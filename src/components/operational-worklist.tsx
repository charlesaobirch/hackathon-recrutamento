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
    clients: FilterOption[];
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const interviewTrack = [
  "triagem",
  "entrevista_tecnica",
  "entrevista_cliente",
  "entrevista_final",
] as const;

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
          className="row-link candidate-cell"
          href={`/candidaturas/${encodeURIComponent(row.applicationId)}`}
        >
          <span className="avatar" aria-hidden="true">
            {initials(row.candidateName)}
          </span>
          <span className="candidate-copy">
            <b>{row.candidateName}</b>
            <small>{row.applicationId}</small>
          </span>
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
      return (
        <span className="cell-stack">
          <Badge tone={row.stage === "contratado" ? "positive" : "neutral"}>
            {stageLabel(row.stage)}
          </Badge>
          <span className="stage-track" aria-hidden="true">
            {interviewTrack.map((phase) => {
              const index = interviewTrack.indexOf(phase);
              const isCurrent =
                row.stage === phase ||
                (row.stage === "proposta" && phase === "entrevista_final");
              const isReached =
                row.reachedStages.includes(phase) ||
                row.stage === "proposta" ||
                row.stage === "contratado";
              return (
                <i
                  key={phase}
                  className={
                    isCurrent
                      ? "is-current"
                      : isReached && index < interviewTrack.length
                        ? "is-done"
                        : undefined
                  }
                />
              );
            })}
          </span>
        </span>
      );
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
      return <Badge tone={signalTone(row.signal)}>{signalLabel(row)}</Badge>;
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
    case "proposal":
      return (
        <Link
          className="row-link"
          href={`/propostas/${encodeURIComponent(row.id)}`}
        >
          <b>{row.id}</b>
          <small>Validar oferta · {row.candidateName}</small>
        </Link>
      );
    case "offer":
      return formatMoney(row.offer);
    case "band":
      if (row.salaryMin === null || row.salaryMax === null) {
        return <span className="muted">Banda indisponível</span>;
      }
      {
        const min = row.salaryMin;
        const max = row.salaryMax;
        if (min === null || max === null) return null;
        const position = (value: number | null) =>
          value === null
            ? null
            : `${Math.min(100, Math.max(0, ((value - min) / (max - min || 1)) * 100))}%`;
        const expectationPosition = position(row.expectedSalary);
        const offerPosition = position(row.offer);
        return (
          <span
            className="salary-band-cell"
            role="img"
            aria-label={`Banda ${formatMoney(min)} a ${formatMoney(max)}${row.expectedSalary === null ? "" : `; expectativa ${formatMoney(row.expectedSalary)}`}${row.offer === null ? "" : `; oferta ${formatMoney(row.offer)}`}`}
          >
            <span className="salary-band-range">
              {formatMoney(min)} <i>—</i> {formatMoney(max)}
            </span>
            <span className="salary-band-track" aria-hidden="true">
              <i className="salary-band-limit start" />
              <i className="salary-band-limit end" />
              {expectationPosition ? (
                <i
                  className="salary-band-marker expectation"
                  style={{ left: expectationPosition }}
                />
              ) : null}
              {offerPosition ? (
                <i
                  className="salary-band-marker offer"
                  style={{ left: offerPosition }}
                />
              ) : null}
            </span>
            <span className="salary-band-legend" aria-hidden="true">
              {expectationPosition ? (
                <small>
                  <i className="expectation-key" /> Expectativa
                </small>
              ) : null}
              {offerPosition ? (
                <small>
                  <i className="offer-key" /> Oferta
                </small>
              ) : null}
            </span>
          </span>
        );
      }
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
  initialSignal = "all",
  initialPeriod = "all",
}: {
  kind: WorklistKind;
  initialStage?: string;
  initialSearch?: string;
  initialSignal?: string;
  initialPeriod?: string;
}) {
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [stage, setStage] = useState(initialStage || "all");
  const [recruiter, setRecruiter] = useState("all");
  const [client, setClient] = useState("all");
  const [signal, setSignal] = useState(initialSignal);
  const [period, setPeriod] = useState(initialPeriod);
  const [position, setPosition] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(kind === "waiting" ? 8 : 20);
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
    setSignal(initialSignal);
    setPeriod(initialPeriod);
  }, [initialSearch, initialStage, initialSignal, initialPeriod]);

  useEffect(() => {
    setVisibleColumns(defaultColumns(kind));
    setPageSize(kind === "waiting" ? 8 : 20);
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
      retry: String(retryVersion),
    });
    if (search) params.set("search", search);
    if (stage !== "all") params.set("stage", stage);
    if (recruiter !== "all") params.set("recruiter", recruiter);
    if (client !== "all") params.set("client", client);
    if (signal !== "all") params.set("signal", signal);
    if (period !== "all") params.set("period", period);
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
    client,
    signal,
    period,
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
  const activeFilterCount = [
    stage !== "all",
    recruiter !== "all",
    client !== "all",
    signal !== "all",
    period !== "all",
    position !== "all",
    status !== "all",
  ].filter(Boolean).length;

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
            placeholder="Pesquisar candidato, vaga ou ID…"
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
            {kind === "waiting" ? <option value={8}>8</option> : null}
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

      <details className="worklist-filters">
        <summary>
          Filtros
          {activeFilterCount ? (
            <span className="filter-count">{activeFilterCount}</span>
          ) : null}
        </summary>
        <div className="worklist-filter-groups">
          <FilterGroup
            label="Cliente"
            value={client}
            options={[
              { value: "all", label: "Todos" },
              ...(result?.filters.clients ?? []),
            ]}
            onChange={(value) => updateFilter(setClient, value)}
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
          {kind !== "proposals" ? (
            <>
              <FilterGroup
                label="Data de candidatura"
                value={period}
                options={[
                  { value: "recent", label: "Últimos 90 dias" },
                  { value: "old", label: "Mais de 90 dias / sem data" },
                  { value: "all", label: "Todo o histórico" },
                ]}
                onChange={(value) => updateFilter(setPeriod, value)}
              />
              <FilterGroup
                label="Etapa atingida"
                value={stage}
                options={defaultStageOptions}
                onChange={(value) => updateFilter(setStage, value)}
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
      </details>

      <div className="dataset-status" aria-live="polite">
        {error ? (
          <span className="dataset-error">{error}</span>
        ) : result ? (
          <span>
            <b>{result.total.toLocaleString("pt-PT")}</b> registos encontrados
            {search ? ` para “${search}”` : ""} · página{" "}
            {result.total ? result.page : 0} de {result.totalPages} · dados até{" "}
            {formatDate(result.asOf)}
          </span>
        ) : (
          <span>A carregar os registos correspondentes…</span>
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
                      ["offer", "band", "expectedSalary", "daysIdle"].includes(
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
                        [
                          "offer",
                          "band",
                          "expectedSalary",
                          "daysIdle",
                        ].includes(column)
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
