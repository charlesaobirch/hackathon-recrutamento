import Link from "next/link";
import { Badge } from "@/components/ui";
import { stageLabel } from "@/lib/format";
import type { OperationalStage, WorklistRow } from "@/lib/operational-data";

const stages: OperationalStage[] = [
  "sem_entrevista",
  "triagem",
  "entrevista_tecnica",
  "entrevista_cliente",
  "entrevista_final",
  "proposta",
  "contratado",
];

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pt-PT") ?? "")
    .join("");
}

function signal(row: WorklistRow) {
  if (row.daysIdle === null)
    return { label: "Sem data de atividade", tone: "neutral" as const };
  if (row.daysIdle >= 30)
    return {
      label: `${row.daysIdle} dias sem atividade`,
      tone: "danger" as const,
    };
  if (row.daysIdle >= 14)
    return {
      label: `${row.daysIdle} dias sem atividade`,
      tone: "warning" as const,
    };
  return {
    label: `${row.daysIdle} dias sem atividade`,
    tone: "positive" as const,
  };
}

export function CandidateBoard({ rows }: { rows: WorklistRow[] }) {
  return (
    <section
      className="candidate-board"
      aria-label="Candidaturas por etapa atual"
    >
      {stages.map((stage) => {
        const stageRows = rows.filter((row) => row.stage === stage);
        return (
          <section
            className="candidate-lane"
            key={stage}
            aria-labelledby={`lane-${stage}`}
          >
            <header className="candidate-lane-heading">
              <h2 id={`lane-${stage}`}>{stageLabel(stage)}</h2>
              <span>{stageRows.length.toLocaleString("pt-PT")}</span>
            </header>
            <div className="candidate-lane-cards">
              {stageRows.length ? (
                stageRows.map((row) => {
                  const activity = signal(row);
                  return (
                    <Link
                      className="candidate-card"
                      href={`/candidaturas/${encodeURIComponent(row.applicationId)}`}
                      key={row.applicationId}
                    >
                      <span className="candidate-card-person">
                        <span
                          className="candidate-card-avatar"
                          aria-hidden="true"
                        >
                          {initials(row.candidateName)}
                        </span>
                        <span className="candidate-card-name">
                          <b>{row.candidateName}</b>
                          <small>{row.applicationId}</small>
                        </span>
                      </span>
                      <span className="candidate-card-role">
                        {row.vacancyTitle}
                      </span>
                      <span className="candidate-card-client">
                        {row.clientName}
                      </span>
                      <span className="candidate-card-foot">
                        <Badge tone={activity.tone}>{activity.label}</Badge>
                        <small>{row.recruiterName}</small>
                      </span>
                    </Link>
                  );
                })
              ) : (
                <p className="candidate-lane-empty">
                  Sem candidaturas nesta etapa.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </section>
  );
}
