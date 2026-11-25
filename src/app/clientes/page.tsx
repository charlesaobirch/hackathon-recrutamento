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
        title="Clientes e retenção"
        subtitle="Comparar retenção, desempenho e substituições; satisfação é contexto."
      />
      <div className="metric-grid three-metrics">
        <Metric
          label="Retenção aos 90 dias"
          value={percentage(data.clientTotals.retention90)}
          note={`${data.clientTotals.retentionKnown.toLocaleString("pt-PT")} contratações com retenção conhecida`}
          tone="warning"
        />
        <Metric
          label="Desempenho médio"
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
        title="Comparação por cliente"
        meta={<Badge tone="info">{clients.length} clientes</Badge>}
      >
        <div className="table-scroll">
          <table className="data-table client-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contratações</th>
                <th>Retenção · 90 dias</th>
                <th>Desempenho · 90 dias</th>
                <th>Substituições</th>
                <th>Satisfação · contexto</th>
                <th>Acompanhamento</th>
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
                  </td>
                  <td className="num">
                    {rating(client.performance)} / 5
                  </td>
                  <td className="num">
                    <b>{client.replacements.toLocaleString("pt-PT")}</b>
                    <small>
                      em {client.feedbackCount.toLocaleString("pt-PT")} feedbacks
                    </small>
                  </td>
                  <td className="num">
                    {rating(client.satisfaction)} / 5
                    <small>{client.feedbackCount} respostas</small>
                  </td>
                  <td>
                    <details className="client-plan">
                      <summary>Plano 30/60/90</summary>
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
