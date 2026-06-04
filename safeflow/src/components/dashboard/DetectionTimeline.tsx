"use client";

import { TimelineEntry, AnomalySeverity } from "@/types";

const severityColor: Record<AnomalySeverity, string> = {
  critical: "var(--severity-critical)",
  high: "var(--severity-high)",
  medium: "var(--severity-medium)",
  low: "var(--severity-low)",
};

interface DetectionTimelineProps {
  entries: TimelineEntry[];
}

export function DetectionTimeline({ entries }: DetectionTimelineProps) {
  return (
    <div className="rounded-xl border overflow-hidden bg-[var(--bg-card)] border-[var(--border-subtle)]">
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Timeline de Detecção
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Atividades nas últimas 24 horas
        </p>
      </div>

      <div className="p-5">
        <div className="relative">
          {/* Linha guia de opacidade reduzida */}
          <div className="absolute left-[13px] top-2 bottom-2 w-px bg-[var(--border-subtle)]" />

          {/* O espaçamento vertical foi elevado para space-y-6 para dar respiro aos blocos */}
          <div className="space-y-6">
            {entries.map((entry, i) => (
              <div key={i} className="flex items-start gap-4 relative group">
                
                {/* Bullet Premium */}
                <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center z-10 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: entry.resolved ? "var(--accent-emerald)" : severityColor[entry.severity] }} 
                  />
                </div>

                {/* Conteúdo de Texto */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {entry.event}
                    </p>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] flex-shrink-0">
                      {entry.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      {entry.camera}
                    </span>
                    <span className="text-[9px] font-bold tracking-wide"
                      style={{ color: entry.resolved ? "var(--accent-emerald)" : severityColor[entry.severity] }}>
                      {entry.resolved ? "RESOLVIDO" : "ATIVO"}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}