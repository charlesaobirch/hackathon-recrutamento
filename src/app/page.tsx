import Link from "next/link";
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

function days(value: number | null) {
  return value === null ? "—" : `${Math.round(value)} dias`;
}

export default function OverviewPage() {
  const data = getOverviewData();
  const validSalaryOffers =
    data.counts.salaryBelow + data.counts.salaryWithin + data.counts.salaryAbove;
  const belowBandRate = validSalaryOffers
    ? data.counts.salaryBelow / validSalaryOffers
    : null;
  const noResponseRate = data.counts.proposals
    ? data.counts.proposalsNoResponse / data.counts.proposals
    : null;
  const hiringRate = data.counts.applications
    ? data.counts.hires / data.counts.applications
    : null;
  const waitingShare =
    data.cycle.total && data.cycle.waitingForOffer
      ? data.cycle.waitingForOffer / data.cycle.total
      : null;
  const cycleValues = [
    data.cycle.firstInterview,
    data.cycle.interviewCycle,
    data.cycle.waitingForOffer,
    data.cycle.proposalToHire,
  ];
  const p0Issues = [
    data.qualityCounts.invalidVacancyApplications > 0,
    data.qualityCounts.candidatesMarkedHired !==
      data.qualityCounts.distinctHiredCandidates,
  ].filter(Boolean).length;

  return (
    <div className="page-content">
      <PageHeader
        title="Torre de controlo"
        subtitle="Prioridades e decisões reconstruídas a partir dos registos de origem."
        action={
          <span className="data-date">
            Dados até {formatDate(data.asOf)}
          </span>
        }
      />
      <div className="metric-grid">
        <Metric
          label="Candidaturas"
          value={data.counts.applications.toLocaleString("pt-PT")}
          note={`${data.candidatesCount.toLocaleString("pt-PT")} candidatos no conjunto completo`}
        />
        <Metric
          label="Última entrevista → proposta"
          value={days(data.cycle.waitingForOffer)}
          note={`${percentage(waitingShare)} da mediana do ciclo de ${days(data.cycle.total)}`}
          tone="danger"
        />
        <Metric
          label="Propostas emitidas"
          value={data.counts.proposals.toLocaleString("pt-PT")}
          note={`${data.counts.proposalsNoResponse.toLocaleString("pt-PT")} sem resposta (${percentage(noResponseRate)})`}
          tone="warning"
        />
        <Metric
          label="Contratações por candidatura"
          value={data.counts.hires.toLocaleString("pt-PT")}
          note={`${percentage(hiringRate)} de conversão desde a candidatura`}
          tone="positive"
        />
      </div>

      <div className="overview-layout">
        <Panel
          title="À espera de proposta"
          meta={
            <Badge tone="danger">
              {data.counts.waiting.toLocaleString("pt-PT")} candidaturas
            </Badge>
          }
          className="priority-panel"
        >
          <p className="panel-intro">
            Entrevista mais recente aprovada, sem proposta ou contratação
            registada; ordenado pelo tempo desde a última ação.
          </p>
          <OperationalWorklist kind="waiting" />
        </Panel>
        <div className="overview-rail">
          <Panel
            title="Integridade crítica"
            meta={<Badge tone="danger">{p0Issues} regras P0</Badge>}
          >
            <strong className="rail-value">
              {data.qualityCounts.invalidVacancyApplications.toLocaleString(
                "pt-PT",
              )}
            </strong>
            <p className="panel-copy">
              Candidaturas ligadas a vagas inexistentes. Os relatórios oficiais
              continuam bloqueados até à correção validada na origem.
            </p>
            <Link className="inline-action" href="/qualidade">
              Abrir fila de qualidade <span>↗</span>
            </Link>
          </Panel>
          <Panel title="Propostas abaixo da banda">
            <strong className="rail-value">
              {percentage(belowBandRate)}
            </strong>
            <p className="panel-copy">
              {data.counts.salaryBelow.toLocaleString("pt-PT")} propostas abaixo
              do mínimo, entre {validSalaryOffers.toLocaleString("pt-PT")} com
              banda válida.
            </p>
            <Link className="inline-action" href="/propostas">
              Rever propostas <span>↗</span>
            </Link>
          </Panel>
        </div>
      </div>

      <div className="bottom-grid">
        <Panel
          title="Ciclo de recrutamento"
          meta={
            <Badge tone="danger">
              {percentage(waitingShare)} do ciclo em espera
            </Badge>
          }
        >
          <div className="cycle-summary">
            <div className="cycle-total">
              <span>Mediana · {data.cycle.sampleSize} candidaturas contratadas</span>
              <strong>
                {data.cycle.total ?? "—"} <small>dias</small>
              </strong>
            </div>
            <div className="cycle-wait-highlight">
              <b>{days(data.cycle.waitingForOffer)}</b>
              <span>entre a última entrevista e a proposta</span>
            </div>
          </div>
          <div className="cycle-strip" aria-label="Mediana por segmento do ciclo">
            <span className="cycle-first" style={{ flex: cycleValues[0] ?? 1 }} />
            <span
              className="cycle-interviews"
              style={{ flex: cycleValues[1] ?? 1 }}
            />
            <span className="cycle-wait" style={{ flex: cycleValues[2] ?? 1 }} />
            <span className="cycle-close" style={{ flex: cycleValues[3] ?? 1 }} />
          </div>
          <div
            className="cycle-steps"
            style={{
              gridTemplateColumns: cycleValues
                .map((value) => `${Math.max(value ?? 1, 1)}fr`)
                .join(" "),
            }}
          >
            <div>
              <b>{days(data.cycle.firstInterview)}</b>
              <span>Candidatura → 1.ª entrevista</span>
            </div>
            <div>
              <b>{days(data.cycle.interviewCycle)}</b>
              <span>Ciclo de entrevistas</span>
            </div>
            <div>
              <b>{days(data.cycle.waitingForOffer)}</b>
              <span>Espera até proposta</span>
            </div>
            <div>
              <b>{days(data.cycle.proposalToHire)}</b>
              <span>Proposta → contratação</span>
            </div>
          </div>
          <p className="source-note">
            Medianas da coorte contratada; intervalos não somam necessariamente
            a mediana global.
          </p>
          <Link href="/pipeline" className="inline-action">
            Ver etapas e conversões <span>↗</span>
          </Link>
        </Panel>
        <Panel
          title="Funil de conversão"
          meta={
            <Link className="text-link" href="/pipeline">
              Abrir pipeline ↗
            </Link>
          }
        >
          <div className="mini-funnel">
            {data.funnel.map((stage, index) => {
              const share = data.counts.applications
                ? stage.count / data.counts.applications
                : 0;
              return (
                <div className="mini-funnel-row" key={stage.key}>
                  <div className="mini-funnel-label">
                    <span>{stage.label}</span>
                    <small>{percentage(share)}</small>
                  </div>
                  <b>{stage.count.toLocaleString("pt-PT")}</b>
                  <div
                    className="mini-funnel-track"
                    aria-label={`${stage.label}: ${stage.count.toLocaleString("pt-PT")} registos`}
                  >
                    <span
                      style={{
                        width: `${data.counts.applications ? (stage.count / data.counts.applications) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  {index > 0 ? (
                    <small className="mini-funnel-conversion">
                      {percentage(stage.conversion)} da etapa anterior
                    </small>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
