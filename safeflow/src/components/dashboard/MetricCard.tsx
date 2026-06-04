"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  delta: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  accentColor?: string;
  description?: string;
}

export function MetricCard({
  label,
  value,
  delta,
  trend,
  icon,
  accentColor = "var(--accent-cyan)",
  description,
}: MetricCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "var(--accent-emerald)" : trend === "down" ? "var(--severity-critical)" : "var(--text-muted)";

  return (
    /* Sobrescrita controlada via inline-style para restaurar o padding original roubado pelo erro do compilador */
    <div 
      className="rounded-xl border flex flex-col justify-between group transition-all"
      style={{ minHeight: "140px", padding: "24px" }}
    >
      {/* Topo do Card */}
      <div className="flex justify-between items-start w-full">
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block truncate">
            {label}
          </span>
          <div className="text-3xl font-bold tracking-tight tabular-nums text-[var(--text-primary)] mt-2">
            {value}
          </div>
        </div>
        
        {/* Ícone Container */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex-shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
          <div style={{ color: accentColor }} className="scale-85">{icon}</div>
        </div>
      </div>

      {/* Divisor Inferior Sóbrio */}
      <div className="pt-3 border-t border-[var(--border-subtle)]/40 w-full flex items-center justify-between gap-2 text-[11px]">
        <p className="text-[var(--text-muted)] font-medium truncate flex-1">
          {description}
        </p>
        <div
          className="flex items-center gap-0.5 px-2 py-0.5 rounded font-bold flex-shrink-0"
          style={{ backgroundColor: `${trendColor}06`, color: trendColor }}
        >
          <TrendIcon size={10} />
          {delta}
        </div>
      </div>

    </div>
  );
}