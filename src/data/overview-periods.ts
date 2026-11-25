// Agregados calculados a partir de analise/dados, com data de referência 03 jan. 2026.
// Contratações únicas = registos deduplicados por id_candidatura.

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
  "1m": { value: "227", note: "227 de 5 962 no total" },
  "3m": { value: "909", note: "909 de 5 962 no total" },
  "6m": { value: "1 807", note: "1 807 de 5 962 no total" },
};

export const propostasByPeriod: Record<PeriodKey, PeriodValue> = {
  "1m": { value: "43", note: "43 de 1 065 no total" },
  "3m": { value: "212", note: "212 de 1 065 no total" },
  "6m": { value: "349", note: "349 de 1 065 no total" },
};

export const contratacoesByPeriod = [
  { label: "1 mês", value: 14 },
  { label: "3 meses", value: 63 },
  { label: "6 meses", value: 94 },
] as const;
