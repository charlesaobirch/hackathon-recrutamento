import Link from "next/link";
import { Suspense } from "react";
import { CandidateBoard } from "@/components/candidate-board";
import { OperationalWorklist } from "@/components/operational-worklist";
import { PageHeader, Panel } from "@/components/ui";
import {
  applicationPeriodDays,
  applicationPeriodDescription,
  applicationPeriodOptions,
  DEFAULT_APPLICATION_PERIOD,
  normalizeApplicationPeriod,
} from "@/lib/application-period";
import {
  getApplicationPeriodSummary,
  getCandidateBoardRows,
} from "@/lib/operational-data";

type SearchParameters = Promise<{
  q?: string | string[];
  stage?: string | string[];
  period?: string | string[];
  view?: string | string[];
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function periodHref(period: string) {
  return period === DEFAULT_APPLICATION_PERIOD
    ? "/candidaturas"
    : `/candidaturas?period=${period}`;
}

async function ApplicationsContent({
  searchParams,
}: {
  searchParams: SearchParameters;
}) {
  const params = await searchParams;
  const period = normalizeApplicationPeriod(firstValue(params.period));
  const periodDays = applicationPeriodDays(period);
  const query = firstValue(params.q);
  const view =
    firstValue(params.view) ?? (params.stage || query ? "list" : "board");
  const summary = getApplicationPeriodSummary(period);
  const periodQuery =
    period === DEFAULT_APPLICATION_PERIOD ? "" : `&period=${period}`;
  const title = period === "all" ? "Histórico de candidaturas" : "Candidaturas";
  const subtitle =
    period === "all"
      ? "Todo o arquivo, para pesquisa e auditoria."
      : `Quadro por etapa dos últimos ${period} dias, ordenado pelo tempo parado.`;
  return (
    <div className="page-content">
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <nav className="segmented" aria-label="Janela temporal">
            {applicationPeriodOptions.map((option) => (
              <Link
                key={option.value}
                href={periodHref(option.value)}
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

      {periodDays !== null ? (
        <section
          className="candidate-summary"
          aria-label={`Resumo dos últimos ${periodDays} dias`}
        >
          <div>
            <strong>{summary.applications.toLocaleString("pt-PT")}</strong>
            <span>Candidaturas · {periodDays} dias</span>
          </div>
          <div>
            <strong>{summary.waiting.toLocaleString("pt-PT")}</strong>
            <span>Aguardam proposta</span>
          </div>
          <div>
            <strong>{summary.proposals.toLocaleString("pt-PT")}</strong>
            <span>Propostas emitidas</span>
          </div>
          <div>
            <strong>{summary.hires.toLocaleString("pt-PT")}</strong>
            <span>Contratações</span>
          </div>
        </section>
      ) : null}

      <Panel
        title={
          periodDays !== null && view !== "list" ? "Quadro por etapa" : title
        }
        meta={
          <span className="muted">{applicationPeriodDescription(period)}</span>
        }
      >
        {periodDays !== null && view !== "list" ? (
          <>
            <div className="board-toolbar">
              <p>
                Ordenadas pelo tempo desde a última atividade. Clica numa pessoa
                para abrir o processo; desliza o quadro para ver todas as
                etapas.
              </p>
              <Link
                className="view-switch"
                href={`/candidaturas?view=list${periodQuery}`}
              >
                Ver em tabela
              </Link>
            </div>
            <CandidateBoard rows={getCandidateBoardRows(periodDays)} />
          </>
        ) : (
          <>
            {periodDays !== null ? (
              <div className="board-toolbar">
                <p>
                  Vista em tabela para procurar e filtrar os registos desta
                  janela.
                </p>
                <Link
                  className="view-switch"
                  href={`/candidaturas?view=board${periodQuery}`}
                >
                  Ver por etapas
                </Link>
              </div>
            ) : null}
            <OperationalWorklist
              kind="applications"
              initialStage={firstValue(params.stage)}
              initialSearch={query}
              initialPeriod={period}
            />
          </>
        )}
      </Panel>
    </div>
  );
}

export default function ApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParameters;
}) {
  return (
    <Suspense
      fallback={
        <div className="page-content">
          <p className="muted">A preparar as candidaturas…</p>
        </div>
      }
    >
      <ApplicationsContent searchParams={searchParams} />
    </Suspense>
  );
}
