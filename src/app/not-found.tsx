import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="page-content">
      <PageHeader
        title="Registo não encontrado"
        subtitle="Este identificador não corresponde a um registo dos JSON de origem."
      />
      <Panel title="Voltar ao fluxo">
        <p className="panel-copy">
          Escolhe um registo disponível na lista para abrir o respetivo
          percurso.
        </p>
        <Link href="/" className="button-primary">
          Voltar à torre de controlo
        </Link>
      </Panel>
    </div>
  );
}
