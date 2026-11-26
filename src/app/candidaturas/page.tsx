import Link from "next/link";
import { CandidateBoard } from "@/components/candidate-board";
import { OperationalWorklist } from "@/components/operational-worklist";
import { PageHeader, Panel } from "@/components/ui";
import {
  getOverviewData,
  getRecentCandidateBoardRows,
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

const periodOptions = [
  { value: "recent", label: "90 dias" },
  { value: "old", label: "Arquivo" },
  { value: "all", label: "Tudo" },
];

function periodHref(period: string) {
  return period === "recent"
    ? "/candidaturas"
    : `/candidaturas?period=${period}`;
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParameters;
}) {
  const params = await searchParams;
  const period = firstValue(params.period) ?? "recent";
  const query = firstValue(params.q);
  const view =
    firstValue(params.view) ?? (params.stage || query ? "list" : "board");
  const data = getOverviewData();
  const title =
    period === "old"
      ? "Arquivo de candidaturas"
      : period === "all"
        ? "Todas as candidaturas"
        : "Candidatos";
  const subtitle =
    period === "old"
      ? "Processos com mais de 90 dias ou sem data registada."
      : period === "all"
        ? "Histórico completo, para auditoria e análise de tendência."
        : "Trabalho recente por etapa, com o tempo parado e a próxima ação em destaque.";
  return (
    <div className="page-content">
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <nav className="segmented" aria-label="Janela temporal">
            {periodOptions.map((option) => (
              <Link
                key={option.value}
                href={periodHref(option.value)}
                className={period === option.value ? "is-active" : undefined}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        }
      />

      {period === "recent" ? (
        <section
          className="candidate-summary"
          aria-label="Resumo dos últimos 90 dias"
        >
          <div>
            <strong>
              {data.counts.applicationsRecent.toLocaleString("pt-PT")}
            </strong>
            <span>Candidaturas · 90 dias</span>
          </div>
          <div>
            <strong>{data.counts.waitingRecent.toLocaleString("pt-PT")}</strong>
            <span>Aguardam proposta</span>
          </div>
          <div>
            <strong>
              {data.counts.proposalsRecent.toLocaleString("pt-PT")}
            </strong>
            <span>Propostas emitidas</span>
          </div>
          <div>
            <strong>{data.counts.hiresRecent.toLocaleString("pt-PT")}</strong>
            <span>Contratações</span>
          </div>
        </section>
      ) : null}

      <Panel
        title={period === "recent" && view !== "list" ? "Etapas atuais" : title}
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
        {period === "recent" && view !== "list" ? (
          <>
            <div className="board-toolbar">
              <p>
                Ordenadas pelo tempo desde a última atividade · selecione uma
                pessoa para abrir o processo.
              </p>
              <Link className="view-switch" href="/candidaturas?view=list">
                Ver em tabela
              </Link>
            </div>
            <CandidateBoard rows={getRecentCandidateBoardRows()} />
          </>
        ) : (
          <>
            {period === "recent" ? (
              <div className="board-toolbar">
                <p>
                  Vista em tabela para procurar, filtrar e percorrer o histórico
                  completo.
                </p>
                <Link className="view-switch" href="/candidaturas">
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
