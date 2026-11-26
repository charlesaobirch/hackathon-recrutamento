import { OperationalWorklist } from "@/components/operational-worklist";
import { Metric, PageHeader, Panel } from "@/components/ui";
import { getOverviewData } from "@/lib/operational-data";

type SearchParameters = Promise<{ q?: string | string[] }>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function percentage(value: number | null) {
  return value === null
    ? "—"
    : new Intl.NumberFormat("pt-PT", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value);
}

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: SearchParameters;
}) {
  const params = await searchParams;
  const data = getOverviewData();
  const validBandCount =
    data.counts.salaryBelow +
    data.counts.salaryWithin +
    data.counts.salaryAbove;
  const belowRate = validBandCount
    ? data.counts.salaryBelow / validBandCount
    : null;
  const noResponseRate = data.counts.proposals
    ? data.counts.proposalsNoResponse / data.counts.proposals
    : null;

  return (
    <div className="page-content">
      <PageHeader
        title="Validação de propostas"
        subtitle="Compara cada oferta com a banda da vaga e a expectativa do candidato antes de avançar."
      />
      <div className="metric-grid two-metrics">
        <Metric
          label="Ofertas abaixo do mínimo"
          value={percentage(belowRate)}
          note={`${data.counts.salaryBelow.toLocaleString("pt-PT")} de ${validBandCount.toLocaleString("pt-PT")} propostas com banda válida`}
          tone="danger"
        />
        <Metric
          label="Propostas sem resposta"
          value={percentage(noResponseRate)}
          note={`${data.counts.proposalsNoResponse.toLocaleString("pt-PT")} propostas sem resposta registada`}
          tone="warning"
        />
      </div>
      <Panel
        title="Propostas emitidas"
        meta={
          <span className="muted">
            {data.counts.proposals.toLocaleString("pt-PT")} registos
          </span>
        }
      >
        <p className="panel-intro">
          Abre uma linha para comparar a oferta com a banda da vaga e a
          expectativa do candidato.
        </p>
        <OperationalWorklist
          kind="proposals"
          initialSearch={firstValue(params.q)}
        />
      </Panel>
    </div>
  );
}
