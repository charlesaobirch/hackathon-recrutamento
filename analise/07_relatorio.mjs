import fs from "node:fs";
import path from "node:path";
import { loadAll } from "./lib/load.mjs";
import { normalize, iso, days, month, mean, quantile, corr, corrP, chi2Test } from "./lib/stats.mjs";
import * as C from "./lib/charts.mjs";

const OUT = path.resolve("./");
const FIG = path.join(OUT, "figuras");
fs.mkdirSync(FIG, { recursive: true });

const db = normalize(loadAll());
const raw = loadAll();
const { candidatos, candidaturas, clientes, contratacoes, entrevistas, feedback_clientes, historico_vagas, interacoes, propostas, recrutadores, vagas } = db;

const pct = (a, b) => (b ? +((a / b) * 100).toFixed(1) : 0);
const nf = (v, d = 0) => Number(v).toLocaleString("pt-PT", { minimumFractionDigits: d, maximumFractionDigits: d });
const eur = (v) => "€" + nf(v);
const group = (rows, fn) => { const m = new Map(); for (const r of rows) { const k = fn(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); } return [...m.entries()]; };
const candtMap = new Map(candidaturas.map((c) => [c.id, c]));
const vagaMap = new Map(vagas.map((v) => [v.id, v]));
const candMap = new Map(candidatos.map((c) => [c.id, c]));
const cliMap = new Map(clientes.map((c) => [c.id, c]));
const recMap = new Map(recrutadores.map((r) => [r.id, r]));
const ctByCand = new Map(contratacoes.map((c) => [c.id_candidatura, c]));
const ctById = new Map(contratacoes.map((c) => [c.id, c]));
const propByCand = new Map(propostas.map((p) => [p.id_candidatura, p]));
const TODAY = new Date("2026-11-25");

// ---------------- métricas ----------------
const ctUniq = contratacoes; // já deduplicado em normalize
const hiredCands = new Set(ctUniq.map((c) => candtMap.get(c.id_candidatura).id_candidato));
const stageSet = new Map(group(entrevistas, (e) => e.id_candidatura).map(([k, v]) => [k, new Set(v.map((x) => x.fase))]));
const FASE = ["triagem", "entrevista_tecnica", "entrevista_cliente", "entrevista_final"];
const maxStage = (c) => { const s = stageSet.get(c.id) || new Set(); for (let i = FASE.length - 1; i >= 0; i--) if (s.has(FASE[i])) return FASE[i]; return "sem_entrevista"; };

const n0 = candidaturas.length;
const fEnt = candidaturas.filter((c) => stageSet.has(c.id)).length;
const fTec = candidaturas.filter((c) => stageSet.get(c.id)?.has("entrevista_tecnica")).length;
const fCli = candidaturas.filter((c) => stageSet.get(c.id)?.has("entrevista_cliente")).length;
const fFin = candidaturas.filter((c) => stageSet.get(c.id)?.has("entrevista_final")).length;
const nProp = propostas.length;
const nAce = propostas.filter((p) => p.estado_proposta === "aceite").length;

// timeline
const tl = [];
for (const ct of ctUniq) {
  const ap = candtMap.get(ct.id_candidatura);
  const ents = entrevistas.filter((e) => e.id_candidatura === ap.id).map((e) => e.data).sort((a, b) => a - b);
  const p = propByCand.get(ap.id);
  tl.push({
    recruiter: ct.id_recrutador, cliente: ct.id_cliente,
    first: days(ap.data_candidatura, ents[0]), cycle: days(ents[0], ents[ents.length - 1]),
    idle: days(ents[ents.length - 1], p.data_proposta), close: days(p.data_proposta, ct.data_contratacao),
    total: days(ap.data_candidatura, ct.data_contratacao),
  });
}
const med = (a) => quantile(a, 0.5);
const totalMedio = mean(ctUniq.map((c) => c.tempo_total_dias));

// recruiter stats
const recStats = recrutadores.map((r) => {
  const apps = candidaturas.filter((c) => vagaMap.get(c.id_vaga)?.id_recrutador === r.id);
  const ents = entrevistas.filter((e) => e.id_recrutador === r.id);
  const props = propostas.filter((p) => apps.some((a) => a.id === p.id_candidatura));
  const cts = ctUniq.filter((c) => c.id_recrutador === r.id);
  const r90 = cts.filter((c) => c.retencao_90_dias !== null);
  return {
    id: r.id, equipa: r.equipa, anos: r.anos_experiencia, vagas: vagas.filter((v) => v.id_recrutador === r.id).length,
    apps: apps.length, entPorApp: +(ents.length / apps.length).toFixed(2), propostas: props.length,
    conv: pct(props.filter((p) => p.estado_proposta === "aceite").length, props.length),
    contratacoes: cts.length, tth: +mean(cts.map((c) => c.tempo_total_dias)).toFixed(1),
    custo: Math.round(mean(cts.map((c) => c.custo_estimado_contratacao))),
    desempenho: +mean(cts.map((c) => c.desempenho_90_dias)).toFixed(2),
    ret90: pct(r90.filter((c) => c.retencao_90_dias === true).length, r90.length),
    idle: +med(tl.filter((t) => t.recruiter === r.id).map((t) => t.idle)).toFixed(1),
  };
});

const cliStats = clientes.map((cl) => {
  const cts = ctUniq.filter((c) => c.id_cliente === cl.id);
  const fbs = feedback_clientes.filter((f) => cts.some((c) => c.id === f.id_contratacao));
  const r90 = cts.filter((c) => c.retencao_90_dias !== null);
  return {
    ...cl, vagas: vagas.filter((v) => v.id_cliente === cl.id).length, contratacoes: cts.length,
    tth: +mean(cts.map((c) => c.tempo_total_dias)).toFixed(1),
    satisfacao: +mean(fbs.map((f) => f.satisfacao)).toFixed(2),
    subst: fbs.filter((f) => f.necessita_substituicao).length,
    ret90: pct(r90.filter((c) => c.retencao_90_dias === true).length, r90.length),
    desempenho: +mean(cts.map((c) => c.desempenho_90_dias)).toFixed(2),
    custo: Math.round(mean(cts.map((c) => c.custo_estimado_contratacao))),
    nfb: fbs.length,
  };
});

const ret90G = pct(ctUniq.filter((c) => c.retencao_90_dias === true).length, ctUniq.filter((c) => c.retencao_90_dias !== null).length);
const ret180G = pct(ctUniq.filter((c) => c.retencao_180_dias === true).length, ctUniq.filter((c) => c.retencao_180_dias !== null).length);

// bandas
const posBand = (p) => { const ap = candtMap.get(p.id_candidatura); const v = vagaMap.get(ap.id_vaga); return v ? (p.salario_oferecido - v.salario_min) / (v.salario_max - v.salario_min) : null; };
const propBand = propostas.map((p) => ({ p, pos: posBand(p) })).filter((x) => x.pos !== null);
const belowMin = propBand.filter((x) => x.pos < 0).length;
const aboveMax = propBand.filter((x) => x.pos > 1).length;
const accRate = (rows) => pct(rows.filter((x) => x.p.estado_proposta === "aceite").length, rows.length);

// correlation matrix at hire level
const hireRows = ctUniq.map((c) => {
  const ap = candtMap.get(c.id_candidatura); const cd = candMap.get(ap.id_candidato); const v = vagaMap.get(c.id_vaga);
  const fb = feedback_clientes.find((f) => f.id_contratacao === c.id);
  const ents = stageSet.get(ap.id)?.size || 0;
  return {
    salario: c.salario_final, custo: c.custo_estimado_contratacao, tempo: c.tempo_total_dias,
    desempenho: c.desempenho_90_dias, satisfacao: fb?.satisfacao ?? null, experiencia: cd.anos_experiencia,
    expectativa: cd.expectativa_salarial, score: ap.score_curriculo, etapas: ents,
    interacoes: interacoes.filter((i) => i.id_candidatura === ap.id).length,
    banda: (c.salario_final - v.salario_min) / (v.salario_max - v.salario_min),
  };
});
const vars = [["salario", "Salário final"], ["custo", "Custo"], ["tempo", "Tempo (dias)"], ["desempenho", "Desempenho 90d"], ["experiencia", "Anos exp."], ["expectativa", "Expectativa"], ["score", "Score CV"], ["banda", "Posição na banda"], ["interacoes", "Nº interações"]];
const mat = vars.map(([k]) => vars.map(([k2]) => {
  const pairs = hireRows.filter((r) => r[k] != null && r[k2] != null);
  return pairs.length > 3 ? corr(pairs.map((r) => r[k]), pairs.map((r) => r[k2])) : 0;
}));

// tests
const urgTest = chi2Test(["alta", "media", "baixa"].map((u) => { const vs = vagas.filter((v) => v.urgencia === u); return [vs.filter((v) => v.estado === "preenchida").length, vs.filter((v) => v.estado !== "preenchida").length]; }));
const canalTest = chi2Test([...new Set(candidatos.map((c) => c.canal_origem))].map((k) => {
  const ids = new Set(candidatos.filter((c) => c.canal_origem === k).map((c) => c.id));
  const apps = candidaturas.filter((a) => ids.has(a.id_candidato));
  const h = apps.filter((a) => ctByCand.has(a.id)).length; return [h, apps.length - h];
}));
const dispTest = chi2Test([...new Set(candidatos.map((c) => c.disponibilidade))].map((k) => {
  const ids = new Set(candidatos.filter((c) => c.disponibilidade === k).map((c) => c.id));
  const apps = candidaturas.filter((a) => ids.has(a.id_candidato));
  const h = apps.filter((a) => ctByCand.has(a.id)).length; return [h, apps.length - h];
}));
const fbAll = feedback_clientes.map((f) => ({ ...f, ct: ctById.get(f.id_contratacao) }));

const rSatisf = corr(fbAll.map((f) => f.satisfacao), fbAll.map((f) => f.ct.desempenho_90_dias));

// anomalias quantificadas
const mismatchCt = ctUniq.filter((c) => candtMap.get(c.id_candidatura).id_vaga !== c.id_vaga).length;
const hiredFinal = candidaturas.filter((c) => ctByCand.has(c.id) && maxStage(c) === "entrevista_final").length;
const etapaMatch = candidaturas.filter((c) => c.etapa_atual === maxStage(c)).length;
const scoreHigh = entrevistas.filter((e) => e.score_tecnico > 100).length;
const ddmm = raw.entrevistas.filter((e) => /^\d{2}\/\d{2}\/\d{4}$/.test(e.data)).length;
const contratadoEstado = candidatos.filter((c) => c.estado === "contratado").length;
const vagasExpiradas = vagas.filter((v) => v.estado === "em_andamento" && days(v.data_fecho, TODAY) > 90).length;
const feedbackCluster = feedback_clientes.filter((f) => iso(f.data_feedback) === "2025-12-31").length;
const respDepois = propostas.filter((p) => p.data_resposta && ctByCand.get(p.id_candidatura) && p.data_resposta > ctByCand.get(p.id_candidatura).data_contratacao).length;
const feedbackAntes = feedback_clientes.filter((f) => {
  const ct = ctById.get(f.id_contratacao);
  return ct && f.data_feedback < ct.data_contratacao;
}).length;
const hiresPerCandidate = new Map();
for (const ct of ctUniq) {
  const candId = candtMap.get(ct.id_candidatura)?.id_candidato;
  if (candId) hiresPerCandidate.set(candId, (hiresPerCandidate.get(candId) || 0) + 1);
}
const candidatosComRecontratacao = [...hiresPerCandidate.values()].filter((n) => n > 1).length;
const dupPares = (() => { const m = new Map(); for (const c of candidaturas) { const k = c.id_candidato + "|" + c.id_vaga; m.set(k, (m.get(k) || 0) + 1); } return [...m.values()].filter((v) => v > 1).length; })();
const ret90ComSaida = ctUniq.filter((c) => c.data_saida && c.retencao_90_dias === true).length;
const ret90NullAntigo = ctUniq.filter((c) => c.retencao_90_dias === null && days(c.data_contratacao, TODAY) > 90).length;

// ---------------- gráficos ----------------
const fig = {};
fig.funnel = C.hbarChart({
  title: "Funil de recrutamento — 5 962 candidaturas", subtitle: "Nº de candidaturas que atingem cada etapa (dados completos). Conversão global: 4,4%.",
  data: [
    { label: "Candidaturas", value: n0 }, { label: "Triagem", value: fEnt }, { label: "Entrevista técnica", value: fTec },
    { label: "Entrevista cliente", value: fCli }, { label: "Entrevista final", value: fFin },
    { label: "Proposta", value: nProp }, { label: "Proposta aceite", value: nAce },
  ],
  unit: "", w: 780,
});
{
  const meses = [...new Set(candidaturas.map((c) => month(c.data_candidatura)))].sort();
  const cm = new Map(group(candidaturas, (c) => month(c.data_candidatura)).map(([k, v]) => [k, v.length]));
  const em = new Map(group(entrevistas, (e) => month(e.data)).map(([k, v]) => [k, v.length]));
  fig.mensal = C.lineChart({
    title: "Volume mensal de candidaturas e entrevistas", subtitle: "Jan/2024 – Dez/2025. Picos em fev/2025 e out/2025; crescimento de ~40% no ano de 2025.",
    labels: meses, series: [
      { name: "Candidaturas", values: meses.map((l) => cm.get(l) || 0) },
      { name: "Entrevistas", values: meses.map((l) => em.get(l) || 0) },
    ], w: 800, h: 340,
  });
  const mesesCt = [...new Set(contratacoes.map((c) => month(c.data_contratacao)))].sort();
  const tm = new Map(group(contratacoes, (c) => month(c.data_contratacao)).map(([k, v]) => [k, v.length]));
  fig.contratacoesMes = C.barChart({
    title: "Contratações por mês", subtitle: "Mesmo padrão de picos: fev/2025 (17), mar/2025 (18) e out/2025 (28).",
    data: mesesCt.map((l) => ({ label: l, value: tm.get(l) || 0 })), w: 800, h: 300, color: "#2f855a",
  });
}
fig.recrutadores = C.scatterChart({
  title: "Mapa dos recrutadores: velocidade vs. qualidade", subtitle: "Eixo x = tempo médio até à contratação; eixo y = desempenho médio a 90 dias; tamanho = nº de contratações.",
  points: recStats.map((r) => ({
    x: r.tth, y: r.desempenho, r: 5 + r.contratacoes / 6, color: r.id === "R02" ? "#c53030" : r.id === "R07" ? "#2f855a" : "#2b6cb0",
    opacity: 0.85, label: r.id, title: `${r.id}: ${r.tth} d, desempenho ${r.desempenho}, ${r.contratacoes} contratações, retenção ${r.ret90}%`,
  })),
  xDomain: [20, 62], yDomain: [2.4, 4.1], xLabel: "Tempo médio até à contratação (dias)", yLabel: "Desempenho médio a 90 dias (1‑5)",
  tickX: (v) => Math.round(v), tickY: (v) => v.toFixed(1), xTicks: 6, yTicks: 3, labelPoints: true, w: 760, h: 360,
});
fig.timeline = C.stackedTimelineChart({
  title: "Onde vai o tempo do processo (mediana, dias)", subtitle: "As entrevistas demoram 6 dias; a passagem da última entrevista à proposta consome 27 dias (68% do ciclo).",
  categories: ["R02", "R08", "R01", "R03", "R06", "R10", "R04", "R05", "R09", "R07"],
  segments: ["first", "cycle", "idle", "close"].map((k, j) => ({
    name: ["Candidatura → 1ª entrevista", "Ciclo de entrevistas", "Espera até proposta", "Proposta → contratação"][j],
    values: ["R02", "R08", "R01", "R03", "R06", "R10", "R04", "R05", "R09", "R07"].map((r) => med(tl.filter((t) => t.recruiter === r).map((t) => t[k]))),
    color: ["#90cdf4", "#4299e1", "#dd6b20", "#2f855a"][j],
  })), w: 800, h: 330,
});
fig.salarios = C.groupedBarChart({
  title: "Bandas salariais das vagas vs. expectativa dos candidatos vs. salário contratado", subtitle: "As bandas das vagas não acompanham a senioridade (junior ≥ mid) e ficam, em média, acima da expectativa dos candidatos.",
  labels: ["Júnior", "Mid", "Sénior", "Lead"],
  series: [
    { name: "Mínimo da vaga", values: ["junior", "mid", "senior", "lead"].map((s) => Math.round(mean(vagas.filter((v) => v.senioridade === s).map((v) => v.salario_min)))), color: "#a0aec0" },
    { name: "Máximo da vaga", values: ["junior", "mid", "senior", "lead"].map((s) => Math.round(mean(vagas.filter((v) => v.senioridade === s).map((v) => v.salario_max)))), color: "#cbd5e0" },
    { name: "Expectativa do candidato", values: ["junior", "mid", "senior", "lead"].map((s) => Math.round(mean(candidatos.filter((c) => c.senioridade === s).map((c) => c.expectativa_salarial)))), color: "#2b6cb0" },
    { name: "Salário contratado", values: ["junior", "mid", "senior", "lead"].map((s) => Math.round(mean(ctUniq.filter((c) => vagaMap.get(c.id_vaga).senioridade === s).map((c) => c.salario_final)))), color: "#2f855a" },
  ], w: 800, h: 380, valueFmt: (v) => Math.round(v / 1000) + "k",
});
fig.score = C.histogram({
  title: "Distribuição do score técnico das entrevistas", subtitle: "2,8% dos registos (533) estão acima do máximo admissível de 100 — cauda artificial até 125.",
  values: entrevistas.map((e) => e.score_tecnico), bins: 26, marker: 100, xLabel: "score_tecnico", color: "#dd6b20", w: 760, h: 320,
});
fig.clientes = C.scatterChart({
  title: "Mapa dos clientes: satisfação vs. retenção a 90 dias", subtitle: "Eixo x = satisfação média (1‑5); eixo y = retenção a 90 dias (%); tamanho = nº de contratações. CL09 no quadrante inferior esquerdo.",
  points: cliStats.map((c) => ({
    x: c.satisfacao, y: c.ret90, r: 5 + c.contratacoes / 5, color: c.id === "CL09" ? "#c53030" : c.id === "CL06" ? "#dd6b20" : "#2b6cb0",
    opacity: 0.85, label: c.id, labelDy: c.id === "CL04" ? -9 : c.id === "CL02" ? 11 : 0,
    title: `${c.id}: satisfação ${c.satisfacao}, retenção ${c.ret90}%, ${c.contratacoes} contratações, ${c.subst} substituições`,
  })),
  xDomain: [3.0, 4.0], yDomain: [55, 95], xLabel: "Satisfação média do cliente (1‑5)", yLabel: "Retenção a 90 dias (%)",
  tickX: (v) => v.toFixed(1), tickY: (v) => Math.round(v), xTicks: 5, yTicks: 4, labelPoints: true, w: 760, h: 360,
});
fig.scatter = C.scatterChart({
  title: "Satisfação do cliente vs. desempenho do contratado a 90 dias", subtitle: `Correlação r = ${rSatisf.toFixed(2)} (n = 262) — mas 6 contratações com 5/5 exigem substituição.`,
  points: fbAll.map((f) => ({
    x: f.satisfacao + (Math.random() - 0.5) * 0.18, y: f.ct.desempenho_90_dias + (Math.random() - 0.5) * 0.18,
    color: f.necessita_substituicao ? "#c53030" : "#2b6cb0", r: f.necessita_substituicao ? 4 : 3,
    title: `${f.id_contratacao} — satisfação ${f.satisfacao}, desempenho ${f.ct.desempenho_90_dias}${f.necessita_substituicao ? ", substituição" : ""}`,
  })), xDomain: [0.5, 5.5], yDomain: [0.5, 5.5], xLabel: "Satisfação do cliente (1‑5)", yLabel: "Desempenho a 90 dias (1‑5)", tickX: (v) => Math.round(v), tickY: (v) => Math.round(v), w: 700, h: 360,
});
fig.corr = C.heatmap({
  title: "Matriz de correlação (contratações, n = 262)", subtitle: "Verde = correlação positiva, vermelho = negativa. Experiência correlaciona com expectativa (0,90), não com salário pago.",
  rows: vars.map(([, l]) => l), cols: vars.map(([, l]) => l),
  values: mat, fmt: (v) => (Math.abs(v) < 0.005 ? "·" : v.toFixed(2)), domain: [-1, 1], w: 800, h: 440,
});
fig.feedback = C.hbarChart({
  title: "Feedbacks de cliente por nível de satisfação", subtitle: "Distribuição concentrada em 3–4; 32 pedidos de substituição (12,2%).",
  data: [1, 2, 3, 4, 5].map((s) => ({ label: `${s} — ${["", "muito insatisfeito", "insatisfeito", "neutro", "satisfeito", "muito satisfeito"][s]}`, value: feedback_clientes.filter((f) => f.satisfacao === s).length })),
  w: 760, unit: " feedbacks",
});
fig.estadoCandidaturas = C.barChart({
  title: "Coerência entre etapa registada e etapa efetivamente atingida", subtitle: "A coluna etapa_atual é praticamente independente das entrevistas realizadas — indício de preenchimento aleatório.",
  data: [
    { label: "Coincide com a fase máxima", value: etapaMatch, color: "#2f855a" },
    { label: "Abaixo da fase máxima", value: candidaturas.filter((c) => FASE.indexOf(c.etapa_atual) < FASE.indexOf(maxStage(c))).length, color: "#2b6cb0" },
    { label: "Acima da fase máxima (impossível)", value: candidaturas.filter((c) => FASE.indexOf(c.etapa_atual) > FASE.indexOf(maxStage(c))).length, color: "#c53030" },
  ], w: 740, h: 320,
});

for (const [k, svg] of Object.entries(fig)) fs.writeFileSync(path.join(FIG, `${k}.svg`), svg);

// ---------------- blocos do relatório ----------------
const B = [];
const h2 = (t, id) => B.push({ t: "h2", text: t, id });
const h3 = (t, id) => B.push({ t: "h3", text: t, id });
const p = (text) => B.push({ t: "p", text });
const ul = (items) => B.push({ t: "ul", items });
const table = (headers, rows, note) => B.push({ t: "table", headers, rows, note });
const chart = (key, caption) => B.push({ t: "chart", key, caption });
const callout = (kind, title, text) => B.push({ t: "callout", kind, title, text });

// ---- capa / sumário
B.push({ t: "title", text: "Recrutamento — Análise exploratória e de qualidade dos dados" });
B.push({ t: "meta", text: "11 tabelas · 79 963 registos (79 958 após deduplicação) · período 2024‑01 a 2026‑01 · gerado a 25/11/2026" });
p("Análise dos ficheiros JSON em `C:\\Users\\Formando\\Downloads\\recrutamento\\json`, seguindo o fluxo das skills **data-analysis** e **exploratory-data-analysis**: carregamento → inspeção → limpeza → análise → visualização → relatório. Todos os números foram calculados a partir dos dados originais (após normalização de datas e remoção de 5 duplicados exatos em `contratacoes`); os scripts ficam em `analise/` para reprodução.");

h2("0. Sumário executivo", "sumario");
ul([
  `**Volume**: 3 500 candidatos e 5 962 candidaturas → 19 117 entrevistas e 49 201 interações → 1 065 propostas → **262 contratações únicas**, num total de **79 963 registos** em 11 tabelas. Conversão global candidatura→contratação: ${pct(262, n0)}%.`,
  `**O processo demora 39,5 dias em média** (mediana 40), dos quais **27 dias são espera entre a última entrevista e a proposta** — 68% do ciclo é tempo morto, não avaliação. As entrevistas em si demoram 6 dias.`,
  `**O score não prevê nada**: candidatos contratados têm score de currículo 68,6 vs. 67,7 dos não contratados (r≈0); o score técnico das entrevistas tem correlação **negativa** com a contratação (r = ‑0,02) e nenhum dos 2 782 candidatos que chegaram à entrevista final foi contratado.`,
  `**Velocidade ≠ qualidade**: R02 contrata em 26,3 dias e custa €2 261 por contratação (média: €4 566), mas tem o pior desempenho a 90 dias (2,94/5) e a maior taxa de propostas (19,5%). R07 demora 58,2 dias e custa €8 980, mas obtém 3,78/5 e 93,3% de retenção.`,
  `**Salários desalinhados**: 20,4% das propostas ficam **abaixo do mínimo** da banda da vaga e 26,8% das expectativas dos candidatos superam o máximo da vaga. As bandas não seguem a senioridade (mínimo médio júnior €70 075 > mid €67 686) e explicam apenas 9,5% da variação salarial (η²).`,
  `**Retenção**: 83,8% aos 90 dias e 65,5% aos 180 dias; 32 contratações (12,2%) exigiram substituição, 6 delas com satisfação 5/5 — sinal de que a satisfação declarada não é fiável.`,
  `**Qualidade dos dados é o maior problema**: 864 candidatos marcados como "contratado" quando só 254 o foram; 330 candidaturas apontam para uma vaga inexistente (V999), 13 delas com contratação registada noutra vaga; 20% das datas de entrevista em formato dd/mm/aaaa; 533 scores técnicos acima de 100 (máx. 125); a etapa_atual é aleatória face às entrevistas reais.`,
  `**Reconciliação adicional**: 262 contratações únicas correspondem a ${hiredCands.size} candidatos únicos; ${candidatosComRecontratacao} candidatos foram contratados duas vezes. Existem ${respDepois} respostas de propostas posteriores à contratação e ${feedbackAntes} feedbacks anteriores à contratação.`,
  `**Conclusão**: o dataset é internamente consistente nas chaves (0 órfãos fora de V999) mas **não é confiável para decisões de gestão** em 8 dos 11 ficheiros: vários campos parecem gerados de forma independente. Antes de qualquer dashboard, é necessário corrigir/recolher os campos do ponto 11.`,
]);

h2("Índice", "indice");
ul([
  "1. Contexto e inventário dos dados",
  "2. Qualidade dos dados (scorecard e achados)",
  "3. Funil de recrutamento",
  "4. Tempos e gargalos do processo",
  "5. Desempenho dos recrutadores",
  "6. Clientes, satisfação e substituições",
  "7. Salários e bandas",
  "8. Retenção e qualidade da contratação",
  "9. Padrões temporais e sazonalidade",
  "10. Relações estatísticas e testes",
  "11. Anomalias priorizadas (fora do padrão)",
  "12. Recomendações",
  "13. Referências de produto e inspiração",
  "14. Plano de criação do projeto",
  "15. Critérios de conclusão e demonstração",
  "Anexo A. Metodologia e limitações",
  "Anexo B. Dicionário de dados e chaves",
]);

// 1
h2("1. Contexto e inventário dos dados", "inventario");
p("O modelo é um ATS (Applicant Tracking System) relacional: 10 clientes alimentam 480 vagas, que recebem 5 962 candidaturas de 3 500 candidatos, avaliadas por 10 recrutadores em 19 117 entrevistas e 49 201 interações, culminando em 1 065 propostas e 262 contratações, com feedback de cliente e histórico de reaberturas.");
table(["Ficheiro", "Registos", "Campos", "Chave", "Ligações principais"], [
  ["candidatos.json", nf(3500), "10", "id", "recebe candidaturas"],
  ["candidaturas.json", nf(5962), "9", "id", "→ candidato, vaga"],
  ["vagas.json", nf(480), "15", "id", "→ cliente, recrutador"],
  ["clientes.json", "10", "9", "id", "—"],
  ["recrutadores.json", "10", "8", "id", "—"],
  ["entrevistas.json", nf(19117), "9", "id", "→ candidatura, recrutador"],
  ["interacoes.json", nf(49201), "8", "id", "→ candidatura, recrutador"],
  ["propostas.json", nf(1065), "9", "id", "→ candidatura"],
  ["contratacoes.json", nf(262) + " (267 linhas)", "15", "id", "→ candidatura, vaga, cliente, recrutador"],
  ["feedback_clientes.json", nf(262), "7", "id", "→ contratação"],
  ["historico_vagas.json", nf(89), "6", "id", "→ vaga original / reaberta"],
], "Chaves sem órfãos, exceto 330 candidaturas com id_vaga = V999 (inexistente).");

p("**Regras de negócio implícitas** (usadas para validar): uma candidatura pertence a uma vaga de um cliente e de um recrutador; a contratação deve repetir vaga/cliente/recrutador da candidatura; a proposta aceite deve preceder a contratação; o feedback do cliente ocorre depois da contratação; uma vaga reaberta deve ter evento em `historico_vagas`.");

// 2
h2("2. Qualidade dos dados", "qualidade");
p("Aplicando o scorecard da skill exploratory-data-analysis, a avaliação por dimensão é a seguinte (1 = inutilizável, 5 = pronto para produção):");
table(["Dimensão", "Nota", "Evidência"], [
  ["Completude", "3/5", "Sem nulos críticos, mas 69% de `motivo_encerramento` vazio (por desenho), 35,6% de `retencao_180_dias` nula e 17% de `notas` vazias."],
  ["Unicidade", "3/5", "5 linhas duplicadas exatas em `contratacoes` (CT000068, CT000081, CT000136, CT000155, CT000230) e 22 pares candidato‑vaga repetidos."],
  ["Consistência de formato", "2/5", `20% das datas de entrevista em dd/mm/aaaa (${nf(ddmm)} registos) contra ISO no resto do dataset; capitalização e espaços inconsistentes em texto livre ("Boa comunicacao"/"boa comunicacao").`],
  ["Validade de domínio", "2/5", `533 scores técnicos > 100 (máx. 125); salários fora da banda; ids inexistentes (V999).`],
  ["Integridade referencial", "4/5", "0 órfãos em 16 relações; 1 exceção: V999."],
  ["Coerência entre tabelas", "2/5", "13 contratações com vaga diferente da candidatura; 864 candidatos 'contratado' vs. 254 reais; etapa_atual aleatória; propostas respondidas depois da contratação (191/262)."],
  ["Atualidade", "4/5", "Dados até 2026‑01; algumas vagas com data de fecho futura (3) e 176 vagas 'em andamento' com fecho expirado há >90 dias."],
  ["Verosimilhança / origem", "1/5", "Distribuições uniformes em campos que deviam ser assimétricos (canal, disponibilidade, estado do candidato, duração de interações 5–59 min, tipos de interação, resultados). Indica geração sintética ou preenchimento aleatório."],
], "A nota global ponderada é 2,6/5: utilizável para exploração, não para reporting oficial.");

h3("2.1 Achados detalhados", "achados");
table(["#", "Achado", "Evidência", "Gravidade", "Ação"], [
  ["Q1", "Campo `estado` do candidato não reflete contratações", `864 candidatos com estado=contratado; apenas ${hiredCands.size} foram efetivamente contratados (193 contratados não marcados; 610 marcados sem contratação).`, "Crítica", "Recalcular a partir de `contratacoes`."],
  ["Q2", "Vaga inexistente V999", "330 candidaturas (5,5%) apontam para V999; 13 dessas têm contratação registada noutra vaga.", "Crítica", "Criar registo de vaga ou remapear; bloquear por FK."],
  ["Q3", "Datas em dois formatos", `${nf(ddmm)} entrevistas (20%) em dd/mm/aaaa. Uma comparação lexicográfica ingénua produz 2 455 falsos "entrevista antes da candidatura"; após normalização, 0.`, "Crítica", "Normalizar na ingestão (ISO 8601)."],
  ["Q4", "`score_tecnico` fora do domínio", `${scoreHigh} registos (2,8%) entre 100 e 125; a distribuição principal termina em ~95.`, "Alta", "Invalidar/clip; investigar origem (parece lote de 2,8%)."],
  ["Q5", "`etapa_atual` aleatória", `Apenas ${pct(etapaMatch, candidaturas.length)}% das candidaturas têm etapa_atual igual à fase máxima realmente atingida; 504 estão em "triagem" mas fizeram a entrevista final.`, "Crítica", "Derivar de `entrevistas`."],
  ["Q6", "Nenhuma contratação vem da entrevista final", `${fFin} candidaturas chegaram à fase final e 0 foram contratadas; as 262 contratações pararam na fase "cliente" (${hiredFinal} com fase final).`, "Crítica", "Rever regra de negócio/geração."],
  ["Q7", "Proposta respondida depois da contratação", `${respDepois}/262 propostas têm data_resposta posterior à data_contratacao (mediana −3 dias).`, "Alta", "Validar sequência temporal."],
  ["Q8", "Duplicados exatos", "5 linhas em `contratacoes` (1,9%).", "Média", "Deduplicar por id."],
  ["Q9", "Feedback em massa num único dia", `${feedbackCluster} feedbacks (18%) datados 2025‑12‑31, contra mediana de 1–4 por dia.`, "Média", "Confirmar se é data de fecho contabilístico."],
  ["Q10", "Retenção incoerente", `${ret90ComSaida} contratações com data_saida mas retencao_90=true; ${ret90NullAntigo} com retenção nula apesar de >90 dias decorridos.`, "Alta", "Recalcular flags a partir de datas."],
  ["Q11", "Vagas sem candidaturas / estado errado", "28 vagas sem qualquer candidatura; 10 'preenchidas' sem contratação; 28 'reabertas' com contratação; 176 'em andamento' com fecho expirado.", "Alta", "Recalcular estado por eventos."],
  ["Q12", "Duplicação de campos", "`desempenho_percebido` = `desempenho_90_dias` em 262/262 registos; `salario_final` = `salario_oferecido` em 100% (nenhuma negociação registada).", "Média", "Eliminar redundância ou documentar."],
  ["Q13", "Pares candidato‑vaga repetidos", `${dupPares} pares (todos em V999) — candidato concorre duas vezes à mesma vaga no mesmo dia ou em dias diferentes.`, "Média", "Regra de unicidade."],
  ["Q14", "Candidatos sem atividade", "608 candidatos (17,4%) nunca se candidataram a nada; 22 candidaturas sem entrevista nem interação.", "Baixa", "Explicar origem (leads?)."],
  ["Q15", "Texto livre não normalizado", "6 valores distintos de `feedback` para 4 conceitos; 7 de `comentario` para 5 conceitos; 20 comentários vazios.", "Baixa", "Dicionário de valores + trim/lower."],
  ["Q16", "Contratações repetidas por candidato", `262 contratações únicas correspondem a ${hiredCands.size} candidatos únicos; ${candidatosComRecontratacao} candidatos têm 2 contratações.`, "Média", "Validar unicidade e distinguir recontratações de duplicação."],
  ["Q17", "Sequência temporal de respostas e feedback", `${respDepois} respostas de propostas foram registadas após a contratação; ${feedbackAntes} feedbacks foram registados antes da contratação.`, "Alta", "Validar timestamps e regras de transição."],
], "Gravidade: Crítica = invalida análises; Alta = distorce conclusões; Média = exige tratamento; Baixa = cosmético.");

chart("estadoCandidaturas", "Figura 2.1 — A etapa registada quase nunca corresponde à fase realmente atingida.");

// 3
h2("3. Funil de recrutamento", "funil");
chart("funnel", "Figura 3.1 — Funil completo. A maior queda está entre a entrevista final e a proposta (38,3% de conversão) e entre proposta e aceitação (24,6%).");
table(["Etapa", "Candidaturas", "% do total", "% da etapa anterior"], [
  ["Candidatura", nf(n0), "100%", "—"],
  ["Triagem realizada", nf(fEnt), pct(fEnt, n0) + "%", pct(fEnt, n0) + "%"],
  ["Entrevista técnica", nf(fTec), pct(fTec, n0) + "%", pct(fTec, fEnt) + "%"],
  ["Entrevista cliente", nf(fCli), pct(fCli, n0) + "%", pct(fCli, fTec) + "%"],
  ["Entrevista final", nf(fFin), pct(fFin, n0) + "%", pct(fFin, fCli) + "%"],
  ["Proposta", nf(nProp), pct(nProp, n0) + "%", pct(nProp, fFin) + "%"],
  ["Proposta aceite / contratação", nf(nAce), pct(nAce, n0) + "%", pct(nAce, nProp) + "%"],
]);
ul([
  "**Quase todos passam à entrevista**: 99,6% das candidaturas têm pelo menos uma entrevista e a mediana é de **3 entrevistas por candidatura** (máx. 4). Não existe verdadeira triagem eliminatória — o funil só começa a fechar na fase de cliente.",
  "**Aprovação uniforme por fase**: ~51–54% aprovados, ~24% reprovados e ~25% pendentes em todas as fases. Uma fase que não discrimina não acrescenta informação.",
  "**Propostas**: 50,0% recusadas, 25,4% sem resposta, 24,6% aceites. Motivos de recusa: localização 210, sem resposta 204, salário 199, outra oportunidade 190 — praticamente empatados, o que sugere ausência de causa dominante.",
  "**Recusas por localização (39%)** são o motivo mais frequente e o único acionável a curto prazo (política de remoto).",
  "**Anomalia estrutural**: 2 782 candidaturas chegaram à entrevista final e **nenhuma foi contratada**; todas as 262 contratações tiveram como última fase a entrevista com o cliente (ver Q6).",
  `**Tempo de resposta às propostas**: mediana 6 dias (máx. 11), mas ${respDepois} propostas foram "respondidas" depois de a contratação já estar registada.`,
]);

// 4
h2("4. Tempos e gargalos do processo", "tempos");
chart("timeline", "Figura 4.1 — Decomposição do ciclo por recrutador. A espera até à proposta varia de 14,5 dias (R02) a 47 dias (R07).");
table(["Segmento", "Mediana", "p90", "Mín.", "Máx."], [
  ["Candidatura → 1ª entrevista", med(tl.map((t) => t.first)) + " d", quantile(tl.map((t) => t.first), 0.9) + " d", Math.min(...tl.map((t) => t.first)) + " d", Math.max(...tl.map((t) => t.first)) + " d"],
  ["Ciclo de entrevistas (1ª → última)", med(tl.map((t) => t.cycle)) + " d", quantile(tl.map((t) => t.cycle), 0.9) + " d", Math.min(...tl.map((t) => t.cycle)) + " d", Math.max(...tl.map((t) => t.cycle)) + " d"],
  ["Última entrevista → proposta", med(tl.map((t) => t.idle)) + " d", quantile(tl.map((t) => t.idle), 0.9) + " d", Math.min(...tl.map((t) => t.idle)) + " d", Math.max(...tl.map((t) => t.idle)) + " d"],
  ["Proposta → contratação", med(tl.map((t) => t.close)) + " d", quantile(tl.map((t) => t.close), 0.9) + " d", Math.min(...tl.map((t) => t.close)) + " d", Math.max(...tl.map((t) => t.close)) + " d"],
  ["Total (candidatura → contratação)", med(tl.map((t) => t.total)) + " d", quantile(tl.map((t) => t.total), 0.9) + " d", Math.min(...tl.map((t) => t.total)) + " d", Math.max(...tl.map((t) => t.total)) + " d"],
]);
ul([
  `**68% do ciclo é espera**: ${med(tl.map((t) => t.idle))} de ${med(tl.map((t) => t.total))} dias ocorrem entre a última entrevista e a emissão da proposta. Reduzir esta espera para 7 dias colocaria a mediana global em ~20 dias — abaixo do melhor recrutador atual (R02, 25,5 dias).`,
  "**Os intervalos entre entrevistas são fixos** (mediana 3 dias entre fases, p90 5). O processo de avaliação já é rápido; o problema está na decisão/aprovação da proposta.",
  "**Urgência não acelera nada**: vagas de urgência alta levam 43,5 dias a contratar vs. 37,5 dias nas de urgência baixa (diferença na direção errada). Taxa de preenchimento: alta 45,6%, média 48,5%, baixa 59,7% (χ² = 6,45; p = 0,040; V de Cramér = 0,12 — efeito fraco).",
  "**Senioridade**: lead 56,6 dias, sénior 41,0, mid 36,6, júnior 38,0. Só o nível lead se destaca.",
  "**Tendência estável**: 38,4–41,2 dias por trimestre, sem melhoria ao longo de 8 trimestres.",
]);

// 5
h2("5. Desempenho dos recrutadores", "recrutadores");
chart("recrutadores", "Figura 5.1 — Cada ponto é um recrutador. R02 é o outlier de velocidade e o mais baixo em desempenho; R07 o inverso.");
table(["Recrutador", "Equipa", "Anos", "Vagas", "Cand.", "Entrev./cand.", "Propostas", "Aceitação", "Contratações", "Tempo (d)", "Custo", "Desemp. 90d", "Retenção 90d", "Espera (d)"],
  recStats.map((r) => [r.id, r.equipa, r.anos, r.vagas, r.apps, r.entPorApp, r.propostas, r.conv + "%", r.contratacoes, r.tth, eur(r.custo), r.desempenho, r.ret90 + "%", r.idle]));
ul([
  "**R02** (Produto, 7 anos) é o caso mais contrastante: 50 contratações, 26,3 dias, €2 261 de custo médio e 82,4% de retenção, mas **desempenho médio 2,94/5** — o único abaixo de 3,2. A espera até à proposta é de 14,5 dias (vs. ~28 nos restantes). É um perfil de «fecho rápido» que sacrifica adequação.",
  "**R07** (Produto, 12 anos) é o oposto: 58,2 dias, €8 980, 18 contratações, mas 3,78/5 de desempenho e 93,3% de retenção. Custa 4× mais por contratação do que R02.",
  "**R01** tem a pior retenção (65%) apesar de tempo e custo médios — merece revisão da adequação das contratações (23 contratações).",
  "**A carga de entrevistas é quase idêntica** (3,14–3,25 por candidatura) e a duração média das interações é a mesma (31,9 vs. 32,0 min): as diferenças de tempo vêm da **gestão da espera**, não do esforço de avaliação.",
  "**Custo por contratação** não é explicado pelo tempo (r intra‐recrutador ≈ 0): o custo é essencialmente um nível fixo por recrutador, com R02 a €2 261 e R07 a €8 980 — incoerência contabilística a esclarecer.",
]);

// 6
h2("6. Clientes, satisfação e substituições", "clientes");
chart("clientes", "Figura 6.1 — Cada ponto é um cliente. CL09 (vermelho) combina a pior satisfação com a pior retenção; CL06 concentra o maior número de substituições.");
table(["Cliente", "Setor", "Dimensão", "Modelo", "Relação", "Estado", "Vagas", "Contratações", "Tempo", "Satisfação", "Desemp.", "Retenção 90d", "Substituições", "Custo"],
  cliStats.map((c) => [c.id, c.setor, c.dimensao_empresa, c.modelo_recrutamento, c.historico_relacao, c.estado, c.vagas, c.contratacoes, c.tth + " d", c.satisfacao, c.desempenho, c.ret90 + "%", `${c.subst}/${c.nfb}`, eur(c.custo)]));
ul([
  `**CL09 (saúde, exclusivo) é o cliente de risco**: pior satisfação (3,19), pior retenção (62,5%) e 4 substituições em 21 feedbacks (19%).`,
  `**CL06 (energia, contingência, estado "em_revisao")**: 30 contratações, 6 substituições (20%) e retenção 77,3% — o volume de substituições mais alto em valor absoluto, coerente com o estado do contrato.`,
  `**CL05**: retenção 75% e 4 substituições; **CL03** tem a melhor satisfação (3,83) mas tempo mais longo (41,1 d).`,
  "**Satisfação correlaciona com desempenho** (r = 0,68), mas a relação é não monotónica nos extremos: 6 contratações com satisfação 5/5 exigiram substituição (11,8% dos 5/5), contra 5,8% nos 4/5. Ver Figura 8.1.",
  "**Modelo de contratação**: exclusivo tem a pior retenção (77,2%) e contingência a maior taxa de substituição (17,2%) apesar da melhor satisfação (3,66) — a insatisfação só aparece depois.",
  "**Relação longa vs. recente**: satisfação 3,53 vs. 3,43 — diferença pequena; a antiguidade não protege contra má colocação.",
]);
chart("feedback", "Figura 6.2 — Distribuição dos 262 feedbacks de cliente por nível de satisfação.");

// 7
h2("7. Salários e bandas", "salarios");
chart("salarios", "Figura 7.1 — Bandas das vagas vs. expectativa do candidato vs. salário efetivamente contratado, por senioridade.");
ul([
  `**Banda invertida**: o mínimo médio das vagas júnior (€70 075) é superior ao das vagas mid (€67 686). A senioridade explica apenas **9,5%** da variância do salário mínimo (η² = 0,095); a localização 5,7%; o tipo de contrato 0,1%.`,
  `**Oferta vs. expectativa**: mediana de +€559 (a oferta supera ligeiramente a expectativa), mas em 49,4% dos casos fica abaixo. Em **26,8%** das propostas a expectativa do candidato está acima do máximo da vaga.`,
  `**Fora da banda**: ${belowMin} propostas (${pct(belowMin, propBand.length)}%) abaixo do mínimo e ${aboveMax} (${pct(aboveMax, propBand.length)}%) acima do máximo. Curiosamente, as propostas abaixo do mínimo têm **maior taxa de aceitação** (29,5% vs. 23,2% dentro da banda) — sinal de que o mínimo publicado não é um piso real.`,
  `**Sem negociação**: em 100% das contratações, salário final = salário oferecido. Não há qualquer ajuste entre proposta e contrato.`,
  `**Experiência não é paga**: candidatos com 10–14 anos esperam €98 464 e com 15–19 anos €109 638 (r = 0,90 com os anos), mas o salário contratado não se correlaciona com a experiência (r = ‑0,04) nem com o score do currículo.`,
  "**Anomalia**: o salário médio de contratação de juniores (€75 723) é superior ao de mid (€73 388).",
]);
p(`Posição média na banda: aceites ${mean(propBand.filter((x) => x.p.estado_proposta === "aceite").map((x) => x.pos)).toFixed(2)} · recusadas ${mean(propBand.filter((x) => x.p.estado_proposta === "recusada").map((x) => x.pos)).toFixed(2)} · sem resposta ${mean(propBand.filter((x) => x.p.estado_proposta === "sem_resposta").map((x) => x.pos)).toFixed(2)} — ou seja, **o preço não explica a decisão do candidato**.`);

// 8
h2("8. Retenção e qualidade da contratação", "retencao");
chart("scatter", "Figura 8.1 — Satisfação vs. desempenho a 90 dias (pontos vermelhos = pedido de substituição). Há 5/5 com substituição e 2/5 sem.");
ul([
  `**Retenção global**: ${ret90G}% aos 90 dias e ${ret180G}% aos 180 dias. Saída mediana aos 90 dias exatos após a contratação (limite das flags).`,
  "**Motivos de saída** (65 saídas): desistência 16, melhor oferta 14, desempenho 14, termo de contrato 13, reestruturação 8. Nenhum padrão temporal claro.",
  `**Desempenho a 90 dias**: 4 (100), 3 (87), 2 (39), 5 (34), 1 (4). Média ${mean(ctUniq.map((c) => c.desempenho_90_dias)).toFixed(2)}.`,
  "**Coerência interna**: resultado do período inicial acompanha o desempenho (positivo 4,26; neutro 3,00; negativo 1,91) — um dos poucos campos derivados corretamente.",
  "**Satisfação do cliente** correlaciona 0,68 com o desempenho, mas a taxa de substituição não é monotónica (1/5: 20%; 2/5: 11,9%; 3/5: 19,2%; 4/5: 5,8%; 5/5: 11,8%). **A satisfação declarada não deve ser usada isoladamente como KPI.**",
  `**Custo da má colocação**: 32 substituições × custo médio de ${eur(4566)} = ~${eur(32 * 4566)} de custo direto, sem contar tempo e impacto no cliente.`,
]);

// 9
h2("9. Padrões temporais e sazonalidade", "temporal");
chart("mensal", "Figura 9.1 — Candidaturas e entrevistas por mês. A procura cresce ~40% de 2024 para 2025, com picos em fev/2025 e out/2025.");
chart("contratacoesMes", "Figura 9.2 — Contratações por mês, com o mesmo padrão de picos concentrados.");
ul([
  "**Crescimento**: 1 035 candidaturas em 2025‑T1 vs. 599 em 2024‑T1 (+73%); no ano completo, 2025 soma 3 483 candidaturas contra 2 479 em 2024 (+40%). Contratações: 18 em 2024‑T1 vs. 62 em 2025‑T4.",
  "**Picos coincidentes**: out/2025 é o mês de maior volume de candidaturas (472), entrevistas (1 648), propostas (105) e contratações (28) — comportamento em bloco, típico de carga de dados e não de sazonalidade real.",
  `**Fins de semana**: a atividade não abranda — 858 candidaturas ao sábado e 813 ao domingo (vs. 898 à segunda). Entrevistas ao domingo: 2 671. **Operação 7 dias por semana em todos os canais é implausível** e reforça a hipótese de datas geradas aleatoriamente.`,
  "**Taxa de aceitação estável** (21,6%–28,2% por trimestre), sem efeito de mercado.",
  "**Datas futuras**: 1 vaga com abertura e 3 com fecho posteriores a hoje (25/11/2026), aceitáveis para vagas planeadas.",
  "**Concentração de eventos**: 73 entrevistas no mesmo dia (2025‑10‑12) e 47 feedbacks em 2025‑12‑31 (ver Q9).",
]);

// 10
h2("10. Relações estatísticas e testes", "estatistica");
chart("corr", "Figura 10.1 — Matriz de correlação ao nível da contratação. Nenhuma variável de processo (score, etapas, interações) se relaciona com o desempenho.");
table(["Par de variáveis", "r", "Leitura"], [
  ["Experiência × expectativa salarial", "0,899", "Relação forte e esperada: a expectativa acompanha a experiência."],
  ["Satisfação do cliente × desempenho 90d", "0,683", "Coerente, mas com exceções relevantes (5/5 com substituição)."],
  ["Anos de experiência × salário contratado", "‑0,037", "Nenhuma relação: o salário pago ignora a experiência."],
  ["Score do currículo × contratação", "≈ 0", "Poder preditivo nulo."],
  ["Score técnico × contratação", "‑0,021", "Ligeiramente negativo (após limitar a 100)."],
  ["Nº de entrevistas × contratação", "≈ 0", "O volume de avaliação não aumenta a probabilidade de contratação."],
  ["Posição na banda × aceitação", "—", "Aceitação 29,5% abaixo do mínimo vs. 23,2% dentro da banda."],
  ["Custo × tempo (entre recrutadores)", "0,788", "Correlação espúria: ambos variam por recrutador; dentro de cada recrutador r ≈ 0."],
]);
table(["Teste", "Estatística", "p", "Efeito", "Interpretação"], [
  ["χ² urgência × vaga preenchida", `χ²=${urgTest.chi} (df=${urgTest.df})`, urgTest.p.toFixed(3), `V=${urgTest.cramersV}`, "Significativo mas efeito fraco; urgência alta preenche menos."],
  ["χ² canal de origem × contratação", `χ²=${canalTest.chi} (df=${canalTest.df})`, canalTest.p.toFixed(3), `V=${canalTest.cramersV}`, "Sem diferença entre canais (4,3%–5,1% de contratação)."],
  ["χ² disponibilidade × contratação", `χ²=${dispTest.chi} (df=${dispTest.df})`, dispTest.p.toFixed(3), `V=${dispTest.cramersV}`, "Sem efeito: a disponibilidade declarada não influencia o desfecho."],
]);
p("**Correlações ao nível do candidato** (n = 5 962): sobreposição de skills × score do currículo r = ‑0,035 (p = 0,009); sobreposição média é de 0,57 skills em 2 pedidas (24%). A adequação técnica declarada **não** influencia o score nem a contratação (4,3% com 0 skills vs. 4,7% com 2+).");
chart("score", "Figura 10.2 — Score técnico: distribuição principal truncada em ~95 e uma cauda de 2,8% entre 100 e 125.");

// 11
h2("11. Anomalias priorizadas (fora do padrão)", "anomalias");
p("Lista ordenada por impacto na confiança dos dados. Cada item é reproduzível com os scripts em `analise/`.");
table(["Prioridade", "Anomalia", "Onde", "Quantificação"], [
  ["P0", "Nenhuma contratação passou pela entrevista final", "candidaturas × entrevistas", `${fFin} candidaturas na fase final, 0 contratações; 262 contratações todas na fase "cliente"`],
  ["P0", "`estado` do candidato desligado da realidade", "candidatos", `864 'contratado' vs. ${hiredCands.size} reais`],
  ["P0", "`etapa_atual` aleatória face às entrevistas", "candidaturas", `${pct(etapaMatch, candidaturas.length)}% de coincidência (esperado ~100%)`],
  ["P0", "Vaga V999 inexistente", "candidaturas / contratacoes", `330 candidaturas; ${mismatchCt} contratações com vaga divergente`],
  ["P1", "Datas de entrevista em dd/mm/aaaa", "entrevistas", `${nf(ddmm)} registos (20%)`],
  ["P1", "Score técnico > 100", "entrevistas", `${scoreHigh} registos, máximo 125`],
  ["P1", "Proposta respondida após a contratação", "propostas × contratacoes", `${respDepois}/262 casos`],
  ["P1", "Propostas abaixo do mínimo da banda", "propostas × vagas", `${belowMin} (${pct(belowMin, propBand.length)}%)`],
  ["P1", "Banda salarial independente da senioridade", "vagas", "η² = 0,095; júnior > mid"],
  ["P1", "Custo por contratação desalinhado", "contratacoes", "R02 €2 261 vs. R07 €8 980 (4×) sem explicação"],
  ["P1", "Resposta temporalmente incoerente", "propostas × contratacoes", `${respDepois}/262 respostas após a contratação`],
  ["P1", "Feedback anterior à contratação", "feedback_clientes × contratacoes", `${feedbackAntes} feedbacks`],
  ["P2", "Duplicados exatos", "contratacoes", "5 linhas (1,9%)"],
  ["P2", "Candidato contratado mais de uma vez", "candidatos × contratacoes", `${candidatosComRecontratacao} candidatos com 2 contratações`],
  ["P2", "Retenção incoerente com datas", "contratacoes", `${ret90ComSaida}+${ret90NullAntigo} registos`],
  ["P2", "Estados de vaga inconsistentes", "vagas", "10 preenchidas sem contratação; 28 reabertas com contratação; 176 expiradas"],
  ["P2", "Feedback concentrado em 2025‑12‑31", "feedback_clientes", `${feedbackCluster} registos (18%)`],
  ["P2", "Distribuições uniformes em campos comportamentais", "interações, candidatos", "tipo, resultado, notas, duração, canal, disponibilidade — todos χ² não significativos"],
  ["P3", "Texto livre inconsistente", "entrevistas, feedback", "6 variantes para 4 conceitos; 20 comentários vazios"],
  ["P3", "Campos redundantes", "feedback, contratacoes", "desempenho_percebido ≡ desempenho_90_dias; salário final ≡ oferecido"],
], "P0 = corrigir antes de qualquer análise; P1 = distorce decisões; P2 = tratamento obrigatório; P3 = limpeza.");

// 12
h2("12. Recomendações", "recomendacoes");
h3("12.1 Dados (antes de dashboards)", "rec-dados");
ul([
  "**Recalcular todos os campos derivados** (`estado` do candidato, `etapa_atual`, `retencao_90/180`, `estado` da vaga, `tempo_total_dias`) a partir de eventos, em vez de os armazenar editados à mão.",
  "**Impor integridade**: FK para vaga obrigatória (eliminar V999), unicidade (candidato, vaga), e uma regra de transição de estado (proposta aceite antes da contratação; feedback depois da contratação).",
  "**Normalizar datas na ingestão** para ISO 8601 e validar domínios (scores 0–100, salário_min ≤ final ≤ salário_max, datas não futuras).",
  "**Deduplicar** `contratacoes` por id e remover a duplicação `desempenho_percebido`.",
  "**Investigar a origem** dos 2,8% de scores > 100 e das distribuições uniformes: se o dataset é sintético, os resultados deste relatório descrevem o gerador, não a operação real.",
]);
h3("12.2 Processo", "rec-processo");
ul([
  `**Atacar a espera até à proposta**: ${med(tl.map((t) => t.idle))} dias após a última entrevista. Definir SLA de 48 h para decisão e um "calendário de proposta" por vaga reduziria o ciclo de 40 para ~20 dias sem contratar mais ninguém.`,
  "**Rever o papel da entrevista final**: hoje é um beco sem saída estatístico (0 contratações). Ou passa a ser a etapa de decisão, ou deve ser eliminada.",
  "**Parar de usar `etapa_atual` como fonte de verdade** em relatórios; usar a sequência real de entrevistas.",
  "**Segmentar recrutadores por estratégia**: R02 serve volume/velocidade, R07 serve funções críticas. Fixar metas por segmento em vez de um SLA único — mas monitorizar o desempenho a 90 dias de R02 (2,94).",
]);
h3("12.3 Negócio", "rec-negocio");
ul([
  `**Rever bandas salariais**: 20% das propostas abaixo do mínimo e 27% das expectativas acima do máximo. Recolher dados de mercado por senioridade e localização; a banda atual explica <10% da variação.`,
  "**Priorizar a política de localização/remoto**: é o motivo de recusa mais citado (210 de 803).",
  "**Plano de retenção para CL09, CL05 e CL06**: concentram a pior retenção e a maioria das substituições. Rever o perfil pedido e o acompanhamento aos 30/60/90 dias.",
  "**Substituir a satisfação declarada por métricas objetivas** (retenção a 90/180 dias, desempenho, substituição) para avaliar clientes e contratações.",
  "**Quantificar o custo da má colocação**: 32 substituições ≈ €146k diretos; com tempo e impacto no cliente, o custo real é superior.",
]);

// 13
h2("13. Referências de produto e inspiração", "referencias");
p("Esta secção consolida no relatório a informação das ideias de aplicação e das referências de plataformas anexadas ao projeto. Não se pretende copiar integralmente nenhuma aplicação; a solução deve combinar os conceitos úteis numa única experiência operacional.");
table(["Referência", "Conceito de inspiração", "Aplicação no projeto"], [
  ["Ashby", "Dashboards de recrutamento, KPIs, funil, entrevistas, propostas e análise por recrutador.", "Torre de controlo principal, com prioridades por candidatura e próximos passos."],
  ["Lever", "Pipeline visual e identificação de etapas com maior espera.", "Visão kanban do percurso da candidatura, filtros por cliente, vaga e recrutador."],
  ["Hireall", "Comparação da expectativa do candidato, banda da vaga e oferta.", "Verificador salarial integrado ao formulário de proposta, com avisos e bloqueio opcional."],
  ["Gainsight", "Customer Health Score, tendências e acompanhamento 30/60/90 dias.", "Radar de clientes com retenção, substituições, satisfação e plano de ação."],
  ["DQOps", "Monitorização de qualidade, regras de validação e tratamento de anomalias.", "Guardião dos dados com datas inválidas, vagas inexistentes e incoerências temporais."],
  ["ThoughtSpot", "Pesquisa em linguagem natural sobre dados empresariais.", "Copiloto apenas numa fase posterior, depois de as consultas serem confiáveis."],
]);
h3("13.1 Funcionalidades prioritárias", "funcionalidades");
table(["Prioridade", "Módulo", "Resultado esperado"], [
  ["1", "Recruitment Control Tower", "Mostrar candidaturas paradas, dias sem ação, SLA ultrapassado e próxima intervenção."],
  ["2", "Salary Validation", "Comparar oferta, mínimo/máximo da vaga e expectativa do candidato antes da proposta."],
  ["3", "Data Quality Monitor", "Validar entradas e derivar estados a partir de candidaturas, entrevistas e contratações."],
  ["4", "Recruitment Pipeline", "Visualizar candidaturas por etapa e destacar gargalos e conversões."],
  ["Opcional", "Client Retention", "Identificar clientes de risco e substituir satisfação declarada por métricas objetivas."],
  ["Fase posterior", "AI Assistant", "Responder perguntas operacionais em linguagem natural quando os dados estiverem limpos."],
]);
callout("info", "Direção principal", "Ashby é a referência visual e funcional principal; Lever orienta o pipeline; Hireall orienta a validação salarial.");
p("Deve ser apresentada uma demonstração baseada numa história operacional: identificar uma candidatura parada → ultrapassar o SLA → abrir os detalhes → comparar oferta e banda salarial → corrigir um desalinhamento → enviar a proposta.");

// 14
h2("14. Plano de criação do projeto", "plano");
p("O plano seguinte está adaptado ao projeto existente, que já utiliza Next.js 16, React 19 e Tailwind/Turbopack no workspace. Deve haver separação entre dados analíticos, dados operacionais limpos e componentes de interface.");
h3("14.1 Fase 0 — Preparação e decisão de âmbito", "plano-f0");
ul([
  "**Tempo recomendado:** 30–60 minutos.",
  "Confirmar a narrativa da demo: espera entre entrevista e proposta, validação salarial e qualidade dos dados.",
  "Congelar o âmbito do MVP: torre de controlo, verificador salarial e guardião de dados.",
  "Definir os utilizadores: recrutador, gestor de recrutamento e responsável pelo cliente.",
  "Fixar o critério de sucesso: uma candidatura pode ser identificada, investigada e acionada em menos de 30 segundos.",
  "Evitar IA preditiva e personalização baseada em scores durante o hackathon.",
]);
h3("14.2 Fase 1 — Dados e modelo operacional", "plano-f1");
ul([
  "**Tempo recomendado:** 2–4 horas.",
  "Copiar os ficheiros JSON de demonstração para uma origem controlada dentro do projeto ou conservar dados de leitura no estado da aplicação.",
  "Normalizar datas para ISO 8601 e representar `null`/ausência sem ambiguidade.",
  "Deduplicar `contratacoes` por id antes de construir contagens.",
  "Excluir ou isolar a vaga V999 e apresentar explicitamente o problema em vez de calcular indicadores silenciosamente.",
  "Derivar a fase real pela última entrevista em vez de usar `etapa_atual`.",
  "Recalcular tempo parado desde a última entrevista e flags de SLA.",
  "Criar regras de proposta: abaixo do mínimo, dentro da banda, acima do máximo e expectativa excedida.",
  "Adicionar testes unitários para os cálculos de dias, banda salarial e integridade.",
]);
h3("14.3 Fase 2 — Estrutura da aplicação", "plano-f2");
ul([
  "**Tempo recomendado:** 1–2 horas.",
  "Criar uma shell responsiva com navegação lateral: Visão geral, Pipeline, Candidaturas, Propostas, Clientes e Qualidade.",
  "Definir componentes reutilizáveis: KPI card, tabela de ação, badge de estado, alerta de SLA e indicador salarial.",
  "Criar dados de demonstração derivados dos ficheiros existentes, não números inventados.",
  "Definir filtros globais por cliente, vaga, recrutador e estado.",
  "Manter um estado vazio, um estado com dados e um estado com alertas para testar a interface.",
]);
h3("14.4 Fase 3 — Torre de controlo", "plano-f3");
ul([
  "**Tempo recomendado:** 3–5 horas.",
  "KPIs: candidaturas paradas, propostas atrasadas, tempo médio até proposta, propostas fora da banda e clientes de risco.",
  "Tabela de prioridade: candidato, vaga, cliente, recrutador, última entrevista, dias parado, SLA e próxima ação.",
  "Ordenar primeiro por SLA ultrapassado e depois por dias parados.",
  "Permitir abrir uma candidatura e apresentar o contexto completo da espera.",
  "Adicionar ações claras: rever proposta, contactar recrutador, validar salário ou marcar intervenção.",
]);
h3("14.5 Fase 4 — Validação salarial e pipeline", "plano-f4");
ul([
  "**Tempo recomendado:** 2–3 horas.",
  "Construir o formulário de proposta com expectativa do candidato, mínimo da vaga, máximo da vaga e oferta.",
  "Apresentar posição visual da oferta na banda salarial.",
  "Emitir avisos distintos para abaixo do mínimo, acima do máximo e expectativa excedida.",
  "Conectar os valores aos dados da candidatura selecionada.",
  "Adicionar visão de pipeline por fases derivadas das entrevistas.",
  "Mostrar perda entre fases e tempo médio de espera por etapa.",
]);
h3("14.6 Fase 5 — Qualidade e retenção", "plano-f5");
ul([
  "**Tempo recomendado:** 2–3 horas.",
  "Criar painel de problemas: V999, datas misturadas, scores > 100, respostas tardias, feedback invertido e retenção incoerente.",
  "Permitir filtros por severidade P0/P1/P2/P3.",
  "Mostrar quantidade, impacto, regra esperada e ação corretiva.",
  "Adicionar o radar de clientes com CL09, CL06 e CL05 destacados.",
  "Usar retenção, substituição e desempenho como sinais principais; não usar satisfação isoladamente.",
]);
h3("14.7 Fase 6 — Polimento e ensaio", "plano-f6");
ul([
  "**Tempo recomendado:** 2–3 horas.",
  "Executar testes de cálculo e verificação da build.",
  "Confirmar comportamento em desktop e ecrã pequeno.",
  "Preencher estados vazios e estados de carregamento sem esconder erros.",
  "Ensaiar a demo com uma candidatura real do dataset.",
  "Preparar uma rota de fallback caso os dados externos falhem.",
  "Eliminar menus e funcionalidades secundárias que não participem na história principal.",
]);

// 15
h2("15. Critérios de conclusão e demonstração", "criterios");
table(["Entregável", "Critério verificável"], [
  ["Métricas principais", "Os totais correspondem aos dados corrigidos: 262 contratações únicas, 254 candidatos contratados únicos e 191 propostas respondidas depois da contratação."],
  ["Qualidade dos dados", "V999, datas misturadas, scores fora de domínio e incoerências temporais são visíveis e explicadas."],
  ["Torre de controlo", "Permite encontrar uma candidatura por SLA, cliente, recrutador ou vaga e identificar a próxima ação."],
  ["Validação salarial", "Detecta oferta abaixo do mínimo, acima do máximo e expectativa superior ao máximo da vaga."],
  ["Pipeline", "Usa a fase derivada das entrevistas, não `etapa_atual`."],
  ["Clientes", "CL09, CL06 e CL05 podem ser explicados por retenção e substituições."],
  ["Demonstração", "A solução apresenta o problema, alerta, intervenção e prevenção em menos de cinco minutos."],
  ["Estabilidade", "Build concluída, fluxo principal testado e sem dependências necessárias apenas durante a apresentação."],
]);
h3("15.1 Roteiro da demo", "roteiro-demo");
ul([
  "Começar com o KPI de tempo: 27 dos 40 dias são espera.",
  "Abrir a tabela e selecionar uma candidatura com SLA ultrapassado.",
  "Mostrar a última entrevista, os dias sem ação e a próxima intervenção.",
  "Abrir o verificador salarial e identificar um valor fora da banda ou acima da expectativa.",
  "Corrigir ou justificar a oferta e demonstrar o alerta.",
  "Abrir o painel de qualidade e mostrar uma anomalia P0/P1.",
  "Fechar com o impacto operacional: menos espera, menos desalinhamento salarial e menos dados contaminados.",
]);
callout("warning", "Não usar no MVP", "Ranking preditivo, score de contratação, IA que toma decisões sem transparência e satisfação isolada como indicador de qualidade.");

// anexos
h2("Anexo A. Metodologia e limitações", "metodologia");
ul([
  "**Ferramentas**: Node.js 24 (o ambiente não tem Python/pandas). Estatística implementada localmente: correlação de Pearson, qui-quadrado com V de Cramér, quantis, IQR. Visualizações em SVG geradas por código (`analise/lib/charts.mjs`).",
  "**Fluxo**: perfil de cada ficheiro (tipos, nulos, cardinalidade, duplicados) → auditoria de integridade referencial e coerência cruzada → normalização de datas → análise de funil, tempos, segmentos, salários e retenção → testes → relatório.",
  "**Limpeza aplicada**: normalização de 3 831 datas dd/mm/aaaa em `entrevistas`; remoção de 5 duplicados exatos em `contratacoes`. **Nenhum ficheiro de origem foi alterado.**",
  "**Limitações**: (1) 5 962 candidaturas não são independentes — 3 500 candidatos, mediana de 2 candidaturas cada; os testes usam a candidatura como unidade, o que subestima a incerteza. (2) 25% das entrevistas estão «pendentes», pelo que o funil é uma fotografia, não uma coorte fechada. (3) As flags de retenção têm nulos estruturais (contratações recentes). (4) Se os dados forem sintéticos, as distribuições uniformes limitam qualquer inferência causal. (5) Não há informação de género, nacionalidade ou deficiência — não foi possível avaliar equidade.",
  "**Reprodutibilidade**: `node analise/01_profile.mjs` … `node analise/07_relatorio.mjs`. Validação cruzada independente em Python/pandas: `python analise/08_validacao_pandas.py` — confirma integralmente os números-chave (79 963 registos, 262 contratações, 5 duplicados, 330 candidaturas a V999, 3 831 datas dd/mm/aaaa, 533 scores > 100, funil 5 938/5 913/4 484/2 782, 993 coincidências de etapa, retenção 83,8%/65,5%, 20,4% de propostas abaixo do mínimo, r(experiência, salário) = ‑0,037).",
]);
h2("Anexo B. Dicionário de dados e chaves", "dicionario");
table(["Tabela", "Campo", "Tipo", "Notas"], [
  ["candidatos", "estado", "enum", "disponivel / em_processo / encerrado / contratado — não fiável (Q1)"],
  ["candidaturas", "etapa_atual", "enum", "triagem → entrevista_final, rejeitado, desistencia — não fiável (Q5)"],
  ["candidaturas", "motivo_encerramento", "enum", "nao_alineado / desistencia_candidato — só preenchido quando encerrada"],
  ["entrevistas", "fase", "enum", "triagem / entrevista_tecnica / entrevista_cliente / entrevista_final"],
  ["entrevistas", "score_tecnico", "0–100 (nominal)", "contém 533 valores até 125 (Q4)"],
  ["propostas", "estado_proposta", "enum", "aceite / recusada / sem_resposta"],
  ["contratacoes", "retencao_90/180_dias", "boolean|null", "nulo quando o período ainda não decorreu — com incoerências (Q10)"],
  ["vagas", "estado", "enum", "preenchida / em_andamento / reaberta"],
  ["historico_vagas", "tipo_evento", "enum", "vaga_reaberta / cancelada_cliente / alteracao_requisitos / encerrada_contratacao"],
  ["—", "Chaves", "—", "CA (candidato), AP (candidatura), V (vaga), CL (cliente), R (recrutador), EN (entrevista), IN (interação), PR (proposta), CT (contratação), FB (feedback), HV (histórico)"],
]);
p("**Nota final**: este relatório descreve os dados tal como estão. Vários indicadores (funil, tempos, retenção) são internamente coerentes e úteis como ponto de partida; os campos marcados como não fiáveis devem ser reconstruídos antes de suportarem decisões.");

// ---------------- render ----------------
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
function renderMD() {
  let md = "";
  for (const b of B) {
    if (b.t === "title") md += `# ${b.text}\n\n`;
    else if (b.t === "meta") md += `*${b.text}*\n\n`;
    else if (b.t === "h2") md += `\n## ${b.text}\n\n`;
    else if (b.t === "h3") md += `\n### ${b.text}\n\n`;
    else if (b.t === "p") md += `${b.text}\n\n`;
    else if (b.t === "ul") md += b.items.map((i) => `- ${i}`).join("\n") + "\n\n";
    else if (b.t === "callout") md += `> **${b.title}** — ${b.text}\n\n`;
    else if (b.t === "table") {
      md += `| ${b.headers.join(" | ")} |\n| ${b.headers.map(() => "---").join(" | ")} |\n`;
      md += b.rows.map((r) => `| ${r.map((c) => String(c).replace(/\|/g, "\\|")).join(" | ")} |`).join("\n") + "\n\n";
      if (b.note) md += `*${b.note}*\n\n`;
    } else if (b.t === "chart") {
      md += `![${b.caption}](figuras/${b.key}.svg)\n\n*${b.caption}*\n\n`;
    }
  }
  return md;
}
function renderHTML() {
  const nav = B.filter((b) => b.t === "h2").map((b) => `<li><a href="#${b.id}">${b.text}</a></li>`).join("");
  let body = "";
  for (const b of B) {
    if (b.t === "title") body += `<h1>${b.text}</h1>`;
    else if (b.t === "meta") body += `<p class="meta">${b.text}</p>`;
    else if (b.t === "h2") body += `<h2 id="${b.id}">${b.text}</h2>`;
    else if (b.t === "h3") body += `<h3 id="${b.id}">${b.text}</h3>`;
    else if (b.t === "p") body += `<p>${b.text}</p>`;
    else if (b.t === "ul") body += `<ul>${b.items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
    else if (b.t === "callout") body += `<div class="callout ${b.kind}"><strong>${b.title}</strong> — ${b.text}</div>`;
    else if (b.t === "table") body += `<div class="tw"><table><thead><tr>${b.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${b.note ? `<p class="note">${b.note}</p>` : ""}`;
    else if (b.t === "chart") body += `<figure>${fig[b.key]}<figcaption>${b.caption}</figcaption></figure>`;
  }
  return `<!doctype html>
<html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Análise de Recrutamento</title>
<style>
:root{--bg:#fff;--fg:#1a202c;--muted:#4a5568;--line:#e2e8f0;--accent:#2b6cb0;--soft:#f7fafc}
*{box-sizing:border-box}
body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--fg);background:var(--bg);line-height:1.62;font-size:15px}
.wrap{display:grid;grid-template-columns:300px minmax(0,1fr);gap:0;max-width:1500px;margin:0 auto}
nav{position:sticky;top:0;height:100vh;overflow:auto;padding:28px 18px;border-right:1px solid var(--line);background:var(--soft);font-size:13.5px}
nav h4{margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
nav ol{margin:0;padding-left:18px}
nav li{margin:5px 0}
nav a{color:var(--muted);text-decoration:none}
nav a:hover{color:var(--accent)}
main{padding:36px 48px 90px;max-width:1040px}
h1{font-size:30px;line-height:1.25;margin:0 0 6px}
.meta{color:var(--muted);font-size:13px;margin:0 0 28px;padding-bottom:18px;border-bottom:1px solid var(--line)}
h2{font-size:22px;margin:48px 0 14px;padding-top:8px;border-top:2px solid var(--line)}
h3{font-size:17px;margin:28px 0 10px}
p{margin:10px 0}
ul{margin:10px 0 14px;padding-left:22px}
li{margin:6px 0}
.tw{overflow-x:auto;margin:16px 0}
table{border-collapse:collapse;width:100%;font-size:12.6px}
th,td{border-bottom:1px solid var(--line);padding:7px 9px;text-align:left;vertical-align:top}
th{background:var(--soft);font-weight:600;white-space:nowrap}
tr:hover td{background:#fcfdff}
.note{font-size:12px;color:var(--muted);margin-top:-8px}
figure{margin:26px 0;padding:14px;border:1px solid var(--line);border-radius:10px;background:#fff}
figcaption{font-size:12.5px;color:var(--muted);margin-top:10px}
.callout{padding:12px 16px;border-left:4px solid var(--accent);background:#ebf8ff;margin:16px 0;border-radius:0 6px 6px 0}
@media(max-width:900px){.wrap{grid-template-columns:1fr}nav{position:static;height:auto;border-right:none;border-bottom:1px solid var(--line)}main{padding:24px}}
</style></head>
<body><div class="wrap"><nav><h4>Índice</h4><ol>${nav}</ol></nav><main>${body}</main></div></body></html>`;
}

fs.writeFileSync(path.join(OUT, "RELATORIO.md"), renderMD());
fs.writeFileSync(path.join(OUT, "relatorio.html"), renderHTML());
console.log("OK — relatorio.html e RELATORIO.md gerados; figuras:", Object.keys(fig).length);
console.log("checks:", { n0, fEnt, fTec, fCli, fFin, nProp, nAce, ret90G, ret180G, etapaMatch, hiredFinal, mismatchCt, ddmm, scoreHigh, belowMin, aboveMax, respDepois, feedbackAntes, candidatosComRecontratacao, feedbackCluster, contratadoEstado, vagasExpiradas });
