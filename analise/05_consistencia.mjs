import { loadAll } from "./lib/load.mjs";
import { normalize, iso, days, month, mean, quantile, corr, corrP } from "./lib/stats.mjs";

const raw = loadAll();
const db = normalize(raw);
const { candidatos, candidaturas, clientes, contratacoes, entrevistas, feedback_clientes, historico_vagas, interacoes, propostas, recrutadores, vagas } = db;
const log = (...a) => console.log(...a);
const pct = (a, b) => (b ? +((a / b) * 100).toFixed(1) : null);
const group = (rows, fn) => { const m = new Map(); for (const r of rows) { const k = fn(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); } return [...m.entries()]; };
const candtMap = new Map(candidaturas.map((c) => [c.id, c]));
const vagaMap = new Map(vagas.map((v) => [v.id, v]));

log("=== 1. MISTURA DE FORMATOS DE DATA ===");
for (const [t, col] of [["entrevistas", "data"], ["interacoes", "data"], ["propostas", "data_proposta"], ["contratacoes", "data_contratacao"], ["candidaturas", "data_candidatura"], ["feedback_clientes", "data_feedback"], ["historico_vagas", "data_evento"], ["vagas", "data_abertura"], ["candidatos", "data_candidatura"]]) {
  const rawVals = raw[t].map((r) => r[col]);
  const ddmm = rawVals.filter((v) => /^\d{2}\/\d{2}\/\d{4}$/.test(v)).length;
  const isoN = rawVals.filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v)).length;
  log(`${t}.${col}: ISO=${isoN} dd/mm/yyyy=${ddmm} (${pct(ddmm, rawVals.length)}%)`);
}
// entrevistas com data antes da candidatura ANTES da normalização
const rawCandDates = new Map(raw.candidaturas.map((c) => [c.id, c.data_candidatura.split("/").reverse().join("-")]));
log("entrevistas (raw) com data anterior à candidatura — comparação lexicográfica ingénua:", raw.entrevistas.filter((e) => rawCandDates.get(e.id_candidatura) && e.data > rawCandDates.get(e.id_candidatura) ? false : true).length);

log("\n=== 2. INCONSISTÊNCIA CANDIDATURA x CONTRATAÇÃO ===");
const mismatch = contratacoes.filter((c) => candtMap.get(c.id_candidatura).id_vaga !== c.id_vaga);
log("contratações com id_vaga diferente da candidatura:", mismatch.length, "/", contratacoes.length);
log("  exemplos:", mismatch.slice(0, 5).map((c) => `${c.id}: cand.vaga=${candtMap.get(c.id_candidatura).id_vaga} ct.vaga=${c.id_vaga}`));
log("  dessas, candidatura aponta p/ V999:", mismatch.filter((c) => candtMap.get(c.id_candidatura).id_vaga === "V999").length);
const mismCliente = contratacoes.filter((c) => vagaMap.get(c.id_vaga).id_cliente !== c.id_cliente);
log("contratações com id_cliente diferente do cliente da vaga:", mismCliente.length);
const mismRec = contratacoes.filter((c) => vagaMap.get(c.id_vaga).id_recrutador !== c.id_recrutador);
log("contratações com recrutador diferente do recrutador da vaga:", mismRec.length);
const mismEntRec = entrevistas.filter((e) => { const ap = candtMap.get(e.id_candidatura); return vagaMap.get(ap.id_vaga) && vagaMap.get(ap.id_vaga).id_recrutador !== e.id_recrutador; });
log("entrevistas com recrutador diferente do dono da vaga:", mismEntRec.length, "/", entrevistas.length);

log("\n=== 3. LINEARIDADE DO CUSTO ===");
for (const [k, v] of group(contratacoes, (c) => c.id_recrutador)) {
  const r = corr(v.map((x) => x.tempo_total_dias), v.map((x) => x.custo_estimado_contratacao));
  const slope = (() => { const mx = mean(v.map((x) => x.tempo_total_dias)), my = mean(v.map((x) => x.custo_estimado_contratacao)); return v.reduce((s, x) => s + (x.tempo_total_dias - mx) * (x.custo_estimado_contratacao - my), 0) / v.reduce((s, x) => s + (x.tempo_total_dias - mx) ** 2, 0); })();
  log(`  ${k}: n=${v.length} r=${r.toFixed(3)} slope=${slope.toFixed(1)} EUR/dia intercept≈${(mean(v.map((x) => x.custo_estimado_contratacao)) - slope * mean(v.map((x) => x.tempo_total_dias))).toFixed(0)}`);
}
log("custo médio por recrutador (R02 ~2200 vs ~4700): diferença explica-se pelo tempo? custo/dia global:", (mean(contratacoes.map((c) => c.custo_estimado_contratacao)) / mean(contratacoes.map((c) => c.tempo_total_dias))).toFixed(1));

log("\n=== 4. PADRÕES SUSPEITAMENTE UNIFORMES ===");
for (const [t, col] of [["interacoes", "tipo"], ["interacoes", "resultado"], ["interacoes", "notas"], ["interacoes", "duracao_minutos"], ["entrevistas", "resultado"], ["entrevistas", "fase"], ["candidatos", "canal_origem"], ["candidatos", "localizacao"], ["candidatos", "disponibilidade"], ["candidatos", "estado"], ["candidatos", "senioridade"], ["vagas", "urgencia"], ["vagas", "estado"]]) {
  const rows = db[t]; const g = group(rows, (r) => r[col]);
  const counts = g.map(([, v]) => v.length);
  const exp = rows.length / g.length;
  const chi = counts.reduce((s, c) => s + (c - exp) ** 2 / exp, 0);
  log(`  ${t}.${col}: ${g.length} categorias, chi2=${chi.toFixed(1)} (df=${g.length - 1}, crítico 5%=${(g.length - 1 + 1.645 * Math.sqrt(2 * (g.length - 1))).toFixed(0)}) -> ${chi < 2 * (g.length - 1) ? "UNIFORME" : "não uniforme"}`);
}
log("duração interações: distribuição", [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map((q) => quantile(interacoes.map((i) => i.duracao_minutos), q)).join(" / "), "| nº valores distintos:", new Set(interacoes.map((i) => i.duracao_minutos)).size);

log("\n=== 5. SCORE_TECNICO > 100 ===");
const hi = entrevistas.filter((e) => e.score_tecnico > 100);
log("n:", hi.length, `(${pct(hi.length, entrevistas.length)}%)`);
const buckets = [40, 50, 60, 70, 80, 90, 100, 110, 120, 126];
const hist = {};
for (const e of entrevistas) { const b = buckets.find((x, i) => e.score_tecnico >= x && e.score_tecnico < (buckets[i + 1] ?? 999)); hist[`${b}-${buckets[buckets.indexOf(b) + 1] ?? 999}`] = (hist[`${b}-${buckets[buckets.indexOf(b) + 1] ?? 999}`] || 0) + 1; }
log("histograma:", hist);
log("inteiros vs decimais entre >100:", hi.filter((e) => Number.isInteger(e.score_tecnico)).length, "/", hi.length);
log("score_comunicacao correspondente (média):", mean(hi.map((e) => e.score_comunicacao)).toFixed(1), "vs global", mean(entrevistas.map((e) => e.score_comunicacao)).toFixed(1));
log("por mês:", group(hi, (e) => month(e.data)).sort((a, b) => a[0] < b[0] ? -1 : 1).map(([k, v]) => `${k}:${v.length}`).join(" "));

log("\n=== 6. STRINGS E HIGIENE ===");
const feedbackVals = [...new Set(entrevistas.map((e) => JSON.stringify(e.feedback)))];
log("feedback distintos (raw json):", feedbackVals.join(" | "));
const comentVals = [...new Set(feedback_clientes.map((f) => JSON.stringify(f.comentario)))];
log("comentario distintos (raw json):", comentVals.join(" | "));
log("feedback null vs 'sem registo':", entrevistas.filter((e) => e.feedback === null).length, "vs", entrevistas.filter((e) => e.feedback === "sem registo").length);
log("candidatos skills com espaço após vírgula:", candidatos.filter((c) => /,\s/.test(c.skills)).length);
log("vagas skills com espaço após vírgula:", vagas.filter((c) => /,\s/.test(c.skills_requeridas)).length);
log("capitalização em 'nome'/'titulo':", new Set(vagas.map((v) => v.titulo)).size, "títulos distintos");
log("skills candidatos: nº distinto de skills individuais:", new Set(candidatos.flatMap((c) => c.skills.split(","))).size);
log("skills vagas: nº distinto de skills individuais:", new Set(vagas.flatMap((v) => v.skills_requeridas.split(","))).size);
const candSkills = new Set(candidatos.flatMap((c) => c.skills.split(",")));
const vagaSkills = new Set(vagas.flatMap((v) => v.skills_requeridas.split(",")));
const onlyVaga = [...vagaSkills].filter((s) => !candSkills.has(s));
log("skills pedidas nas vagas que nenhum candidato tem:", onlyVaga.length, "/", vagaSkills.size, onlyVaga.slice(0, 20).join(","));

log("\n=== 7. FEEDBACK: LAG E CLUSTER ===");
const fb = feedback_clientes.map((f) => ({ ...f, ct: contratacoes.find((c) => c.id === f.id_contratacao) }));
const lag = fb.filter((f) => f.ct).map((f) => days(f.ct.data_contratacao, f.data_feedback));
log("lag contratação->feedback: mediana", quantile(lag, 0.5), "p10", quantile(lag, 0.1), "p90", quantile(lag, 0.9), "min", Math.min(...lag), "max", Math.max(...lag));
log("feedbacks no cluster 2025-12-31:", fb.filter((f) => iso(f.data_feedback) === "2025-12-31").length);
log("  desses, contratações de 2025? ", fb.filter((f) => iso(f.data_feedback) === "2025-12-31" && f.ct && f.ct.data_contratacao.getUTCFullYear() === 2025).length);
log("satisfação 5 com necessita_substituicao:", fb.filter((f) => f.satisfacao === 5 && f.necessita_substituicao).length);
log("satisfação 5 média desempenho_90:", mean(fb.filter((f) => f.satisfacao === 5).map((f) => f.ct.desempenho_90_dias)).toFixed(2));
log("satisfação 4 média desempenho_90:", mean(fb.filter((f) => f.satisfacao === 4).map((f) => f.ct.desempenho_90_dias)).toFixed(2));
log("satisfação 3 média desempenho_90:", mean(fb.filter((f) => f.satisfacao === 3).map((f) => f.ct.desempenho_90_dias)).toFixed(2));
log("desempenho_percebido == desempenho_90_dias:", fb.filter((f) => f.desempenho_percebido === f.ct.desempenho_90_dias).length, "/", fb.length);
log("corr(satisfacao, desempenho_percebido) r=", corr(fb.map((f) => f.satisfacao), fb.map((f) => f.desempenho_percebido)).toFixed(3), "p=", corrP(corr(fb.map((f) => f.satisfacao), fb.map((f) => f.desempenho_percebido)), fb.length).toExponential(2));

log("\n=== 8. PROPOSTA / CONTRATAÇÃO: ORDEM TEMPORAL ===");
const seq = [];
for (const p of propostas) {
  const ct = contratacoes.find((c) => c.id_candidatura === p.id_candidatura);
  if (!ct) continue;
  const ap = candtMap.get(p.id_candidatura);
  const ents = entrevistas.filter((e) => e.id_candidatura === p.id_candidatura).map((e) => e.data).sort((a, b) => a - b);
  seq.push({
    candToProp: days(ap.data_candidatura, p.data_proposta),
    propToCt: days(p.data_proposta, ct.data_contratacao),
    respToCt: p.data_resposta ? days(p.data_resposta, ct.data_contratacao) : null,
    lastEntToProp: ents.length ? days(ents[ents.length - 1], p.data_proposta) : null,
    lastEntToCt: ents.length ? days(ents[ents.length - 1], ct.data_contratacao) : null,
  });
}
for (const k of ["candToProp", "propToCt", "respToCt", "lastEntToProp", "lastEntToCt"]) {
  const a = seq.map((s) => s[k]).filter((x) => x !== null);
  log(`${k}: mediana ${quantile(a, 0.5)}d  min ${Math.min(...a)}  max ${Math.max(...a)}  negativos ${a.filter((x) => x < 0).length}/${a.length}`);
}

log("\n=== 9. VOLUME POR VAGA / CANDIDATO ===");
const appsPerVaga = group(candidaturas, (c) => c.id_vaga).map(([, v]) => v.length);
log("candidaturas por vaga: mediana", quantile(appsPerVaga, 0.5), "p90", quantile(appsPerVaga, 0.9), "max", Math.max(...appsPerVaga));
const appsPerCand = group(candidaturas, (c) => c.id_candidato).map(([, v]) => v.length);
log("candidaturas por candidato: mediana", quantile(appsPerCand, 0.5), "max", Math.max(...appsPerCand), "| candidatos sem candidatura:", candidatos.length - new Set(candidaturas.map((c) => c.id_candidato)).size);
const ctByCand = new Map(contratacoes.map((c) => [c.id_candidatura, c]));
log("taxa contratação por nº de candidaturas:");
for (const [k, v] of group(group(candidaturas, (c) => c.id_candidato).map(([id, apps]) => ({ id, apps })), (x) => x.apps.length)) log(`  ${k} candidaturas: candidatos=${v.length} contratados=${v.filter((x) => x.apps.some((a) => ctByCand.has(a.id))).length}`);

log("\n=== CANDIDATOS COM MAIS DE UMA CONTRATAÇÃO ===");
const hiresPerCandidate = group(contratacoes, (c) => candtMap.get(c.id_candidatura).id_candidato);
log("candidatos com mais de 1 contratação:", hiresPerCandidate.filter(([, v]) => v.length > 1).length,
  "| máximo:", Math.max(...hiresPerCandidate.map(([, v]) => v.length)));

log("\n=== 10. SCORE_CURRICULO ===");
log("distribuição:", [0, 0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99, 1].map((q) => quantile(candidaturas.map((c) => c.score_curriculo), q)).join(" / "));
log("score/expectativa por senioridade: candidato vs score:");
for (const [k, v] of group(candidaturas.map((c) => ({ ...c, cd: candidatos.find((x) => x.id === c.id_candidato) })), (c) => c.cd.senioridade)) log(`  ${k}: n=${v.length} score médio=${mean(v.map((x) => x.score_curriculo)).toFixed(1)}`);
