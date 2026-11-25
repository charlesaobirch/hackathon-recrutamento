// Agregados calculados a partir de analise/dados, com data de referência 03 jan. 2026
// (data mais recente observada nos conjuntos usados, coerente com "jan. 2026" no cabeçalho).
// Janelas móveis: data >= referência menos N meses e data <= referência.
// Contratações únicas = registos deduplicados por id_candidatura (262 no total).

export const periodOptions = [
  { value: "1m", label: "Último mês", shortLabel: "1 mês" },
  { value: "3m", label: "Últimos 3 meses", shortLabel: "3 meses" },
  { value: "6m", label: "Últimos 6 meses", shortLabel: "6 meses" },
] as const;

export type PeriodKey = (typeof periodOptions)[number]["value"];

export type PeriodValue = {
  value: string;
  note: string;
};

export const candidaturasByPeriod: Record<PeriodKey, PeriodValue> = {
  "1m": { value: "235", note: "235 de 5 962 no total" },
  "3m": { value: "929", note: "929 de 5 962 no total" },
  "6m": { value: "1 816", note: "1 816 de 5 962 no total" },
};

export const propostasByPeriod: Record<PeriodKey, PeriodValue> = {
  "1m": { value: "44", note: "44 de 1 065 no total" },
  "3m": { value: "212", note: "212 de 1 065 no total" },
  "6m": { value: "349", note: "349 de 1 065 no total" },
};

export const contratacoesByPeriod = [
  { label: "1 mês", value: 14 },
  { label: "3 meses", value: 64 },
  { label: "6 meses", value: 94 },
] as const;

// Espera mediana entre a última entrevista e a proposta, nas propostas que
// levaram a uma contratação única. Janela ancorada na data da proposta.
// n = amostra de cada janela; mediana global = 27 dias (n = 262).
export const esperaByPeriod = [
  { label: "1 mês", value: 23, n: 14 },
  { label: "3 meses", value: 26, n: 61 },
  { label: "6 meses", value: 27, n: 93 },
] as const;
