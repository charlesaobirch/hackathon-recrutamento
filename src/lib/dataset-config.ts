export const DATASETS = [
  { id: "candidatos", label: "Candidatos" },
  { id: "candidaturas", label: "Candidaturas" },
  { id: "clientes", label: "Clientes" },
  { id: "contratacoes", label: "Contratações" },
  { id: "entrevistas", label: "Entrevistas" },
  { id: "feedback_clientes", label: "Feedback de clientes" },
  { id: "historico_vagas", label: "Histórico de vagas" },
  { id: "interacoes", label: "Interações" },
  { id: "propostas", label: "Propostas" },
  { id: "recrutadores", label: "Recrutadores" },
  { id: "vagas", label: "Vagas" },
] as const;

export type DatasetName = (typeof DATASETS)[number]["id"];
export type DatasetRow = Record<string, unknown>;

export function isDatasetName(value: string | null): value is DatasetName {
  return DATASETS.some((dataset) => dataset.id === value);
}
