import { DatasetExplorer } from "@/components/dataset-explorer";
import { Badge, Notice, PageHeader, Panel } from "@/components/ui";

export default function DataPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Dados completos"
        subtitle="Consulta os registos originais das 11 tabelas do projeto, sem resumos."
        action={<Badge tone="positive">11 ficheiros ligados</Badge>}
      />
      <Notice title="Registos originais, sem alterações" tone="info">
        Os dados são lidos dos JSON completos no servidor. A tabela mostra os
        campos originais e pagina os resultados, sem substituir o conteúdo por
        resumos nem corrigir a origem.
      </Notice>
      <Panel title="Explorador de tabelas">
        <DatasetExplorer initialTable="candidaturas" showDatasetPicker />
      </Panel>
    </div>
  );
}
