import { DatasetExplorer } from "@/components/dataset-explorer";
import { Badge, Metric, Notice, PageHeader, Panel } from "@/components/ui";
import { clientSignals } from "@/lib/recruitment";

export default function ClientsPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Clientes e retenção"
        subtitle="Acompanhar a qualidade das colocações com retenção e substituições, não só satisfação declarada."
        action={<Badge tone="warning">Agregados exploratórios</Badge>}
      />
      <Notice title="Retenção com limitações conhecidas" tone="warning">
        O relatório identificou retenções incoerentes e feedbacks desalinhados
        no tempo. Usa estes indicadores para priorizar revisão, não para avaliar
        contratos isoladamente.
      </Notice>
      <div className="metric-grid three-metrics">
        <Metric
          label="Retenção global · 90 dias"
          value="83,8%"
          note="Há 31 contratações com saída e retenção positiva"
          tone="warning"
        />
        <Metric
          label="Retenção global · 180 dias"
          value="65,5%"
          note="35,6% das flags têm valores nulos estruturais"
        />
        <Metric
          label="Substituições"
          value="32"
          note="12,2% das contratações únicas reportadas"
          tone="danger"
        />
      </div>
      <Panel
        title="Clientes para acompanhar"
        meta={
          <span className="muted">Retenção · desempenho · substituições</span>
        }
      >
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Setor</th>
                <th>Estado do contrato</th>
                <th>Retenção 90 d</th>
                <th>Desempenho médio</th>
                <th>Substituições</th>
                <th>Sinal</th>
              </tr>
            </thead>
            <tbody>
              {clientSignals.map((signal) => {
                return (
                  <tr key={signal.id}>
                    <td>
                      <b>{signal.id}</b>
                      <small>Cliente fictício · {signal.sector}</small>
                    </td>
                    <td>{signal.sector}</td>
                    <td>
                      {signal.id === "CL06" ? (
                        <Badge tone="warning">Em revisão</Badge>
                      ) : (
                        <Badge tone="positive">Ativo</Badge>
                      )}
                    </td>
                    <td>
                      <b>{signal.ret90}</b>
                    </td>
                    <td>{signal.performance}</td>
                    <td>{signal.replacements}</td>
                    <td className="client-note">{signal.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="source-note">
          Indicadores por cliente reproduzidos do relatório; 21 contratações com
          feedback para CL09 e não o universo de 262 contratações.
        </p>
      </Panel>
      <div className="client-insight-grid">
        <Panel title="CL09 · rever adequação">
          <strong className="client-highlight">62,5%</strong>
          <p className="panel-copy">
            Menor retenção aos 90 dias e pior satisfação média do conjunto.
            Quatro substituições em 21 feedbacks (19%).
          </p>
          <span className="signal-line">
            <i className="signal-bad" /> Prioridade de revisão
          </span>
        </Panel>
        <Panel title="CL06 · volume de substituições">
          <strong className="client-highlight">
            6 <small>substituições</small>
          </strong>
          <p className="panel-copy">
            Maior volume absoluto. Retenção de 77,3%; contrato em revisão no
            registo do cliente.
          </p>
          <span className="signal-line">
            <i className="signal-warn" /> Rever causas por vaga
          </span>
        </Panel>
        <Panel title="CL03 · referência positiva">
          <strong className="client-highlight">
            3,88 <small>/ 5</small>
          </strong>
          <p className="panel-copy">
            Melhor desempenho médio observado, com 86,7% de retenção aos 90
            dias.
          </p>
          <span className="signal-line">
            <i className="signal-good" /> Acompanhar a duração do ciclo
          </span>
        </Panel>
      </div>
      <Panel title="Como ler estes sinais">
        <p className="panel-copy">
          A satisfação isolada não garante qualidade: seis contratações com nota
          5/5 exigiram substituição. Para decidir, considera retenção,
          desempenho e substituições em conjunto.
        </p>
      </Panel>
      <Panel
        title="Todos os clientes"
        meta={<Badge tone="positive">10 registos completos</Badge>}
      >
        <DatasetExplorer initialTable="clientes" />
      </Panel>
    </div>
  );
}
