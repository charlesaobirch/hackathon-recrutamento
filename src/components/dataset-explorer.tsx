"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  DATASETS,
  type DatasetName,
  type DatasetRow,
} from "@/lib/dataset-config";

type DatasetResponse = {
  table: DatasetName;
  fields: string[];
  rows: DatasetRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
};

function formatCell(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function fieldLabel(field: string) {
  return field
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toLocaleUpperCase("pt-PT"));
}

function rowHref(table: DatasetName, row: DatasetRow) {
  const id = row.id;
  if (typeof id !== "string") return null;
  if (table === "candidaturas")
    return `/candidaturas/${encodeURIComponent(id)}`;
  if (table === "propostas") return `/propostas/${encodeURIComponent(id)}`;
  return null;
}

export function DatasetExplorer({
  initialTable = "candidaturas",
  showDatasetPicker = false,
  initialPageSize = 25,
}: {
  initialTable?: DatasetName;
  showDatasetPicker?: boolean;
  initialPageSize?: number;
}) {
  const [table, setTable] = useState<DatasetName>(initialTable);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<DatasetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const current = useMemo(
    () => DATASETS.find((dataset) => dataset.id === table),
    [table],
  );

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
      table,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    setLoading(true);
    setError("");

    fetch(`/api/datasets?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as DatasetResponse;
        if (!response.ok)
          throw new Error(
            body.error ?? "Não foi possível carregar os registos.",
          );
        return body;
      })
      .then(setResult)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar os registos.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [table, page, pageSize, search]);

  function chooseTable(value: string) {
    const dataset = DATASETS.find((item) => item.id === value);
    if (!dataset) return;
    setTable(dataset.id);
    setPage(1);
    setSearchInput("");
    setSearch("");
    setResult(null);
  }

  return (
    <div className="dataset-explorer">
      <div className="dataset-toolbar">
        {showDatasetPicker ? (
          <label className="dataset-picker">
            <span>Tabela</span>
            <select
              value={table}
              onChange={(event) => chooseTable(event.target.value)}
            >
              {DATASETS.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="search-field dataset-search">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <span className="sr-only">Pesquisar em todos os campos</span>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={`Pesquisar em ${current?.label.toLocaleLowerCase("pt-PT") ?? "registos"}…`}
          />
        </label>
        <label className="page-size-picker">
          <span>Linhas</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>
      <div className="dataset-status" aria-live="polite">
        {error ? (
          <span className="dataset-error">{error}</span>
        ) : result ? (
          <span>
            <b>{result.total.toLocaleString("pt-PT")}</b> registos
            {search ? ` para “${search}”` : ""} · página{" "}
            {result.total ? result.page : 0} de {result.totalPages}
          </span>
        ) : (
          <span>A carregar {current?.label.toLocaleLowerCase("pt-PT")}…</span>
        )}
        {loading && result ? (
          <span className="loading-label">A atualizar…</span>
        ) : null}
      </div>
      {error ? (
        <div className="dataset-error-box" role="alert">
          {error} Tenta novamente ou muda de tabela.
        </div>
      ) : null}
      {!error ? (
        <div className="dataset-table-scroll" aria-busy={loading}>
          <table className="data-table dataset-table">
            <thead>
              <tr>
                {(result?.fields ?? []).map((field) => (
                  <th key={field}>{fieldLabel(field)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result?.rows.map((row, rowIndex) => {
                const href = rowHref(table, row);
                return (
                  <tr key={`${String(row.id ?? "registo")}-${rowIndex}`}>
                    {result.fields.map((field) => {
                      const value = formatCell(row[field]);
                      return (
                        <td key={field}>
                          {href && field === "id" ? (
                            <Link className="dataset-record-link" href={href}>
                              {value}
                            </Link>
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {result && result.rows.length === 0 ? (
                <tr>
                  <td
                    className="dataset-empty"
                    colSpan={Math.max(result.fields.length, 1)}
                  >
                    {search
                      ? "Nenhum registo corresponde à pesquisa."
                      : "Esta tabela não contém registos."}
                  </td>
                </tr>
              ) : null}
              {!result && !error ? (
                <tr>
                  <td className="dataset-empty" colSpan={1}>
                    {loading ? "A carregar registos…" : ""}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="dataset-pagination">
        <span>
          {result?.total
            ? `${(result.page - 1) * result.pageSize + 1}–${Math.min(result.page * result.pageSize, result.total)} de ${result.total.toLocaleString("pt-PT")}`
            : "0 registos"}
        </span>
        <div>
          <button
            className="button-secondary"
            type="button"
            disabled={!result || result.page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Anterior
          </button>
          <button
            className="button-secondary"
            type="button"
            disabled={!result || result.page >= result.totalPages || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            Seguinte
          </button>
        </div>
      </div>
    </div>
  );
}
