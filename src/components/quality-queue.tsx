"use client";

import { useMemo, useState } from "react";
import { Badge, Panel } from "@/components/ui";
import type { QualityIssue } from "@/lib/operational-data";

type CorrectionState = "Por tratar" | "Em correção" | "Resolvido (demo)";

const states: CorrectionState[] = [
  "Por tratar",
  "Em correção",
  "Resolvido (demo)",
];

export function QualityQueue({ issues }: { issues: QualityIssue[] }) {
  const [filter, setFilter] = useState("Todos");
  const [statuses, setStatuses] = useState<Record<string, CorrectionState>>({});
  const visible = useMemo(
    () =>
      issues.filter((issue) => filter === "Todos" || issue.priority === filter),
    [filter, issues],
  );
  const resolved = issues.filter(
    (issue) => statuses[issue.id] === "Resolvido (demo)",
  ).length;
  const openP0 = issues.filter(
    (issue) =>
      issue.priority === "P0" && statuses[issue.id] !== "Resolvido (demo)",
  ).length;
  const progress = issues.length ? (resolved / issues.length) * 100 : 0;

  return (
    <>
      <div className="quality-progress-panel">
        <div>
          <strong>
            {resolved} de {issues.length} resolvidas
          </strong>
          <span>
            {openP0
              ? `${openP0} regras P0 continuam por validar`
              : "P0 marcados como resolvidos nesta demonstração"}
          </span>
        </div>
        <div
          className="quality-progress-track"
          role="progressbar"
          aria-label="Correções marcadas como resolvidas"
          aria-valuemin={0}
          aria-valuemax={issues.length}
          aria-valuenow={resolved}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="quality-controls">
        <fieldset className="priority-filter">
          <legend className="sr-only">Filtrar por severidade</legend>
          <div className="filter-pills">
            {["Todos", "P0", "P1", "P2"].map((priority) => (
              <button
                type="button"
                key={priority}
                aria-pressed={filter === priority}
                className={
                  filter === priority ? "filter-pill selected" : "filter-pill"
                }
                onClick={() => setFilter(priority)}
              >
                {priority}
              </button>
            ))}
          </div>
        </fieldset>
        <span className="muted">
          {visible.length} regras visíveis · P0 bloqueia reporting
        </span>
      </div>

      <Panel
        title="Regras de qualidade"
        meta={
          <Badge tone={openP0 ? "danger" : "warning"}>
            {openP0 ? `${openP0} P0 por validar` : "P0 revistos na demo"}
          </Badge>
        }
      >
        <p className="report-blocked">
          <b>Reporting oficial bloqueado.</b> Mudar o estado nesta fila não
          corrige a origem; o reporting só desbloqueia depois de corrigir e
          validar os dados fonte.
        </p>
        <div className="table-scroll">
          <table className="data-table quality-table">
            <thead>
              <tr>
                <th>Severidade</th>
                <th>Anomalia</th>
                <th>Área</th>
                <th>Estado da correção</th>
                <th>Próxima ação</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((issue) => {
                const status = statuses[issue.id] ?? "Por tratar";
                return (
                  <tr key={issue.id}>
                    <td>
                      <Badge
                        tone={
                          issue.priority === "P0"
                            ? "danger"
                            : issue.priority === "P1"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {issue.priority}
                      </Badge>
                    </td>
                    <td>
                      <b>{issue.title}</b>
                      <small>
                        {issue.count.toLocaleString("pt-PT")} registos ·{" "}
                        {issue.id}
                      </small>
                    </td>
                    <td>{issue.area}</td>
                    <td>
                      <label
                        className="sr-only"
                        htmlFor={`quality-${issue.id}`}
                      >
                        Estado da correção para {issue.id}
                      </label>
                      <select
                        id={`quality-${issue.id}`}
                        className="quality-status-select"
                        value={status}
                        onChange={(event) => {
                          const nextState = states.find(
                            (value) => value === event.target.value,
                          );
                          if (nextState) {
                            setStatuses((current) => ({
                              ...current,
                              [issue.id]: nextState,
                            }));
                          }
                        }}
                      >
                        {states.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{issue.action}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
