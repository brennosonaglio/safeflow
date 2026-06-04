"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrafficData } from "@/types";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-3.5 py-2.5 text-xs space-y-1.5 shadow-xl bg-[var(--bg-elevated)] border-[var(--border-default)]">
      <p className="font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-1 mb-1">{label}h</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[var(--text-secondary)]">{p.name}:</span>
          </div>
          <span className="font-mono font-bold tabular-nums text-[var(--text-primary)]">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

interface TrafficChartProps {
  data: TrafficData[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  return (
    <div className="rounded-xl border p-6 bg-[var(--bg-card)] border-[var(--border-subtle)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Volume de Tráfego
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Mapeamento analítico de transeuntes e anomalias registradas
          </p>
        </div>
        <div className="flex gap-3 text-[10px] font-semibold bg-[var(--bg-surface)] px-2.5 py-1 rounded-md border border-[var(--border-subtle)] self-start sm:self-auto">
          {[
            { label: "Veículos", color: "#3b82f6" },
            { label: "Pedestres", color: "#8b5cf6" },
            { label: "Anomalias", color: "#f43f5e" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[var(--text-secondary)] uppercase tracking-wider text-[9px]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recuo interno do gráfico ajustado com margem no topo para criar respiro visual */}
      <ResponsiveContainer width="100%" height={215}>
        <AreaChart data={data} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="gVehicles" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.06} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gPedestrians" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.06} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gAnomalies" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.06} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.012)" vertical={false} />
          <XAxis dataKey="time" tick={{ fill: "#52525b", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#52525b", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.03)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="vehicles" name="Veículos" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gVehicles)" dot={false} activeDot={{ r: 3, fill: "#3b82f6" }} />
          <Area type="monotone" dataKey="pedestrians" name="Pedestres" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#gPedestrians)" dot={false} activeDot={{ r: 3, fill: "#8b5cf6" }} />
          <Area type="monotone" dataKey="anomalies" name="Anomalias" stroke="#f43f5e" strokeWidth={1.5} fill="url(#gAnomalies)" dot={false} activeDot={{ r: 3, fill: "#f43f5e" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}