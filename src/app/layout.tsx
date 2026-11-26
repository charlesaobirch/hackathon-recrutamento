import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
import "./candidaturas.css";

export const metadata: Metadata = {
  title: {
    default: "Farol · Recrutamento",
    template: "%s · Farol",
  },
  description:
    "Torre de controlo do recrutamento: prioridades, ritmo, propostas e qualidade dos dados.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
