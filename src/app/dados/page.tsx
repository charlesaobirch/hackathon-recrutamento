import { DatasetExplorer } from "@/components/dataset-explorer";
import { Badge, Notice, PageHeader, Panel } from "@/components/ui";

export default function DataPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Dados completos"
        subtitle="Consulta os registos originais das 11 tabelas usadas no projeto."
        action={<Badge tone="positive">11 ficheiros ligados</Badge>}
      />
      <Notice title="Pesquisa sobre todos os campos" tone="info">
        Os registos são lidos dos JSON completos no servidor. A tabela mostra os
        campos originais e percorre os resultados em páginas, sem substituir o
        conteúdo por resumos nem corrigir os dados de origem.
      </Notice>
      <Panel title="Explorador de tabelas">
        <DatasetExplorer initialTable="candidaturas" showDatasetPicker />
      </Panel>
    </div>
  );
}
