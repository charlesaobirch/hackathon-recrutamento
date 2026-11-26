"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SalaryChecker } from "@/components/salary-checker";
import { Badge, Notice, PageHeader, Panel } from "@/components/ui";
import type { DatasetRow } from "@/lib/dataset-config";
import { formatDate, formatMoney } from "@/lib/format";

type RecordResult = { rows: DatasetRow[]; error?: string };

async function getRecord(table: string, id: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ table, id });
  const response = await fetch(`/api/datasets?${params}`, { signal });
  const result = (await response.json()) as RecordResult;
  if (!response.ok)
    throw new Error(result.error ?? "Não foi possível ler os dados.");
  return result.rows[0] ?? null;
}

export function SalaryRecord({ id: initialId }: { id?: string }) {
  const id = initialId ?? "";
  const [records, setRecords] = useState<{
    offer: DatasetRow;
    application: DatasetRow;
    candidate: DatasetRow | null;
    vacancy: DatasetRow | null;
  } | null>(null);
  const [loading, setLoading] = useState(Boolean(initialId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    async function load() {
      try {
        const offer = await getRecord("propostas", id, controller.signal);
        if (!offer)
          throw new Error("A proposta não existe no ficheiro de origem.");
        const application = await getRecord(
          "candidaturas",
          String(offer.id_candidatura),
          controller.signal,
        );
        if (!application)
          throw new Error(
            `A candidatura ${String(offer.id_candidatura)} não foi encontrada.`,
          );
        const [candidate, vacancy] = await Promise.all([
          getRecord(
            "candidatos",
            String(application.id_candidato),
            controller.signal,
          ),
          getRecord("vagas", String(application.id_vaga), controller.signal),
        ]);
        if (!controller.signal.aborted)
          setRecords({ offer, application, candidate, vacancy });
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar a proposta.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [id]);

  const candidateName = String(
    records?.candidate?.nome_ficticio ?? "Candidato não associado",
  );
  if (!initialId)
    return (
      <div className="page-content">
        <PageHeader
          title="Escolher proposta"
          subtitle="A validação abre a partir do registo escolhido."
        />
        <Notice title="Seleciona uma proposta" tone="info">
          Abre uma proposta na lista para comparar a oferta com a banda da vaga
          e a expectativa do candidato.
        </Notice>
        <Link href="/propostas" className="button-primary">
          Ver propostas
        </Link>
      </div>
    );
  if (loading && !records)
    return (
      <div className="page-content">
        <PageHeader
          title="A carregar validação salarial…"
          subtitle="A consultar proposta, candidatura, candidato e vaga."
        />
        <output className="loading-panel">A carregar registos ligados…</output>
      </div>
    );
  if (error || !records)
    return (
      <div className="page-content">
        <PageHeader
          title="Não foi possível validar esta proposta"
          subtitle={id || "A obter uma proposta do ficheiro"}
        />
        <Notice title="Consulta incompleta" tone="warning">
          {error || "Não foram devolvidos os registos relacionados."}
        </Notice>
        <Link href="/propostas" className="text-link">
          Voltar à lista completa de propostas
        </Link>
      </div>
    );

  return (
    <div className="page-content">
      <div className="back-row">
        <Link href="/propostas">← Todas as propostas</Link>
        <span>
          {String(records.offer.id)} · {String(records.application.id)}
        </span>
      </div>
      <PageHeader
        title="Validação salarial"
        subtitle={`${candidateName} · ${String(records.vacancy?.titulo ?? records.application.id_vaga)}`}
        action={
          <Badge
            tone={records.candidate && records.vacancy ? "info" : "danger"}
          >
            {records.candidate && records.vacancy
              ? "Registo completo"
              : "Ligação em falta"}
          </Badge>
        }
      />
      {!records.candidate || !records.vacancy ? (
        <Notice title="Validação bloqueada por falta de dados" tone="warning">
          {!records.candidate ? "O candidato associado não existe. " : ""}
          {!records.vacancy ? "A vaga associada não existe. " : ""}
          Sem estes valores não é possível validar a oferta; consulta a fila de
          Qualidade.
        </Notice>
      ) : null}
      <Panel title="Contexto da proposta">
        <div className="offer-context">
          <div>
            <span>Candidato</span>
            <b>{candidateName}</b>
            <small>
              {String(
                records.candidate?.id ?? records.application.id_candidato,
              )}
            </small>
          </div>
          <div>
            <span>Cliente · vaga</span>
            <b>
              {String(records.vacancy?.id_cliente ?? "—")} ·{" "}
              {String(records.vacancy?.id ?? records.application.id_vaga)}
            </b>
            <small>
              {String(records.vacancy?.titulo ?? "Vaga não encontrada")}
            </small>
          </div>
          <div>
            <span>Oferta original</span>
            <b>{formatMoney(records.offer.salario_oferecido)}</b>
            <small>{formatDate(records.offer.data_proposta)}</small>
          </div>
        </div>
      </Panel>
      {records.candidate && records.vacancy ? (
        <SalaryChecker
          minimum={Number(records.vacancy.salario_min)}
          maximum={Number(records.vacancy.salario_max)}
          expectation={Number(records.candidate.expectativa_salarial)}
          initialOffer={Number(records.offer.salario_oferecido)}
        />
      ) : (
        <Panel title="Regras de decisão">
          <p className="panel-copy">
            O envio permanece bloqueado enquanto a candidatura não tiver
            candidato e vaga associados.
          </p>
        </Panel>
      )}
    </div>
  );
}
