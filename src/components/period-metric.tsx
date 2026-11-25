"use client";

import { useState } from "react";
import { Metric } from "@/components/ui";
import {
  type PeriodKey,
  type PeriodValue,
  periodOptions,
} from "@/data/overview-periods";

type Selection = PeriodKey | "total";

export function PeriodMetric({
  label,
  total,
  byPeriod,
  tone = "neutral",
}: {
  label: string;
  total: PeriodValue;
  byPeriod: Record<PeriodKey, PeriodValue>;
  tone?: "neutral" | "danger" | "warning" | "positive";
}) {
  const [selected, setSelected] = useState<Selection>("total");
  const current = selected === "total" ? total : byPeriod[selected];

  const options: { value: Selection; label: string }[] = [
    { value: "total", label: "Total" },
    ...periodOptions.map((option) => ({
      value: option.value,
      label: option.shortLabel,
    })),
  ];

  return (
    <Metric
      label={label}
      value={current.value}
      note={current.note}
      tone={tone}
      footer={
        <fieldset className="period-filter">
          <legend className="sr-only">Filtrar {label} por período</legend>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={selected === option.value ? "is-active" : undefined}
              aria-pressed={selected === option.value}
              onClick={() => setSelected(option.value)}
            >
              {option.label}
            </button>
          ))}
        </fieldset>
      }
    />
  );
}
