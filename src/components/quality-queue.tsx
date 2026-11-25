"use client";

import { useMemo, useState } from "react";
import { Badge, Panel } from "@/components/ui";
import { qualityIssues } from "@/lib/recruitment";

type State = "Por tratar" | "Em correção" | "Resolvido (demo)";
const next: Record<State, State> = {
  "Por tratar": "Em correção",
  "Em correção": "Resolvido (demo)",
  "Resolvido (demo)": "Por tratar",
};

export function QualityQueue() {
  const [filter, setFilter] = useState("Todos");
  const [statuses, setStatuses] = useState<Record<string, State>>({});
  const visible = useMemo(
    () =>
      qualityIssues.filter(
        (issue) => filter === "Todos" || issue.priority === filter,
      ),
    [filter],
  );
  const openP0 = qualityIssues.filter(
    (issue) =>
      issue.priority === "P0" && statuses[issue.id] !== "Resolvido (demo)",
  ).length;
  return (
    <>
      <div className="quality-controls">
        <fieldset className="priority-filter">
          <legend className="sr-only">Filtrar por prioridade</legend>
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
          {visible.length} regras prioritárias visíveis
        </span>
      </div>
      <Panel
        title="Anomalias prioritárias"
        meta={
          <Badge tone={openP0 ? "danger" : "warning"}>
            {openP0 ? `${openP0} P0 por tratar` : "P0 revistos na demo"}
          </Badge>
        }
      >
        {openP0 ? (
          <p className="report-blocked">
            <b>Reporting oficial bloqueado.</b> Marcar uma regra como resolvida
            nesta demonstração não corrige nem valida o ficheiro de origem.
          </p>
        ) : (
          <p className="report-blocked cleared">
            <b>P0 revistos na demonstração.</b> A origem continua por corrigir e
            validar.
          </p>
        )}
        <div className="table-scroll">
          <table className="data-table quality-table">
            <thead>
              <tr>
                <th>Prioridade</th>
                <th>Problema identificado</th>
                <th>Área</th>
                <th>Estado da demo</th>
                <th>Correção recomendada</th>
                <th></th>
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
                      <small>{issue.id}</small>
                    </td>
                    <td>{issue.area}</td>
                    <td>
                      <Badge
                        tone={
                          status === "Resolvido (demo)"
                            ? "positive"
                            : status === "Em correção"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {status}
                      </Badge>
                    </td>
                    <td>{issue.action}</td>
                    <td>
                      <button
                        className="table-action"
                        type="button"
                        onClick={() =>
                          setStatuses((previous) => ({
                            ...previous,
                            [issue.id]:
                              next[previous[issue.id] ?? "Por tratar"],
                          }))
                        }
                      >
                        {status === "Resolvido (demo)"
                          ? "Reabrir"
                          : "Avançar estado"}
                      </button>
                    </td>
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
