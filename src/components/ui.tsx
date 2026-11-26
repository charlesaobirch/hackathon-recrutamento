import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action ? <div className="heading-actions">{action}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  meta,
  children,
  className = "",
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h2>{title}</h2>
        {meta ? <div className="panel-meta">{meta}</div> : null}
      </div>
      {children}
    </section>
  );
}

const glyphs: Record<string, ReactNode> = {
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 2.4-4.5 5.5-4.5s4.9 1.5 5.5 4.5M16 5.5a3 3 0 0 1 0 5.8" />
    </>
  ),
  document: (
    <>
      <path d="M7 3.5h7l4 4V20H7z" />
      <path d="M14 3.5v5h5M10 13h5M10 16.5h5" />
    </>
  ),
  check: <path d="m4 12.5 5 5L20 6.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.5 2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 21 20H3z" />
      <path d="M12 9.5v4.5M12 17v.5" />
    </>
  ),
  building: (
    <>
      <path d="M4 20V7l8-4 8 4v13M2.5 20h19" />
      <path d="M8 10h2m4 0h2M8 14h2m4 0h2M10 20v-3h4v3" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </>
  ),
};

function MetricGlyph({ name }: { name: string }) {
  return (
    <span className="metric-glyph" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyphs[name] ?? glyphs.chart}
      </svg>
    </span>
  );
}

export function Metric({
  label,
  value,
  note,
  tone = "neutral",
  delta,
  glyph,
  primary = false,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "danger" | "warning" | "positive";
  delta?: string;
  glyph?: string;
  primary?: boolean;
}) {
  return (
    <section className={`metric metric-card${primary ? " is-primary" : ""}`}>
      <div className="metric-head">
        <span className="metric-label">{label}</span>
        {glyph ? <MetricGlyph name={glyph} /> : null}
      </div>
      <div className="metric-value-row">
        <strong>{value}</strong>
        {delta ? <span className={`delta ${tone}`}>{delta}</span> : null}
      </div>
      <span className="metric-note">{note}</span>
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "danger" | "warning" | "positive" | "info";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Notice({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: ReactNode;
  tone?: "info" | "warning" | "danger";
}) {
  return (
    <aside className={`notice ${tone}`}>
      <span className="notice-mark" aria-hidden="true">
        {tone === "danger" ? "!" : tone === "warning" ? "△" : "i"}
      </span>
      <div>
        <b>{title}</b>
        <p>{children}</p>
      </div>
    </aside>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}
