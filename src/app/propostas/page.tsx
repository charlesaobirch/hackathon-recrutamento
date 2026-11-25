import Link from "next/link";
import { DatasetExplorer } from "@/components/dataset-explorer";
import { Badge, Metric, Notice, PageHeader, Panel } from "@/components/ui";

export default function ProposalsPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Propostas"
        subtitle="Consulta os registos e valida a relação entre oferta e banda salarial."
        action={
          <Link className="button-primary" href="/propostas/validar">
            Abrir validador salarial
          </Link>
        }
      />
      <div className="metric-grid three-metrics">
        <Metric
          label="Propostas no ficheiro"
          value="1 065"
          note="Todos os registos de propostas.json"
        />
        <Metric
          label="Abaixo do mínimo · relatório"
          value="20,4%"
          note="207 propostas reportadas; denominador a reconciliar"
          tone="danger"
        />
        <Metric
          label="Sem resposta · relatório"
          value="25,4%"
          note="Indicador exploratório do conjunto completo"
          tone="warning"
        />
      </div>
      <Notice title="A lista inclui o ficheiro completo" tone="info">
        A classificação salarial é calculada no validador a partir da proposta,
        da candidatura e da banda da vaga. Os indicadores agregados continuam
        sujeitos às limitações documentadas no relatório.
      </Notice>
      <Panel
        title="Todas as propostas"
        meta={<Badge tone="positive">1 065 registos</Badge>}
      >
        <DatasetExplorer initialTable="propostas" />
      </Panel>
    </div>
  );
}
