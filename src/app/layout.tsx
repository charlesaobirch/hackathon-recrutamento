import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TalentFlow · Torre de Controlo",
    template: "%s · TalentFlow",
  },
  description: "Acompanhamento operacional do processo de recrutamento.",
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
