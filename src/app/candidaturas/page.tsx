import { OperationalWorklist } from "@/components/operational-worklist";
import { PageHeader, Panel } from "@/components/ui";

type SearchParameters = Promise<{
  q?: string | string[];
  stage?: string | string[];
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParameters;
}) {
  const params = await searchParams;
  return (
    <div className="page-content">
      <PageHeader
        title="Candidaturas"
        subtitle="Lista completa, ordenada pelo tempo parado e reconstruída a partir dos eventos."
      />
      <Panel title="Todas as candidaturas">
        <OperationalWorklist
          kind="applications"
          initialStage={firstValue(params.stage)}
          initialSearch={firstValue(params.q)}
        />
      </Panel>
    </div>
  );
}
