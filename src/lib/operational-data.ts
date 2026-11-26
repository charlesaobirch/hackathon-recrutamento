import type { DatasetName, DatasetRow } from "@/lib/dataset-config";
import { getDatasetRows } from "@/lib/dataset-store";
import { humanizeValue } from "@/lib/format";

const interviewPhases = [
  "triagem",
  "entrevista_tecnica",
  "entrevista_cliente",
  "entrevista_final",
] as const;

type InterviewPhase = (typeof interviewPhases)[number];
export type OperationalStage =
  | "sem_entrevista"
  | InterviewPhase
  | "proposta"
  | "contratado";
export type Signal = "critical" | "attention" | "recent" | "unknown";
export type SalaryPosition = "below" | "within" | "above" | "unknown";

export type ActivityMonth = {
  label: string;
  applications: number;
  proposals: number;
  partial: boolean;
};

export type FunnelStage = {
  key: string;
  label: string;
  count: number;
  conversion: number | null;
};

export type SalaryPositionStat = {
  position: SalaryPosition;
  label: string;
  total: number;
  accepted: number;
  rejected: number;
  noResponse: number;
  acceptance: number | null;
};

export type QueueAges = {
  recent: number;
  attention: number;
  critical: number;
  unknown: number;
};

export type WorklistRow = {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  vacancyId: string;
  vacancyTitle: string;
  clientId: string;
  clientName: string;
  recruiterId: string;
  recruiterName: string;
  stage: OperationalStage;
  reachedStages: OperationalStage[];
  stageSinceDate: string | null;
  latestInterviewDate: string | null;
  latestInterviewPhase: string;
  latestInterviewResult: string;
  lastActivityDate: string | null;
  daysIdle: number | null;
  signal: Signal;
  applicationDate: string | null;
  expectedSalary: number | null;
  proposalId: string | null;
  offerDate: string | null;
  responseDate: string | null;
  offer: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPosition: SalaryPosition;
  proposalStatus: string | null;
};

type ClientSummary = {
  id: string;
  name: string;
  sector: string;
  contractStatus: string;
  hires: number;
  retention90: number | null;
  retentionKnown: number;
  performance: number | null;
  replacements: number;
  feedbackCount: number;
  satisfaction: number | null;
};

export type QualityIssue = {
  id: string;
  priority: "P0" | "P1" | "P2";
  count: number;
  title: string;
  area: string;
  action: string;
};

type DataSnapshot = {
  asOf: string | null;
  candidatesCount: number;
  applicationRows: WorklistRow[];
  waitingRows: WorklistRow[];
  proposalRows: WorklistRow[];
  activityMonths: ActivityMonth[];
  recentFunnel: FunnelStage[];
  stageMixRecent: Array<{ key: string; label: string; count: number }>;
  queueAges: QueueAges;
  salaryPositions: SalaryPositionStat[];
  funnel: Array<{
    key: string;
    label: string;
    count: number;
    conversion: number | null;
  }>;
  cycle: {
    firstInterview: number | null;
    interviewCycle: number | null;
    waitingForOffer: number | null;
    proposalToHire: number | null;
    total: number | null;
    sampleSize: number;
  };
  finalStageHires: number;
  qualityCounts: {
    invalidVacancyApplications: number;
    candidatesMarkedHired: number;
    distinctHiredCandidates: number;
    interviewScoresOver100: number;
    mixedInterviewDates: number;
    responsesAfterHire: number;
    feedbackBeforeHire: number;
  };
  clients: ClientSummary[];
  clientTotals: {
    retention90: number | null;
    retentionKnown: number;
    performance: number | null;
    replacements: number;
    feedbackCount: number;
    satisfaction: number | null;
    hires: number;
  };
  counts: {
    applications: number;
    candidates: number;
    proposals: number;
    proposalsNoResponse: number;
    hires: number;
    waiting: number;
    waitingRecent: number;
    applicationsRecent: number;
    proposalsRecent: number;
    hiresRecent: number;
    applicationsPrevious: number;
    proposalsPrevious: number;
    hiresPrevious: number;
    salaryBelow: number;
    salaryWithin: number;
    salaryAbove: number;
    salaryUnknown: number;
  };
};

type WorklistOptions = {
  kind: "applications" | "waiting" | "proposals";
  search?: string;
  stage?: string;
  recruiter?: string;
  signal?: string;
  period?: string;
  position?: string;
  status?: string;
  client?: string;
  page?: number;
  pageSize?: number;
};

const phaseLabels: Record<string, string> = {
  sem_entrevista: "Sem entrevista",
  triagem: "Triagem",
  entrevista_tecnica: "Entrevista técnica",
  entrevista_cliente: "Entrevista de cliente",
  entrevista_final: "Entrevista final",
  proposta: "Proposta",
  contratado: "Contratado",
};

let snapshot: DataSnapshot | null = null;

function rows(name: DatasetName) {
  return getDatasetRows(name);
}

function text(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "";
}

function number(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  let year: number;
  let month: number;
  let day: number;
  if (match) {
    year = Number(match[1]);
    month = Number(match[2]) - 1;
    day = Number(match[3]);
  } else {
    match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return null;
    year = Number(match[3]);
    month = Number(match[2]) - 1;
    day = Number(match[1]);
  }

  const date = new Date(Date.UTC(year, month, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function isoDate(value: unknown): string | null {
  return parseDate(value)?.toISOString().slice(0, 10) ?? null;
}

function dayDifference(later: Date, earlier: Date) {
  return Math.round((later.getTime() - earlier.getTime()) / 86_400_000);
}

function average(values: number[]) {
  return values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null;
}

function quantile(values: number[], proportion: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * proportion;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function groupById(records: DatasetRow[], key = "id_candidatura") {
  const grouped = new Map<string, DatasetRow[]>();
  for (const record of records) {
    const id = text(record[key]);
    if (!id) continue;
    const current = grouped.get(id) ?? [];
    current.push(record);
    grouped.set(id, current);
  }
  return grouped;
}

function latestByDate(records: DatasetRow[], field = "data") {
  return [...records].sort((first, second) => {
    const firstDate = parseDate(first[field])?.getTime() ?? 0;
    const secondDate = parseDate(second[field])?.getTime() ?? 0;
    return secondDate - firstDate;
  })[0];
}

function eventDate(records: DatasetRow[], field: string) {
  let latest: Date | null = null;
  for (const record of records) {
    const date = parseDate(record[field]);
    if (date && (!latest || date > latest)) latest = date;
  }
  return latest;
}

function getSignal(daysIdle: number | null): Signal {
  if (daysIdle === null) return "unknown";
  if (daysIdle >= 30) return "critical";
  if (daysIdle >= 14) return "attention";
  return "recent";
}

function isRecentApplication(
  applicationDate: string | null,
  asOf: string | null,
) {
  return isWithinWindow(applicationDate, asOf, 0, 90);
}

function isWithinWindow(
  value: string | null,
  asOf: string | null,
  fromDays: number,
  toDays: number,
) {
  const date = parseDate(value);
  const reference = parseDate(asOf);
  if (!date || !reference) return false;
  const days = Math.floor((reference.getTime() - date.getTime()) / 86_400_000);
  return days >= fromDays && days < toDays;
}

function monthlyActivity(
  asOf: string | null,
  applications: DatasetRow[],
  proposals: DatasetRow[],
): ActivityMonth[] {
  const reference = parseDate(asOf);
  if (!reference) return [];

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      Date.UTC(
        reference.getUTCFullYear(),
        reference.getUTCMonth() - 5 + index,
        1,
      ),
    );
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: new Intl.DateTimeFormat("pt-PT", {
        month: "short",
        timeZone: "UTC",
      })
        .format(date)
        .replace(".", ""),
      applications: 0,
      proposals: 0,
      partial: index === 5,
    };
  });
  const byMonth = new Map(months.map((month) => [month.key, month]));

  for (const application of applications) {
    const date = parseDate(application.data_candidatura);
    if (!date) continue;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const month = byMonth.get(key);
    if (month) month.applications += 1;
  }
  for (const proposal of proposals) {
    const date = parseDate(proposal.data_proposta);
    if (!date) continue;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const month = byMonth.get(key);
    if (month) month.proposals += 1;
  }

  return months.map((month) => ({
    label: month.label,
    applications: month.applications,
    proposals: month.proposals,
    partial: month.partial,
  }));
}

function computeSnapshot(): DataSnapshot {
  const applications = rows("candidaturas");
  const candidates = rows("candidatos");
  const vacancies = rows("vagas");
  const clients = rows("clientes");
  const recruiters = rows("recrutadores");
  const interviews = rows("entrevistas");
  const interactions = rows("interacoes");
  const proposals = rows("propostas");
  const hires = rows("contratacoes");
  const feedback = rows("feedback_clientes");

  const candidateById = new Map(candidates.map((row) => [text(row.id), row]));
  const vacancyById = new Map(vacancies.map((row) => [text(row.id), row]));
  const clientById = new Map(clients.map((row) => [text(row.id), row]));
  const recruiterById = new Map(recruiters.map((row) => [text(row.id), row]));
  const applicationById = new Map(
    applications.map((row) => [text(row.id), row]),
  );
  const interviewsByApplication = groupById(interviews);
  const interactionsByApplication = groupById(interactions);
  const proposalsByApplication = groupById(proposals);
  const hiresByApplication = groupById(hires);

  let asOf: Date | null = null;
  for (const [records, field] of [
    [interviews, "data"],
    [interactions, "data"],
    [proposals, "data_proposta"],
    [proposals, "data_resposta"],
    [hires, "data_contratacao"],
    [feedback, "data_feedback"],
  ] as const) {
    const latest = eventDate(records, field);
    if (latest && (!asOf || latest > asOf)) asOf = latest;
  }
  for (const application of applications) {
    const applicationDate = parseDate(application.data_candidatura);
    if (applicationDate && (!asOf || applicationDate > asOf)) {
      asOf = applicationDate;
    }
  }
  const referenceDate = asOf;

  const applicationRows: WorklistRow[] = applications.map((application) => {
    const id = text(application.id);
    const candidateId = text(application.id_candidato);
    const vacancyId = text(application.id_vaga);
    const candidate = candidateById.get(candidateId);
    const vacancy = vacancyById.get(vacancyId);
    const clientId = text(vacancy?.id_cliente);
    const recruiterId = text(vacancy?.id_recrutador);
    const client = clientById.get(clientId);
    const recruiter = recruiterById.get(recruiterId);
    const appInterviews = interviewsByApplication.get(id) ?? [];
    const appInteractions = interactionsByApplication.get(id) ?? [];
    const appProposals = proposalsByApplication.get(id) ?? [];
    const appHires = hiresByApplication.get(id) ?? [];
    const latestInterview = latestByDate(appInterviews);
    const stageSet = new Set(appInterviews.map((row) => text(row.fase)));
    const reachedStages = interviewPhases.filter((phase) =>
      stageSet.has(phase),
    );
    const maxInterviewPhase = reachedStages.at(-1) ?? "sem_entrevista";
    const hasProposal = appProposals.length > 0;
    const hasHire = appHires.length > 0;
    const stage: OperationalStage = hasHire
      ? "contratado"
      : hasProposal
        ? "proposta"
        : maxInterviewPhase;
    const lastInterviewDate = eventDate(appInterviews, "data");
    const lastInteractionDate = eventDate(appInteractions, "data");
    const hireDate = eventDate(appHires, "data_contratacao");
    const latestActivity = [
      lastInterviewDate,
      lastInteractionDate,
      eventDate(appProposals, "data_proposta"),
      eventDate(appProposals, "data_resposta"),
      hireDate,
    ]
      .filter((date): date is Date => date !== null)
      .sort((first, second) => second.getTime() - first.getTime())[0];
    const idle =
      latestActivity && referenceDate
        ? Math.max(0, dayDifference(referenceDate, latestActivity))
        : null;
    const offer = appProposals[0];
    const salaryMin = number(vacancy?.salario_min);
    const salaryMax = number(vacancy?.salario_max);
    const offerAmount = number(offer?.salario_oferecido);
    const salaryPosition: SalaryPosition =
      salaryMin === null || salaryMax === null || offerAmount === null
        ? "unknown"
        : offerAmount < salaryMin
          ? "below"
          : offerAmount > salaryMax
            ? "above"
            : "within";
    const interviewStageDate = eventDate(
      appInterviews.filter((row) => text(row.fase) === maxInterviewPhase),
      "data",
    );
    const stageSince =
      stage === "contratado"
        ? hireDate
        : stage === "proposta"
          ? eventDate(appProposals, "data_proposta")
          : interviewStageDate;

    return {
      id,
      applicationId: id,
      candidateId,
      candidateName: text(candidate?.nome_ficticio) || candidateId,
      vacancyId,
      vacancyTitle: text(vacancy?.titulo) || vacancyId,
      clientId,
      clientName: text(client?.nome) || clientId || "Sem cliente",
      recruiterId,
      recruiterName: text(recruiter?.nome) || recruiterId || "Sem recrutador",
      stage,
      reachedStages: [
        ...reachedStages,
        ...(hasProposal ? ["proposta" as const] : []),
        ...(hasHire ? ["contratado" as const] : []),
      ],
      stageSinceDate: stageSince?.toISOString().slice(0, 10) ?? null,
      latestInterviewDate:
        lastInterviewDate?.toISOString().slice(0, 10) ?? null,
      latestInterviewPhase: text(latestInterview?.fase),
      latestInterviewResult: text(latestInterview?.resultado),
      lastActivityDate: latestActivity?.toISOString().slice(0, 10) ?? null,
      daysIdle: idle,
      signal: getSignal(idle),
      applicationDate: isoDate(application.data_candidatura),
      expectedSalary: number(candidate?.expectativa_salarial),
      proposalId: offer ? text(offer.id) : null,
      offerDate: isoDate(offer?.data_proposta),
      responseDate: isoDate(offer?.data_resposta),
      offer: offerAmount,
      salaryMin,
      salaryMax,
      salaryPosition,
      proposalStatus: offer ? text(offer.estado_proposta) : null,
    };
  });
  applicationRows.sort(
    (first, second) =>
      (second.daysIdle ?? -1) - (first.daysIdle ?? -1) ||
      first.applicationId.localeCompare(second.applicationId),
  );
  const applicationRowById = new Map(
    applicationRows.map((row) => [row.applicationId, row]),
  );

  const waitingRows = applicationRows.filter((row) => {
    const latestInterview = latestByDate(
      interviewsByApplication.get(row.applicationId) ?? [],
    );
    return (
      Boolean(latestInterview) &&
      text(latestInterview.resultado) === "aprovado" &&
      !proposalsByApplication.has(row.applicationId) &&
      !hiresByApplication.has(row.applicationId)
    );
  });
  waitingRows.sort(
    (first, second) =>
      (second.daysIdle ?? -1) - (first.daysIdle ?? -1) ||
      first.applicationId.localeCompare(second.applicationId),
  );

  const proposalRows = proposals.map((proposal) => {
    const applicationId = text(proposal.id_candidatura);
    const row = applicationRowById.get(applicationId);
    if (!row) {
      return {
        ...emptyWorklistRow(applicationId),
        id: text(proposal.id),
        proposalId: text(proposal.id),
        offerDate: isoDate(proposal.data_proposta),
        responseDate: isoDate(proposal.data_resposta),
        offer: number(proposal.salario_oferecido),
        proposalStatus: text(proposal.estado_proposta),
      };
    }

    const salary = number(proposal.salario_oferecido);
    const position: SalaryPosition =
      row.salaryMin === null || row.salaryMax === null || salary === null
        ? "unknown"
        : salary < row.salaryMin
          ? "below"
          : salary > row.salaryMax
            ? "above"
            : "within";
    return {
      ...row,
      id: text(proposal.id),
      proposalId: text(proposal.id),
      offerDate: isoDate(proposal.data_proposta),
      responseDate: isoDate(proposal.data_resposta),
      offer: salary,
      salaryPosition: position,
      proposalStatus: text(proposal.estado_proposta),
    };
  });
  proposalRows.sort(
    (first, second) =>
      (parseDate(second.offerDate)?.getTime() ?? 0) -
        (parseDate(first.offerDate)?.getTime() ?? 0) ||
      first.id.localeCompare(second.id),
  );

  const reached = new Map<string, Set<string>>();
  for (const [applicationId, appInterviews] of interviewsByApplication) {
    reached.set(
      applicationId,
      new Set(appInterviews.map((interview) => text(interview.fase))),
    );
  }
  const proposalsIds = new Set(
    proposals.map((proposal) => text(proposal.id_candidatura)),
  );
  const hireIds = new Set(hires.map((hire) => text(hire.id_candidatura)));
  const phaseCounts = interviewPhases.map(
    (phase) =>
      applications.filter((application) =>
        reached.get(text(application.id))?.has(phase),
      ).length,
  );
  const funnelCounts = [
    applications.length,
    ...phaseCounts,
    proposalsIds.size,
    hireIds.size,
  ];
  const funnelKeys = [
    "candidaturas",
    ...interviewPhases,
    "proposta",
    "contratado",
  ];
  const funnelLabels = [
    "Candidaturas",
    "Triagem",
    "Entrevista técnica",
    "Entrevista de cliente",
    "Entrevista final",
    "Propostas",
    "Contratações",
  ];
  const funnel = funnelCounts.map((count, index) => ({
    key: funnelKeys[index],
    label: funnelLabels[index],
    count,
    conversion:
      index === 0 || !funnelCounts[index - 1]
        ? null
        : count / funnelCounts[index - 1],
  }));

  const asOfValue = asOf?.toISOString().slice(0, 10) ?? null;
  const recentApplicationRows = applicationRows.filter((row) =>
    isRecentApplication(row.applicationDate, asOfValue),
  );
  const recentPhaseCounts = interviewPhases.map(
    (phase) =>
      recentApplicationRows.filter((row) =>
        reached.get(row.applicationId)?.has(phase),
      ).length,
  );
  const recentFunnelCounts = [
    recentApplicationRows.length,
    ...recentPhaseCounts,
    recentApplicationRows.filter((row) => proposalsIds.has(row.applicationId))
      .length,
    recentApplicationRows.filter((row) => hireIds.has(row.applicationId))
      .length,
  ];
  const recentFunnel = recentFunnelCounts.map((count, index) => ({
    key: funnelKeys[index],
    label: funnelLabels[index],
    count,
    conversion:
      index === 0 || !recentFunnelCounts[index - 1]
        ? null
        : count / recentFunnelCounts[index - 1],
  }));
  const stageMixRecent = (
    [
      "sem_entrevista",
      ...interviewPhases,
      "proposta",
      "contratado",
    ] as OperationalStage[]
  ).map((stage) => ({
    key: stage,
    label: phaseLabels[stage],
    count: recentApplicationRows.filter((row) => row.stage === stage).length,
  }));
  const queueAges: QueueAges = {
    recent: 0,
    attention: 0,
    critical: 0,
    unknown: 0,
  };
  for (const row of waitingRows) queueAges[row.signal] += 1;

  const uniqueHires = new Map<string, DatasetRow>();
  for (const hire of hires) {
    const applicationId = text(hire.id_candidatura);
    if (!uniqueHires.has(applicationId)) uniqueHires.set(applicationId, hire);
  }
  const finalStageHires = [...uniqueHires.keys()].filter(
    (applicationId) =>
      text(
        latestByDate(interviewsByApplication.get(applicationId) ?? [])?.fase,
      ) === "entrevista_final",
  ).length;
  const cycleMetrics: Record<string, number[]> = {
    firstInterview: [],
    interviewCycle: [],
    waitingForOffer: [],
    proposalToHire: [],
    total: [],
  };
  for (const [applicationId, hire] of uniqueHires) {
    const application = applicationById.get(applicationId);
    const appInterviews = interviewsByApplication.get(applicationId) ?? [];
    const proposal = (proposalsByApplication.get(applicationId) ?? [])[0];
    const applicationDate = parseDate(application?.data_candidatura);
    const interviewDates = appInterviews
      .map((interview) => parseDate(interview.data))
      .filter((date): date is Date => date !== null)
      .sort((first, second) => first.getTime() - second.getTime());
    const proposalDate = parseDate(proposal?.data_proposta);
    const hireDate = parseDate(hire.data_contratacao);
    if (
      !applicationDate ||
      !interviewDates.length ||
      !proposalDate ||
      !hireDate
    ) {
      continue;
    }
    cycleMetrics.firstInterview.push(
      dayDifference(interviewDates[0], applicationDate),
    );
    cycleMetrics.interviewCycle.push(
      dayDifference(
        interviewDates[interviewDates.length - 1],
        interviewDates[0],
      ),
    );
    cycleMetrics.waitingForOffer.push(
      dayDifference(proposalDate, interviewDates[interviewDates.length - 1]),
    );
    cycleMetrics.proposalToHire.push(dayDifference(hireDate, proposalDate));
    cycleMetrics.total.push(dayDifference(hireDate, applicationDate));
  }

  const hiredCandidateIds = new Set(
    [...uniqueHires.values()]
      .map((hire) =>
        text(applicationById.get(text(hire.id_candidatura))?.id_candidato),
      )
      .filter(Boolean),
  );
  const feedbackByHire = new Map<string, DatasetRow[]>();
  for (const record of feedback) {
    const id = text(record.id_contratacao);
    const current = feedbackByHire.get(id) ?? [];
    current.push(record);
    feedbackByHire.set(id, current);
  }
  const clientsSummary: ClientSummary[] = clients.map((client) => {
    const clientHires = [...uniqueHires.values()].filter(
      (hire) => text(hire.id_cliente) === text(client.id),
    );
    const clientFeedback = clientHires.flatMap(
      (hire) => feedbackByHire.get(text(hire.id)) ?? [],
    );
    const knownRetention = clientHires.filter(
      (hire) => hire.retencao_90_dias !== null && hire.retencao_90_dias !== "",
    );
    return {
      id: text(client.id),
      name: text(client.nome),
      sector: text(client.setor),
      contractStatus: text(client.estado),
      hires: clientHires.length,
      retention90: knownRetention.length
        ? knownRetention.filter((hire) => hire.retencao_90_dias === true)
            .length / knownRetention.length
        : null,
      retentionKnown: knownRetention.length,
      performance: average(
        clientHires
          .map((hire) => number(hire.desempenho_90_dias))
          .filter((value): value is number => value !== null),
      ),
      replacements: clientFeedback.filter(
        (record) => record.necessita_substituicao === true,
      ).length,
      feedbackCount: clientFeedback.length,
      satisfaction: average(
        clientFeedback
          .map((record) => number(record.satisfacao))
          .filter((value): value is number => value !== null),
      ),
    };
  });
  const knownRetention = [...uniqueHires.values()].filter(
    (hire) => hire.retencao_90_dias !== null && hire.retencao_90_dias !== "",
  );
  const allFeedback = [...uniqueHires.values()].flatMap(
    (hire) => feedbackByHire.get(text(hire.id)) ?? [],
  );
  const clientTotals = {
    retention90: knownRetention.length
      ? knownRetention.filter((hire) => hire.retencao_90_dias === true).length /
        knownRetention.length
      : null,
    retentionKnown: knownRetention.length,
    performance: average(
      [...uniqueHires.values()]
        .map((hire) => number(hire.desempenho_90_dias))
        .filter((value): value is number => value !== null),
    ),
    replacements: allFeedback.filter(
      (record) => record.necessita_substituicao === true,
    ).length,
    feedbackCount: allFeedback.length,
    satisfaction: average(
      allFeedback
        .map((record) => number(record.satisfacao))
        .filter((value): value is number => value !== null),
    ),
    hires: uniqueHires.size,
  };

  const qualityCounts = {
    invalidVacancyApplications: applications.filter(
      (application) => !vacancyById.has(text(application.id_vaga)),
    ).length,
    candidatesMarkedHired: candidates.filter(
      (candidate) => text(candidate.estado) === "contratado",
    ).length,
    distinctHiredCandidates: hiredCandidateIds.size,
    interviewScoresOver100: interviews.filter(
      (interview) => (number(interview.score_tecnico) ?? 0) > 100,
    ).length,
    mixedInterviewDates: interviews.filter(
      (interview) =>
        typeof interview.data === "string" &&
        /^\d{2}\/\d{2}\/\d{4}$/.test(interview.data),
    ).length,
    responsesAfterHire: proposals.filter((proposal) => {
      const responseDate = parseDate(proposal.data_resposta);
      if (!responseDate) return false;
      const appHires =
        hiresByApplication.get(text(proposal.id_candidatura)) ?? [];
      return appHires.some((hire) => {
        const hireDate = parseDate(hire.data_contratacao);
        return hireDate !== null && responseDate > hireDate;
      });
    }).length,
    feedbackBeforeHire: feedback.filter((record) => {
      const feedbackDate = parseDate(record.data_feedback);
      if (!feedbackDate) return false;
      const hire = hires.find(
        (candidate) => text(candidate.id) === text(record.id_contratacao),
      );
      const hireDate = parseDate(hire?.data_contratacao);
      return hireDate !== null && feedbackDate < hireDate;
    }).length,
  };

  const salaryPositionLabels: Record<SalaryPosition, string> = {
    below: "Abaixo da banda",
    within: "Dentro da banda",
    above: "Acima da banda",
    unknown: "Banda indisponível",
  };
  const salaryPositions: SalaryPositionStat[] = (
    ["below", "within", "above", "unknown"] as SalaryPosition[]
  ).map((position) => {
    const rowsForPosition = proposalRows.filter(
      (proposal) => proposal.salaryPosition === position,
    );
    const accepted = rowsForPosition.filter(
      (proposal) => proposal.proposalStatus === "aceite",
    ).length;
    return {
      position,
      label: salaryPositionLabels[position],
      total: rowsForPosition.length,
      accepted,
      rejected: rowsForPosition.filter(
        (proposal) => proposal.proposalStatus === "recusada",
      ).length,
      noResponse: rowsForPosition.filter(
        (proposal) => proposal.proposalStatus === "sem_resposta",
      ).length,
      acceptance: rowsForPosition.length
        ? accepted / rowsForPosition.length
        : null,
    };
  });

  const proposalStatusCounts = proposals.reduce<Record<string, number>>(
    (counts, proposal) => {
      const status = text(proposal.estado_proposta);
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    },
    {},
  );

  return {
    asOf: asOfValue,
    candidatesCount: candidates.length,
    applicationRows,
    waitingRows,
    proposalRows,
    activityMonths: monthlyActivity(asOfValue, applications, proposals),
    recentFunnel,
    stageMixRecent,
    queueAges,
    salaryPositions,
    funnel,
    cycle: {
      firstInterview: quantile(cycleMetrics.firstInterview, 0.5),
      interviewCycle: quantile(cycleMetrics.interviewCycle, 0.5),
      waitingForOffer: quantile(cycleMetrics.waitingForOffer, 0.5),
      proposalToHire: quantile(cycleMetrics.proposalToHire, 0.5),
      total: quantile(cycleMetrics.total, 0.5),
      sampleSize: cycleMetrics.total.length,
    },
    finalStageHires,
    qualityCounts,
    clients: clientsSummary,
    clientTotals,
    counts: {
      applications: applications.length,
      candidates: candidates.length,
      proposals: proposals.length,
      proposalsNoResponse: proposalStatusCounts.sem_resposta ?? 0,
      hires: hireIds.size,
      waiting: waitingRows.length,
      waitingRecent: waitingRows.filter((row) =>
        isRecentApplication(row.applicationDate, asOfValue),
      ).length,
      applicationsRecent: applications.filter((application) =>
        isRecentApplication(isoDate(application.data_candidatura), asOfValue),
      ).length,
      proposalsRecent: proposals.filter((proposal) =>
        isRecentApplication(isoDate(proposal.data_proposta), asOfValue),
      ).length,
      hiresRecent: [...uniqueHires.values()].filter((hire) =>
        isRecentApplication(isoDate(hire.data_contratacao), asOfValue),
      ).length,
      applicationsPrevious: applications.filter((application) =>
        isWithinWindow(
          isoDate(application.data_candidatura),
          asOfValue,
          90,
          180,
        ),
      ).length,
      proposalsPrevious: proposals.filter((proposal) =>
        isWithinWindow(isoDate(proposal.data_proposta), asOfValue, 90, 180),
      ).length,
      hiresPrevious: [...uniqueHires.values()].filter((hire) =>
        isWithinWindow(isoDate(hire.data_contratacao), asOfValue, 90, 180),
      ).length,
      salaryBelow: proposalRows.filter(
        (proposal) => proposal.salaryPosition === "below",
      ).length,
      salaryWithin: proposalRows.filter(
        (proposal) => proposal.salaryPosition === "within",
      ).length,
      salaryAbove: proposalRows.filter(
        (proposal) => proposal.salaryPosition === "above",
      ).length,
      salaryUnknown: proposalRows.filter(
        (proposal) => proposal.salaryPosition === "unknown",
      ).length,
    },
  };
}

function emptyWorklistRow(id: string): WorklistRow {
  return {
    id,
    applicationId: id,
    candidateId: "",
    candidateName: "Candidato não associado",
    vacancyId: "",
    vacancyTitle: "Vaga não associada",
    clientId: "",
    clientName: "Sem cliente",
    recruiterId: "",
    recruiterName: "Sem recrutador",
    stage: "sem_entrevista",
    reachedStages: [],
    stageSinceDate: null,
    latestInterviewDate: null,
    latestInterviewPhase: "",
    latestInterviewResult: "",
    lastActivityDate: null,
    daysIdle: null,
    signal: "unknown",
    applicationDate: null,
    expectedSalary: null,
    proposalId: null,
    offerDate: null,
    responseDate: null,
    offer: null,
    salaryMin: null,
    salaryMax: null,
    salaryPosition: "unknown",
    proposalStatus: null,
  };
}

function getSnapshot() {
  if (!snapshot) snapshot = computeSnapshot();
  return snapshot;
}

export function getOverviewData() {
  return getSnapshot();
}

export function getRecentCandidateBoardRows() {
  const data = getSnapshot();
  return data.applicationRows
    .filter((row) => isRecentApplication(row.applicationDate, data.asOf))
    .sort((first, second) => {
      const idleDifference = (second.daysIdle ?? -1) - (first.daysIdle ?? -1);
      return (
        idleDifference ||
        first.candidateName.localeCompare(second.candidateName, "pt-PT")
      );
    });
}

export function getPipelineData() {
  return getSnapshot();
}

export function getQualityData() {
  return getSnapshot();
}

export function getQualityIssues(): QualityIssue[] {
  const { qualityCounts } = getSnapshot();
  return [
    {
      id: "V999",
      priority: "P0",
      count: qualityCounts.invalidVacancyApplications,
      title: `${qualityCounts.invalidVacancyApplications.toLocaleString("pt-PT")} candidaturas ligadas a vagas inexistentes`,
      area: "Integridade referencial",
      action: "Corrigir a vaga de origem e validar as contratações associadas.",
    },
    {
      id: "estado-candidato",
      priority: "P0",
      count: qualityCounts.candidatesMarkedHired,
      title: `${qualityCounts.candidatesMarkedHired.toLocaleString("pt-PT")} candidatos marcados como contratados; ${qualityCounts.distinctHiredCandidates.toLocaleString("pt-PT")} com contratação`,
      area: "Estados divergentes",
      action: "Recalcular o estado a partir das contratações deduplicadas.",
    },
    {
      id: "score-125",
      priority: "P1",
      count: qualityCounts.interviewScoresOver100,
      title: `${qualityCounts.interviewScoresOver100.toLocaleString("pt-PT")} scores técnicos acima do limite de 100`,
      area: "Domínio inválido",
      action:
        "Confirmar escala e normalizar scores antes de comparar candidatos.",
    },
    {
      id: "datas",
      priority: "P1",
      count: qualityCounts.mixedInterviewDates,
      title: `${qualityCounts.mixedInterviewDates.toLocaleString("pt-PT")} datas de entrevista em formato dia/mês/ano`,
      area: "Normalização",
      action: "Normalizar datas antes de ordenar ou calcular durações.",
    },
    {
      id: "resposta-pos-contrato",
      priority: "P1",
      count: qualityCounts.responsesAfterHire,
      title: `${qualityCounts.responsesAfterHire.toLocaleString("pt-PT")} respostas a propostas posteriores à contratação`,
      area: "Coerência temporal",
      action: "Verificar a sequência proposta → resposta → contratação.",
    },
    {
      id: "feedback-antes",
      priority: "P2",
      count: qualityCounts.feedbackBeforeHire,
      title: `${qualityCounts.feedbackBeforeHire.toLocaleString("pt-PT")} feedbacks anteriores à contratação`,
      area: "Coerência temporal",
      action: "Confirmar datas de evento na origem.",
    },
  ];
}

export function getClientData() {
  return getSnapshot();
}

export function queryWorklist(options: WorklistOptions) {
  const data = getSnapshot();
  let matches =
    options.kind === "waiting"
      ? data.waitingRows
      : options.kind === "proposals"
        ? data.proposalRows
        : data.applicationRows;
  if (options.period === "recent" && options.kind !== "proposals") {
    matches = matches.filter((row) =>
      isRecentApplication(row.applicationDate, data.asOf),
    );
  } else if (options.period === "old" && options.kind !== "proposals") {
    matches = matches.filter((row) => {
      if (!row.applicationDate) return true;
      const applicationDate = parseDate(row.applicationDate);
      const referenceDate = parseDate(data.asOf);
      if (!applicationDate || !referenceDate) return true;
      const daysSinceApplication = Math.floor(
        (referenceDate.getTime() - applicationDate.getTime()) / 86_400_000,
      );
      return daysSinceApplication > 90;
    });
  }
  const search = options.search?.trim().toLocaleLowerCase("pt-PT");
  if (search) {
    matches = matches.filter((row) =>
      [
        row.id,
        row.candidateName,
        row.candidateId,
        row.vacancyTitle,
        row.vacancyId,
        row.clientName,
        row.recruiterName,
        row.recruiterId,
        row.proposalId,
      ]
        .join(" ")
        .toLocaleLowerCase("pt-PT")
        .includes(search),
    );
  }
  if (
    options.stage &&
    options.stage !== "all" &&
    options.kind !== "proposals"
  ) {
    matches = matches.filter((row) =>
      options.stage === "sem_entrevista"
        ? row.stage === "sem_entrevista"
        : row.reachedStages.some((stage) => stage === options.stage),
    );
  }
  if (options.recruiter) {
    matches = matches.filter((row) => row.recruiterId === options.recruiter);
  }
  if (options.client) {
    matches = matches.filter((row) => row.clientId === options.client);
  }
  if (options.signal && options.signal !== "all") {
    matches = matches.filter((row) => row.signal === options.signal);
  }
  if (options.position) {
    matches = matches.filter((row) => row.salaryPosition === options.position);
  }
  if (options.status) {
    matches = matches.filter((row) => row.proposalStatus === options.status);
  }

  const total = matches.length;
  const requestedPageSize = options.pageSize ?? 20;
  const pageSize = Math.min(
    100,
    Math.max(
      1,
      Number.isFinite(requestedPageSize) ? Math.trunc(requestedPageSize) : 20,
    ),
  );
  const totalPages = Math.ceil(total / pageSize);
  const requestedPage = options.page ?? 1;
  const page = Math.min(
    Math.max(1, Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1),
    Math.max(1, totalPages),
  );

  return {
    kind: options.kind,
    rows: matches.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    totalPages,
    asOf: data.asOf,
    filters: {
      stages: [
        { value: "all", label: "Todas", count: data.counts.applications },
        {
          value: "sem_entrevista",
          label: phaseLabels.sem_entrevista,
          count: data.applicationRows.filter(
            (row) => row.stage === "sem_entrevista",
          ).length,
        },
        ...data.funnel.slice(1, 5).map((stage) => ({
          value: stage.key,
          label: stage.label,
          count: stage.count,
        })),
        {
          value: "proposta",
          label: phaseLabels.proposta,
          count: data.counts.proposals,
        },
        {
          value: "contratado",
          label: phaseLabels.contratado,
          count: data.counts.hires,
        },
      ],
      recruiters: [
        ...new Map(
          data.applicationRows
            .filter((row) => row.recruiterId)
            .map((row) => [row.recruiterId, row.recruiterName]),
        ).entries(),
      ]
        .map(([value, label]) => ({ value, label }))
        .sort((first, second) =>
          first.label.localeCompare(second.label, "pt-PT"),
        ),
      clients: [
        ...new Map(
          data.applicationRows
            .filter((row) => row.clientId)
            .map((row) => [row.clientId, row.clientName]),
        ).entries(),
      ]
        .map(([value, label]) => ({ value, label }))
        .sort((first, second) =>
          first.label.localeCompare(second.label, "pt-PT"),
        ),
      signals: [
        { value: "critical", label: "30+ dias" },
        { value: "attention", label: "14–29 dias" },
        { value: "recent", label: "0–13 dias" },
        { value: "unknown", label: "Sem data" },
      ],
      positions: [
        {
          value: "below",
          label: "Abaixo da banda",
          count: data.counts.salaryBelow,
        },
        {
          value: "within",
          label: "Dentro da banda",
          count: data.counts.salaryWithin,
        },
        {
          value: "above",
          label: "Acima da banda",
          count: data.counts.salaryAbove,
        },
        {
          value: "unknown",
          label: "Banda indisponível",
          count: data.counts.salaryUnknown,
        },
      ],
      statuses: [
        ...new Set(
          data.proposalRows
            .map((row) => row.proposalStatus)
            .filter((value): value is string => Boolean(value)),
        ),
      ]
        .sort((first, second) => first.localeCompare(second, "pt-PT"))
        .map((value) => ({
          value,
          label: humanizeValue("estado_proposta", value),
        })),
    },
  };
}
