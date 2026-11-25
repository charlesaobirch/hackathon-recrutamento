import Link from "next/link";
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
    data.counts.salaryBelow + data.counts.salaryWithin + data.counts.salaryAbove;
  const belowRate = validBandCount
    ? data.counts.salaryBelow / validBandCount
    : null;
  const noResponseRate = data.counts.proposals
    ? data.counts.proposalsNoResponse / data.counts.proposals
    : null;

  return (
    <div className="page-content">
      <PageHeader
        title="Propostas"
        subtitle="Exceções salariais e estado de resposta em todos os registos."
        action={
          <Link className="button-primary" href="/propostas/validar">
            Abrir validador salarial
          </Link>
        }
      />
      <div className="metric-grid three-metrics">
        <Metric
          label="Propostas no conjunto completo"
          value={data.counts.proposals.toLocaleString("pt-PT")}
          note={`${data.counts.salaryUnknown.toLocaleString("pt-PT")} sem vaga/banda válida`}
        />
        <Metric
          label="Abaixo do mínimo"
          value={percentage(belowRate)}
          note={`${data.counts.salaryBelow.toLocaleString("pt-PT")} de ${validBandCount.toLocaleString("pt-PT")} propostas com banda válida`}
          tone="danger"
        />
        <Metric
          label="Sem resposta"
          value={percentage(noResponseRate)}
          note={`${data.counts.proposalsNoResponse.toLocaleString("pt-PT")} propostas sem resposta registada`}
          tone="warning"
        />
      </div>
      <Panel
        title="Todas as propostas"
        meta={
          <span className="muted">
            {data.counts.proposals.toLocaleString("pt-PT")} registos
          </span>
        }
      >
        <OperationalWorklist
          kind="proposals"
          initialSearch={firstValue(params.q)}
        />
      </Panel>
    </div>
  );
}
