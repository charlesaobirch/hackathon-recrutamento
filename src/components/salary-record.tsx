"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SalaryChecker } from "@/components/salary-checker";
import { Badge, Notice, PageHeader, Panel } from "@/components/ui";
import type { DatasetRow } from "@/lib/dataset-config";

type RecordResult = { rows: DatasetRow[]; error?: string };

async function getRecord(table: string, id: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ table, id });
  const response = await fetch(`/api/datasets?${params}`, { signal });
  const result = (await response.json()) as RecordResult;
  if (!response.ok)
    throw new Error(result.error ?? "Não foi possível ler os dados.");
  return result.rows[0] ?? null;
}

function formatAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(amount)
    : "Sem valor registado";
}

export function SalaryRecord({ id: initialId }: { id?: string }) {
  const [id, setId] = useState(initialId ?? "");
  const [records, setRecords] = useState<{
    offer: DatasetRow;
    application: DatasetRow;
    candidate: DatasetRow;
    vacancy: DatasetRow;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialId) return;
    const controller = new AbortController();
    fetch("/api/datasets?table=propostas&page=1&pageSize=1", {
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as {
          rows: DatasetRow[];
          error?: string;
        };
        if (!response.ok || !result.rows[0])
          throw new Error(result.error ?? "Não há propostas no ficheiro.");
        setId(String(result.rows[0].id));
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível obter uma proposta.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [initialId]);

  useEffect(() => {
    if (!id) return;
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
        if (!candidate || !vacancy)
          throw new Error(
            "Falta o candidato ou a vaga ligada a esta proposta; consulta a anomalia na página Qualidade.",
          );
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

  const candidateName = String(records?.candidate.nome_ficticio ?? "proposta");
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
        subtitle={`${candidateName} · ${String(records.vacancy.titulo)}`}
        action={<Badge tone="info">Registo original</Badge>}
      />
      <Notice title="Valores provenientes dos quatro JSON ligados" tone="info">
        Expectativa, oferta, candidatura e banda da vaga são lidas dos ficheiros
        completos. Os controlos são locais: não alteram os registos nem enviam
        propostas.
      </Notice>
      <Panel title="Contexto da proposta">
        <div className="offer-context">
          <div>
            <span>Candidato</span>
            <b>{candidateName}</b>
            <small>{String(records.candidate.id)}</small>
          </div>
          <div>
            <span>Cliente · vaga</span>
            <b>
              {String(records.vacancy.id_cliente)} ·{" "}
              {String(records.vacancy.id)}
            </b>
            <small>{String(records.vacancy.titulo)}</small>
          </div>
          <div>
            <span>Oferta original</span>
            <b>{formatAmount(records.offer.salario_oferecido)}</b>
            <small>
              {String(records.offer.data_proposta ?? "Data não registada")}
            </small>
          </div>
        </div>
      </Panel>
      <SalaryChecker
        minimum={Number(records.vacancy.salario_min)}
        maximum={Number(records.vacancy.salario_max)}
        expectation={Number(records.candidate.expectativa_salarial)}
        initialOffer={Number(records.offer.salario_oferecido)}
      />
    </div>
  );
}
