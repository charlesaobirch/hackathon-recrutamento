"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, Suspense } from "react";

const items = [
  { href: "/", label: "Visão geral", icon: "grid" },
  { href: "/pipeline", label: "Pipeline", icon: "pipeline" },
  { href: "/candidaturas", label: "Candidaturas", icon: "people" },
  { href: "/propostas", label: "Propostas", icon: "document" },
  { href: "/clientes", label: "Clientes", icon: "building" },
  { href: "/qualidade", label: "Qualidade", icon: "shield" },
  { href: "/dados", label: "Dados", icon: "database" },
];

function Icon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
        <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
        <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
        <rect x="14.5" y="14.5" width="6" height="6" rx="1" />
      </>
    ),
    pipeline: (
      <>
        <path d="M4 5h5v5H4zM15 14h5v5h-5zM9 7.5h4a3 3 0 0 1 3 3V14" />
        <path d="m13 12 3 3 3-3" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.6-3 2.4-4.5 5.5-4.5s4.9 1.5 5.5 4.5M16 5.5a3 3 0 0 1 0 5.8M17 15c2.2.4 3.5 1.7 4 4" />
      </>
    ),
    document: (
      <>
        <path d="M7 3.5h7l4 4V20H7z" />
        <path d="M14 3.5v5h5M10 13h5M10 16.5h5" />
      </>
    ),
    building: (
      <>
        <path d="M4 20V7l8-4 8 4v13M2.5 20h19" />
        <path d="M8 10h2m4 0h2M8 14h2m4 0h2M10 20v-3h4v3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 19 6v5c0 4.6-2.6 7.8-7 10-4.4-2.2-7-5.4-7-10V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="17"
      height="17"
      {...common}
    >
      {paths[name]}
    </svg>
  );
}

function ShellFrame({
  children,
  pathname,
}: {
  children: ReactNode;
  pathname?: string;
}) {
  const active = pathname
    ? items.find((item) =>
        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
      )?.href
    : undefined;

  return (
    <div className="app-frame">
      <div className="app-shell">
        <header className="topbar">
          <Link href="/" className="brand" aria-label="TalentFlow, início">
            <span className="brand-mark">T</span>
            <span>TalentFlow</span>
          </Link>
          <nav className="top-nav" aria-label="Navegação principal">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-tab${active === item.href ? " is-active" : ""}`}
                aria-current={active === item.href ? "page" : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <form action="/candidaturas" method="get" className="global-search">
              <label className="sr-only" htmlFor="global-search">
                Pesquisar em todos os registos de candidatura
              </label>
              <span className="search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                id="global-search"
                name="q"
                type="search"
                placeholder="Pesquisar registos…"
              />
            </form>
            <details className="exploration-disclosure">
              <summary>
                <span className="exploration-dot" />
                Modo exploratório
              </summary>
              <div className="exploration-popover">
                <b>Limitações dos dados e ações</b>
                <ul>
                  <li>Os nomes apresentados são fictícios.</li>
                  <li>As etapas e métricas são derivadas dos eventos de origem.</li>
                  <li>Correções e validações nesta interface não alteram os JSON.</li>
                  <li>Relatórios oficiais exigem correção e validação das regras P0.</li>
                </ul>
              </div>
            </details>
          </div>
        </header>
        <main className="workspace">{children}</main>
      </div>
    </div>
  );
}

function RouteAwareShell({ children }: { children: ReactNode }) {
  return <ShellFrame pathname={usePathname()}>{children}</ShellFrame>;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellFrame>{children}</ShellFrame>}>
      <RouteAwareShell>{children}</RouteAwareShell>
    </Suspense>
  );
}
