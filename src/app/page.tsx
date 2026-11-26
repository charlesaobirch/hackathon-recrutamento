import Link from "next/link";
import { ActivityChart } from "@/components/activity-chart";
import { OperationalWorklist } from "@/components/operational-worklist";
import { Badge, Metric, PageHeader, Panel } from "@/components/ui";
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

export default async function OverviewPage({
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
    periodDays === null ? "em todo o histórico" : "no período selecionado";
  const waitingHref =
    period === DEFAULT_APPLICATION_PERIOD
      ? "/espera"
      : `/espera?period=${period}`;
  const funnelHref = (stageKey: string) => {
    const search = new URLSearchParams();
    if (stageKey !== "candidaturas") search.set("stage", stageKey);
    if (period !== DEFAULT_APPLICATION_PERIOD) search.set("period", period);
    const query = search.toString();
    return query ? `/candidaturas?${query}` : "/candidaturas";
  };
  const waitingShare =
    overview.cycle.total !== null &&
    overview.cycle.total > 0 &&
    overview.cycle.waitingForOffer !== null
      ? overview.cycle.waitingForOffer / overview.cycle.total
      : null;
  const queue = [
    { key: "recent", label: "0–13 dias", count: overview.queueAges.recent },
    {
      key: "attention",
      label: "14–29 dias",
      count: overview.queueAges.attention,
    },
    { key: "critical", label: "30+ dias", count: overview.queueAges.critical },
    { key: "unknown", label: "Sem data", count: overview.queueAges.unknown },
  ];
  const queueMax = Math.max(...queue.map((item) => item.count), 1);
  const alertCount =
    (overview.alerts.invalidVacancyApplications > 0 ? 1 : 0) +
    (overview.alerts.salaryBelow > 0 ? 1 : 0);
  const funnelBase = overview.funnel[0]?.count ?? 0;

  return (
    <div className="page-content">
      <PageHeader
        title="Visão geral"
        subtitle={
          periodDays === null
            ? "Prioridades, funil e alertas em todo o histórico — muda a janela em cima."
            : `Prioridades, funil e alertas dos últimos ${periodDays} dias — o histórico completo está a um clique.`
        }
        action={
          <div className="overview-actions">
            <nav
              className="segmented"
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
                  aria-label={`Ver ${applicationPeriodDescription(option.value).toLowerCase()}`}
                  aria-current={period === option.value ? "true" : undefined}
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
        title="Prioridades: à espera de proposta"
        meta={
          <Link className="text-link" href={waitingHref}>
            Abrir fila completa ↗
          </Link>
        }
        className="priority-panel"
      >
        <p className="panel-intro">
          {`Candidaturas com entrevista aprovada e sem proposta registada ${scopePhrase}, ordenadas pelo tempo parado. Abre uma para ver o contexto e registar a intervenção.`}
        </p>
        <OperationalWorklist
          kind="waiting"
          initialPeriod={period}
          showPeriodFilter={false}
        />
      </Panel>

      <div className="kpi-strip">
        <Metric
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
        <Metric
          label="À espera de proposta"
          value={overview.waiting.toLocaleString("pt-PT")}
          note="Entrevista aprovada, oferta por emitir"
          glyph="clock"
          primary
        />
        <Metric
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
        <Metric
          label="Contratações"
          value={overview.hires.toLocaleString("pt-PT")}
          note="Aceitações concretizadas"
          glyph="check"
          delta={change(overview.hires, previous?.hires)}
          tone={deltaTone(overview.hires, previous?.hires)}
        />
      </div>

      <div className="split-main">
        <div className="stack">
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

          <Panel
            title={
              periodDays === null
                ? "Funil do histórico completo"
                : `Funil dos últimos ${periodDays} dias`
            }
            meta={
              <Link className="text-link" href="/pipeline">
                Ver percurso completo ↗
              </Link>
            }
          >
            <div className="funnel">
              {overview.funnel.map((stage, index) => {
                const previousCount =
                  index > 0 ? overview.funnel[index - 1].count : null;
                const width =
                  funnelBase > 0 ? (stage.count / funnelBase) * 100 : 0;
                return (
                  <Link
                    className="funnel-row"
                    href={funnelHref(stage.key)}
                    key={stage.key}
                  >
                    <span className="funnel-label">
                      <b>{stage.label}</b>
                      <small>
                        {previousCount
                          ? `${percentage(stage.conversion)} da etapa anterior`
                          : periodDays === null
                            ? "entrada no histórico"
                            : "entrada no período"}
                      </small>
                    </span>
                    <span className="funnel-bar-wrap">
                      <span className="funnel-bar">
                        <span style={{ width: `${Math.max(width, 1.5)}%` }} />
                      </span>
                      <span className="funnel-meta">
                        <strong>
                          {stage.count.toLocaleString("pt-PT")} candidaturas
                        </strong>
                        <span>
                          {overview.applications
                            ? percentage(stage.count / overview.applications)
                            : "—"}{" "}
                          do total
                        </span>
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </Panel>
        </div>

        <aside className="stack" aria-label="Alertas e ritmo do processo">
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
                    {percentage(overview.alerts.salaryBelowRate)} das ofertas
                    com banda definida
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
            title="Tempo de espera"
            meta={
              <span className="muted">
                {overview.waiting.toLocaleString("pt-PT")} em espera
              </span>
            }
          >
            <div className="age-list">
              {queue.map((bucket) => (
                <div className={`age-item is-${bucket.key}`} key={bucket.key}>
                  <span className="age-head">
                    <span>{bucket.label}</span>
                    <b>{bucket.count.toLocaleString("pt-PT")}</b>
                  </span>
                  <span className="age-bar">
                    <span
                      style={{
                        width: `${Math.max((bucket.count / queueMax) * 100, 1)}%`,
                      }}
                    />
                  </span>
                </div>
              ))}
            </div>
            <p className="chart-caption">
              {`Tempo desde a última entrevista aprovada, para candidaturas ainda sem proposta ${scopePhrase}. Os limites são relativos, não um SLA.`}
            </p>
          </Panel>

          <Panel
            title="Ciclo até à contratação"
            meta={
              <Badge>{periodDays === null ? "Histórico" : "Período"}</Badge>
            }
            className="cycle-panel"
          >
            <div className="cycle-figure">
              <strong>
                {overview.cycle.total === null
                  ? "—"
                  : Math.round(overview.cycle.total)}
              </strong>
              <span>
                dias, mediana até à contratação
                <small>
                  {overview.cycle.sampleSize.toLocaleString("pt-PT")} processos
                </small>
              </span>
            </div>
            <div className="cycle-split">
              <div>
                <b>
                  {overview.cycle.waitingForOffer === null
                    ? "—"
                    : Math.round(overview.cycle.waitingForOffer)}{" "}
                  dias
                </b>
                <span>
                  entrevista final → proposta · {percentage(waitingShare)}
                </span>
              </div>
              <div>
                <b>
                  {overview.cycle.proposalToHire === null
                    ? "—"
                    : Math.round(overview.cycle.proposalToHire)}{" "}
                  dias
                </b>
                <span>proposta → contratação</span>
              </div>
            </div>
            <p className="source-note">
              {periodDays === null
                ? "Medianas sobre processos contratados de todo o histórico — contexto para interpretar a fila."
                : `Medianas sobre processos contratados nos últimos ${periodDays} dias — contexto para interpretar a fila.`}
            </p>
          </Panel>
        </aside>
      </div>

      <p className="source-note archive-note">
        O arquivo completo tem{" "}
        {data.counts.applications.toLocaleString("pt-PT")} candidaturas e{" "}
        {data.counts.proposals.toLocaleString("pt-PT")} propostas.{" "}
        <Link className="text-link" href="/candidaturas?period=all">
          Abrir histórico completo
        </Link>
      </p>
    </div>
  );
}
