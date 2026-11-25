import { loadAll } from "./lib/load.mjs";
import { normalize, iso, days, month, mean, quantile, corr, corrP } from "./lib/stats.mjs";

const db = normalize(loadAll());
const { candidatos, candidaturas, clientes, contratacoes, entrevistas, feedback_clientes, interacoes, propostas, recrutadores, vagas } = db;
const log = (...a) => console.log(...a);
const pct = (a, b) => (b ? +((a / b) * 100).toFixed(1) : null);
const group = (rows, fn) => { const m = new Map(); for (const r of rows) { const k = fn(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); } return [...m.entries()]; };
const candtMap = new Map(candidaturas.map((c) => [c.id, c]));
const vagaMap = new Map(vagas.map((v) => [v.id, v]));
const ctByCand = new Map(contratacoes.map((c) => [c.id_candidatura, c]));

log("=== TIMELINE DETALHADO (candidaturas contratadas, n=262) ===");
const rows = [];
for (const ct of contratacoes) {
  const ap = candtMap.get(ct.id_candidatura);
  const ents = entrevistas.filter((e) => e.id_candidatura === ap.id).map((e) => e.data).sort((a, b) => a - b);
  const p = propostas.find((x) => x.id_candidatura === ap.id);
  rows.push({
    candToFirstEnt: ents.length ? days(ap.data_candidatura, ents[0]) : null,
    entCycle: ents.length > 1 ? days(ents[0], ents[ents.length - 1]) : 0,
    lastEntToProp: p ? days(ents[ents.length - 1], p.data_proposta) : null,
    propToCt: days(p.data_proposta, ct.data_contratacao),
    total: days(ap.data_candidatura, ct.data_contratacao),
    recruiter: ct.id_recrutador,
  });
}
for (const k of ["candToFirstEnt", "entCycle", "lastEntToProp", "propToCt", "total"]) {
  const a = rows.map((r) => r[k]).filter((x) => x !== null);
  log(`${k}: mediana ${quantile(a, 0.5)}d  p90 ${quantile(a, 0.9)}d  min ${Math.min(...a)}  max ${Math.max(...a)}`);
}
log("\npor recrutador (mediana dos segmentos):");
for (const [k, v] of group(rows, (r) => r.recruiter).sort()) {
  log(`  ${k}: cand->1ªentrevista=${quantile(v.map((r) => r.candToFirstEnt), 0.5)} ciclo_entrevistas=${quantile(v.map((r) => r.entCycle), 0.5)} última_ent->proposta=${quantile(v.map((r) => r.lastEntToProp), 0.5)} proposta->contrato=${quantile(v.map((r) => r.propToCt), 0.5)} total=${quantile(v.map((r) => r.total), 0.5)}`);
}

log("\n=== CANDIDATURAS SEM ENTREVISTA ===");
const hasEnt = new Set(entrevistas.map((e) => e.id_candidatura));
const semEnt = candidaturas.filter((c) => !hasEnt.has(c.id));
log("n:", semEnt.length, "| etapa:", group(semEnt, (c) => c.etapa_atual).map(([k, v]) => `${k}:${v.length}`).join(" | "));
log("| por vaga:", group(semEnt, (c) => c.id_vaga).map(([k, v]) => `${k}:${v.length}`).join(" | "));

log("\n=== PARAGEM POR ETAPA (candidaturas) ===");
const stageSet = new Map(group(entrevistas, (e) => e.id_candidatura).map(([k, v]) => [k, new Set(v.map((x) => x.fase))]));
const reach = (c) => {
  const s = stageSet.get(c.id) || new Set();
  if (s.has("entrevista_final")) return "final";
  if (s.has("entrevista_cliente")) return "cliente";
  if (s.has("entrevista_tecnica")) return "tecnica";
  if (s.has("triagem")) return "triagem";
  return "sem_entrevista";
};
for (const [k, v] of group(candidaturas, reach).sort((a, b) => b[1].length - a[1].length)) {
  const hired = v.filter((c) => ctByCand.has(c.id)).length;
  log(`  ${k}: ${v.length} (contratados ${hired})`);
}
// *efetivo* alcance: máxima fase atingida vs etapa_atual
log("etapa_atual x fase máxima atingida:");
const cross = {};
for (const c of candidaturas) {
  const k = `${c.etapa_atual}|${reach(c)}`;
  cross[k] = (cross[k] || 0) + 1;
}
for (const [k, v] of Object.entries(cross).sort((a, b) => b[1] - a[1])) log(`  ${k}: ${v}`);

log("\n=== CONVERSÃO POR ETAPA (coorte) ===");
const n0 = candidaturas.length;
const nEnt = [...stageSet.keys()].length;
const nTec = candidaturas.filter((c) => stageSet.get(c.id)?.has("entrevista_tecnica")).length;
const nCli = candidaturas.filter((c) => stageSet.get(c.id)?.has("entrevista_cliente")).length;
const nFin = candidaturas.filter((c) => stageSet.get(c.id)?.has("entrevista_final")).length;
const nProp = new Set(propostas.map((p) => p.id_candidatura)).size;
const nAce = propostas.filter((p) => p.estado_proposta === "aceite").length;
log(`candidaturas ${n0} -> entrevista ${nEnt} (${pct(nEnt, n0)}%) -> técnica ${nTec} (${pct(nTec, nEnt)}%) -> cliente ${nCli} (${pct(nCli, nTec)}%) -> final ${nFin} (${pct(nFin, nCli)}%) -> proposta ${nProp} (${pct(nProp, nFin)}%) -> aceite ${nAce} (${pct(nAce, nProp)}%)`);
log(`global candidatura->contratação: ${pct(262, n0)}%`);

log("\n=== TENDÊNCIA TEMPORAL (trimestres) ===");
const q = (d) => `${d.getUTCFullYear()}-T${Math.floor(d.getUTCMonth() / 3) + 1}`;
const ctsQ = group(contratacoes, (c) => q(c.data_contratacao)).sort();
for (const [k, v] of ctsQ) log(`  ${k}: contratações=${v.length} tempo=${mean(v.map((x) => x.tempo_total_dias)).toFixed(1)}d custo=${Math.round(mean(v.map((x) => x.custo_estimado_contratacao)))} desempenho=${mean(v.map((x) => x.desempenho_90_dias)).toFixed(2)}`);
log("propostas/trimestre:", group(propostas, (p) => q(p.data_proposta)).sort().map(([k, v]) => `${k}:${v.length}`).join(" "));
log("taxa aceitação/trimestre:", group(propostas, (p) => q(p.data_proposta)).sort().map(([k, v]) => `${k}:${pct(v.filter((x) => x.estado_proposta === "aceite").length, v.length)}%`).join(" "));
log("candidaturas/trimestre:", group(candidaturas, (c) => q(c.data_candidatura)).sort().map(([k, v]) => `${k}:${v.length}`).join(" "));

log("\n=== PREÇO: BANDAS VS MERCADO ===");
const senOrder = ["junior", "mid", "senior", "lead"];
log("média salario_min/max da vaga por senioridade:");
for (const s of senOrder) {
  const v = vagas.filter((x) => x.senioridade === s);
  log(`  ${s}: n=${v.length} min=${Math.round(mean(v.map((x) => x.salario_min)))} max=${Math.round(mean(v.map((x) => x.salario_max)))}`);
}
log("média expectativa por senioridade do candidato:");
for (const s of senOrder) {
  const v = candidatos.filter((x) => x.senioridade === s);
  log(`  ${s}: n=${v.length} exp=${Math.round(mean(v.map((x) => x.expectativa_salarial)))}`);
}
log("salário final médio por senioridade da vaga:");
for (const s of senOrder) {
  const v = contratacoes.filter((x) => vagaMap.get(x.id_vaga).senioridade === s);
  log(`  ${s}: n=${v.length} final=${Math.round(mean(v.map((x) => x.salario_final)))}`);
}
// eta^2 senioridade -> salario_min
const grand = mean(vagas.map((v) => v.salario_min));
let ssb = 0, sst = 0;
for (const s of senOrder) { const v = vagas.filter((x) => x.senioridade === s); ssb += v.length * (mean(v.map((x) => x.salario_min)) - grand) ** 2; }
sst = vagas.reduce((a, v) => a + (v.salario_min - grand) ** 2, 0);
log("eta² senioridade -> salario_min:", (ssb / sst).toFixed(3), "(0=sem relação, 1=determina)");
const grandL = mean(vagas.map((v) => v.salario_min));
let ssbL = 0;
for (const l of [...new Set(vagas.map((v) => v.localizacao))]) { const v = vagas.filter((x) => x.localizacao === l); ssbL += v.length * (mean(v.map((x) => x.salario_min)) - grandL) ** 2; }
log("eta² localização -> salario_min:", (ssbL / sst).toFixed(3));
log("eta² tipo_contrato -> salario_min:", (() => {
  let s = 0; for (const l of ["permanente", "temporario"]) { const v = vagas.filter((x) => x.tipo_contrato === l); s += v.length * (mean(v.map((x) => x.salario_min)) - grandL) ** 2; } return (s / sst).toFixed(3);
})());
log("corr anos_experiencia x expectativa:", corr(candidatos.map((c) => c.anos_experiencia), candidatos.map((c) => c.expectativa_salarial)).toFixed(3));
log("corr anos_experiencia x salario_final (contratados):", corr(contratacoes.map((c) => candtMap.get(c.id_candidatura)).map((ap) => candidatos.find((x) => x.id === ap.id_candidato).anos_experiencia), contratacoes.map((c) => c.salario_final)).toFixed(3));

log("\n=== EXCLUSIVO VS PARTILHADO (resultado) ===");
for (const m of ["exclusivo", "partilhado", "contingencia"]) {
  const cls = clientes.filter((c) => c.modelo_recrutamento === m).map((c) => c.id);
  const vs = vagas.filter((v) => cls.includes(v.id_cliente));
  const cts = contratacoes.filter((c) => cls.includes(c.id_cliente));
  const fbs = feedback_clientes.filter((f) => cts.some((c) => c.id === f.id_contratacao));
  log(`  ${m}: vagas=${vs.length} contratações=${cts.length} tth=${mean(cts.map((c) => c.tempo_total_dias)).toFixed(1)}d custo=${Math.round(mean(cts.map((c) => c.custo_estimado_contratacao)))} satisf=${mean(fbs.map((f) => f.satisfacao)).toFixed(2)} subst=${pct(fbs.filter((f) => f.necessita_substituicao).length, fbs.length)}% ret90=${pct(cts.filter((c) => c.retencao_90_dias === true).length, cts.filter((c) => c.retencao_90_dias !== null).length)}%`);
}
log("\n=== VAGAS: URGÊNCIA / TIPO / ESTADO ===");
log("tempo médio até preencher por urgência (data_abertura->data_fecho):");
for (const u of ["alta", "media", "baixa"]) {
  const v = vagas.filter((x) => x.urgencia === u);
  const preench = v.filter((x) => x.estado === "preenchida");
  log(`  ${u}: n=${v.length} preenchidas=${preench.length} (${pct(preench.length, v.length)}%) dias_abertura_fecho=${quantile(preench.map((x) => days(x.data_abertura, x.data_fecho)), 0.5)}`);
}
log("por tipo de contrato:", group(vagas, (v) => v.tipo_contrato).map(([k, v]) => `${k}: ${v.length} preenchidas=${pct(v.filter((x) => x.estado === "preenchida").length, v.length)}%`).join(" | "));
log("vagas por departamento x estado:", group(vagas, (v) => `${v.departamento}|${v.estado}`).map(([k, v]) => `${k}:${v.length}`).join(" | "));

log("\n=== REABERTURAS ===");
const reab = vagas.filter((v) => v.estado === "reaberta");
log("vagas reabertas:", reab.length, "| com evento em historico:", reab.filter((v) => db.historico_vagas.some((h) => h.vaga_reaberta_id === v.id)).length);
log("motivos de reabertura:", group(db.historico_vagas.filter((h) => h.tipo_evento === "vaga_reaberta"), (h) => h.motivo).map(([k, v]) => `${k}:${v.length}`).join(" | "));
const reabIds = new Set(reab.map((v) => v.id));
log("contratações em vagas reabertas:", contratacoes.filter((c) => reabIds.has(c.id_vaga)).length);
const evPorVaga = group(db.historico_vagas, (h) => h.id_vaga_original).filter(([, v]) => v.length > 1);
log("vagas com múltiplos eventos:", evPorVaga.map(([k, v]) => `${k}(${v.length})`).join(" "));

log("\n=== SAÍDAS PREcoces vs SUBSTITUIÇÃO ===");
const fb = feedback_clientes.map((f) => ({ ...f, ct: contratacoes.find((c) => c.id === f.id_contratacao) }));
log("feedbacks que pedem substituição:", fb.filter((f) => f.necessita_substituicao).length);
log("  desses, contratado saiu:", fb.filter((f) => f.necessita_substituicao && f.ct.data_saida).length);
log("  desses, saída < 90d:", fb.filter((f) => f.necessita_substituicao && f.ct.data_saida && days(f.ct.data_contratacao, f.ct.data_saida) < 90).length);
log("substituição por motivo_saida:", group(fb.filter((f) => f.necessita_substituicao), (f) => f.ct.motivo_saida ?? "sem_saida").map(([k, v]) => `${k}:${v.length}`).join(" | "));
log("necessita_substituicao por cliente:");
for (const [k, v] of group(fb, (f) => contratacoes.find((c) => c.id === f.id_contratacao).id_cliente).sort()) log(`  ${k}: ${v.filter((f) => f.necessita_substituicao).length}/${v.length}`);
