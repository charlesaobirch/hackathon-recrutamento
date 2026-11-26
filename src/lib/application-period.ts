export type ApplicationPeriod = "7" | "14" | "30" | "60" | "90" | "all";

export type ApplicationPeriodOption = {
  value: ApplicationPeriod;
  label: string;
  shortLabel: string;
};

export const applicationPeriodOptions: ApplicationPeriodOption[] = [
  { value: "7", label: "7 dias", shortLabel: "7d" },
  { value: "14", label: "14 dias", shortLabel: "14d" },
  { value: "30", label: "30 dias", shortLabel: "30d" },
  { value: "60", label: "60 dias", shortLabel: "60d" },
  { value: "90", label: "90 dias", shortLabel: "90d" },
  { value: "all", label: "Tudo", shortLabel: "Tudo" },
];

export const DEFAULT_APPLICATION_PERIOD: ApplicationPeriod = "90";

export function normalizeApplicationPeriod(
  value?: string | null,
): ApplicationPeriod {
  const match = applicationPeriodOptions.find(
    (option) => option.value === value,
  );
  return match?.value ?? DEFAULT_APPLICATION_PERIOD;
}

export function applicationPeriodDays(period?: string | null) {
  if (!period || period === "all") return null;
  const days = Number(period);
  return Number.isInteger(days) && days > 0 ? days : null;
}

export function applicationPeriodDescription(period: ApplicationPeriod) {
  return period === "all" ? "Todo o histórico" : `Últimos ${period} dias`;
}
