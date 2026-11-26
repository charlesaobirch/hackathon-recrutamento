import Link from "next/link";
import { Suspense } from "react";
import { OperationalWorklist } from "@/components/operational-worklist";
import { PageHeader, Panel } from "@/components/ui";
import {
  applicationPeriodOptions,
  DEFAULT_APPLICATION_PERIOD,
  normalizeApplicationPeriod,
} from "@/lib/application-period";
import { getApplicationPeriodSummary } from "@/lib/operational-data";

type SearchParameters = Promise<{ period?: string | string[] }>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function WaitingContent({
  searchParams,
}: {
  searchParams: SearchParameters;
}) {
  const params = await searchParams;
  const period = normalizeApplicationPeriod(firstValue(params.period));
  const summary = getApplicationPeriodSummary(period);

  return (
    <div className="page-content">
      <PageHeader
        title="À espera de proposta"
        subtitle="Entrevista aprovada sem proposta registada. Prioridade pelo tempo desde a última atividade."
        action={
          <nav className="segmented period-nav" aria-label="Janela temporal da fila">
            {applicationPeriodOptions.map((option) => (
              <Link
                key={option.value}
                href={
                  option.value === DEFAULT_APPLICATION_PERIOD
                    ? "/espera"
                    : `/espera?period=${option.value}`
                }
                className={period === option.value ? "is-active" : undefined}
              >
                {option.shortLabel}
              </Link>
            ))}
          </nav>
        }
      />
      <div className="waiting-summary">
        <strong>{summary.waiting.toLocaleString("pt-PT")}</strong>
        <span>
          candidaturas aguardam uma proposta
          {period === "all" ? " em todo o histórico" : " no período selecionado"}
        </span>
        <Link href="/pipeline">Ver percurso completo ↗</Link>
      </div>
      <Panel
        title="Fila de intervenção"
        meta={<span className="muted">{`Janela: ${period === "all" ? "todo o histórico" : `${period} dias`}`}</span>}
      >
        <OperationalWorklist kind="waiting" initialPeriod={period} />
      </Panel>
    </div>
  );
}

export default function WaitingPage({
  searchParams,
}: {
  searchParams: SearchParameters;
}) {
  return (
    <Suspense
      fallback={
        <div className="page-content">
          <p className="muted">A preparar a fila…</p>
        </div>
      }
    >
      <WaitingContent searchParams={searchParams} />
    </Suspense>
  );
}
