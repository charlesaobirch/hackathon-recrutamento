export const funnel = [
  { label: "Candidaturas", count: 5962, rate: "100%" },
  { label: "Triagem", count: 5938, rate: "99,6%" },
  { label: "Entrevista técnica", count: 5913, rate: "99,6%" },
  { label: "Entrevista cliente", count: 4484, rate: "75,8%" },
  { label: "Entrevista final", count: 2782, rate: "62,1%" },
  { label: "Propostas", count: 1065, rate: "38,3%" },
  { label: "Contratações", count: 262, rate: "24,6%" },
];

export const qualityIssues = [
  {
    id: "V999",
    priority: "P0",
    title: "330 candidaturas ligadas à vaga inexistente V999",
    area: "Integridade referencial",
    action:
      "Corrigir a vaga de origem e validar as 13 contratações associadas.",
  },
  {
    id: "estado-candidato",
    priority: "P0",
    title: "864 candidatos marcados como contratados; 254 foram contratados",
    area: "Estados divergentes",
    action: "Recalcular o estado a partir das contratações deduplicadas.",
  },
  {
    id: "score-125",
    priority: "P1",
    title: "533 scores técnicos acima do limite de 100",
    area: "Domínio inválido",
    action:
      "Confirmar escala e normalizar scores antes de comparar candidatos.",
  },
  {
    id: "datas",
    priority: "P1",
    title: "3 831 datas de entrevista em formato dd/mm/aaaa",
    area: "Normalização",
    action: "Normalizar datas antes de ordenar ou calcular durações.",
  },
  {
    id: "resposta-pos-contrato",
    priority: "P1",
    title: "191 respostas a propostas posteriores à contratação",
    area: "Coerência temporal",
    action: "Verificar a sequência proposta → resposta → contratação.",
  },
  {
    id: "feedback-antes",
    priority: "P2",
    title: "2 feedbacks anteriores à contratação",
    area: "Coerência temporal",
    action: "Confirmar datas de evento na origem.",
  },
];

export const clientSignals = [
  {
    id: "CL09",
    sector: "Saúde",
    ret90: "62,5%",
    performance: "3,38 / 5",
    replacements: "4 / 21",
    note: "Menor retenção e maior substituição relativa.",
  },
  {
    id: "CL06",
    sector: "Energia",
    ret90: "77,3%",
    performance: "3,60 / 5",
    replacements: "6 / 30",
    note: "Maior volume absoluto de substituições.",
  },
  {
    id: "CL05",
    sector: "Tecnologia",
    ret90: "75,0%",
    performance: "3,37 / 5",
    replacements: "4 / 27",
    note: "Retenção abaixo da média global.",
  },
  {
    id: "CL03",
    sector: "Retalho",
    ret90: "86,7%",
    performance: "3,88 / 5",
    replacements: "2 / 24",
    note: "Melhor satisfação média observada.",
  },
];

export function money(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}
