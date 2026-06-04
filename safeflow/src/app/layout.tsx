import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "SafeFlow — AI Traffic Intelligence",
  description: "Dashboard de análise de anomalias de tráfego com IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 flex flex-col min-h-screen overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
