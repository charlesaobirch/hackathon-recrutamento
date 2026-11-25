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
        subtitle="Anomalias calculadas sobre os ficheiros completos e ordenadas por severidade."
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
          label="Scores técnicos fora de escala"
          value={qualityCounts.interviewScoresOver100.toLocaleString("pt-PT")}
          note="Scores superiores ao limite de 100"
          tone="warning"
        />
        <Metric
          label="Datas de entrevista em formato D/M/A"
          value={qualityCounts.mixedInterviewDates.toLocaleString("pt-PT")}
          note="Datas normalizadas para cálculo na interface"
          tone="warning"
        />
      </div>
      <QualityQueue issues={issues} />
    </div>
  );
}
