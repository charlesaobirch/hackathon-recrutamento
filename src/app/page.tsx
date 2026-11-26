import Link from "next/link";
import { Suspense } from "react";
import { ActivityChart } from "@/components/activity-chart";
import { OperationalWorklist } from "@/components/operational-worklist";
import { HiringConversionChart } from "@/components/overview-charts";
import { Badge, Notice, PageHeader, Panel } from "@/components/ui";
import {
  applicationPeriodDays,
  applicationPeriodDescription,
  applicationPeriodOptions,
  DEFAULT_APPLICATION_PERIOD,
  normalizeApplicationPeriod,
} from "@/lib/application-period";
import { formatDate } from "@/lib/format";
import { getOverviewData, getOverviewPeriodData } from "@/lib/operational-data";

type SearchParameters = Promise<{ period?: string | string[] }>;

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

function change(current: number, previous?: number) {
  if (!previous) return undefined;
  const delta = Math.round(((current - previous) / previous) * 100);
  return `${delta > 0 ? "+" : ""}${delta}%`;
}

function deltaTone(current: number, previous?: number): "positive" | "warning" {
  return current >= (previous ?? 0) ? "positive" : "warning";
}

function dayLabel(value: number | null) {
  return value === null ? "—" : `${Math.round(value)} dias`;
}

const summaryGlyphs = {
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 2.4-4.5 5.5-4.5s4.9 1.5 5.5 4.5M16 5.5a3 3 0 0 1 0 5.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.5 2" />
    </>
  ),
  document: (
    <>
      <path d="M7 3.5h7l4 4V20H7z" />
      <path d="M14 3.5v5h5M10 13h5M10 16.5h5" />
    </>
  ),
  check: <path d="m4 12.5 5 5L20 6.5" />,
} as const;

type SummaryGlyph = keyof typeof summaryGlyphs;

function SummaryMetric({
  label,
  value,
  note,
  glyph,
  delta,
  tone,
  highlight = false,
}: {
  label: string;
  value: string;
  note: string;
  glyph: SummaryGlyph;
  delta?: string;
  tone?: "positive" | "warning";
  highlight?: boolean;
}) {
  return (
    <article className={`summary-metric${highlight ? " is-highlight" : ""}`}>
      <div className="summary-metric-head">
        <span className="summary-metric-label">{label}</span>
        <span className="summary-metric-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {summaryGlyphs[glyph]}
          </svg>
        </span>
      </div>
      <div className="summary-metric-value">
        <strong>{value}</strong>
        {delta ? <span className={`delta ${tone ?? "neutral"}`}>{delta}</span> : null}
      </div>
      <span className="summary-metric-note">{note}</span>
    </article>
  );
}

async function OverviewContent({
  searchParams,
}: {
  searchParams: SearchParameters;
}) {
  const params = await searchParams;
  const period = normalizeApplicationPeriod(firstValue(params.period));
  const periodDays = applicationPeriodDays(period);
  const data = getOverviewData();
  const overview = getOverviewPeriodData(period);
  const previous = overview.previous;
  const scopePhrase =
    periodDays === null
      ? "em todo o histórico"
      : `nos últimos ${periodDays} dias`;
  const waitingHref = `/espera?period=${period}`;
  const alertCount =
    (overview.alerts.invalidVacancyApplications > 0 ? 1 : 0) +
    (overview.alerts.salaryBelow > 0 ? 1 : 0);
  const waitingShare =
    overview.cycle.total !== null &&
    overview.cycle.total > 0 &&
    overview.cycle.waitingForOffer !== null
      ? overview.cycle.waitingForOffer / overview.cycle.total
      : null;

  return (
    <div className="page-content">
      <PageHeader
        title="Visão geral"
        subtitle={
          periodDays === null
            ? "Prioridades e ritmo do processo em todo o histórico — muda a janela em cima."
            : `Prioridades e ritmo do processo dos últimos ${periodDays} dias — o histórico completo está a um clique.`
        }
        action={
          <div className="overview-actions">
            <nav
              className="segmented period-nav"
              aria-label="Janela temporal da visão geral"
            >
              {applicationPeriodOptions.map((option) => (
                <Link
                  key={option.value}
                  href={
                    option.value === DEFAULT_APPLICATION_PERIOD
                      ? "/"
                      : `/?period=${option.value}`
                  }
                  aria-current={period === option.value ? "page" : undefined}
                  title={applicationPeriodDescription(option.value)}
                  className={period === option.value ? "is-active" : undefined}
                >
                  {option.shortLabel}
                </Link>
              ))}
            </nav>
            <span className="data-date">Dados até {formatDate(data.asOf)}</span>
          </div>
        }
      />

      <Panel
        title="Resumo do período"
        meta={
          <span className="muted">
            {applicationPeriodDescription(period)}
          </span>
        }
        className="summary-panel"
      >
        <div className="summary-metrics">
          <SummaryMetric
            label="Candidaturas"
            value={overview.applications.toLocaleString("pt-PT")}
            note={
              periodDays === null
                ? "Entradas no histórico completo"
                : `Entradas nos últimos ${periodDays} dias`
            }
            glyph="people"
            delta={change(overview.applications, previous?.applications)}
            tone={deltaTone(overview.applications, previous?.applications)}
          />
          <SummaryMetric
            label="À espera de proposta"
            value={overview.waiting.toLocaleString("pt-PT")}
            note="Entrevista aprovada, oferta por emitir"
            glyph="clock"
            highlight
          />
          <SummaryMetric
            label="Propostas emitidas"
            value={overview.proposals.toLocaleString("pt-PT")}
            note={
              periodDays === null
                ? "Ofertas registadas no histórico"
                : "Ofertas registadas no período"
            }
            glyph="document"
            delta={change(overview.proposals, previous?.proposals)}
            tone={deltaTone(overview.proposals, previous?.proposals)}
          />
          <SummaryMetric
            label="Contratações"
            value={overview.hires.toLocaleString("pt-PT")}
            note="Aceitações concretizadas"
            glyph="check"
            delta={change(overview.hires, previous?.hires)}
            tone={deltaTone(overview.hires, previous?.hires)}
          />
        </div>
      </Panel>

      <div className="overview-pairs">
        <Panel
          title="Precisa de atenção"
          meta={
            <Badge tone={alertCount ? "danger" : "positive"}>
              {alertCount === 0
                ? "Sem bloqueios"
                : alertCount === 1
                  ? "1 regra a rever"
                  : `${alertCount} regras a rever`}
            </Badge>
          }
          className="alerts-panel"
        >
          <ul className="alert-list">
            <li>
              <span className="alert-mark danger" />
              <span>
                <b>
                  {overview.alerts.invalidVacancyApplications.toLocaleString(
                    "pt-PT",
                  )}{" "}
                  candidaturas sem vaga válida
                </b>
                <small>Bloqueia o reporting oficial</small>
              </span>
            </li>
            <li>
              <span className="alert-mark warning" />
              <span>
                <b>
                  {overview.alerts.salaryBelow.toLocaleString("pt-PT")}{" "}
                  propostas abaixo do mínimo
                </b>
                <small>
                  {percentage(overview.alerts.salaryBelowRate)} das ofertas com
                  banda definida
                </small>
              </span>
            </li>
          </ul>
          <div className="alert-actions">
            <Link className="inline-action" href="/qualidade">
              Corrigir na qualidade <span>↗</span>
            </Link>
            <Link className="inline-action" href="/propostas">
              Rever propostas <span>↗</span>
            </Link>
          </div>
        </Panel>

        <Panel
          title="Entradas e propostas"
          meta={
            <span className="muted">
              {applicationPeriodDescription(period)}
            </span>
          }
          className="activity-panel"
        >
          <ActivityChart
            months={overview.activity.buckets}
            granularity={overview.activity.granularity}
          />
        </Panel>
      </div>

      <div className="overview-pairs">
        <Panel
          title="Contratações únicas"
          meta={<Badge tone="positive">4,4% de conversão</Badge>}
          className="chart-panel chart-panel--hires"
        >
          <HiringConversionChart />
        </Panel>

        <Panel
          title="Ciclo de recrutamento"
          meta={
            <Badge tone="danger">
              {waitingShare === null
                ? "Sem amostra"
                : `${percentage(waitingShare)} em espera`}
            </Badge>
          }
          className="cycle-panel"
        >
          <div className="cycle-summary">
            <div className="cycle-total">
              <span>Ciclo total · mediana</span>
              <strong>
                {overview.cycle.total === null
                  ? "—"
                  : Math.round(overview.cycle.total)}{" "}
                <small>dias</small>
              </strong>
            </div>
            <div className="cycle-wait-highlight">
              <b>{dayLabel(overview.cycle.waitingForOffer)}</b>
              <span>entre a última entrevista e a proposta</span>
            </div>
          </div>
          <div className="cycle-strip" aria-hidden="true">
            <span className="cycle-first" />
            <span className="cycle-interviews" />
            <span className="cycle-wait" />
            <span className="cycle-close" />
          </div>
          <div className="cycle-steps">
            <div>
              <b>3 dias</b>
              <span>1.ª entrevista</span>
            </div>
            <div>
              <b>6 dias</b>
              <span>Entrevistas</span>
            </div>
            <div>
              <b>{dayLabel(overview.cycle.waitingForOffer)}</b>
              <span>Espera até proposta</span>
            </div>
            <div>
              <b>{dayLabel(overview.cycle.proposalToHire)}</b>
              <span>Proposta → contratação</span>
            </div>
          </div>
          <Link href="/pipeline" className="inline-action">
            Ver etapas e conversões <span>↗</span>
          </Link>
        </Panel>
      </div>

      <Panel
        title="Estado de candidaturas"
        meta={
          <Link className="text-link" href={waitingHref}>
            Abrir fila completa ↗
          </Link>
        }
        className="priority-panel estate-table-panel"
      >
        <p className="panel-intro">
          {`Candidaturas com entrevista aprovada e sem proposta registada ${scopePhrase}, ordenadas pelo tempo desde a última atividade.`}
        </p>
        <OperationalWorklist
          kind="waiting"
          initialPeriod={period}
          showPeriodFilter={false}
        />
      </Panel>

      <Notice title="Métricas exploratórias" tone="warning">
        O relatório identifica problemas nos estados, nas datas e nas ligações
        entre tabelas. Usa estes valores para orientar a demonstração, não como
        reporting oficial.
      </Notice>
    </div>
  );
}

export default function OverviewPage({
  searchParams,
}: {
  searchParams: SearchParameters;
}) {
  return (
    <Suspense
      fallback={
        <div className="page-content">
          <p className="muted">A preparar a visão geral…</p>
        </div>
      }
    >
      <OverviewContent searchParams={searchParams} />
    </Suspense>
  );
}
