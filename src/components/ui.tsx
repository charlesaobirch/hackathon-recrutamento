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
        {meta ? <div>{meta}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Metric({
  label,
  value,
  note,
  tone = "neutral",
  delta,
  footer,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "danger" | "warning" | "positive";
  delta?: string;
  footer?: ReactNode;
}) {
  return (
    <section className="metric">
      <span className="metric-label">{label}</span>
      <div className="metric-value-row">
        <strong>{value}</strong>
        {delta ? (
          <span className={`delta ${tone}`}>{delta}</span>
        ) : tone !== "neutral" ? (
          <span className={`delta ${tone}`}>
            {tone === "danger"
              ? "Atenção"
              : tone === "positive"
                ? "↑"
                : "Em análise"}
          </span>
        ) : null}
      </div>
      <span className="metric-note">{note}</span>
      {footer}
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
