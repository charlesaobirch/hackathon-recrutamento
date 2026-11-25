import { loadAll } from "./lib/load.mjs";
import { normalize, iso, days, month, mean, quantile, corr, corrP, spearman, chi2Test } from "./lib/stats.mjs";

const raw = loadAll();
const db = normalize(raw);
const { candidatos, candidaturas, clientes, contratacoes, entrevistas, feedback_clientes, historico_vagas, interacoes, propostas, recrutadores, vagas } = db;
const km = (arr, k) => new Map(arr.map((r) => [r[k], r]));
const candMap = km(candidatos, "id"), vagaMap = km(vagas, "id"), candtMap = km(candidaturas, "id");
const cliMap = km(clientes, "id"), recMap = km(recrutadores, "id");

const log = (...a) => console.log(...a);
const pct = (a, b) => (b ? +((a / b) * 100).toFixed(1) : null);
const group = (rows, fn) => {
  const m = new Map();
  for (const r of rows) { const k = fn(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
};

// ================= 1. FUNIL =================
log("\n=== 1. FUNIL DE RECRUTAMENTO ===");
const semVaga = candidaturas.filter((c) => !vagaMap.has(c.id_vaga));
log("candidaturas:", candidaturas.length, "| vaga inexistente V999:", semVaga.length, `(${pct(semVaga.length, candidaturas.length)}%)`);
const validas = candidaturas.filter((c) => vagaMap.has(c.id_vaga));
const entByCand = group(entrevistas, (e) => e.id_candidatura);
const entSet = new Map(entByCand);
const stageOf = (cid) => new Set((entSet.get(cid) || []).map((e) => e.fase));
const fases = ["triagem", "entrevista_tecnica", "entrevista_cliente", "entrevista_final"];
log("candidaturas válidas:", validas.length);
for (const f of fases) log(`  com entrevista ${f}:`, validas.filter((c) => stageOf(c.id).has(f)).length);
log("  com proposta:", validas.filter((c) => propostas.some((p) => p.id_candidatura === c.id)).length);
log("  com proposta aceite:", validas.filter((c) => propostas.some((p) => p.id_candidatura === c.id && p.estado_proposta === "aceite")).length);
log("  com contratação:", validas.filter((c) => contratacoes.some((x) => x.id_candidatura === c.id)).length);

// sequência de fases: saltos
let saltos = 0, semTriagem = 0, ordemInversa = 0, dupFase = 0;
const exemplos = [];
for (const [cid, es] of entSet) {
  const fs = es.map((e) => fases.indexOf(e.fase)).sort((a, b) => a - b);
  if (!fs.includes(0)) { semTriagem++; if (exemplos.length < 3) exemplos.push(cid); }
  if (new Set(fs).size !== fs.length) dupFase++;
  if (fs.some((v, i) => i > 0 && v < fs[i - 1])) ordemInversa++;
  if (new Set(fs).size > 1 && fs[fs.length - 1] - fs[0] > 1) saltos++;
}
log("candidaturas com entrevistas mas sem triagem:", semTriagem, "ex:", exemplos);
log("candidaturas com fase repetida:", dupFase, "| com saltos de fase:", saltos);
// entrevistas por ordem temporal vs fase
let faseForaDeOrdem = 0;
for (const [cid, es] of entSet) {
  const s = [...es].sort((a, b) => a.data - b.data);
  const fs = s.map((e) => fases.indexOf(e.fase));
  if (fs.some((v, i) => i > 0 && v < fs[i - 1])) faseForaDeOrdem++;
}
log("candidaturas cuja sequência temporal das fases regride:", faseForaDeOrdem, `(${pct(faseForaDeOrdem, entSet.size)}% de ${entSet.size})`);

// resultado por fase
log("\nresultado por fase:");
for (const f of fases) {
  const rs = entrevistas.filter((e) => e.fase === f);
  const ap = rs.filter((r) => r.resultado === "aprovado").length;
  const rp = rs.filter((r) => r.resultado === "reprovado").length;
  const pe = rs.filter((r) => r.resultado === "pendente").length;
  log(`  ${f.padEnd(20)} n=${String(rs.length).padStart(5)} aprov=${String(ap).padStart(5)} (${pct(ap, rs.length)}%) reprov=${String(rp).padStart(5)} (${pct(rp, rs.length)}%) pend=${pe}`);
}

// ================= 2. PROPOSTAS =================
log("\n=== 2. PROPOSTAS ===");
log("por estado:", group(propostas, (p) => p.estado_proposta).map(([k, v]) => `${k}:${v.length} (${pct(v.length, propostas.length)}%)`).join(" | "));
log("motivo recusa:", group(propostas.filter((p) => p.motivo_recusa), (p) => p.motivo_recusa).map(([k, v]) => `${k}:${v.length}`).join(" | "));
const diasResposta = propostas.filter((p) => p.data_resposta).map((p) => days(p.data_proposta, p.data_resposta));
log("dias até resposta: mediana", quantile(diasResposta, 0.5), "p90", quantile(diasResposta, 0.9), "min", Math.min(...diasResposta), "max", Math.max(...diasResposta));
const aceites = propostas.filter((p) => p.estado_proposta === "aceite");
const ctByCand = new Map(contratacoes.map((c) => [c.id_candidatura, c]));
const gapSal = aceites.map((p) => ctByCand.get(p.id_candidatura)?.salario_final - p.salario_oferecido).filter((x) => x !== undefined);
log("diferença salário final - oferecido (aceites): media", mean(gapSal).toFixed(1), "max", Math.max(...gapSal), "min", Math.min(...gapSal), "!=0:", gapSal.filter((x) => x !== 0).length);
const gapTempo = aceites.map((p) => days(p.data_resposta, ctByCand.get(p.id_candidatura)?.data_contratacao)).filter((x) => x !== undefined);
log("dias proposta aceite -> contratação: mediana", quantile(gapTempo, 0.5), "min", Math.min(...gapTempo), "max", Math.max(...gapTempo));

// ================= 3. TEMPO ATÉ CONTRATAR =================
log("\n=== 3. TEMPO ATÉ CONTRATAÇÃO ===");
const tth = contratacoes.map((c) => {
  const ap = candtMap.get(c.id_candidatura);
  return { c, dias: days(ap.data_candidatura, c.data_contratacao), declarado: c.tempo_total_dias };
});
log("tempo_total_dias declarado: mediana", quantile(tth.map((t) => t.declarado), 0.5), "min", Math.min(...tth.map((t) => t.declarado)), "max", Math.max(...tth.map((t) => t.declarado)));
const recalc = tth.map((t) => t.dias);
log("recalculado (candidatura->contratação): mediana", quantile(recalc, 0.5), "min", Math.min(...recalc), "max", Math.max(...recalc));
const dif = tth.map((t) => t.declarado - t.dias);
log("desvio declarado-recalculado: media", mean(dif).toFixed(2), "| iguais:", dif.filter((d) => d === 0).length, "| |desvio|>7d:", dif.filter((d) => Math.abs(d) > 7).length);
const byUrg = group(contratacoes.map((c) => ({ c, v: vagaMap.get(c.id_vaga) })), (r) => r.v.urgencia);
log("tempo médio por urgência da vaga:");
for (const [k, rs] of byUrg) log(`  ${k}: n=${rs.length} media=${mean(rs.map((r) => r.c.tempo_total_dias)).toFixed(1)}d`);
const bySen = group(contratacoes.map((c) => ({ c, v: vagaMap.get(c.id_vaga) })), (r) => r.v.senioridade);
log("tempo médio por senioridade:");
for (const [k, rs] of bySen) log(`  ${k}: n=${rs.length} media=${mean(rs.map((r) => r.c.tempo_total_dias)).toFixed(1)}d`);

// ================= 4. RECRUTADORES =================
log("\n=== 4. RECRUTADORES ===");
const recruiterStats = recrutadores.map((r) => {
  const vs = vagas.filter((v) => v.id_recrutador === r.id);
  const apps = candidaturas.filter((c) => vs.some((v) => v.id === c.id_vaga));
  const ents = entrevistas.filter((e) => e.id_recrutador === r.id);
  const props = propostas.filter((p) => apps.some((c) => c.id === p.id_candidatura));
  const aceites = props.filter((p) => p.estado_proposta === "aceite");
  const cts = contratacoes.filter((c) => c.id_recrutador === r.id);
  const ret90 = cts.filter((c) => c.retencao_90_dias === true).length;
  const ret90n = cts.filter((c) => c.retencao_90_dias !== null).length;
  return {
    id: r.id, equipa: r.equipa, anos: r.anos_experiencia,
    vagas: vs.length, apps: apps.length,
    entrevistas: ents.length,
    propostas: props.length, aceites: aceites.length,
    contratacoes: cts.length,
    conv: pct(aceites.length, props.length),
    appsPorVaga: +(apps.length / vs.length).toFixed(1),
    tempoMedio: cts.length ? +mean(cts.map((c) => c.tempo_total_dias)).toFixed(1) : null,
    desempenho: cts.length ? +mean(cts.map((c) => c.desempenho_90_dias)).toFixed(2) : null,
    ret90: ret90n ? pct(ret90, ret90n) : null,
    scoreTecEnt: ents.length ? +mean(ents.map((e) => e.score_tecnico)).toFixed(1) : null,
    interacoes: interacoes.filter((i) => i.id_recrutador === r.id).length,
  };
});
console.table(recruiterStats);

// ================= 5. CLIENTES =================
log("\n=== 5. CLIENTES ===");
const clientStats = clientes.map((cl) => {
  const vs = vagas.filter((v) => v.id_cliente === cl.id);
  const cts = contratacoes.filter((c) => c.id_cliente === cl.id);
  const fbs = feedback_clientes.filter((f) => cts.some((c) => c.id === f.id_contratacao));
  const ret90 = cts.filter((c) => c.retencao_90_dias === true).length;
  const ret90n = cts.filter((c) => c.retencao_90_dias !== null).length;
  return {
    id: cl.id, setor: cl.setor, dim: cl.dimensao_empresa, modelo: cl.modelo_recrutamento, hist: cl.historico_relacao, estado: cl.estado,
    vagas: vs.length, preenchidas: vs.filter((v) => v.estado === "preenchida").length,
    contratacoes: cts.length,
    tempoMedio: cts.length ? +mean(cts.map((c) => c.tempo_total_dias)).toFixed(1) : null,
    satisfacao: fbs.length ? +mean(fbs.map((f) => f.satisfacao)).toFixed(2) : null,
    subst: fbs.filter((f) => f.necessita_substituicao).length,
    ret90: ret90n ? pct(ret90, ret90n) : null,
    desempenho: cts.length ? +mean(cts.map((c) => c.desempenho_90_dias)).toFixed(2) : null,
    custoMedio: cts.length ? Math.round(mean(cts.map((c) => c.custo_estimado_contratacao))) : null,
    nFb: fbs.length,
  };
});
console.table(clientStats);

// satisfação por modelo / setor
log("\nsatisfação média por modelo de recrutamento:");
for (const [k, rs] of group(feedback_clientes.map((f) => ({ f, ct: ctsByF(f) })), (r) => r.f ? r.f.id : "-")) {}
function ctsByF(f) { return contratacoes.find((c) => c.id === f.id_contratacao); }
function fbWithClient() {
  return feedback_clientes.map((f) => {
    const ct = contratacoes.find((c) => c.id === f.id_contratacao);
    return { ...f, cliente: ct ? cliMap.get(ct.id_cliente) : null, ct };
  });
}
const fb = fbWithClient();
for (const [k, rs] of group(fb, (r) => r.cliente.modelo_recrutamento)) log(`  ${k}: n=${rs.length} satisf=${mean(rs.map((r) => r.satisfacao)).toFixed(2)} subst=${pct(rs.filter((r) => r.necessita_substituicao).length, rs.length)}%`);
log("satisfação por setor:");
for (const [k, rs] of group(fb, (r) => r.cliente.setor)) log(`  ${k}: n=${rs.length} satisf=${mean(rs.map((r) => r.satisfacao)).toFixed(2)} subst=${pct(rs.filter((r) => r.necessita_substituicao).length, rs.length)}%`);
log("satisfação por historico_relacao:");
for (const [k, rs] of group(fb, (r) => r.cliente.historico_relacao)) log(`  ${k}: n=${rs.length} satisf=${mean(rs.map((r) => r.satisfacao)).toFixed(2)}`);

// ================= 6. SALÁRIOS =================
log("\n=== 6. SALÁRIOS ===");
const candExp = new Map(candidatos.map((c) => [c.id, c.expectativa_salarial]));
const propComCand = propostas.map((p) => {
  const ap = candtMap.get(p.id_candidatura);
  const cd = candMap.get(ap.id_candidato);
  const v = vagaMap.get(ap.id_vaga);
  return { p, cd, v, exp: candExp.get(cd.id) };
});
const diffExp = propComCand.map((x) => x.p.salario_oferecido - x.exp);
log("oferta - expectativa: media", mean(diffExp).toFixed(0), "mediana", quantile(diffExp, 0.5), "| oferta < expectativa:", pct(diffExp.filter((d) => d < 0).length, diffExp.length) + "%");
const posBand = propComCand.filter((x) => x.v).map((x) => {
  const mid = (x.v.salario_min + x.v.salario_max) / 2;
  return { pos: (x.p.salario_oferecido - mid) / ((x.v.salario_max - x.v.salario_min) / 2), p: x.p, v: x.v };
});
log("posição na banda (0=min,1=max): mediana", quantile(posBand.map((x) => (x.pos + 1) / 2), 0.5).toFixed(2),
  "| abaixo do min:", pct(posBand.filter((x) => x.pos < -1).length, posBand.length) + "%",
  "| acima do max:", pct(posBand.filter((x) => x.pos > 1).length, posBand.length) + "%");
const posOf = (x) => (x.p.salario_oferecido - x.v.salario_min) / (x.v.salario_max - x.v.salario_min);
const withV = propComCand.filter((x) => x.v);
const aberto = withV.filter((x) => x.p.estado_proposta === "aceite");
const recusado = withV.filter((x) => x.p.estado_proposta === "recusada");
const semResp = withV.filter((x) => x.p.estado_proposta === "sem_resposta");
log("posição média na banda — aceites:", mean(aberto.map(posOf)).toFixed(2),
  "recusadas:", mean(recusado.map(posOf)).toFixed(2),
  "sem_resposta:", mean(semResp.map(posOf)).toFixed(2));
const aceiteRate = (rows) => pct(rows.filter((x) => x.p.estado_proposta === "aceite").length, rows.length);
log("taxa de aceitação por posição na banda:");
log("  abaixo do min:", aceiteRate(withV.filter((x) => posOf(x) < 0)) + "%", "n=" + withV.filter((x) => posOf(x) < 0).length);
log("  dentro da banda:", aceiteRate(withV.filter((x) => posOf(x) >= 0 && posOf(x) <= 1)) + "%", "n=" + withV.filter((x) => posOf(x) >= 0 && posOf(x) <= 1).length);
log("  acima do max:", aceiteRate(withV.filter((x) => posOf(x) > 1)) + "%", "n=" + withV.filter((x) => posOf(x) > 1).length);
log("salario_final vs salario_oferecido (top desvios):");
const ofertasMap = new Map(propostas.map((p) => [p.id_candidatura, p]));
const desvios = contratacoes.map((c) => ({ id: c.id, cand: c.id_candidatura, final: c.salario_final, oferta: ofertasMap.get(c.id_candidatura).salario_oferecido }))
  .map((x) => ({ ...x, d: x.final - x.oferta })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 5);
log(desvios);

// ================= 7. QUALIDADE / OUTLIERS =================
log("\n=== 7. OUTLIERS E ANOMALIAS ===");
const cmp = ["salario_final", "custo_estimado_contratacao", "tempo_total_dias"];
for (const k of cmp) {
  const a = contratacoes.map((c) => c[k]);
  const q1 = quantile(a, 0.25), q3 = quantile(a, 0.75), iqr = q3 - q1;
  const out = a.filter((x) => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr);
  log(`${k}: Q1=${q1} Q3=${q3} IQR=${iqr} outliers=${out.length} (${out.slice(0, 8).join(", ")})`);
}
const scores = entrevistas.map((e) => e.score_tecnico);
const s100 = entrevistas.filter((e) => e.score_tecnico > 100);
log("score_tecnico>100 por recrutador:", group(s100, (e) => e.id_recrutador).map(([k, v]) => `${k}:${v.length}`).join(" | "));
log("score_tecnico>100 por fase:", group(s100, (e) => e.fase).map(([k, v]) => `${k}:${v.length}`).join(" | "));
log("distribuição score_tecnico:", [0, 0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99, 1].map((q) => quantile(scores, q)).join(" / "));
log("score_comunicacao distribuição:", [0, 0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99, 1].map((q) => quantile(entrevistas.map((e) => e.score_comunicacao), q)).join(" / "));

// retenção coerência
log("\ncoerência retenção/saída:");
log("  retencao_90=false mas sem data_saida:", contratacoes.filter((c) => c.retencao_90_dias === false && !c.data_saida).length);
log("  com data_saida mas retencao_90=true:", contratacoes.filter((c) => c.data_saida && c.retencao_90_dias === true).length);
log("  retencao_90=true e retencao_180=false:", contratacoes.filter((c) => c.retencao_90_dias === true && c.retencao_180_dias === false).length);
log("  retencao_90=null mas data_contratacao ha >90d:", contratacoes.filter((c) => c.retencao_90_dias === null && days(c.data_contratacao, new Date("2026-11-25")) > 90).length);
log("  retencao_180 não-nulo mas <180d desde contratação:", contratacoes.filter((c) => c.retencao_180_dias !== null && days(c.data_contratacao, new Date("2026-11-25")) < 180).length);
log("  data_saida > 180d após contratação:", contratacoes.filter((c) => c.data_saida && days(c.data_contratacao, c.data_saida) > 180).length);
log("  dias até saída: mediana", quantile(contratacoes.filter((c) => c.data_saida).map((c) => days(c.data_contratacao, c.data_saida)), 0.5));
log("  motivo_saida sem data_saida:", contratacoes.filter((c) => c.motivo_saida && !c.data_saida).length);

// feedback datas
log("\nfeedback_clientes: datas mais frequentes:");
for (const [k, rs] of group(feedback_clientes, (f) => iso(f.data_feedback)).slice(0, 5)) log(`  ${k}: ${rs.length}`);
log("feedback antes da contratação:", feedback_clientes.filter((f) => { const ct = contratacoes.find((c) => c.id === f.id_contratacao); return ct && f.data_feedback < ct.data_contratacao; }).length);

// histórico vagas
log("\nhistorico_vagas:", group(historico_vagas, (h) => h.tipo_evento).map(([k, v]) => `${k}:${v.length}`).join(" | "));
log("  vaga_reaberta com motivo:", historico_vagas.filter((h) => h.tipo_evento === "vaga_reaberta" && h.motivo).length, "/60");
log("  sem vaga_reaberta_id:", historico_vagas.filter((h) => h.tipo_evento === "vaga_reaberta" && !h.vaga_reaberta_id).length);
log("  eventos por vaga original (>=2):", group(historico_vagas, (h) => h.id_vaga_original).filter(([, v]) => v.length >= 2).length);
