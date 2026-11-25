import Link from "next/link";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getPipelineData } from "@/lib/operational-data";

function percentage(value: number | null) {
  return value === null
    ? "—"
    : new Intl.NumberFormat("pt-PT", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value);
}

function stageHref(key: string) {
  return key === "candidaturas"
    ? "/candidaturas"
    : `/candidaturas?stage=${encodeURIComponent(key)}`;
}

export default function PipelinePage() {
  const data = getPipelineData();
  const stages = data.funnel;
  const maxCount = Math.max(...stages.map((stage) => stage.count), 1);
  const timeSegments = [
    {
      label: "Candidatura → 1.ª entrevista",
      value: data.cycle.firstInterview,
      critical: false,
    },
    {
      label: "Ciclo de entrevistas",
      value: data.cycle.interviewCycle,
      critical: false,
    },
    {
      label: "Última entrevista → proposta",
      value: data.cycle.waitingForOffer,
      critical: true,
    },
    {
      label: "Proposta → contratação",
      value: data.cycle.proposalToHire,
      critical: false,
    },
  ];
  const maxDuration = Math.max(
    ...timeSegments.map((segment) => segment.value ?? 0),
    1,
  );
  const finalStage = stages.find((stage) => stage.key === "entrevista_final");

  return (
    <div className="page-content">
      <PageHeader
        title="Percurso das candidaturas"
        subtitle="Etapas e conversões reconstruídas a partir dos eventos completos."
        action={
          <Badge tone="info">
            Dados até {data.asOf ?? "sem data"}
          </Badge>
        }
      />
      <section className="panel journey-panel">
        <div className="panel-heading">
          <h2>O caminho até à contratação</h2>
          <span className="muted">
            Registos únicos por candidatura · selecionar uma etapa filtra a lista
          </span>
        </div>
        <div className="journey-stages">
          {stages.map((stage, index) => {
            const cumulative =
              data.counts.applications > 0
                ? stage.count / data.counts.applications
                : 0;
            return (
              <Link
                className={`journey-stage${index === stages.length - 1 ? " final" : ""}${stage.key === "entrevista_final" ? " bottleneck" : ""}`}
                href={stageHref(stage.key)}
                key={stage.key}
              >
                <span className="stage-node">
                  {index === 0 ? (
                    <span className="node-start" />
                  ) : index === stages.length - 1 ? (
                    "✓"
                  ) : (
                    index + 1
                  )}
                </span>
                <h3>{stage.label}</h3>
                <strong>{stage.count.toLocaleString("pt-PT")}</strong>
                <span className="stage-rate">
                  {percentage(cumulative)} <small>do total</small>
                </span>
                {index > 0 ? (
                  <span className="stage-conversion">
                    {percentage(stage.conversion)} da etapa anterior
                  </span>
                ) : (
                  <span className="stage-conversion">entrada</span>
                )}
                <span
                  className="stage-bar-track"
                  aria-hidden="true"
                >
                  <span
                    style={{
                      width: `${(stage.count / maxCount) * 100}%`,
                    }}
                  />
                </span>
              </Link>
            );
          })}
        </div>
        <div className="journey-foot">
          <span>
            <i className="legend-dot lime" /> O volume usa candidaturas únicas
            com pelo menos um evento da etapa.
          </span>
          <span>As etapas não dependem de etapa_atual nem de estado de origem.</span>
        </div>
      </section>

      <div className="pipeline-lower">
        <Panel
          title="Onde se acumula o tempo"
          meta={
            <Badge tone="danger">
              {data.cycle.waitingForOffer ?? "—"} dias até à proposta
            </Badge>
          }
        >
          <div className="time-breakdown">
            {timeSegments.map((segment) => (
              <div
                className={segment.critical ? "time-critical" : ""}
                key={segment.label}
              >
                <span>{segment.label}</span>
                <b>
                  {segment.value ?? "—"} <small>dias</small>
                </b>
                <div className="time-bar">
                  <span
                    style={{
                      width: `${((segment.value ?? 0) / maxDuration) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="source-note">
            Medianas calculadas sobre {data.cycle.sampleSize.toLocaleString("pt-PT")}{" "}
            candidaturas contratadas. Os segmentos não somam necessariamente à
            mediana global.
          </p>
        </Panel>

        <Panel
          title="Bloqueio na entrevista final"
          meta={<Badge tone="danger">Conversão a validar</Badge>}
        >
          <div className="pipeline-blockage">
            <div>
              <strong>{(finalStage?.count ?? 0).toLocaleString("pt-PT")}</strong>
              <span>candidaturas chegaram à entrevista final</span>
            </div>
            <div>
              <strong>{data.finalStageHires.toLocaleString("pt-PT")}</strong>
              <span>
                contratações com entrevista final como último evento registado
              </span>
            </div>
          </div>
          <p className="panel-copy">
            A conversão para proposta nesta coorte é de{" "}
            {percentage(stages[5]?.conversion ?? null)}. A contagem deriva de
            candidaturas distintas com eventos em cada etapa.
          </p>
          <Link
            href="/candidaturas?stage=entrevista_final"
            className="inline-action"
          >
            Abrir candidaturas que chegaram à fase final <span>↗</span>
          </Link>
        </Panel>
      </div>
    </div>
  );
}
