import Link from "next/link";
import { ActivityChart } from "@/components/activity-chart";
import { OperationalWorklist } from "@/components/operational-worklist";
import { Badge, Metric, PageHeader, Panel } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getOverviewData } from "@/lib/operational-data";

function percentage(value: number | null) {
  return value === null
    ? "—"
    : new Intl.NumberFormat("pt-PT", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value);
}

function change(current: number, previous: number) {
  if (!previous) return undefined;
  const delta = Math.round(((current - previous) / previous) * 100);
  return `${delta > 0 ? "+" : ""}${delta}%`;
}

function deltaTone(current: number, previous: number): "positive" | "warning" {
  return current >= previous ? "positive" : "warning";
}

export default function OverviewPage() {
  const data = getOverviewData();
  const validSalaryOffers =
    data.counts.salaryBelow +
    data.counts.salaryWithin +
    data.counts.salaryAbove;
  const belowBandRate = validSalaryOffers
    ? data.counts.salaryBelow / validSalaryOffers
    : null;
  const waitingShare =
    data.cycle.total !== null &&
    data.cycle.total > 0 &&
    data.cycle.waitingForOffer !== null
      ? data.cycle.waitingForOffer / data.cycle.total
      : null;
  const queue = [
    { key: "recent", label: "0–13 dias", count: data.queueAges.recent },
    { key: "attention", label: "14–29 dias", count: data.queueAges.attention },
    { key: "critical", label: "30+ dias", count: data.queueAges.critical },
    { key: "unknown", label: "Sem data", count: data.queueAges.unknown },
  ];
  const queueMax = Math.max(...queue.map((item) => item.count), 1);
  const openIssues =
    data.qualityCounts.invalidVacancyApplications > 0 ||
    data.qualityCounts.candidatesMarkedHired !==
      data.qualityCounts.distinctHiredCandidates;

  return (
    <div className="page-content">
      <PageHeader
        title="Hoje"
        subtitle="O que merece atenção nos últimos 90 dias, com o histórico completo a um clique."
        action={
          <span className="data-date">Dados até {formatDate(data.asOf)}</span>
        }
      />

      <Panel
        title="À espera de proposta"
        meta={
          <Link className="text-link" href="/espera">
            Abrir fila completa ↗
          </Link>
        }
        className="priority-panel"
      >
        <p className="panel-intro">
          Candidaturas com entrevista aprovada e sem proposta registada,
          ordenadas pelo tempo desde a última atividade.
        </p>
        <OperationalWorklist kind="waiting" initialPeriod="recent" />
      </Panel>

      <div className="kpi-strip">
        <Metric
          label="Candidaturas"
          value={data.counts.applicationsRecent.toLocaleString("pt-PT")}
          note="Entradas nos últimos 90 dias"
          glyph="people"
          delta={change(
            data.counts.applicationsRecent,
            data.counts.applicationsPrevious,
          )}
          tone={deltaTone(
            data.counts.applicationsRecent,
            data.counts.applicationsPrevious,
          )}
        />
        <Metric
          label="À espera de proposta"
          value={data.counts.waitingRecent.toLocaleString("pt-PT")}
          note="Aprovadas em entrevista, sem oferta"
          glyph="clock"
          primary
        />
        <Metric
          label="Propostas emitidas"
          value={data.counts.proposalsRecent.toLocaleString("pt-PT")}
          note="Ofertas registadas no período"
          glyph="document"
          delta={change(
            data.counts.proposalsRecent,
            data.counts.proposalsPrevious,
          )}
          tone={deltaTone(
            data.counts.proposalsRecent,
            data.counts.proposalsPrevious,
          )}
        />
        <Metric
          label="Contratações"
          value={data.counts.hiresRecent.toLocaleString("pt-PT")}
          note="Aceitações concretizadas"
          glyph="check"
          delta={change(data.counts.hiresRecent, data.counts.hiresPrevious)}
          tone={deltaTone(data.counts.hiresRecent, data.counts.hiresPrevious)}
        />
      </div>

      <div className="split-main">
        <div className="stack">
          <Panel
            title="Atividade registada"
            meta={<span className="muted">Últimos 6 meses</span>}
            className="activity-panel"
          >
            <ActivityChart months={data.activityMonths} />
          </Panel>

          <Panel
            title="Funil dos últimos 90 dias"
            meta={
              <Link className="text-link" href="/pipeline">
                Ver percurso completo ↗
              </Link>
            }
          >
            <div className="funnel">
              {data.recentFunnel.map((stage, index) => {
                const previousCount =
                  index > 0 ? data.recentFunnel[index - 1].count : null;
                const width =
                  data.recentFunnel[0].count > 0
                    ? (stage.count / data.recentFunnel[0].count) * 100
                    : 0;
                return (
                  <Link
                    className="funnel-row"
                    href={
                      stage.key === "candidaturas"
                        ? "/candidaturas"
                        : `/candidaturas?stage=${encodeURIComponent(stage.key)}`
                    }
                    key={stage.key}
                  >
                    <span className="funnel-label">
                      <b>{stage.label}</b>
                      <small>
                        {previousCount
                          ? `${percentage(stage.conversion)} da etapa anterior`
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
                          {data.counts.applicationsRecent
                            ? percentage(
                                stage.count / data.counts.applicationsRecent,
                              )
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
            title="Requer ação"
            meta={
              <Badge tone={openIssues ? "danger" : "positive"}>
                {openIssues ? "2 regras críticas" : "Sem bloqueios"}
              </Badge>
            }
            className="alerts-panel"
          >
            <ul className="alert-list">
              <li>
                <span className="alert-mark danger" />
                <span>
                  <b>
                    {data.qualityCounts.invalidVacancyApplications.toLocaleString(
                      "pt-PT",
                    )}{" "}
                    candidaturas sem vaga válida
                  </b>
                  <small>Corrigir ligações antes de reporting</small>
                </span>
              </li>
              <li>
                <span className="alert-mark warning" />
                <span>
                  <b>
                    {data.counts.salaryBelow.toLocaleString("pt-PT")} propostas
                    abaixo do mínimo
                  </b>
                  <small>
                    {percentage(belowBandRate)} das ofertas com banda definida
                  </small>
                </span>
              </li>
            </ul>
            <Link className="inline-action" href="/qualidade">
              Abrir fila de qualidade <span>↗</span>
            </Link>
          </Panel>

          <Panel
            title="Idade da fila"
            meta={
              <span className="muted">
                {data.counts.waitingRecent.toLocaleString("pt-PT")} em espera
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
              Tempo desde a última entrevista aprovada, para candidaturas
              recentes ainda sem proposta. Os limites são relativos, não um SLA.
            </p>
          </Panel>

          <Panel
            title="Ciclo habitual"
            meta={<Badge>Histórico</Badge>}
            className="cycle-panel"
          >
            <div className="cycle-figure">
              <strong>
                {data.cycle.total === null ? "—" : Math.round(data.cycle.total)}
              </strong>
              <span>
                dias, mediana até à contratação
                <small>
                  {data.cycle.sampleSize.toLocaleString("pt-PT")} processos
                </small>
              </span>
            </div>
            <div className="cycle-split">
              <div>
                <b>
                  {data.cycle.waitingForOffer === null
                    ? "—"
                    : Math.round(data.cycle.waitingForOffer)}{" "}
                  dias
                </b>
                <span>
                  entrevista final → proposta · {percentage(waitingShare)}
                </span>
              </div>
              <div>
                <b>
                  {data.cycle.proposalToHire === null
                    ? "—"
                    : Math.round(data.cycle.proposalToHire)}{" "}
                  dias
                </b>
                <span>proposta → contratação</span>
              </div>
            </div>
            <p className="source-note">
              Medianas sobre processos contratados de todo o histórico —
              contexto para interpretar a fila de hoje.
            </p>
          </Panel>
        </aside>
      </div>

      <p className="source-note archive-note">
        O arquivo completo tem{" "}
        {data.counts.applications.toLocaleString("pt-PT")} candidaturas e{" "}
        {data.counts.proposals.toLocaleString("pt-PT")} propostas.{" "}
        <Link className="text-link" href="/candidaturas?period=all">
          Ver todo o histórico
        </Link>
      </p>
    </div>
  );
}
