import { Badge, Metric, PageHeader, Panel } from "@/components/ui";
import { humanizeValue } from "@/lib/format";
import { getClientData } from "@/lib/operational-data";

function percentage(value: number | null) {
  return value === null
    ? "—"
    : new Intl.NumberFormat("pt-PT", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value);
}

function rating(value: number | null) {
  return value === null
    ? "—"
    : new Intl.NumberFormat("pt-PT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
}

function retentionGap(value: number | null, average: number | null) {
  if (value === null || average === null) return "Sem comparação";
  const points = (value - average) * 100;
  if (Math.abs(points) < 0.05) return "Igual à média global";
  const formatted = new Intl.NumberFormat("pt-PT", {
    maximumFractionDigits: 1,
    signDisplay: "always",
  }).format(points);
  return `${formatted} p.p. face à média`;
}

export default function ClientsPage() {
  const data = getClientData();
  const clients = [...data.clients].sort(
    (first, second) =>
      (first.retention90 ?? 2) - (second.retention90 ?? 2) ||
      second.replacements - first.replacements,
  );
  const replacementRate = data.clientTotals.feedbackCount
    ? data.clientTotals.replacements / data.clientTotals.feedbackCount
    : null;

  return (
    <div className="page-content">
      <PageHeader
        title="Radar de clientes"
        subtitle="Retenção, desempenho e substituições por cliente — satisfação serve de contexto."
      />
      <div className="metric-grid three-metrics">
        <Metric
          label="Retenção aos 90 dias"
          value={percentage(data.clientTotals.retention90)}
          note={`${data.clientTotals.retentionKnown.toLocaleString("pt-PT")} contratações com retenção conhecida`}
          tone="warning"
        />
        <Metric
          label="Desempenho · 90 dias"
          value={`${rating(data.clientTotals.performance)} / 5`}
          note={`${data.clientTotals.hires.toLocaleString("pt-PT")} candidaturas contratadas`}
        />
        <Metric
          label="Substituições"
          value={data.clientTotals.replacements.toLocaleString("pt-PT")}
          note={`${percentage(replacementRate)} dos feedbacks com substituição registada`}
          tone="danger"
        />
      </div>
      <Panel
        title="Saúde por cliente"
        meta={<Badge tone="info">{clients.length} clientes</Badge>}
      >
        <p className="panel-intro">
          Ordenados pela retenção mais baixa. Abre o plano 30/60/90 para ver o
          acompanhamento de cada cliente.
        </p>
        <div className="table-scroll">
          <table className="data-table client-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th className="num">Contratações</th>
                <th className="num">
                  Retenção · 90 dias
                  <small>
                    Média global: {percentage(data.clientTotals.retention90)}
                  </small>
                </th>
                <th className="num">Desempenho · 90 dias</th>
                <th className="num">Substituições</th>
                <th className="num">Satisfação · contexto</th>
                <th>Plano de acompanhamento</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <b>{client.name || client.id}</b>
                    <small>
                      {client.id} · {client.sector}
                    </small>
                  </td>
                  <td className="num">
                    {client.hires.toLocaleString("pt-PT")}
                  </td>
                  <td className="num">
                    <b>{percentage(client.retention90)}</b>
                    <small>
                      {client.retentionKnown.toLocaleString("pt-PT")} valores
                      válidos
                    </small>
                    <small className="comparison-note">
                      {retentionGap(
                        client.retention90,
                        data.clientTotals.retention90,
                      )}
                    </small>
                  </td>
                  <td className="num">{rating(client.performance)} / 5</td>
                  <td className="num">
                    <b>{client.replacements.toLocaleString("pt-PT")}</b>
                    <small>
                      em {client.feedbackCount.toLocaleString("pt-PT")}{" "}
                      feedbacks
                    </small>
                  </td>
                  <td className="num">
                    {rating(client.satisfaction)} / 5
                    <small>{client.feedbackCount} respostas</small>
                  </td>
                  <td>
                    <details className="client-plan">
                      <summary>Ver plano 30/60/90</summary>
                      <ol>
                        <li>
                          <b>30 dias</b> — alinhar perfil de sucesso e
                          expectativas das vagas.
                        </li>
                        <li>
                          <b>60 dias</b> — rever shortlist, entrevistas e
                          feedback recente.
                        </li>
                        <li>
                          <b>90 dias</b> — avaliar retenção, desempenho e
                          substituições.
                        </li>
                      </ol>
                      <span>
                        Estado do contrato:{" "}
                        {humanizeValue("estado", client.contractStatus)}
                      </span>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="source-note">
          Retenção usa apenas valores conhecidos; satisfação não é usada como
          medida isolada de qualidade. Os totais derivam das contratações e
          feedbacks ligados.
        </p>
      </Panel>
    </div>
  );
}
