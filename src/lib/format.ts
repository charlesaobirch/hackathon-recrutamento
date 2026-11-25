const enumLabels: Record<string, string> = {
  aprovado: "Aprovado",
  aceite: "Aceite",
  ativo: "Ativo",
  agendado: "Agendado",
  alta: "Alta",
  baixa: "Baixa",
  concluido: "Concluído",
  em_andamento: "Em andamento",
  em_correcao: "Em correção",
  em_licenca: "Em licença",
  em_processo: "Em processo",
  em_revisao: "Em revisão",
  encerrado: "Encerrado",
  feedback: "Feedback",
  junior: "Júnior",
  lead: "Lead",
  mid: "Mid",
  nao_alineado: "Não alinhado",
  nao: "Não",
  pendente: "Pendente",
  preenchida: "Preenchida",
  reaberta: "Reaberta",
  recusada: "Recusada",
  reprovado: "Reprovado",
  respondido: "Respondido",
  sem_resposta: "Sem resposta",
  senior: "Sénior",
  sim: "Sim",
  urgente: "Urgente",
};

export function parseDateValue(value: unknown): Date | null {
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

function numericValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

export function formatDate(value: unknown) {
  const date = parseDateValue(value);
  return date
    ? new Intl.DateTimeFormat("pt-PT", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date)
    : "—";
}

export function formatMoney(value: unknown) {
  const amount = numericValue(value);
  return amount === null
    ? "—"
    : new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(amount);
}

export function humanizeValue(field: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  const raw = String(value);
  if (/^data(_|$)/.test(field)) return formatDate(raw);
  if (/salario|expectativa_salarial|custo_estimado/i.test(field)) {
    return formatMoney(raw);
  }
  if (enumLabels[raw]) return enumLabels[raw];
  return raw
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toLocaleUpperCase("pt-PT"));
}

export function isNumericField(field: string, value: unknown) {
  return (
    typeof value === "number" ||
    (/salario|expectativa_salarial|custo_estimado|score|duracao|anos|dias/i.test(
      field,
    ) &&
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value)))
  );
}

const stageLabels: Record<string, string> = {
  sem_entrevista: "Sem entrevista",
  triagem: "Triagem",
  entrevista_tecnica: "Entrevista técnica",
  entrevista_cliente: "Entrevista de cliente",
  entrevista_final: "Entrevista final",
  proposta: "Proposta",
  contratado: "Contratado",
};

export function stageLabel(stage: string) {
  return stageLabels[stage] ?? humanizeValue("etapa", stage);
}
