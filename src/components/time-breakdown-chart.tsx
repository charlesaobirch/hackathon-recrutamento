"use client";

import { type CSSProperties, useState } from "react";

const CYCLE_DAYS = 40;
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Stage = {
  label: string;
  days: number;
  detail: string;
  critical?: boolean;
};

const STAGES: readonly Stage[] = [
  {
    label: "1.ª entrevista",
    days: 3,
    detail: "Da candidatura à primeira entrevista registada.",
  },
  {
    label: "Entrevistas",
    days: 6,
    detail: "Entre a primeira e a última entrevista registadas.",
  },
  {
    label: "Espera entre entrevista e proposta",
    days: 27,
    detail: "O maior bloco do ciclo: mais de dois terços do tempo mediano.",
    critical: true,
  },
  {
    label: "Proposta → contratação",
    days: 3,
    detail: "Da emissão da proposta à contratação efetiva.",
  },
];

type View = "stage" | "cumulative";

function percent(value: number) {
  return `${((value / CYCLE_DAYS) * 100).toLocaleString("pt-PT", {
    maximumFractionDigits: 1,
  })}%`;
}

export function TimeBreakdownChart() {
  const [view, setView] = useState<View>("stage");
  const [selected, setSelected] = useState<number | null>(2);
  const [preview, setPreview] = useState<number | null>(null);

  const active = preview ?? selected;
  let running = 0;
  const rows = STAGES.map((stage) => {
    running += stage.days;
    return { ...stage, cumulative: running };
  });

  const detail =
    active === null
      ? `A espera entre a última entrevista e a proposta domina o ciclo: 27 dias, ${percent(27)} dos ${CYCLE_DAYS} dias medianos.`
      : view === "stage"
        ? `${rows[active].label}: mediana de ${rows[active].days} dias (${percent(rows[active].days)} do ciclo). ${rows[active].detail}`
        : `Até "${rows[active].label}": ${rows[active].cumulative} dias acumulados (${percent(rows[active].cumulative)} do ciclo).`;

  return (
    <div className="time-chart">
      <div className="time-chart-toolbar">
        <span className="time-chart-caption">
          Ciclo mediano · {CYCLE_DAYS} dias
        </span>
        <div className="time-view-toggle">
          <button
            type="button"
            className={view === "stage" ? "is-active" : undefined}
            aria-pressed={view === "stage"}
            aria-label="Ver tempos por etapa"
            onClick={() => setView("stage")}
          >
            Por etapa
          </button>
          <button
            type="button"
            className={view === "cumulative" ? "is-active" : undefined}
            aria-pressed={view === "cumulative"}
            aria-label="Ver tempos acumulados"
            onClick={() => setView("cumulative")}
          >
            Acumulado
          </button>
        </div>
      </div>

      <div className="time-donuts">
        {rows.map((stage, index) => {
          const value = view === "stage" ? stage.days : stage.cumulative;
          const arc = CIRCUMFERENCE * Math.min(value / CYCLE_DAYS, 1);
          return (
            <button
              type="button"
              key={stage.label}
              className={`time-donut-card${stage.critical ? " time-critical" : ""}${
                active === index ? " is-active" : ""
              }`}
              aria-pressed={selected === index}
              aria-label={`${stage.label}: ${value} dias, ${percent(value)} do ciclo. Ver detalhe.`}
              onMouseEnter={() => setPreview(index)}
              onMouseLeave={() => setPreview(null)}
              onFocus={() => setPreview(index)}
              onBlur={() => setPreview(null)}
              onClick={() => setSelected(index)}
            >
              <span className="time-donut-visual">
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <circle
                    className="time-donut-track"
                    cx="50"
                    cy="50"
                    r={RADIUS}
                  />
                  <circle
                    key={view}
                    className="time-donut-arc"
                    cx="50"
                    cy="50"
                    r={RADIUS}
                    style={
                      {
                        "--dash": `${arc}px`,
                        animationDelay: `${index * 90}ms`,
                      } as CSSProperties
                    }
                  />
                </svg>
                <span className="time-donut-center">
                  <b>{value}</b>
                  <small>dias</small>
                </span>
              </span>
              <span className="time-donut-share">
                {percent(value)} do ciclo
              </span>
              <span className="time-donut-label">{stage.label}</span>
            </button>
          );
        })}
      </div>

      <p className="time-detail" aria-live="polite">
        {detail}
      </p>
    </div>
  );
}
