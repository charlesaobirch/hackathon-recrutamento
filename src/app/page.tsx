import Link from "next/link";
import { DatasetExplorer } from "@/components/dataset-explorer";
import { Badge, Metric, Notice, PageHeader, Panel } from "@/components/ui";

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
      <div className="metric-grid">
        <Metric
          label="Candidaturas"
          value="5 962"
          note="3 500 candidatos no conjunto analisado"
        />
        <Metric
          label="Espera até à proposta"
          value="27 dias"
          note="68% da mediana do ciclo de 40 dias"
          tone="danger"
        />
        <Metric
          label="Propostas emitidas"
          value="1 065"
          note="25,4% sem resposta registada"
          tone="warning"
        />
        <Metric
          label="Contratações únicas"
          value="262"
          note="4,4% de conversão desde a candidatura"
          tone="positive"
        />
      </div>
      <div className="overview-layout">
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
            ficheiro; o relatório alerta que não corresponde sempre aos eventos.
          </p>
        </Panel>
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
        </div>
      </div>
      <div className="bottom-grid">
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
      <Notice title="Métricas exploratórias" tone="warning">
        O relatório identifica problemas nos estados, nas datas e nas ligações
        entre tabelas. Usa estes valores para orientar a demonstração, não como
        reporting oficial.
      </Notice>
    </div>
  );
}
