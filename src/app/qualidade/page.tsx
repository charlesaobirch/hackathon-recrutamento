import { QualityQueue } from "@/components/quality-queue";
import { Metric, PageHeader } from "@/components/ui";
import { getQualityData, getQualityIssues } from "@/lib/operational-data";

export default function QualityPage() {
  const { qualityCounts } = getQualityData();
  const issues = getQualityIssues();

  return (
    <div className="page-content">
      <PageHeader
        title="Qualidade dos dados"
        subtitle="Anomalias nos ficheiros completos, por severidade, com a próxima ação para desbloquear o reporting."
      />
      <div className="metric-grid three-metrics">
        <Metric
          label="Candidaturas sem vaga válida"
          value={qualityCounts.invalidVacancyApplications.toLocaleString(
            "pt-PT",
          )}
          note="Ligações a identificadores de vaga inexistentes"
          tone="danger"
        />
        <Metric
          label="Scores fora da escala"
          value={qualityCounts.interviewScoresOver100.toLocaleString("pt-PT")}
          note="Entrevistas com score acima de 100"
          tone="warning"
        />
        <Metric
          label="Datas de entrevista mistas"
          value={qualityCounts.mixedInterviewDates.toLocaleString("pt-PT")}
          note="Formato D/M/A convertido no cálculo"
          tone="warning"
        />
      </div>
      <QualityQueue issues={issues} />
    </div>
  );
}
