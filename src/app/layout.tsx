import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const ui = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: {
    default: "TalentFlow · Torre de Controlo",
    template: "%s · TalentFlow",
  },
  description: "Acompanhamento operacional do processo de recrutamento.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT" className={`${display.variable} ${ui.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
