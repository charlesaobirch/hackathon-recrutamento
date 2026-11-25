"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui";
import {
  formatDate,
  formatMoney,
  humanizeValue,
  stageLabel,
} from "@/lib/format";
import type { Signal, WorklistRow } from "@/lib/operational-data";

type WorklistKind = "applications" | "waiting" | "proposals";
type ColumnKey =
  | "candidate"
  | "vacancy"
  | "stage"
  | "latestInterviewResult"
  | "lastActivity"
  | "daysIdle"
  | "recruiter"
  | "applicationDate"
  | "expectedSalary"
  | "score"
  | "proposal"
  | "offer"
  | "band"
  | "position"
  | "status";

type FilterOption = { value: string; label: string; count?: number };
type WorklistResponse = {
  rows: WorklistRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  asOf: string | null;
  filters: {
    stages: FilterOption[];
    recruiters: FilterOption[];
    signals: FilterOption[];
    positions: FilterOption[];
    statuses: FilterOption[];
  };
  error?: string;
};

const columnDefinitions: Record<ColumnKey, string> = {
  candidate: "Candidatura e candidato",
  vacancy: "Vaga e cliente",
  stage: "Etapa",
  latestInterviewResult: "Última entrevista",
  lastActivity: "Última ação",
  daysIdle: "Tempo parado",
  recruiter: "Recrutador",
  applicationDate: "Data de candidatura",
  expectedSalary: "Expectativa salarial",
  score: "Score técnico original",
  proposal: "Proposta e candidato",
  offer: "Oferta",
  band: "Banda salarial",
  position: "Posição na banda",
  status: "Estado da proposta",
};

function defaultColumns(kind: WorklistKind): ColumnKey[] {
  if (kind === "waiting") {
    return [
      "candidate",
      "vacancy",
      "latestInterviewResult",
      "lastActivity",
      "daysIdle",
      "recruiter",
    ];
  }
  if (kind === "proposals") {
    return ["proposal", "vacancy", "offer", "band", "position", "status"];
  }
  return [
    "candidate",
    "vacancy",
    "stage",
    "lastActivity",
    "recruiter",
    "latestInterviewResult",
  ];
}

function columnsFor(kind: WorklistKind): ColumnKey[] {
  if (kind === "proposals") {
    return [
      "proposal",
      "candidate",
      "vacancy",
      "offer",
      "band",
      "position",
      "status",
      "applicationDate",
      "expectedSalary",
      "recruiter",
    ];
  }
  return [
    "candidate",
    "vacancy",
    "stage",
    "latestInterviewResult",
    "lastActivity",
    "daysIdle",
    "recruiter",
    "applicationDate",
    "expectedSalary",
    "score",
  ];
}

function signalTone(signal: Signal) {
  if (signal === "critical") return "danger";
  if (signal === "attention") return "warning";
  if (signal === "recent") return "positive";
  return "neutral";
}

function signalLabel(row: WorklistRow) {
  if (row.daysIdle === null) return "Sem data";
  return `${row.daysIdle} ${row.daysIdle === 1 ? "dia" : "dias"} parado`;
}

function resultTone(value: string) {
  if (value === "aprovado" || value === "aceite") return "positive";
  if (value === "pendente" || value === "sem_resposta") return "warning";
  if (value === "reprovado" || value === "recusada") return "danger";
  return "neutral";
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="worklist-filter-group">
      <legend>{label}</legend>
      <div className="filter-pills">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            className={
              value === option.value ? "filter-pill selected" : "filter-pill"
            }
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count !== undefined ? (
              <span>{option.count.toLocaleString("pt-PT")}</span>
            ) : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function cellContent(column: ColumnKey, row: WorklistRow) {
  switch (column) {
    case "candidate":
      return (
        <Link
          className="row-link"
          href={`/candidaturas/${encodeURIComponent(row.applicationId)}`}
        >
          <b>{row.candidateName}</b>
          <small>{row.applicationId}</small>
        </Link>
      );
    case "vacancy":
      return (
        <>
          <b>{row.vacancyTitle}</b>
          <small>{row.clientName}</small>
        </>
      );
    case "stage":
      return <Badge tone={row.stage === "contratado" ? "positive" : "info"}>{stageLabel(row.stage)}</Badge>;
    case "latestInterviewResult":
      return row.latestInterviewResult ? (
        <span className="worklist-value-stack">
          <Badge tone={resultTone(row.latestInterviewResult)}>
            {humanizeValue("resultado", row.latestInterviewResult)}
          </Badge>
          <small>
            {row.latestInterviewPhase
              ? stageLabel(row.latestInterviewPhase)
              : "Entrevista"}
          </small>
        </span>
      ) : (
        "—"
      );
    case "lastActivity":
      return (
        <>
          {formatDate(row.lastActivityDate)}
          <small>desde o último evento</small>
        </>
      );
    case "daysIdle":
      return (
        <Badge tone={signalTone(row.signal)}>{signalLabel(row)}</Badge>
      );
    case "recruiter":
      return (
        <>
          {row.recruiterName}
          {row.recruiterId ? <small>{row.recruiterId}</small> : null}
        </>
      );
    case "applicationDate":
      return formatDate(row.applicationDate);
    case "expectedSalary":
      return formatMoney(row.expectedSalary);
    case "score":
      return row.score === null ? "—" : row.score.toLocaleString("pt-PT");
    case "proposal":
      return (
        <Link
          className="row-link"
          href={`/propostas/${encodeURIComponent(row.id)}`}
        >
          <b>{row.id}</b>
          <small>{row.candidateName}</small>
        </Link>
      );
    case "offer":
      return formatMoney(row.offer);
    case "band":
      return row.salaryMin === null || row.salaryMax === null
        ? "Banda indisponível"
        : `${formatMoney(row.salaryMin)} – ${formatMoney(row.salaryMax)}`;
    case "position": {
      const tone =
        row.salaryPosition === "below"
          ? "danger"
          : row.salaryPosition === "above"
            ? "warning"
            : row.salaryPosition === "within"
              ? "positive"
              : "neutral";
      const label =
        row.salaryPosition === "below"
          ? "Abaixo"
          : row.salaryPosition === "within"
            ? "Dentro"
            : row.salaryPosition === "above"
              ? "Acima"
              : "Indisponível";
      return <Badge tone={tone}>{label}</Badge>;
    }
    case "status":
      return row.proposalStatus ? (
        <Badge tone={resultTone(row.proposalStatus)}>
          {humanizeValue("estado_proposta", row.proposalStatus)}
        </Badge>
      ) : (
        "—"
      );
  }
}

export function OperationalWorklist({
  kind,
  initialStage = "",
  initialSearch = "",
}: {
  kind: WorklistKind;
  initialStage?: string;
  initialSearch?: string;
}) {
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [stage, setStage] = useState(initialStage || "all");
  const [recruiter, setRecruiter] = useState("all");
  const [signal, setSignal] = useState("all");
  const [position, setPosition] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() =>
    defaultColumns(kind),
  );
  const [retryVersion, setRetryVersion] = useState(0);
  const [result, setResult] = useState<WorklistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const allColumns = useMemo(() => columnsFor(kind), [kind]);
  const rows = result?.rows ?? [];

  useEffect(() => {
    setSearchInput(initialSearch);
    setSearch(initialSearch);
    setStage(initialStage || "all");
  }, [initialSearch, initialStage]);

  useEffect(() => {
    setVisibleColumns(defaultColumns(kind));
  }, [kind]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      kind,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (stage !== "all") params.set("stage", stage);
    if (recruiter !== "all") params.set("recruiter", recruiter);
    if (signal !== "all") params.set("signal", signal);
    if (position !== "all") params.set("position", position);
    if (status !== "all") params.set("status", status);

    setLoading(true);
    setError("");
    fetch(`/api/worklists?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as WorklistResponse;
        if (!response.ok) {
          throw new Error(body.error ?? "Não foi possível carregar a lista.");
        }
        return body;
      })
      .then(setResult)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return;
        }
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar a lista operacional.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [
    kind,
    page,
    pageSize,
    search,
    stage,
    recruiter,
    signal,
    position,
    status,
    retryVersion,
  ]);

  function updateFilter(setter: (value: string) => void, next: string) {
    setter(next);
    setPage(1);
  }

  function toggleColumn(column: ColumnKey) {
    setVisibleColumns((current) => {
      if (current.includes(column)) {
        return current.filter((value) => value !== column);
      }
      if (current.length >= 6) return current;
      return [...current, column];
    });
  }

  const defaultStageOptions =
    result?.filters.stages.map((option) => ({
      ...option,
      value: option.value === "all" ? "all" : option.value,
    })) ?? [];
  const signalOptions = [
    { value: "all", label: "Todos" },
    ...(result?.filters.signals ?? []),
  ];

  return (
    <div className="operational-worklist">
      <div className="worklist-toolbar">
        <label className="search-field worklist-search">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <span className="sr-only">
            Pesquisar por candidatura, candidato, vaga, cliente ou recrutador
          </span>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Pesquisar em todos os registos…"
          />
        </label>
        <label className="page-size-picker">
          <span>Registos por página</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
        <details className="column-picker">
          <summary>Colunas ({visibleColumns.length}/6)</summary>
          <div className="column-picker-options">
            {allColumns.map((column) => (
              <label key={column}>
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column)}
                  disabled={
                    !visibleColumns.includes(column) &&
                    visibleColumns.length >= 6
                  }
                  onChange={() => toggleColumn(column)}
                />
                {columnDefinitions[column]}
              </label>
            ))}
          </div>
        </details>
      </div>

      <div className="worklist-filter-groups">
        {kind !== "proposals" ? (
          <>
            <FilterGroup
              label="Etapa atingida"
              value={stage}
              options={defaultStageOptions}
              onChange={(value) => updateFilter(setStage, value)}
            />
            <FilterGroup
              label="Recrutador"
              value={recruiter}
              options={[
                { value: "all", label: "Todos" },
                ...(result?.filters.recruiters ?? []),
              ]}
              onChange={(value) => updateFilter(setRecruiter, value)}
            />
            <FilterGroup
              label="Tempo parado · prioridade relativa"
              value={signal}
              options={signalOptions}
              onChange={(value) => updateFilter(setSignal, value)}
            />
          </>
        ) : (
          <>
            <FilterGroup
              label="Exceção salarial"
              value={position}
              options={[
                { value: "all", label: "Todas" },
                ...(result?.filters.positions ?? []),
              ]}
              onChange={(value) => updateFilter(setPosition, value)}
            />
            <FilterGroup
              label="Estado da proposta"
              value={status}
              options={[
                { value: "all", label: "Todos" },
                ...(result?.filters.statuses ?? []),
              ]}
              onChange={(value) => updateFilter(setStatus, value)}
            />
          </>
        )}
      </div>

      <div className="dataset-status" aria-live="polite">
        {error ? (
          <span className="dataset-error">{error}</span>
        ) : result ? (
          <span>
            <b>{result.total.toLocaleString("pt-PT")}</b> registos encontrados
            {search ? ` para “${search}”` : ""} · página {result.total ? result.page : 0} de{" "}
            {result.totalPages} · dados até {formatDate(result.asOf)}
          </span>
        ) : (
          <span>A carregar o conjunto completo…</span>
        )}
        {loading && result ? (
          <span className="loading-label">A atualizar…</span>
        ) : null}
      </div>

      {error ? (
        <div className="dataset-error-box" role="alert">
          {error}
          <button
            className="button-secondary"
            type="button"
            onClick={() => setRetryVersion((current) => current + 1)}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="dataset-table-scroll" aria-busy={loading}>
          <table className="data-table worklist-table">
            <thead>
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    className={
                      ["offer", "band", "expectedSalary", "score", "daysIdle"].includes(
                        column,
                      )
                        ? "num"
                        : undefined
                    }
                    key={column}
                  >
                    {columnDefinitions[column]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${kind}-${row.id}`}>
                  {visibleColumns.map((column) => (
                    <td
                      className={
                        ["offer", "band", "expectedSalary", "score", "daysIdle"].includes(
                          column,
                        )
                          ? "num"
                          : undefined
                      }
                      key={column}
                    >
                      {cellContent(column, row)}
                    </td>
                  ))}
                </tr>
              ))}
              {result && rows.length === 0 ? (
                <tr>
                  <td className="dataset-empty" colSpan={visibleColumns.length}>
                    Não foram encontrados registos com estes filtros.
                  </td>
                </tr>
              ) : null}
              {!result && !error ? (
                <tr>
                  <td className="dataset-empty" colSpan={visibleColumns.length}>
                    A carregar registos…
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <div className="dataset-pagination">
        <span>
          {result?.total
            ? `${((result.page - 1) * result.pageSize + 1).toLocaleString("pt-PT")}–${Math.min(result.page * result.pageSize, result.total).toLocaleString("pt-PT")} de ${result.total.toLocaleString("pt-PT")} registos`
            : "0 registos"}
        </span>
        <div>
          <button
            className="button-secondary"
            type="button"
            disabled={!result || result.page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </button>
          <button
            className="button-secondary"
            type="button"
            disabled={!result || result.page >= result.totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Seguinte
          </button>
        </div>
      </div>
      <p className="source-note">
        A lista inclui todos os registos correspondentes. A prioridade de 14/30
        dias é relativa ao tempo parado e não representa um SLA.
      </p>
    </div>
  );
}
