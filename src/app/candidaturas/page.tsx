import { DatasetExplorer } from "@/components/dataset-explorer";
import { Notice, PageHeader, Panel } from "@/components/ui";

export default function ApplicationsPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Candidaturas"
        subtitle="Pesquisa e percorre os 5 962 registos completos de candidatura."
      />
      <Notice title="Estados tal como foram registados" tone="warning">
        O relatório assinala incoerências em etapa_atual e nos estados. A tabela
        mantém os valores originais; abre um registo para consultar os eventos
        relacionados.
      </Notice>
      <Panel title="Todas as candidaturas">
        <DatasetExplorer initialTable="candidaturas" />
      </Panel>
    </div>
  );
}
