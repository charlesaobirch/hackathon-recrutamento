import Link from "next/link";
import { OperationalWorklist } from "@/components/operational-worklist";
import { PageHeader, Panel } from "@/components/ui";
import {
  applicationPeriodDays,
  applicationPeriodDescription,
  applicationPeriodOptions,
  DEFAULT_APPLICATION_PERIOD,
  normalizeApplicationPeriod,
} from "@/lib/application-period";
import { getApplicationPeriodSummary } from "@/lib/operational-data";

type SearchParameters = Promise<{ period?: string | string[] }>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function WaitingPage({
  searchParams,
}: {
  searchParams: SearchParameters;
}) {
  const params = await searchParams;
  const period = normalizeApplicationPeriod(firstValue(params.period));
  const periodDays = applicationPeriodDays(period);
  const summary = getApplicationPeriodSummary(period);

  return (
    <div className="page-content">
      <PageHeader
        title="À espera de proposta"
        subtitle="Candidaturas com entrevista aprovada e sem proposta registada — a mais parada primeiro."
        action={
          <nav className="segmented" aria-label="Janela temporal da fila">
            {applicationPeriodOptions.map((option) => (
              <Link
                key={option.value}
                href={
                  option.value === DEFAULT_APPLICATION_PERIOD
                    ? "/espera"
                    : `/espera?period=${option.value}`
                }
                aria-label={`Ver ${applicationPeriodDescription(option.value).toLowerCase()}`}
                aria-current={period === option.value ? "true" : undefined}
                title={applicationPeriodDescription(option.value)}
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
          {periodDays === null
            ? "candidaturas aguardam uma proposta em todo o histórico"
            : `candidaturas aguardam uma proposta nos últimos ${periodDays} dias`}
        </span>
        <Link href="/pipeline">Ver percurso completo ↗</Link>
      </div>
      <Panel
        title="Candidaturas por intervir"
        meta={
          <span className="muted">{applicationPeriodDescription(period)}</span>
        }
      >
        <OperationalWorklist kind="waiting" initialPeriod={period} />
      </Panel>
    </div>
  );
}
