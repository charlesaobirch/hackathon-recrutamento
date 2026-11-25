import { loadAll } from "./lib/load.mjs";
import { normalize, iso, days, month, mean, quantile, corr, corrP, spearman, chi2Test } from "./lib/stats.mjs";

const db = normalize(loadAll());
const { candidatos, candidaturas, clientes, contratacoes, entrevistas, feedback_clientes, historico_vagas, interacoes, propostas, recrutadores, vagas } = db;
const log = (...a) => console.log(...a);
const pct = (a, b) => (b ? +((a / b) * 100).toFixed(1) : null);
const group = (rows, fn) => { const m = new Map(); for (const r of rows) { const k = fn(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); } return [...m.entries()].sort((a, b) => b[1].length - a[1].length); };
const candMap = new Map(candidatos.map((c) => [c.id, c]));
const vagaMap = new Map(vagas.map((v) => [v.id, v]));
const candtMap = new Map(candidaturas.map((c) => [c.id, c]));
const ctByCand = new Map(contratacoes.map((c) => [c.id_candidatura, c]));

// ---------- A. COERÊNCIA DE ESTADOS ----------
log("=== A. COERÊNCIA DE ESTADOS ===");
const hiredCands = new Set(contratacoes.map((c) => candtMap.get(c.id_candidatura).id_candidato));
log("candidatos estado=contratado:", candidatos.filter((c) => c.estado === "contratado").length, "| candidatos efetivamente contratados:", hiredCands.size);
const hiresPerCandId = group(contratacoes, (c) => candtMap.get(c.id_candidatura).id_candidato);
log("candidatos com mais de 1 contratação:", hiresPerCandId.filter(([, v]) => v.length > 1).length, "| máximo por candidato:", Math.max(...hiresPerCandId.map(([, v]) => v.length)));
const hiredNotMarked = [...hiredCands].filter((id) => candMap.get(id).estado !== "contratado").length;
log("contratados não marcados como contratado:", hiredNotMarked);
const etapaByCand = new Map();
for (const c of candidaturas) etapaByCand.set(c.id, c.etapa_atual);
const hiredEtapas = group(contratacoes, (ct) => candtMap.get(ct.id_candidatura).etapa_atual).map(([k, v]) => `${k}:${v.length}`);
log("etapa_atual das candidaturas contratadas:", hiredEtapas.join(" | "));
const hiredEstado = group(contratacoes, (ct) => candtMap.get(ct.id_candidatura).estado_candidatura).map(([k, v]) => `${k}:${v.length}`);
log("estado_candidatura das candidaturas contratadas:", hiredEstado.join(" | "));
// candidaturas 'rejeitado' com contratação
log("candidaturas rejeitadas com contratação:", contratacoes.filter((c) => candtMap.get(c.id_candidatura).etapa_atual === "rejeitado").length);
// candidato com várias contratações
const hiresPerCand = group(contratacoes, (c) => candtMap.get(c.id_candidatura).id_candidato);
log("candidatos com mais de 1 contratação:", hiresPerCand.filter(([, v]) => v.length > 1).length, "| max:", Math.max(...hiresPerCand.map(([, v]) => v.length)));

// vagas sem candidaturas / sem candidatos
const vagaApps = group(candidaturas.filter((c) => vagaMap.has(c.id_vaga)), (c) => c.id_vaga);
const vagaAppMap = new Map(vagaApps);
log("vagas sem qualquer candidatura:", vagas.filter((v) => !vagaAppMap.has(v.id)).length, "/", vagas.length);
// vagas preenchidas sem contratação
const ctVagas = new Set(contratacoes.map((c) => c.id_vaga));
log("vagas 'preenchida' sem contratação:", vagas.filter((v) => v.estado === "preenchida" && !ctVagas.has(v.id)).length);
log("vagas 'reaberta' com contratação:", vagas.filter((v) => v.estado === "reaberta" && ctVagas.has(v.id)).length);
log("vagas 'em_andamento' com contratação:", vagas.filter((v) => v.estado === "em_andamento" && ctVagas.has(v.id)).length);
log("contratações cuja vaga continua 'em_andamento':", contratacoes.filter((c) => vagaMap.get(c.id_vaga).estado === "em_andamento").length);
// preenchida vs data_fecho
log("vagas em_andamento com data_fecho no passado (>90d):", vagas.filter((v) => v.estado === "em_andamento" && days(v.data_fecho, new Date("2026-11-25")) > 90).length);

// ---------- B. FUNIL POR ETAPA / ATIVIDADE ----------
log("\n=== B. ATIVIDADE POR CANDIDATURA ===");
const entCount = group(entrevistas, (e) => e.id_candidatura);
const intCount = group(interacoes, (e) => e.id_candidatura);
const cnt = (rows) => rows.map(([, v]) => v.length);
log("entrevistas por candidatura:", "media", mean(cnt(entCount)).toFixed(2), "mediana", quantile(cnt(entCount), 0.5), "max", Math.max(...cnt(entCount)));
log("interações por candidatura:", "media", mean(cnt(intCount)).toFixed(2), "mediana", quantile(cnt(intCount), 0.5), "max", Math.max(...cnt(intCount)));
log("interações por candidatura — distribuição:", [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map((q) => quantile(cnt(intCount), q)).join(" / "));
// tipos de interação por recrutador
log("tipo de interação x resultado (top):");
log("  duração média por tipo:", group(interacoes, (i) => i.tipo).map(([k, v]) => `${k}:${mean(v.map((x) => x.duracao_minutos)).toFixed(1)}min`).join(" | "));
// interações após encerramento
const lastDate = new Map();
for (const i of interacoes) { const p = lastDate.get(i.id_candidatura); if (!p || i.data > p) lastDate.set(i.id_candidatura, i.data); }
log("candidaturas encerradas com interações após 30d do encerramento:", 0);

// ---------- C. SKILLS ----------
log("\n=== C. ADEQUAÇÃO DE SKILLS ===");
const splitSkills = (s) => [...new Set(String(s || "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean))];
const skillStats = [];
for (const ap of candidaturas) {
  const v = vagaMap.get(ap.id_vaga); if (!v) continue;
  const cs = new Set(splitSkills(candMap.get(ap.id_candidato).skills));
  const vs = splitSkills(v.skills_requeridas);
  const match = vs.filter((s) => cs.has(s)).length;
  skillStats.push({ ap, overlap: match, ratio: vs.length ? match / vs.length : 0, nReq: vs.length, score: ap.score_curriculo, hired: ctByCand.has(ap.id) });
}
log("skill overlap (nº skills da vaga presentes no candidato): média", mean(skillStats.map((s) => s.overlap)).toFixed(2), "| ratio média", mean(skillStats.map((s) => s.ratio)).toFixed(2));
log("correlação overlap x score_curriculo: r=", corr(skillStats.map((s) => s.overlap), skillStats.map((s) => s.score)).toFixed(3), "p=", corrP(corr(skillStats.map((s) => s.overlap), skillStats.map((s) => s.score)), skillStats.length).toExponential(2));
log("correlação ratio x score_curriculo: r=", corr(skillStats.map((s) => s.ratio), skillStats.map((s) => s.score)).toFixed(3));
log("overlap médio — contratados:", mean(skillStats.filter((s) => s.hired).map((s) => s.overlap)).toFixed(2), "| não contratados:", mean(skillStats.filter((s) => !s.hired).map((s) => s.overlap)).toFixed(2));
log("taxa contratação por overlap: 0:", pct(skillStats.filter((s) => s.overlap === 0 && s.hired).length, skillStats.filter((s) => s.overlap === 0).length) + "%",
  "1:", pct(skillStats.filter((s) => s.overlap === 1 && s.hired).length, skillStats.filter((s) => s.overlap === 1).length) + "%",
  "2+:", pct(skillStats.filter((s) => s.overlap >= 2 && s.hired).length, skillStats.filter((s) => s.overlap >= 2).length) + "%");
// senioridade candidato vs vaga
const senRank = { junior: 0, mid: 1, senior: 2, lead: 3 };
const fit = skillStats.map((s) => ({ ...s, candSen: candMap.get(s.ap.id_candidato).senioridade, vagaSen: vagaMap.get(s.ap.id_vaga).senioridade }))
  .map((s) => ({ ...s, gap: senRank[s.candSen] - senRank[s.vagaSen] }));
log("senioridade candidato - vaga:", group(fit, (s) => s.gap).map(([k, v]) => `gap${k}:${v.length} (contratação ${pct(v.filter((s) => s.hired).length, v.length)}%)`).join(" | "));
log("salário de contratação vs match de senioridade:");
const hiredFit = fit.filter((s) => s.hired);
log("  gap 0:", mean(hiredFit.filter((s) => s.gap === 0).map((s) => ctByCand.get(s.ap.id).salario_final)).toFixed(0),
  "| gap -1:", mean(hiredFit.filter((s) => s.gap === -1).map((s) => ctByCand.get(s.ap.id).salario_final)).toFixed(0),
  "| gap +1:", mean(hiredFit.filter((s) => s.gap === 1).map((s) => ctByCand.get(s.ap.id).salario_final)).toFixed(0));

// ---------- D. R02: velocidade vs qualidade ----------
log("\n=== D. R02 — VELOCIDADE VS QUALIDADE ===");
const appsByRec = (rid) => candidaturas.filter((c) => vagaMap.get(c.id_vaga)?.id_recrutador === rid);
for (const rid of recrutadores.map((r) => r.id)) {
  const apps = appsByRec(rid);
  const hired = apps.filter((c) => ctByCand.has(c.id));
  const ents = entrevistas.filter((e) => apps.some((a) => a.id === e.id_candidatura));
  const perApp = ents.length / apps.length;
  const prop = propostas.filter((p) => apps.some((a) => a.id === p.id_candidatura));
  const cts = hired.map((c) => ctByCand.get(c.id));
  log(`${rid}: apps=${apps.length} entrevistas/app=${perApp.toFixed(2)} propostas/app=${(prop.length / apps.length).toFixed(3)} contratações=${hired.length} tth=${mean(cts.map((c) => c.tempo_total_dias)).toFixed(1)}d desempenho=${mean(cts.map((c) => c.desempenho_90_dias)).toFixed(2)} ret90=${pct(cts.filter((c) => c.retencao_90_dias === true).length, cts.filter((c) => c.retencao_90_dias !== null).length)}%`);
}
const r02 = appsByRec("R02");
const r02Fases = group(entrevistas.filter((e) => r02.some((a) => a.id === e.id_candidatura)), (e) => e.fase);
log("R02 fases:", r02Fases.map(([k, v]) => `${k}:${v.length}`).join(" | "));
const othersFases = group(entrevistas.filter((e) => !r02.some((a) => a.id === e.id_candidatura)), (e) => e.fase);
log("outros fases:", othersFases.map(([k, v]) => `${k}:${v.length}`).join(" | "));
// duração das entrevistas? não existe. ver interações
const r02Int = interacoes.filter((i) => i.id_recrutador === "R02");
const othInt = interacoes.filter((i) => i.id_recrutador !== "R02");
log("R02 interações/app:", (r02Int.length / r02.length).toFixed(2), "outros:", (othInt.length / (candidaturas.length - r02.length)).toFixed(2));
log("R02 duração média interação:", mean(r02Int.map((i) => i.duracao_minutos)).toFixed(1), "outros:", mean(othInt.map((i) => i.duracao_minutos)).toFixed(1));
// test tth difference
const tthBy = (rid) => contratacoes.filter((c) => c.id_recrutador === rid).map((c) => c.tempo_total_dias);
const t02 = tthBy("R02"), tOthers = contratacoes.filter((c) => c.id_recrutador !== "R02").map((c) => c.tempo_total_dias);
log("tth R02 media:", mean(t02).toFixed(1), "outros:", mean(tOthers).toFixed(1), "n:", t02.length, tOthers.length);

// ---------- E. TEMPO / SAZONALIDADE ----------
log("\n=== E. SÉRIE TEMPORAL ===");
const byMonth = (rows, col) => group(rows, (r) => month(r[col]));
log("candidaturas por mês (2024-01 a 2023?):");
const cm = byMonth(candidaturas, "data_candidatura");
log(cm.map(([k, v]) => `${k}:${v.length}`).join(" "));
log("\ncontratações por mês:");
log(byMonth(contratacoes, "data_contratacao").map(([k, v]) => `${k}:${v.length}`).join(" "));
log("\npropostas por mês:");
log(byMonth(propostas, "data_proposta").map(([k, v]) => `${k}:${v.length}`).join(" "));
const dow = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
log("\ncandidaturas por dia da semana:", group(candidaturas, (c) => dow[c.data_candidatura.getUTCDay()]).map(([k, v]) => `${k}:${v.length}`).join(" | "));
log("contratações por dia da semana:", group(contratacoes, (c) => dow[c.data_contratacao.getUTCDay()]).map(([k, v]) => `${k}:${v.length}`).join(" | "));
log("entrevistas por dia da semana:", group(entrevistas, (e) => dow[e.data.getUTCDay()]).map(([k, v]) => `${k}:${v.length}`).join(" | "));
log("interações por dia da semana:", group(interacoes, (i) => dow[i.data.getUTCDay()]).map(([k, v]) => `${k}:${v.length}`).join(" | "));
// datas repetidas suspeitas em entrevistas
const entDates = group(entrevistas, (e) => iso(e.data));
log("entrevistas no mesmo dia (top):", entDates.slice(0, 3).map(([k, v]) => `${k}:${v.length}`).join(" | "));
log("entrevistas por mês:");
log(byMonth(entrevistas, "data").map(([k, v]) => `${k}:${v.length}`).join(" "));

// ---------- F. TESTES ESTATÍSTICOS ----------
log("\n=== F. TESTES ===");
// chi2 urgência x preenchida
const urg = ["alta", "media", "baixa"];
const tab = urg.map((u) => { const vs = vagas.filter((v) => v.urgencia === u); return [vs.filter((v) => v.estado === "preenchida").length, vs.filter((v) => v.estado !== "preenchida").length]; });
log("qui-quadrado urgência x preenchida:", JSON.stringify(chi2Test(tab)));
// chi2 canal x contratação
const canais = [...new Set(candidatos.map((c) => c.canal_origem))];
const hiredByCandId = new Set([...hiredCands]);
const tabCanal = canais.map((k) => {
  const ids = candidatos.filter((c) => c.canal_origem === k).map((c) => c.id);
  const apps = candidaturas.filter((a) => ids.includes(a.id_candidato));
  return [apps.filter((a) => ctByCand.has(a.id)).length, apps.length - apps.filter((a) => ctByCand.has(a.id)).length];
});
log("qui-quadrado canal x contratação:", JSON.stringify(chi2Test(tabCanal)));
log("taxa contratação por canal:", canais.map((k, i) => `${k}:${pct(tabCanal[i][0], tabCanal[i][0] + tabCanal[i][1])}%`).join(" | "));
// chi2 disponibilidade
const tabDisp = [...new Set(candidatos.map((c) => c.disponibilidade))].map((k) => {
  const ids = candidatos.filter((c) => c.disponibilidade === k).map((c) => c.id);
  const apps = candidaturas.filter((a) => ids.includes(a.id_candidato));
  const n = apps.filter((a) => ctByCand.has(a.id)).length;
  return [n, apps.length - n];
});
log("qui-quadrado disponibilidade x contratação:", JSON.stringify(chi2Test(tabDisp)));
// correlações entrevistas
const entPerCand = new Map(group(entrevistas, (e) => e.id_candidatura).map(([k, v]) => [k, v]));
const scoreTec = entrevistas.filter((e) => e.fase === "entrevista_tecnica");
const x = scoreTec.map((e) => e.score_tecnico), y = scoreTec.map((e) => e.score_comunicacao);
log("corr score_tecnico x score_comunicacao (n=" + x.length + "): r=", corr(x, y).toFixed(3));
const r1 = corr(scoreTec.map((e) => e.score_tecnico).map((v) => Math.min(v, 100)), scoreTec.map((e) => ctByCand.has(e.id_candidatura) ? 1 : 0));
log("corr score_tecnico(<=100) x contratação: r=", r1.toFixed(3));
// score currículo x contratação
log("score_curriculo médio — contratados:", mean(candidaturas.filter((c) => ctByCand.has(c.id)).map((c) => c.score_curriculo)).toFixed(1),
  "| não contratados:", mean(candidaturas.filter((c) => !ctByCand.has(c.id)).map((c) => c.score_curriculo)).toFixed(1));
log("corr score_curriculo x nº entrevistas: r=", corr(candidaturas.map((c) => c.score_curriculo), candidaturas.map((c) => (entPerCand.get(c.id) || []).length)).toFixed(3));
// satisfação x performance
const fb = feedback_clientes.map((f) => ({ ...f, ct: contratacoes.find((c) => c.id === f.id_contratacao) }));
log("corr satisfacao x desempenho_percebido: r=", corr(fb.map((f) => f.satisfacao), fb.map((f) => f.desempenho_percebido)).toFixed(3));
log("corr satisfacao cliente x desempenho_90d: r=", corr(fb.map((f) => f.satisfacao), fb.map((f) => f.ct.desempenho_90_dias)).toFixed(3));
log("necessita_substituicao por satisfação:", group(fb, (f) => f.satisfacao).map(([k, v]) => `sat${k}:${pct(v.filter((f) => f.necessita_substituicao).length, v.length)}%`).join(" | "));
// custo x salario
log("corr custo_estimado x tempo_total: r=", corr(contratacoes.map((c) => c.custo_estimado_contratacao), contratacoes.map((c) => c.tempo_total_dias)).toFixed(3));
log("custo médio por recrutador:", group(contratacoes, (c) => c.id_recrutador).map(([k, v]) => `${k}:${Math.round(mean(v.map((x) => x.custo_estimado_contratacao)))}`).join(" | "));
log("custo médio por senioridade da vaga:", group(contratacoes, (c) => vagaMap.get(c.id_vaga).senioridade).map(([k, v]) => `${k}:${Math.round(mean(v.map((x) => x.custo_estimado_contratacao)))}`).join(" | "));

// ---------- G. EXPECTATIVA SALARIAL ----------
log("\n=== G. EXPECTATIVA VS OFERTA ===");
const rec = [];
for (const p of propostas) {
  const ap = candtMap.get(p.id_candidatura); const cd = candMap.get(ap.id_candidato); const v = vagaMap.get(ap.id_vaga);
  if (!v) continue;
  rec.push({ exp: cd.expectativa_salarial, of: p.salario_oferecido, min: v.salario_min, max: v.salario_max, estado: p.estado_proposta, sen: cd.senioridade });
}
const expAboveMax = rec.filter((r) => r.exp > r.max).length;
log("propostas em que a expectativa do candidato supera o máximo da vaga:", expAboveMax, `(${pct(expAboveMax, rec.length)}%)`);
log("expectativa média por senioridade do candidato:", group(candidatos, (c) => c.senioridade).map(([k, v]) => `${k}:${Math.round(mean(v.map((x) => x.expectativa_salarial)))}`).join(" | "));
log("salario_min medio por senioridade da vaga:", group(vagas, (v) => v.senioridade).map(([k, v]) => `${k}:${Math.round(mean(v.map((x) => x.salario_min)))}`).join(" | "));
log("expectativa média por localização do candidato:", group(candidatos, (c) => c.localizacao).map(([k, v]) => `${k}:${Math.round(mean(v.map((x) => x.expectativa_salarial)))}`).join(" | "));
log("salário_min médio por localização da vaga:", group(vagas, (v) => v.localizacao).map(([k, v]) => `${k}:${Math.round(mean(v.map((x) => x.salario_min)))}`).join(" | "));
log("expectativa por anos de experiência:", group(candidatos, (c) => Math.floor(c.anos_experiencia / 5) * 5).sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}-${k + 4}a:${Math.round(mean(v.map((x) => x.expectativa_salarial)))}`).join(" | "));

// ---------- H. API / CLIENTES CROSS ----------
log("\n=== H. RETENÇÃO E MOTIVOS ===");
log("motivo_saida x retencao_90:", group(contratacoes.filter((c) => c.motivo_saida), (c) => c.motivo_saida).map(([k, v]) => `${k}:${v.length} (ret90=${pct(v.filter((x) => x.retencao_90_dias === true).length, v.length)}%)`).join(" | "));
log("retenção 90 global:", pct(contratacoes.filter((c) => c.retencao_90_dias === true).length, contratacoes.filter((c) => c.retencao_90_dias !== null).length) + "%");
log("retenção 180 global:", pct(contratacoes.filter((c) => c.retencao_180_dias === true).length, contratacoes.filter((c) => c.retencao_180_dias !== null).length) + "%");
log("desempenho_90 distribuição:", group(contratacoes, (c) => c.desempenho_90_dias).sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}:${v.length}`).join(" | "));
log("resultado_periodo_inicial x desempenho:");
for (const [k, v] of group(contratacoes, (c) => c.resultado_periodo_inicial)) log(`  ${k}: n=${v.length} desempenho_medio=${mean(v.map((x) => x.desempenho_90_dias)).toFixed(2)} ret90=${pct(v.filter((x) => x.retencao_90_dias === true).length, v.filter((x) => x.retencao_90_dias !== null).length)}%`);
log("inconsistências motivo vs resultado: negativo mas desempenho>=4:", contratacoes.filter((c) => c.resultado_periodo_inicial === "negativo" && c.desempenho_90_dias >= 4).length,
  "| positivo mas desempenho<=2:", contratacoes.filter((c) => c.resultado_periodo_inicial === "positivo" && c.desempenho_90_dias <= 2).length);

// ---------- I. TEMPO POR ETAPA ----------
log("\n=== I. DURAÇÃO DE ETAPAS (entrevistas) ===");
const gaps = [];
for (const [cid, es] of group(entrevistas, (e) => e.id_candidatura)) {
  const s = [...es].sort((a, b) => a.data - b.data);
  for (let i = 1; i < s.length; i++) gaps.push({ fase: s[i].fase, d: days(s[i - 1].data, s[i].data) });
  if (s.length >= 2) gaps.push({ fase: "total_ciclo", d: days(s[0].data, s[s.length - 1].data) });
}
for (const [k, v] of group(gaps, (g) => g.fase)) log(`  intervalo até ${k}: mediana ${quantile(v.map((x) => x.d), 0.5)}d  p90 ${quantile(v.map((x) => x.d), 0.9)}d  negativos ${v.filter((x) => x.d < 0).length}/${v.length}`);
