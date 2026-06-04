"use client";

import { useState } from "react";
import { AnomalyEvent, AnomalySeverity, AnomalyStatus } from "@/types";
import { ChevronRight } from "lucide-react";

const severityLabel: Record<AnomalySeverity, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
};

const statusLabel: Record<AnomalyStatus, string> = {
  active: "Ativo",
  investigating: "Triagem",
  resolved: "Resolvido",
  dismissed: "Descartado",
};

const statusColor: Record<AnomalyStatus, string> = {
  active: "var(--severity-critical)",
  investigating: "var(--severity-high)",
  resolved: "var(--accent-emerald)",
  dismissed: "var(--text-muted)",
};

interface EventsTableProps {
  events: AnomalyEvent[];
}

export function EventsTable({ events }: EventsTableProps) {
  const [filter, setFilter] = useState<AnomalySeverity | "all">("all");
  const filtered = filter === "all" ? events : events.filter(e => e.severity === filter);

  return (
    <div className="rounded-xl border overflow-hidden bg-[var(--bg-card)] border-[var(--border-subtle)] shadow-xs" style={{ padding: "0px" }}>

      {/* Cabeçalho superior com espaçamento interno corrigido */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b"
        style={{ borderColor: "var(--border-subtle)" }}>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Eventos Detectados
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Histórico de anomalias operacionais tratadas pelo core analítico
          </p>
        </div>
        
        {/* Abas de Filtragem Sóbrias */}
        <div className="flex gap-1 bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border-subtle)] overflow-x-auto">
          {(["all", "critical", "high", "medium", "low"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: filter === s ? "var(--bg-elevated)" : "transparent",
                color: filter === s ? "var(--text-primary)" : "var(--text-secondary)",
                border: filter === s ? "1px solid var(--border-default)" : "1px solid transparent",
              }}>
              {s === "all" ? "Todos" : severityLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela com margens amplas e alinhamento corrigido */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/40 text-[var(--text-muted)] text-[10px] font-semibold uppercase tracking-wider">
              <th className="px-6 py-3.5">ID</th>
              <th className="px-6 py-3.5">Horário</th>
              <th className="px-6 py-3.5">Câmera</th>
              <th className="px-6 py-3.5">Tipo de Anomalia</th>
              <th className="px-6 py-3.5">Severidade</th>
              <th className="px-6 py-3.5">Confiança</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-4 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]/40 text-xs">
            {filtered.map((event) => (
              <tr key={event.id} className="transition-colors hover:bg-[var(--bg-hover)]/30">
                <td className="px-6 py-5 font-mono font-semibold text-[var(--text-primary)]">
                  {event.id}
                </td>
                <td className="px-6 py-5 font-mono text-[var(--text-secondary)]">
                  {event.timestamp.split(" ")[1]}
                </td>
                <td className="px-6 py-5">
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    {event.camera}
                  </span>
                </td>
                <td className="px-6 py-5 font-medium text-[var(--text-primary)]">
                  {event.type}
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border severity-bg-${event.severity} severity-${event.severity}`}>
                    {severityLabel[event.severity]}
                  </span>
                </td>
                <td className="px-6 py-5 font-mono text-[var(--text-secondary)] tabular-nums">
                  {event.confidence}%
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor[event.status] }} />
                    <span className="font-medium text-[var(--text-primary)]">
                      {statusLabel[event.status]}
                    </span>
                  </div>
                </td>
                {/* SOLUÇÃO: Propriedade corrigida para textAlign para passar sem erros no build */}
                <td style={{ textAlign: "right", paddingRight: "24px" }}>
                  <ChevronRight size={14} className="text-[var(--text-muted)] inline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}