import Link from "next/link";
import { DatasetExplorer } from "@/components/dataset-explorer";
import {
  HiringConversionChart,
  HiringTrendChart,
  WaitTimeChart,
  WaitTrendChart,
} from "@/components/overview-charts";
import { PeriodMetric } from "@/components/period-metric";
import { Badge, Notice, PageHeader, Panel } from "@/components/ui";
import {
  candidaturasByPeriod,
  propostasByPeriod,
} from "@/data/overview-periods";

export default function OverviewPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Torre de controlo"
        subtitle="Onde o processo está a abrandar e qual é a próxima decisão."
        action={
          <span className="data-date">
            <span className="live-dot" /> Dados analisados até jan. 2026
          </span>
        }
      />
      <div className="metric-grid spotlight-grid two-metrics">
        <PeriodMetric
          label="Candidaturas"
          total={{
            value: "5 962",
            note: "3 500 candidatos no conjunto analisado",
          }}
          byPeriod={candidaturasByPeriod}
        />
        <PeriodMetric
          label="Propostas emitidas"
          total={{
            value: "1 065",
            note: "25,4% sem resposta registada",
          }}
          byPeriod={propostasByPeriod}
          tone="warning"
        />
      </div>
      <div className="attention-grid">
        <Panel
          title="Contratações únicas"
          meta={<Badge tone="positive">4,4% de conversão</Badge>}
          className="chart-panel chart-panel--hires"
        >
          <HiringConversionChart />
          <HiringTrendChart />
        </Panel>
        <Panel
          title="Espera até à proposta"
          meta={<Badge tone="danger">68% do ciclo</Badge>}
          className="chart-panel chart-panel--wait"
        >
          <WaitTimeChart />
          <WaitTrendChart />
        </Panel>
      </div>
      <div className="overview-grid">
        <div className="overview-main">
          <Panel
            title="Percurso que pede ação"
            meta={
              <Link className="text-link" href="/candidaturas">
                Abrir candidaturas ↗
              </Link>
            }
            className="priority-panel"
          >
            <div className="panel-intro">
              <span>Pesquisa sobre os 5 962 registos originais</span>
              <Badge tone="warning">Etapa original, com limitações</Badge>
            </div>
            <DatasetExplorer initialTable="candidaturas" initialPageSize={10} />
            <p className="source-note">
              O campo <code>etapa_atual</code> é apresentado como está no
              ficheiro; o relatório alerta que não corresponde sempre aos
              eventos.
            </p>
          </Panel>
          <Panel
            title="Ciclo de recrutamento"
            meta={<Badge tone="danger">68% do ciclo em espera</Badge>}
          >
            <div className="cycle-summary">
              <div className="cycle-total">
                <span>Ciclo total · mediana</span>
                <strong>
                  40 <small>dias</small>
                </strong>
              </div>
              <div className="cycle-wait-highlight">
                <b>27 dias</b>
                <span>entre a última entrevista e a proposta</span>
              </div>
            </div>
            <div className="cycle-strip">
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
                <b>27 dias</b>
                <span>Espera até proposta</span>
              </div>
              <div>
                <b>3 dias</b>
                <span>Proposta → contratação</span>
              </div>
            </div>
            <Link href="/pipeline" className="inline-action">
              Ver etapas e conversões <span>↗</span>
            </Link>
          </Panel>
        </div>
        <div className="overview-rail">
          <Panel
            title="Sinal de qualidade"
            meta={<Badge tone="danger">P0 aberto</Badge>}
          >
            <p className="panel-copy">
              330 candidaturas apontam para <b>V999</b>, uma vaga que não
              existe. Treze têm contratação associada a outra vaga.
            </p>
            <Link className="inline-action" href="/qualidade">
              Abrir problemas de dados <span>↗</span>
            </Link>
          </Panel>
          <Panel title="Salário fora da banda">
            <strong className="rail-value">20,4%</strong>
            <p className="panel-copy">
              É a taxa reportada de propostas abaixo do mínimo. O valor absoluto
              e o denominador precisam de reconciliação antes de reporting
              oficial.
            </p>
            <Link className="inline-action" href="/propostas">
              Rever propostas <span>↗</span>
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
              {[
                "Candidaturas|5 962|100%",
                "Entrevistas|4 484|75,8%",
                "Propostas|1 065|38,3%",
                "Contratações|262|24,6%",
              ].map((line) => {
                const [label, count, rate] = line.split("|");
                return (
                  <div key={label}>
                    <span>{label}</span>
                    <b>{count}</b>
                    <small>{rate}</small>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
      <Notice title="Métricas exploratórias" tone="warning">
        O relatório identifica problemas nos estados, nas datas e nas ligações
        entre tabelas. Usa estes valores para orientar a demonstração, não como
        reporting oficial.
      </Notice>
    </div>
  );
}
