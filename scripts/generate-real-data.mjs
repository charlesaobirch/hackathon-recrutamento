// Gera os dados reais das páginas a partir dos JSONs em data/.
// Executar com: node scripts/generate-real-data.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const load = (name) =>
  JSON.parse(readFileSync(resolve(root, `data/${name}.json`), "utf8"));

const candidatos = load("candidatos");
const candidaturas = load("candidaturas");
const clientes = load("clientes");
const contratacoes = load("contratacoes");
const entrevistas = load("entrevistas");
const feedback = load("feedback_clientes");
const interacoes = load("interacoes");
const propostas = load("propostas");
const recrutadores = load("recrutadores");
const vagas = load("vagas");

const by = (rows, key) => new Map(rows.map((row) => [row[key], row]));
const group = (rows, key) => {
  const result = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!result.has(value)) result.set(value, []);
    result.get(value).push(row);
  }
  return result;
};
const countBy = (rows, key) => {
  const result = new Map();
  for (const row of rows) {
    const value = typeof key === "function" ? key(row) : row[key];
    if (value == null) continue;
    result.set(value, (result.get(value) ?? 0) + 1);
  }
  return result;
};
const avg = (values) => {
  const valid = values.filter(
    (value) => typeof value === "number" && Number.isFinite(value),
  );
  return valid.length
    ? valid.reduce((sum, value) => sum + value, 0) / valid.length
    : 0;
};
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};
const pct = (part, total) => (total ? Math.round((100 * part) / total) : 0);
const round = (value) => Math.round(value * 100) / 100;

const parseDate = (value) => {
  if (!value || typeof value !== "string") return null;
  if (value.includes("/")) {
    const [day, month, year] = value.split("/").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};
const monthKey = (value) => {
  const date = parseDate(value);
  return date
    ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
    : null;
};
const dayKey = (value) => {
  const date = value instanceof Date ? value : parseDate(value);
  return date && !Number.isNaN(date.getTime())
    ? date.toISOString().slice(0, 10)
    : null;
};

const REFERENCE = new Date("2025-12-31T00:00:00Z");
const WEEK_START = new Date(REFERENCE.getTime() - 6 * 86_400_000);
const MONTHS_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];
const MONTHS_PT_TITLE = MONTHS_PT.map(
  (month) => month[0].toUpperCase() + month.slice(1),
);
const WEEKDAYS_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const fmtDay = (value) => {
  const date = parseDate(value);
  return date
    ? `${String(date.getUTCDate()).padStart(2, "0")} ${MONTHS_PT[date.getUTCMonth()]}`
    : "—";
};
const fmtMonthYear = (value) => {
  const date = parseDate(value);
  return date
    ? `${MONTHS_PT[date.getUTCMonth()].toUpperCase()} DE ${date.getUTCFullYear()}`
    : "—";
};
const fmtMoney = (value) => `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
const fmtMonthly = (value) => fmtMoney(value / 12);
const label = {
  senioridade: (value) =>
    ({ junior: "Júnior", mid: "Pleno", senior: "Sênior", lead: "Lead" })[
      value
    ] ?? value,
  estado: (value) =>
    ({ em_andamento: "em andamento", encerrada: "encerrada" })[value] ?? value,
  etapa: (value) =>
    ({
      triagem: "Triagem",
      entrevista_tecnica: "Entrevista técnica",
      entrevista_cliente: "Entrevista com cliente",
      entrevista_final: "Entrevista final",
      rejeitado: "Rejeitado",
      desistencia: "Desistência",
    })[value] ?? value,
  proposta: (value) =>
    ({ aceite: "Aceite", recusada: "Recusada", sem_resposta: "Sem resposta" })[
      value
    ] ?? value,
  disponibilidade: (value) =>
    ({
      imediata: "Imediata",
      "1_mes": "Em 1 mês",
      "2_meses": "Em 2 meses",
      a_definir: "A definir",
    })[value] ?? value,
  origem: (value) =>
    ({
      indicacao: "indicação",
      linkedin: "LinkedIn",
      careers: "careers",
      agencia: "agência",
      feira_emprego: "feira de empregos",
    })[value] ?? value,
  contrato: (value) => (value === "permanente" ? "CLT" : "Temporário"),
  setor: (value) =>
    ({
      saude: "Saúde",
      energia: "Energia",
      retalho: "Retalho",
      tecnologia: "Tecnologia",
      banca: "Banca",
    })[value] ?? value,
  modelo: (value) =>
    ({
      partilhado: "partilhado",
      exclusivo: "exclusivo",
      contingencia: "contingência",
    })[value] ?? value,
  beneficio: (value) =>
    ({
      stock: "Stock options",
      saude: "Plano de saúde",
      "saude+formacao": "Saúde + formação",
      nenhum: "Sem benefícios",
    })[value] ?? value,
  percepcao: (value) => {
    if (value >= 4) return "Acima do esperado";
    if (value >= 3) return "Dentro do esperado";
    return "Atenção";
  },
  resultado: (value) =>
    ({
      aprovado: "Aprovado",
      reprovado: "Reprovado",
      pendente: "Pendente",
      respondido: "Respondido",
      concluido: "Concluído",
      sem_resposta: "Sem resposta",
      agendado: "Agendado",
    })[value] ?? value,
};

const candidatosById = by(candidatos, "id");
const vagasById = by(vagas, "id");
const clientesById = by(clientes, "id");
const recrutadoresById = by(recrutadores, "id");
const candidaturasById = by(candidaturas, "id");
const entrevistasByApp = group(entrevistas, "id_candidatura");
const interacoesByApp = group(interacoes, "id_candidatura");
const propostasByApp = group(propostas, "id_candidatura");
const feedbackByContratacao = by(feedback, "id_contratacao");

const between = (row, key, start, end) => {
  const value = dayKey(row?.[key]);
  return value !== null && value >= dayKey(start) && value <= dayKey(end);
};
const vagaCliente = (vaga) => clientesById.get(vaga?.id_cliente)?.nome ?? "—";
const vagaRecrutador = (vaga) => recrutadoresById.get(vaga?.id_recrutador);
const appCountByVaga = countBy(candidaturas, "id_vaga");
const candidateName = (candidato) => candidato?.nome_ficticio ?? "—";
const latestInterview = (list) =>
  [...(list ?? [])].sort(
    (a, b) =>
      (parseDate(b.data)?.getTime() ?? 0) - (parseDate(a.data)?.getTime() ?? 0),
  );

const overrides = {};
const styles = {};
const set = (id, value) => {
  overrides[id] = String(value);
};
const style = (id, value) => {
  styles[id] = { ...styles[id], ...value };
};
const hide = (id) => style(id, { hidden: true });

const recruiter = recrutadoresById.get("R01");
const profileName = recruiter.nome;
const profileRole =
  recruiter.cargo === "consultor" ? "Consultor" : "Senior consultant";

// Navegação e barra superior (presentes em todas as páginas).
for (const id of ["2:53", "2:89", "2:125", "2:161", "2:197", "2:233", "2:269"])
  set(id, profileName);
for (const id of ["2:54", "2:90", "2:126", "2:162", "2:198", "2:234", "2:270"])
  set(id, profileRole);
const todayLabel = `${WEEKDAYS_PT[REFERENCE.getUTCDay()]}, ${String(REFERENCE.getUTCDate()).padStart(2, "0")} ${MONTHS_PT[REFERENCE.getUTCMonth()].toUpperCase()}`;
for (const id of ["2:59", "2:94", "2:131", "2:167", "2:203", "2:239", "2:275"])
  set(id, todayLabel);

// Indicadores globais.
const vagasAbertas = vagas.filter((vaga) =>
  ["em_andamento", "reaberta"].includes(vaga.estado),
);
const candidaturasAtivas = candidaturas.filter(
  (app) => app.estado_candidatura === "em_andamento",
);
const tempos = contratacoes
  .map((item) => item.tempo_total_dias)
  .filter(Number.isFinite);
const satisfacaoMedia = avg(feedback.map((item) => item.satisfacao));
const semResposta = interacoes.filter(
  (item) => item.resultado === "sem_resposta",
);

// Dashboard.
set("2:284", vagasAbertas.length);
set(
  "2:286",
  `+${vagas.filter((vaga) => monthKey(vaga.data_abertura) === "2025-12").length} em dez`,
);
set("2:287", candidaturasAtivas.length);
set(
  "2:289",
  `${candidaturasAtivas.filter((app) => between(app, "data_candidatura", WEEK_START, REFERENCE)).length} novos nesta semana`,
);
set("2:291", `${Math.round(avg(tempos))} dias`);
set("2:293", `mediana ${Math.round(median(tempos))} dias`);
set("2:295", `${Math.round(satisfacaoMedia * 20)}%`);
set("2:297", `${feedback.length} avaliações recebidas`);

const months = Array.from({ length: 6 }, (_, index) => {
  const month = new Date(Date.UTC(2025, 6 + index, 1));
  return {
    key: monthKey(month.toISOString().slice(0, 10)),
    short: MONTHS_PT_TITLE[month.getUTCMonth()],
  };
});
const candidaturasPorMes = countBy(candidaturas, (app) =>
  monthKey(app.data_candidatura),
);
const avancosPorMes = countBy(
  entrevistas.filter((item) => item.resultado === "aprovado"),
  (item) => monthKey(item.data),
);
const maxCandidaturas = Math.max(
  ...months.map((month) => candidaturasPorMes.get(month.key) ?? 0),
);
const maxAvancos = Math.max(
  ...months.map((month) => avancosPorMes.get(month.key) ?? 0),
);
set("2:303", `${months[0].short} — ${months.at(-1).short} 2025`);
set("2:305", maxCandidaturas);
set("2:307", Math.round(maxCandidaturas / 2));
set("2:309", Math.round(maxCandidaturas / 4));
months.forEach((month, index) => {
  set(`2:${312 + index * 3}`, month.short);
  const candidaturasHeight = Math.max(
    4,
    round((120 * (candidaturasPorMes.get(month.key) ?? 0)) / maxCandidaturas),
  );
  style(`2:${310 + index * 3}`, {
    h: candidaturasHeight,
    y: round(240 - candidaturasHeight),
  });
  const avancosHeight = Math.max(
    4,
    round((78 * (avancosPorMes.get(month.key) ?? 0)) / maxAvancos),
  );
  style(`2:${311 + index * 3}`, {
    h: avancosHeight,
    y: round(240 - avancosHeight),
  });
});

const recentInterviews = latestInterview(entrevistas).slice(0, 3);
set("2:334", `${recentInterviews.length} entrevistas no recorte mais recente.`);
recentInterviews.forEach((interview, index) => {
  const app = candidaturasById.get(interview.id_candidatura);
  const vaga = vagasById.get(app?.id_vaga);
  const candidate = candidatosById.get(app?.id_candidato);
  set(`2:${335 + index * 3}`, fmtDay(interview.data));
  set(`2:${336 + index * 3}`, candidateName(candidate));
  set(
    `2:${337 + index * 3}`,
    `${label.etapa(interview.fase)} · ${vagaCliente(vaga)}`,
  );
});

const topVagas = [...vagasAbertas]
  .sort(
    (a, b) => (appCountByVaga.get(b.id) ?? 0) - (appCountByVaga.get(a.id) ?? 0),
  )
  .slice(0, 2);
[
  ["2:352", "2:353", "2:355", "2:356", "2:357"],
  ["2:359", "2:360", "2:362", "2:363", "2:364"],
].forEach(([titleId, clientId, countId, ownerId, nextId], index) => {
  const vaga = topVagas[index];
  if (!vaga) return;
  const apps = candidaturas.filter((app) => app.id_vaga === vaga.id);
  const stage = [...countBy(apps, "etapa_atual").entries()].sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];
  set(titleId, vaga.titulo);
  set(clientId, `${vagaCliente(vaga)} · ${vaga.departamento}`);
  set(countId, `${apps.length} talentos`);
  set(ownerId, vagaRecrutador(vaga)?.nome ?? "—");
  set(nextId, `${apps.length ? label.etapa(stage) : "Sem talentos"}`);
});

// Candidato / candidatura em destaque.
const appsComEntrevistas = candidaturas.filter(
  (app) =>
    app.estado_candidatura === "em_andamento" &&
    (entrevistasByApp.get(app.id)?.length ?? 0) >= 2,
);
const featuredApp =
  [...appsComEntrevistas].sort(
    (a, b) => b.score_curriculo - a.score_curriculo,
  )[0] ?? candidaturas[0];
const featuredCandidate = candidatosById.get(featuredApp.id_candidato);
const featuredVaga = vagasById.get(featuredApp.id_vaga);
const featuredClient = vagaCliente(featuredVaga);
const featuredInterviews = latestInterview(
  entrevistasByApp.get(featuredApp.id),
);
const featuredSkills = featuredCandidate.skills
  .split(",")
  .map((skill) => skill.trim());
const techScore = Math.round(
  avg(featuredInterviews.map((item) => item.score_tecnico)),
);
const commScore = Math.round(
  avg(featuredInterviews.map((item) => item.score_comunicacao)),
);
const experienceScore = Math.min(100, featuredCandidate.anos_experiencia * 10);

set("2:98", candidateName(featuredCandidate));
set(
  "2:99",
  `${label.senioridade(featuredCandidate.senioridade)} · ${featuredCandidate.localizacao}`,
);
set(
  "2:368",
  `${featuredCandidate.anos_experiencia} anos criando soluções em ${featuredSkills[0]}.`,
);
set(
  "2:371",
  `ID ${featuredCandidate.id} · ${label.origem(featuredCandidate.canal_origem)}`,
);
set(
  "2:372",
  `Disponibilidade: ${label.disponibilidade(featuredCandidate.disponibilidade)}`,
);
set("2:373", `Skills: ${featuredSkills.slice(0, 3).join(" · ")}`);
set("2:376", featuredSkills[0]);
set("2:378", featuredSkills[1] ?? featuredSkills[0]);
set("2:380", featuredSkills[2] ?? "—");
set(
  "2:381",
  `Origem: ${label.origem(featuredCandidate.canal_origem)} · ${fmtDay(featuredCandidate.data_candidatura)}`,
);
set("2:383", Math.round(featuredApp.score_curriculo));
set("2:385", `${featuredInterviews.length} entrevistas avaliadas pela equipe.`);
set(
  "2:387",
  featuredApp.score_curriculo >= 70 ? "Alta aderência" : "Em análise",
);
set(
  "2:388",
  `Currículo ${Math.round(featuredApp.score_curriculo)}% · Técnica ${techScore}% · Comunicação ${commScore}% · Experiência ${experienceScore}%`,
);
set("2:392", `Avaliações  ${featuredInterviews.length}`);
set("2:393", `Interações  ${interacoesByApp.get(featuredApp.id)?.length ?? 0}`);
featuredInterviews.slice(0, 2).forEach((interview, index) => {
  const offset = index * 4;
  set(`2:${397 + offset}`, fmtDay(interview.data));
  set(`2:${398 + offset}`, label.etapa(interview.fase));
  set(`2:${399 + offset}`, `${featuredVaga.titulo} · ${featuredClient}`);
  set(
    `2:${400 + offset}`,
    `${label.resultado(interview.resultado)} · Técnica ${Math.round(interview.score_tecnico)}%`,
  );
});
if (featuredInterviews[0]) {
  set(
    "2:410",
    `${featuredVaga.titulo} · ${featuredClient} · ${fmtDay(featuredInterviews[0].data)}`,
  );
}
set(
  "2:413",
  `Candidatura ${label.estado(featuredApp.estado_candidatura)} · ${fmtDay(featuredApp.data_candidatura)}`,
);

// Pipeline da vaga com mais candidaturas.
const mainVaga = topVagas[0] ?? vagas[0];
const mainApps = candidaturas.filter((app) => app.id_vaga === mainVaga.id);
const mainAppIds = new Set(mainApps.map((app) => app.id));
const mainContratacoes = contratacoes.filter(
  (item) => item.id_vaga === mainVaga.id,
);
const proposalAppIds = new Set(
  propostas
    .filter((item) => item.estado_proposta === "sem_resposta")
    .map((item) => item.id_candidatura),
);
const columns = [
  {
    ids: [431, 437, 443],
    texts: [
      [432, 433, 435, 436],
      [438, 439, 441, 442],
      [444, 445, 447, 448],
    ],
    count: "2:430",
    apps: mainApps.filter((app) => app.etapa_atual === "triagem"),
    status: (app) => label.etapa(app.etapa_atual),
    date: (app) => fmtDay(app.data_entrada_etapa),
  },
  {
    ids: [456, 462],
    texts: [
      [457, 458, 460, 461],
      [463, 464, 466, 467],
    ],
    count: "2:455",
    apps: mainApps.filter((app) => app.etapa_atual === "entrevista_tecnica"),
    status: (app) => label.etapa(app.etapa_atual),
    date: (app) => fmtDay(app.data_entrada_etapa),
  },
  {
    ids: [475, 481],
    texts: [
      [476, 477, 479, 480],
      [482, 483, 485, 486],
    ],
    count: "2:474",
    apps: mainApps.filter((app) =>
      ["entrevista_cliente", "entrevista_final"].includes(app.etapa_atual),
    ),
    status: (app) => label.etapa(app.etapa_atual),
    date: (app) => fmtDay(app.data_entrada_etapa),
  },
  {
    ids: [494],
    texts: [[495, 496, 498, 499]],
    count: "2:493",
    apps: mainApps.filter((app) => proposalAppIds.has(app.id)),
    status: () => "Aguardando resposta",
    date: (app) => fmtDay(propostasByApp.get(app.id)?.[0]?.data_proposta),
  },
  {
    ids: [507],
    texts: [[508, 509, 511, 512]],
    count: "2:506",
    apps: mainContratacoes
      .map((item) => candidaturasById.get(item.id_candidatura))
      .filter(Boolean),
    status: () => "Contratação concluída",
    date: (item) =>
      fmtDay(
        mainContratacoes.find((hire) => hire.id_candidatura === item.id)
          ?.data_contratacao,
      ),
  },
];
set(
  "2:135",
  `${mainVaga.titulo} · Vaga #${mainVaga.id.slice(1)} · ${vagaCliente(mainVaga)}`,
);
set("2:416", mainVaga.titulo);
set("2:419", `${mainApps.length} talentos · 5 etapas`);
set(
  "2:423",
  `${semResposta.filter((item) => mainAppIds.has(item.id_candidatura) && between(item, "data", WEEK_START, REFERENCE)).length} talentos aguardam retorno há mais de 2 dias. Uma conversa faz a diferença.`,
);
for (const column of columns) {
  set(column.count, column.apps.length);
  column.ids.forEach((frameId, cardIndex) => {
    const app = column.apps[cardIndex];
    if (!app) {
      hide(`2:${frameId}`);
      return;
    }
    const candidate = candidatosById.get(app.id_candidato);
    const [nameId, roleId, statusId, dateId] = column.texts[cardIndex];
    set(`2:${nameId}`, candidateName(candidate));
    set(
      `2:${roleId}`,
      `${label.senioridade(candidate?.senioridade)} · ${candidate?.anos_experiencia ?? 0} anos`,
    );
    set(`2:${statusId}`, column.status(app));
    set(`2:${dateId}`, column.date(app));
  });
}

// Formulário de candidatura.
set("2:171", `Candidatura para ${featuredVaga.titulo} na ${featuredClient}.`);
set(
  "2:515",
  `${featuredClient.toUpperCase()}  /  ${featuredVaga.departamento.toUpperCase()}`,
);
set(
  "2:517",
  `Skills: ${featuredVaga.skills_requeridas.split(",").join(" · ")}`,
);
set("2:519", featuredVaga.localizacao);
set("2:521", label.contrato(featuredVaga.tipo_contrato));
set("2:522", featuredVaga.titulo);
set(
  "2:523",
  `${fmtMonthly(featuredVaga.salario_min)} – ${fmtMonthly(featuredVaga.salario_max)} / mês`,
);
set("2:525", featuredVaga.skills_requeridas.split(",").slice(0, 3).join("\n"));
set("2:537", candidateName(featuredCandidate));
set("2:540", `ID ${featuredCandidate.id}`);
set("2:543", label.disponibilidade(featuredCandidate.disponibilidade));
set("2:546", featuredCandidate.localizacao);
set("2:549", label.origem(featuredCandidate.canal_origem));
set("2:551", `Candidatura-${featuredCandidate.id}`);
set(
  "2:552",
  `Score ${Math.round(featuredApp.score_curriculo)} · Envio concluído`,
);

// Proposta.
const featuredProposal =
  [...propostas]
    .filter((item) => ["sem_resposta", "aceite"].includes(item.estado_proposta))
    .sort(
      (a, b) =>
        (parseDate(b.data_proposta)?.getTime() ?? 0) -
        (parseDate(a.data_proposta)?.getTime() ?? 0),
    )[0] ?? propostas[0];
const proposalApp = candidaturasById.get(featuredProposal.id_candidatura);
const proposalCandidate = candidatosById.get(proposalApp?.id_candidato);
const proposalVaga = vagasById.get(proposalApp?.id_vaga);
const proposalClient = vagaCliente(proposalVaga);
const proposalRecruiter = vagaRecrutador(proposalVaga);
const proposalFullName = candidateName(proposalCandidate);
set(
  "2:207",
  `Proposta #${featuredProposal.id} · ${proposalFullName} → ${proposalClient}`,
);
set("2:606", proposalClient.toLowerCase());
set("2:608", label.proposta(featuredProposal.estado_proposta).toUpperCase());
set("2:610", `O futuro fica melhor\ncom você, ${proposalFullName}.`);
set(
  "2:611",
  `Nossa proposta para ${proposalVaga.titulo} na ${proposalClient}.`,
);
set("2:614", fmtMonthly(featuredProposal.salario_oferecido));
set("2:615", label.beneficio(featuredProposal.beneficios));
set("2:617", proposalVaga.titulo);
set("2:619", proposalVaga.localizacao);
set(
  "2:621",
  featuredProposal.data_resposta
    ? fmtDay(featuredProposal.data_resposta)
    : "Aguardando resposta",
);
set(
  "2:623",
  `${proposalRecruiter?.nome ?? "—"} · ${proposalRecruiter?.cargo ?? "—"}`,
);
set("2:626", label.beneficio(featuredProposal.beneficios));
set("2:628", label.contrato(proposalVaga.tipo_contrato));
set("2:630", proposalVaga.localizacao);
set(
  "2:639",
  featuredProposal.estado_proposta === "aceite" ? "Concluído" : "Pendente",
);
set("2:641", `Envio para ${proposalFullName}`);
set("2:646", `ID ${proposalCandidate?.id ?? "—"}`);

// Cliente com mais vagas ativas.
const clientStats = clientes
  .map((client) => ({
    client,
    vagas: vagas.filter(
      (vaga) =>
        vaga.id_cliente === client.id &&
        ["em_andamento", "reaberta"].includes(vaga.estado),
    ),
  }))
  .sort((a, b) => b.vagas.length - a.vagas.length);
const featuredClientRecord = clientStats[0].client;
const featuredClientVagas = clientStats[0].vagas;
const featuredClientHires = contratacoes.filter(
  (item) => item.id_cliente === featuredClientRecord.id,
);
const featuredClientFeedback = featuredClientHires
  .map((item) => feedbackByContratacao.get(item.id))
  .filter(Boolean);
const featuredClientRecruiter =
  vagaRecrutador(featuredClientVagas[0]) ?? recrutadores[0];
const clientAppIds = new Set(
  candidaturas
    .filter((app) =>
      featuredClientVagas.some((vaga) => vaga.id === app.id_vaga),
    )
    .map((app) => app.id),
);
const clientMeeting = interacoes
  .filter(
    (item) =>
      item.tipo === "reuniao_cliente" && clientAppIds.has(item.id_candidatura),
  )
  .sort(
    (a, b) =>
      (parseDate(b.data)?.getTime() ?? 0) - (parseDate(a.data)?.getTime() ?? 0),
  )[0];
const latestClientFeedback = featuredClientFeedback
  .filter((item) => item.comentario?.trim())
  .sort(
    (a, b) =>
      (parseDate(b.data_feedback)?.getTime() ?? 0) -
      (parseDate(a.data_feedback)?.getTime() ?? 0),
  )[0];

set("2:242", featuredClientRecord.nome);
set(
  "2:243",
  `${label.setor(featuredClientRecord.setor)} · ${featuredClientRecord.regiao} · ${label.modelo(featuredClientRecord.modelo_recrutamento)}`,
);
set(
  "2:654",
  `PARCERIA DESDE ${fmtMonthYear(featuredClientRecord.data_inicio_contrato)}`,
);
set("2:656", featuredClientVagas.length);
set("2:658", featuredClientHires.length);
set(
  "2:660",
  `${Math.round(avg(featuredClientFeedback.map((item) => item.satisfacao)) * 20)}%`,
);
set("2:664", `Vagas  ${featuredClientVagas.length}`);
[
  ["2:675", "2:676", "2:678", "2:679"],
  ["2:681", "2:682", "2:684", "2:685"],
  ["2:687", "2:688", "2:690", "2:691"],
].forEach(([titleId, detailId, stageId, deadlineId], index) => {
  const vaga = featuredClientVagas[index];
  if (!vaga) return;
  const apps = candidaturas.filter((app) => app.id_vaga === vaga.id);
  const stage = [...countBy(apps, "etapa_atual").entries()].sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];
  set(titleId, vaga.titulo);
  set(detailId, `${vaga.departamento} · ${apps.length} talentos`);
  set(stageId, label.etapa(stage));
  set(deadlineId, fmtDay(vaga.data_fecho));
});
set("2:695", featuredClientRecruiter.nome);
set(
  "2:696",
  `${featuredClientRecruiter.equipa} · ${featuredClientRecruiter.cargo}`,
);
set("2:697", `ID ${featuredClientRecruiter.id}`);
if (clientMeeting) {
  set("2:700", fmtDay(clientMeeting.data));
  set("2:701", `Última interação: ${label.resultado(clientMeeting.resultado)}`);
}
if (latestClientFeedback) {
  set(
    "2:705",
    `ÚLTIMO FEEDBACK  /  ${fmtDay(latestClientFeedback.data_feedback).toUpperCase()}`,
  );
  set("2:706", `“${latestClientFeedback.comentario}”`);
  set(
    "2:707",
    `Registrado por ${featuredClientRecruiter.nome} · ${latestClientFeedback.id}`,
  );
}

// Qualidade da operação.
const qualityScore = Math.round(
  avg(contratacoes.map((item) => item.desempenho_90_dias)) * 20,
);
const ret90 = contratacoes.filter(
  (item) => typeof item.retencao_90_dias === "boolean",
);
const slaOk = interacoes.length - semResposta.length;
const interviewApprovals = entrevistas.filter(
  (item) => item.resultado === "aprovado",
).length;
const dimensions = [
  {
    value: Math.round(avg(entrevistas.map((item) => item.score_tecnico))),
    text: "2:763",
    bar: "2:762",
  },
  {
    value: Math.round(
      avg(feedback.map((item) => item.desempenho_percebido)) * 20,
    ),
    text: "2:767",
    bar: "2:766",
  },
  {
    value: Math.round(
      avg(contratacoes.map((item) => item.desempenho_90_dias)) * 20,
    ),
    text: "2:771",
    bar: "2:770",
  },
  {
    value: Math.round(avg(feedback.map((item) => item.satisfacao)) * 20),
    text: "2:775",
    bar: "2:774",
  },
];
set("2:743", qualityScore);
set("2:744", `${contratacoes.length} avaliações de 90 dias`);
set("2:747", pct(interviewApprovals, entrevistas.length));
set("2:748", `${entrevistas.length} entrevistas avaliadas`);
set(
  "2:751",
  `${pct(ret90.filter((item) => item.retencao_90_dias).length, ret90.length)}%`,
);
set("2:755", `${pct(slaOk, interacoes.length)}%`);
for (const dimension of dimensions) {
  set(dimension.text, dimension.value);
  style(dimension.bar, { w: round((344 * dimension.value) / 100) });
}
set(
  "2:779",
  `${pct(semResposta.length, interacoes.length)}% dos retornos ficaram sem resposta.\n${semResposta.length} interações precisam de acompanhamento.`,
);
set("2:781", `Revisar ${semResposta.length} pendências  →`);
const qualityHires = contratacoes
  .filter((item) => feedbackByContratacao.has(item.id))
  .slice(0, 2);
[
  ["2:790", "2:791", "2:793", "2:794"],
  ["2:796", "2:797", "2:799", "2:800"],
].forEach(([nameId, checkId, perceptionId, actionId], index) => {
  const hire = qualityHires[index];
  if (!hire) return;
  const app = candidaturasById.get(hire.id_candidatura);
  const candidate = candidatosById.get(app?.id_candidato);
  const itemFeedback = feedbackByContratacao.get(hire.id);
  set(
    nameId,
    `${candidateName(candidate)} · ${clientesById.get(hire.id_cliente)?.nome ?? "—"}`,
  );
  set(checkId, hire.retencao_180_dias ? "180 dias" : "90 dias");
  set(perceptionId, label.percepcao(itemFeedback.desempenho_percebido));
  set(actionId, `Check-in em ${fmtDay(itemFeedback.data_feedback)}`);
});

const output = `// Gerado por scripts/generate-real-data.mjs a partir dos JSONs em data/.
// Não editar manualmente: altere os JSONs de origem e rode o gerador.

export type NodeStyleOverride = {
  w?: number;
  h?: number;
  y?: number;
  hidden?: boolean;
};

export const dataReferenceDate = "${REFERENCE.toISOString().slice(0, 10)}";

export const dataProfile = ${JSON.stringify(
  {
    name: profileName,
    role: profileRole,
    clients: clientes.length,
    recruiters: recrutadores.length,
    vagas: vagas.length,
    candidatos: candidatos.length,
    candidaturas: candidaturas.length,
    contratacoes: contratacoes.length,
  },
  null,
  2,
)};

export const nodeOverrides: Record<string, string> = ${JSON.stringify(overrides, null, 2)};

export const nodeStyles: Record<string, NodeStyleOverride> = ${JSON.stringify(styles, null, 2)};
`;

const destination = resolve(root, "src/data/real-data.ts");
writeFileSync(destination, output, "utf8");
execFileSync(
  process.execPath,
  [
    resolve(root, "node_modules/@biomejs/biome/bin/biome"),
    "format",
    "--write",
    destination,
  ],
  { cwd: root, stdio: "ignore" },
);
console.log(
  `overrides=${Object.keys(overrides).length} styles=${Object.keys(styles).length} reference=${REFERENCE.toISOString().slice(0, 10)}`,
);
