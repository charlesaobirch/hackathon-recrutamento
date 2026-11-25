import { loadAll } from "./lib/load.mjs";

const db = loadAll();
const ids = (arr, k = "id") => new Set(arr.map((r) => r[k]));
const find = (rows, pred) => rows.filter(pred);

const S = {};
for (const [k, v] of Object.entries(db)) S[k] = ids(v);

// ---------- referential integrity ----------
const checks = [
  ["candidaturas.id_candidato -> candidatos.id", db.candidaturas, "id_candidato", S.candidatos],
  ["candidaturas.id_vaga -> vagas.id", db.candidaturas, "id_vaga", S.vagas],
  ["vagas.id_cliente -> clientes.id", db.vagas, "id_cliente", S.clientes],
  ["vagas.id_recrutador -> recrutadores.id", db.vagas, "id_recrutador", S.recrutadores],
  ["entrevistas.id_candidatura -> candidaturas.id", db.entrevistas, "id_candidatura", S.candidaturas],
  ["entrevistas.id_recrutador -> recrutadores.id", db.entrevistas, "id_recrutador", S.recrutadores],
  ["interacoes.id_candidatura -> candidaturas.id", db.interacoes, "id_candidatura", S.candidaturas],
  ["interacoes.id_recrutador -> recrutadores.id", db.interacoes, "id_recrutador", S.recrutadores],
  ["propostas.id_candidatura -> candidaturas.id", db.propostas, "id_candidatura", S.candidaturas],
  ["contratacoes.id_candidatura -> candidaturas.id", db.contratacoes, "id_candidatura", S.candidaturas],
  ["contratacoes.id_vaga -> vagas.id", db.contratacoes, "id_vaga", S.vagas],
  ["contratacoes.id_cliente -> clientes.id", db.contratacoes, "id_cliente", S.clientes],
  ["contratacoes.id_recrutador -> recrutadores.id", db.contratacoes, "id_recrutador", S.recrutadores],
  ["feedback_clientes.id_contratacao -> contratacoes.id", db.feedback_clientes, "id_contratacao", S.contratacoes],
  ["historico_vagas.id_vaga_original -> vagas.id", db.historico_vagas, "id_vaga_original", S.vagas],
  ["historico_vagas.vaga_reaberta_id -> vagas.id", find(db.historico_vagas, (r) => r.vaga_reaberta_id), "vaga_reaberta_id", S.vagas],
];

console.log("=== INTEGRIDADE REFERENCIAL ===");
for (const [label, rows, col, target] of checks) {
  const bad = find(rows, (r) => r[col] != null && !target.has(r[col]));
  const uniq = new Set(bad.map((r) => r[col]));
  console.log(`${label}: ${bad.length}/${rows.length} órfãos (${uniq.size} valores distintos) ${uniq.size ? "-> " + [...uniq].slice(0, 12).join(",") : ""}`);
}

// ---------- cardinalidade / coerência entre tabelas ----------
console.log("\n=== COERÊNCIA CRUZADA ===");
const ct = db.contratacoes;
const ctUniq = [...new Map(ct.map((r) => [r.id, r])).values()];
console.log("contratacoes linhas/unicas:", ct.length, ctUniq.length);
const ctCands = new Set(ct.map((r) => r.id_candidatura));
const propAceites = db.propostas.filter((p) => p.estado_proposta === "aceite").map((p) => p.id_candidatura);
console.log("propostas aceites:", propAceites.length, "| aceites sem contratacao:", propAceites.filter((p) => !ctCands.has(p)).length);
console.log("contratacoes sem proposta:", [...ctCands].filter((c) => !db.propostas.some((p) => p.id_candidatura === c)).length);
const candContratado = db.candidaturas.filter((c) => c.etapa_atual === "contratado");
console.log("candidaturas etapa_atual=contratado:", candContratado.length, "| dessas sem contratacao:", candContratado.filter((c) => !ctCands.has(c.id)).length);
// estado candidatura vs etapa
const st = {};
for (const c of db.candidaturas) {
  const k = `${c.estado_candidatura}|${c.etapa_atual}|${c.motivo_encerramento ?? "-"}`;
  st[k] = (st[k] || 0) + 1;
}
console.log("estado_candidatura x etapa_atual x motivo:");
for (const [k, v] of Object.entries(st).sort((a, b) => b[1] - a[1])) console.log("   ", k, v);

// vagas estado vs contratacoes
const ctVagas = new Set(ct.map((r) => r.id_vaga));
const vg = {};
for (const v of db.vagas) vg[`${v.estado}|${ctVagas.has(v.id) ? "com_contratacao" : "sem_contratacao"}`] = (vg[`${v.estado}|${ctVagas.has(v.id) ? "com_contratacao" : "sem_contratacao"}`] || 0) + 1;
console.log("vagas estado x tem_contratacao:", vg);

// destinos: candidaturas sem entrevista / sem interacao
const hasEnt = new Set(db.entrevistas.map((r) => r.id_candidatura));
const hasInt = new Set(db.interacoes.map((r) => r.id_candidatura));
console.log("candidaturas sem entrevista:", db.candidaturas.filter((c) => !hasEnt.has(c.id)).length);
console.log("candidaturas sem interacao:", db.candidaturas.filter((c) => !hasInt.has(c.id)).length);
console.log("candidaturas sem atividade nenhuma:", db.candidaturas.filter((c) => !hasEnt.has(c.id) && !hasInt.has(c.id)).length);

// ---------- valores fora de dominio / formatos ----------
console.log("\n=== FORMATOS E DOMÍNIOS ===");
const notDate = db.entrevistas.filter((r) => !/^\d{4}-\d{2}-\d{2}$/.test(r.data));
console.log("entrevistas.data fora do formato YYYY-MM-DD:", notDate.length);
const samples = [...new Set(notDate.map((r) => r.data))].slice(0, 15);
console.log("  exemplos:", JSON.stringify(samples));
const badIso = Object.values(notDate).filter((r) => /^\d{4}-\d{2}-\d{2}/.test(r.data));
console.log("  começam por YYYY-MM-DD mas com lixo:", badIso.length, "ex:", badIso.slice(0, 3).map((r) => r.data));

console.log("entrevistas score_tecnico > 100:", db.entrevistas.filter((r) => r.score_tecnico > 100).length,
  "| >110:", db.entrevistas.filter((r) => r.score_tecnico > 110).length,
  "| max:", Math.max(...db.entrevistas.map((r) => r.score_tecnico)));
console.log("entrevistas score_comunicacao > 100:", db.entrevistas.filter((r) => r.score_comunicacao > 100).length);
console.log("candidatos com skills vazias/estranhas:", db.candidatos.filter((r) => !r.skills || r.skills.trim() === "" || r.skills.includes(",,")).length);

// duplicados de negocio
const dupVagaCand = {};
for (const c of db.candidaturas) {
  const k = `${c.id_candidato}->${c.id_vaga}`;
  dupVagaCand[k] = (dupVagaCand[k] || 0) + 1;
}
const dupPairs = Object.entries(dupVagaCand).filter(([, v]) => v > 1);
console.log("pares candidato-vaga duplicados:", dupPairs.length, "linhas extra:", dupPairs.reduce((a, [, v]) => a + v - 1, 0));
console.log("  ex:", dupPairs.slice(0, 5));
const dupProp = {};
for (const p of db.propostas) dupProp[p.id_candidatura] = (dupProp[p.id_candidatura] || 0) + 1;
console.log("candidaturas com >1 proposta:", Object.values(dupProp).filter((v) => v > 1).length);

// datas futuras / ordem
const today = new Date("2026-11-25");
const future = (rows, col) => rows.filter((r) => r[col] && new Date(r[col]) > today).length;
for (const [t, cols] of Object.entries({
  candidatos: ["data_candidatura"], candidaturas: ["data_candidatura", "data_entrada_etapa"],
  vagas: ["data_abertura", "data_fecho"], entrevistas: ["data"], interacoes: ["data"],
  propostas: ["data_proposta", "data_resposta"], contratacoes: ["data_contratacao", "data_saida"],
  feedback_clientes: ["data_feedback"], historico_vagas: ["data_evento"],
})) {
  console.log(`${t}:`, cols.map((c) => `${c}=futuras:${future(db[t], c)}`).join(" | "));
}

// datas de fecho < abertura
console.log("vagas com data_fecho < data_abertura:", db.vagas.filter((v) => v.data_fecho < v.data_abertura).length);
console.log("entrevistas com data < data_candidatura:", (() => {
  const m = new Map(db.candidaturas.map((c) => [c.id, c.data_candidatura]));
  return db.entrevistas.filter((e) => { const d = m.get(e.id_candidatura); return d && e.data < d; }).length;
})());
console.log("contratacoes com data_contratacao < data_candidatura:", (() => {
  const m = new Map(db.candidaturas.map((c) => [c.id, c.data_candidatura]));
  return db.contratacoes.filter((c) => { const d = m.get(c.id_candidatura); return d && c.data_contratacao < d; }).length;
})());
console.log("contratacoes com data_saida < data_contratacao:", db.contratacoes.filter((c) => c.data_saida && c.data_saida < c.data_contratacao).length);

// salario fora da banda da vaga
const vmap = new Map(db.vagas.map((v) => [v.id, v]));
const outBand = db.contratacoes.filter((c) => {
  const v = vmap.get(c.id_vaga);
  return v && (c.salario_final < v.salario_min || c.salario_final > v.salario_max);
});
console.log("contratacoes com salario_final fora da banda da vaga:", outBand.length, "/", db.contratacoes.length);
const outBandP = db.propostas.filter((p) => {
  const c = db.candidaturas.find((x) => x.id === p.id_candidatura);
  const v = c && vmap.get(c.id_vaga);
  return v && (p.salario_oferecido < v.salario_min || p.salario_oferecido > v.salario_max);
});
console.log("propostas com salario_oferecido fora da banda da vaga:", outBandP.length, "/", db.propostas.length);
