"use client";

import { Wifi, WifiOff, Maximize2 } from "lucide-react";

interface CameraFeedProps {
  id: string;
  location: string;
  active: boolean;
  hasAnomaly?: boolean;
  fps?: number;
}

function CameraFeed({ id, location, active, hasAnomaly, fps = 30 }: CameraFeedProps) {
  return (
    <div className="relative rounded-lg overflow-hidden border group bg-[var(--bg-surface)] transition-all"
      style={{
        borderColor: hasAnomaly ? "rgba(244,63,94,0.3)" : "var(--border-subtle)",
        aspectRatio: "16/9",
      }}
    >
      {/* Simulação limpa e profissional de monitor corporativo */}
      <div className="absolute inset-0 bg-neutral-900/40 mix-blend-multiply" />

      {!active && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
          <WifiOff size={16} className="text-[var(--text-muted)]" />
        </div>
      )}

      {/* Badge de Ocorrência sutil e elegante */}
      {hasAnomaly && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-[var(--bg-base)] border border-[var(--severity-critical)]/40 text-[var(--severity-critical)]">
          <span className="w-1 h-1 rounded-full bg-current animate-pulse-glow" />
          ANOMALIA
        </div>
      )}

      {/* Barra de dados inferior limpa */}
      <div className="absolute bottom-0 inset-x-0 px-2.5 py-1.5 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent">
        <div className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full"
            style={{ backgroundColor: active ? "var(--accent-emerald)" : "var(--text-muted)" }} />
          <span className="text-[10px] font-mono font-medium text-[var(--text-primary)]">{id}</span>
        </div>
        {active && (
          <span className="text-[9px] font-mono text-[var(--text-muted)]">{fps} FPS</span>
        )}
      </div>

      {/* Tooltip de Localização */}
      <div className="absolute top-2 left-2">
        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-[var(--text-secondary)] backdrop-blur-xs">
          {location}
        </span>
      </div>

      {/* Camada interativa no hover */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
        <Maximize2 size={14} className="text-[var(--text-primary)] transform translate-y-1 group-hover:translate-y-0 transition-transform" />
      </div>
    </div>
  );
}

const cameras = [
  { id: "CAM-01", location: "Praça Central", active: true, hasAnomaly: false },
  { id: "CAM-03", location: "R. das Flores", active: true, hasAnomaly: true },
  { id: "CAM-07", location: "Av. Brasil", active: true, hasAnomaly: true },
  { id: "CAM-12", location: "Terminal", active: true, hasAnomaly: false },
];

export function LiveCameras() {
  return (
    <div className="rounded-xl border overflow-hidden bg-[var(--bg-card)] border-[var(--border-subtle)]">
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "var(--border-subtle)" }}>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Câmeras ao Vivo
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            4 canais em exibição tática
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-[var(--accent-emerald)]">
          <Wifi size={13} />
          <span>LIVE</span>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
        {cameras.map(cam => (
          <CameraFeed key={cam.id} {...cam} />
        ))}
      </div>
    </div>
  );
}