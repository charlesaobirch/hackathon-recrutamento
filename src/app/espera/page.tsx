import Link from "next/link";
import { OperationalWorklist } from "@/components/operational-worklist";
import { PageHeader, Panel } from "@/components/ui";
import { getOverviewData } from "@/lib/operational-data";

type SearchParameters = Promise<{ period?: string | string[] }>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const periods = [
  { value: "recent", label: "90 dias" },
  { value: "old", label: "Arquivo" },
  { value: "all", label: "Tudo" },
];

export default async function WaitingPage({
  searchParams,
}: {
  searchParams: SearchParameters;
}) {
  const params = await searchParams;
  const period = firstValue(params.period) ?? "recent";
  const data = getOverviewData();

  return (
    <div className="page-content">
      <PageHeader
        title="À espera de proposta"
        subtitle="Entrevista aprovada sem proposta registada. Prioridade pelo tempo desde a última atividade."
        action={
          <nav className="segmented" aria-label="Janela temporal da fila">
            {periods.map((option) => (
              <Link
                key={option.value}
                href={
                  option.value === "recent"
                    ? "/espera"
                    : `/espera?period=${option.value}`
                }
                className={period === option.value ? "is-active" : undefined}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        }
      />
      <div className="waiting-summary">
        <strong>{data.counts.waitingRecent.toLocaleString("pt-PT")}</strong>
        <span>candidaturas recentes aguardam uma proposta</span>
        <Link href="/pipeline">Ver percurso completo ↗</Link>
      </div>
      <Panel
        title="Fila de intervenção"
        meta={
          <span className="muted">
            {period === "recent"
              ? "Últimos 90 dias"
              : period === "old"
                ? "Mais de 90 dias / sem data"
                : "Todo o histórico"}
          </span>
        }
      >
        <OperationalWorklist kind="waiting" initialPeriod={period} />
      </Panel>
    </div>
  );
}
