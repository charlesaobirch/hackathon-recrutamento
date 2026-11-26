import Link from "next/link";
import { DatasetExplorer } from "@/components/dataset-explorer";
import { TimeBreakdownChart } from "@/components/time-breakdown-chart";
import { Badge, Notice, PageHeader, Panel } from "@/components/ui";
import { funnel } from "@/lib/recruitment";

export default function PipelinePage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Percurso das candidaturas"
        subtitle="Volumes e perdas entre etapas, reconstruídos a partir dos eventos disponíveis."
        action={<Badge tone="warning">Fotografia exploratória</Badge>}
      />
      <Notice title="A etapa guardada não é fiável" tone="warning">
        O funil agregado abaixo é o apresentado no relatório. Na lista de
        registos, a etapa é derivada da entrevista mais recente; 25% das
        entrevistas estão pendentes.
      </Notice>
      <section className="panel journey-panel">
        <div className="panel-heading">
          <h2>O caminho até à contratação</h2>
          <span className="muted">
            Volume em cada etapa · conversão face à etapa anterior
          </span>
        </div>
        <div className="journey-stages">
          {funnel.map((stage, index) => (
            <article
              className={`journey-stage${index === funnel.length - 1 ? " final" : ""}`}
              key={stage.label}
            >
              <div className="stage-node">
                {index === 0 ? (
                  <span className="node-start" />
                ) : index === funnel.length - 1 ? (
                  <span className="node-end">✓</span>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <h3>{stage.label}</h3>
              <strong>{stage.count.toLocaleString("pt-PT")}</strong>
              <span className="stage-rate">
                {stage.rate}{" "}
                <small>
                  {index === 0 ? "da entrada" : "da etapa anterior"}
                </small>
              </span>
            </article>
          ))}
        </div>
        <div className="journey-foot">
          <span>
            <i className="legend-dot lime" /> Etapas observadas
          </span>
          <span>
            0 contratações após as 2 782 entrevistas finais — validar o desenho
            da última etapa.
          </span>
        </div>
      </section>
      <div className="pipeline-lower">
        <Panel title="Onde se acumula o tempo" className="time-panel">
          <TimeBreakdownChart />
          <p className="source-note">
            As medianas por segmento são calculadas separadamente; não somam
            necessariamente a mediana global de 40 dias.
          </p>
        </Panel>
        <Panel
          title="Entrevistas registadas"
          meta={
            <Link className="text-link" href="/dados">
              Abrir as 11 tabelas ↗
            </Link>
          }
        >
          <DatasetExplorer initialTable="entrevistas" initialPageSize={10} />
        </Panel>
      </div>
    </div>
  );
}
