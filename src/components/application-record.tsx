"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Notice, PageHeader, Panel } from "@/components/ui";
import type { DatasetName, DatasetRow } from "@/lib/dataset-config";

type DatasetResponse = { rows: DatasetRow[]; total: number; error?: string };
type RelatedData = {
  application: DatasetRow;
  candidate: DatasetRow | null;
  vacancy: DatasetRow | null;
  client: DatasetRow | null;
  recruiter: DatasetRow | null;
  interviews: DatasetResponse;
  interactions: DatasetResponse;
  offers: DatasetResponse;
  hires: DatasetResponse;
  feedback: DatasetResponse;
};

async function readDataset(
  table: DatasetName,
  options: Record<string, string>,
) {
  const params = new URLSearchParams({ table, pageSize: "100", ...options });
  const response = await fetch(`/api/datasets?${params}`);
  const result = (await response.json()) as DatasetResponse;
  if (!response.ok)
    throw new Error(
      result.error ?? "Não foi possível ler os dados relacionados.",
    );
  return result;
}

function display(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function RecordFields({
  title,
  records,
}: {
  title: string;
  records: DatasetRow[];
}) {
  if (!records.length) return null;
  return (
    <Panel title={title}>
      <div className="related-field-grid">
        {records.map((record, index) => (
          <dl
            className="detail-list"
            key={`${String(record.id ?? title)}-${index}`}
          >
            {Object.entries(record).map(([key, value]) => (
              <div key={key}>
                <dt>{key.replaceAll("_", " ")}</dt>
                <dd>{display(value)}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </Panel>
  );
}

function RelatedRecords({
  title,
  data,
  table,
}: {
  title: string;
  data: DatasetResponse;
  table: string;
}) {
  if (!data.total)
    return (
      <Panel title={title}>
        <p className="panel-copy">Sem registos ligados a esta candidatura.</p>
      </Panel>
    );
  const fields = Object.keys(data.rows[0] ?? {});
  return (
    <Panel
      title={title}
      meta={
        <Badge tone="info">{data.total.toLocaleString("pt-PT")} registos</Badge>
      }
    >
      <details className="related-records">
        <summary>Consultar os dados completos relacionados</summary>
        <div className="table-scroll">
          <table className="data-table dataset-table">
            <thead>
              <tr>
                {fields.map((field) => (
                  <th key={field}>{field.replaceAll("_", " ")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, index) => (
                <tr key={`${String(row.id ?? table)}-${index}`}>
                  {fields.map((field) => (
                    <td key={field}>{display(row[field])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.total > data.rows.length ? (
          <p className="source-note">
            Mostrados {data.rows.length} registos nesta candidatura. Consulta
            todos em <Link href="/dados">Dados</Link> e pesquisa pelo
            identificador da candidatura.
          </p>
        ) : null}
      </details>
    </Panel>
  );
}

export function ApplicationRecord({ id }: { id: string }) {
  const [data, setData] = useState<RelatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const appResponse = await readDataset("candidaturas", { id });
        if (!appResponse.rows[0])
          throw new Error(
            "A candidatura não foi encontrada nos JSON de origem.",
          );
        const application = appResponse.rows[0];
        const applicationId = String(application.id);
        const [
          candidateResponse,
          vacancyResponse,
          interviews,
          interactions,
          offers,
          hires,
        ] = await Promise.all([
          readDataset("candidatos", { id: String(application.id_candidato) }),
          readDataset("vagas", { id: String(application.id_vaga) }),
          readDataset("entrevistas", {
            field: "id_candidatura",
            value: applicationId,
          }),
          readDataset("interacoes", {
            field: "id_candidatura",
            value: applicationId,
          }),
          readDataset("propostas", {
            field: "id_candidatura",
            value: applicationId,
          }),
          readDataset("contratacoes", {
            field: "id_candidatura",
            value: applicationId,
          }),
        ]);
        const vacancy = vacancyResponse.rows[0] ?? null;
        const [clientResponse, recruiterResponse, feedback] = await Promise.all(
          [
            vacancy
              ? readDataset("clientes", { id: String(vacancy.id_cliente) })
              : Promise.resolve({ rows: [], total: 0 }),
            vacancy
              ? readDataset("recrutadores", {
                  id: String(vacancy.id_recrutador),
                })
              : Promise.resolve({ rows: [], total: 0 }),
            hires.rows.length
              ? readDataset("feedback_clientes", {
                  inField: "id_contratacao",
                  values: hires.rows.map((hire) => String(hire.id)).join(","),
                })
              : Promise.resolve({ rows: [], total: 0 }),
          ],
        );
        if (controller.signal.aborted) return;
        setData({
          application,
          candidate: candidateResponse.rows[0] ?? null,
          vacancy,
          client: clientResponse.rows[0] ?? null,
          recruiter: recruiterResponse.rows[0] ?? null,
          interviews,
          interactions,
          offers,
          hires,
          feedback,
        });
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar a candidatura.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [id]);

  if (loading)
    return (
      <div className="page-content">
        <PageHeader title="A carregar candidatura…" subtitle={id} />
        <output className="loading-panel">
          A consultar candidaturas, entrevistas, interações, propostas e
          contratações ligadas.
        </output>
      </div>
    );
  if (error || !data)
    return (
      <div className="page-content">
        <PageHeader
          title="Não foi possível abrir a candidatura"
          subtitle={id}
        />
        <Notice title="Erro na consulta" tone="danger">
          {error || "Os dados não foram devolvidos."}
        </Notice>
        <Link className="text-link" href="/candidaturas">
          Voltar a todas as candidaturas
        </Link>
      </div>
    );

  const candidateTitle = String(
    data.candidate?.nome_ficticio ??
      data.application.id_candidato ??
      "Candidatura",
  );
  return (
    <div className="page-content">
      <div className="back-row">
        <Link href="/candidaturas">← Todas as candidaturas</Link>
        <span>{id}</span>
      </div>
      <PageHeader
        title={candidateTitle}
        subtitle={`${data.application.id} · ${data.vacancy?.titulo ?? data.application.id_vaga}`}
        action={<Badge tone="info">Registo original</Badge>}
      />
      <Notice title="Campos mantidos como na origem" tone="warning">
        O relatório documenta divergências entre estado, etapa e eventos. A
        página mostra os valores brutos e os registos relacionados sem os
        corrigir silenciosamente.
      </Notice>
      <div className="detail-grid">
        <RecordFields
          title="Candidatura e perfil"
          records={[
            data.application,
            ...(data.candidate ? [data.candidate] : []),
          ]}
        />
        <RecordFields
          title="Vaga, cliente e recrutador"
          records={[
            ...(data.vacancy ? [data.vacancy] : []),
            ...(data.client ? [data.client] : []),
            ...(data.recruiter ? [data.recruiter] : []),
          ]}
        />
      </div>
      <div className="related-record-grid">
        <RelatedRecords
          title="Entrevistas"
          table="entrevistas"
          data={data.interviews}
        />
        <RelatedRecords
          title="Interações"
          table="interacoes"
          data={data.interactions}
        />
        <RelatedRecords
          title="Propostas"
          table="propostas"
          data={data.offers}
        />
        <RelatedRecords
          title="Contratações"
          table="contratacoes"
          data={data.hires}
        />
        <RelatedRecords
          title="Feedback do cliente"
          table="feedback_clientes"
          data={data.feedback}
        />
      </div>
    </div>
  );
}
