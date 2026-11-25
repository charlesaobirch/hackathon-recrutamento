import { QualityQueue } from "@/components/quality-queue";
import { Metric, Notice, PageHeader } from "@/components/ui";

export default function QualityPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Qualidade dos dados"
        subtitle="Anomalias que distorcem o funil, o estado das candidaturas e a leitura salarial."
      />
      <Notice title="Os estados são locais a esta demonstração" tone="warning">
        A fila não modifica os ficheiros JSON. Resolver P0 na interface não
        desbloqueia reporting; a correção tem de acontecer na origem e ser
        validada.
      </Notice>
      <div className="metric-grid three-metrics">
        <Metric
          label="Candidaturas sem vaga válida"
          value="330"
          note="Todas ligadas ao identificador V999"
          tone="danger"
        />
        <Metric
          label="Scores técnicos fora de escala"
          value="533"
          note="Valores superiores ao limite de 100"
          tone="warning"
        />
        <Metric
          label="Datas mistas"
          value="3 831"
          note="Entrevistas em formato dd/mm/aaaa"
          tone="warning"
        />
      </div>
      <QualityQueue />
    </div>
  );
}
