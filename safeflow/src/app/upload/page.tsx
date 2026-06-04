"use client";

/**
 * SafeFlow AI - SettingsPage (refatorado)
 *
 * Este componente é 100% UI. Não contém fetch, timers, localStorage ou lógica de negócio.
 * Toda a máquina de estados vive em useVideoUpload(); toda a comunicação com o backend
 * vive em videoUploadService.ts.
 */

import { useState, useCallback } from "react";
import { Topbar } from "@/components/layout/Topbar";
import {
  Upload,
  Film,
  AlertCircle,
  Cpu,
  Zap,
  Clock,
  Sliders,
  Video,
  RotateCcw,
} from "lucide-react";
import { useVideoUpload, type UploadState } from "@/hooks/useVideoUpload";

// ---------------------------------------------------------------------------
// Dados estáticos (fora do componente — não recriados a cada render)
// ---------------------------------------------------------------------------

const ANALYSIS_OPTIONS_DEFAULT = [
  { id: "vehicle",    label: "Detecção de Veículos",    description: "Identifica e rastreia veículos em cena",                  enabled: true  },
  { id: "pedestrian", label: "Detecção de Pedestres",   description: "Monitora pedestres e fluxo de pessoas",                  enabled: true  },
  { id: "anomaly",    label: "Análise de Anomalias",    description: "Detecta comportamentos suspeitos ou perigosos",           enabled: true  },
  { id: "speed",      label: "Estimativa de Velocidade",description: "Estima velocidade de veículos em movimento",             enabled: false },
  { id: "plate",      label: "Leitura de Placas (OCR)", description: "Reconhece e registra placas veiculares",                 enabled: false },
];

const STATE_CONFIG: Record<UploadState, { label: string; colorVar: string }> = {
  idle:       { label: "Aguardando",         colorVar: "var(--text-secondary)"    },
  uploading:  { label: "Transmitindo...",    colorVar: "var(--accent-cyan)"       },
  processing: { label: "IA Analisando Via...",colorVar: "var(--accent-violet)"    },
  done:       { label: "Concluído",          colorVar: "var(--accent-emerald)"    },
  error:      { label: "Falha",              colorVar: "var(--severity-critical)" },
};

const SYSTEM_BADGES = [
  { icon: <Cpu size={14} />,   label: "Modelo Core",    value: "YOLOv8-LiveCore", color: "var(--accent-cyan)"     },
  { icon: <Zap size={14} />,   label: "Processamento",  value: "CPU Realtime",    color: "var(--accent-violet)"   },
  { icon: <Clock size={14} />, label: "Formatos",        value: "MP4, MOV, AVI",  color: "var(--accent-emerald)"  },
] as const;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [activeTab, setActiveTab]   = useState<"modules" | "upload">("modules");
  const [dragOver, setDragOver]     = useState(false);
  const [options, setOptions]       = useState(ANALYSIS_OPTIONS_DEFAULT);

  // Toda a complexidade de upload fica aqui — o componente não sabe nada sobre fetch
  const { fileInfo, startUpload, reset } = useVideoUpload();

  // ---------------------------------------------------------------------------
  // Handlers de UI
  // ---------------------------------------------------------------------------

  const toggleOption = useCallback((id: string) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, enabled: !o.enabled } : o)),
    );
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) startUpload(file);
    },
    [startUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) startUpload(file);
      // Limpa o input para permitir re-upload do mesmo arquivo
      e.target.value = "";
    },
    [startUpload],
  );

  const openFileDialog = useCallback(() => {
    document.getElementById("file-input")?.click();
  }, []);

  // ---------------------------------------------------------------------------
  // Render helpers (evita JSX verboso no corpo principal)
  // ---------------------------------------------------------------------------

  const progressBarColor =
    fileInfo?.state === "processing" ? "var(--accent-violet)" : "var(--accent-cyan)";

  const isActive = fileInfo?.state === "uploading" || fileInfo?.state === "processing";

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <div
      className="flex flex-col flex-1 bg-grid pb-16 lg:pb-0"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <Topbar
        title="Configurações do Sistema"
        subtitle="Ajustes globais, módulos de inteligência artificial e processamento de mídia"
      />

      {/* Tabs */}
      <div
        className="px-6 border-b"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
      >
        <div className="flex gap-4">
          <TabButton
            active={activeTab === "modules"}
            onClick={() => setActiveTab("modules")}
            icon={<Sliders size={14} />}
            label="Módulos Analíticos"
          />
          <TabButton
            active={activeTab === "upload"}
            onClick={() => setActiveTab("upload")}
            icon={<Video size={14} />}
            label="Ingestão de Vídeo"
          />
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ---- Tab: Módulos ---- */}
          {activeTab === "modules" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              <div className="md:col-span-2 rounded-xl border bg-[var(--bg-card)] border-[var(--border-subtle)] p-5">
                <div className="border-b border-[var(--border-subtle)] pb-3 mb-4">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Módulos Ativos do Core
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Ative ou desative algoritmos de inferência executados nas câmeras
                  </p>
                </div>
                <div className="divide-y divide-[var(--border-subtle)]">
                  {options.map((opt) => (
                    <ModuleRow
                      key={opt.id}
                      label={opt.label}
                      description={opt.description}
                      enabled={opt.enabled}
                      onToggle={() => toggleOption(opt.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---- Tab: Upload ---- */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              {/* Badges de sistema */}
              <div className="grid grid-cols-3 gap-3">
                {SYSTEM_BADGES.map((badge) => (
                  <SystemBadge key={badge.label} {...badge} />
                ))}
              </div>

              {/* Drop zone — desabilita durante processamento ativo */}
              <DropZone
                dragOver={dragOver}
                disabled={isActive}
                onDragOver={() => setDragOver(true)}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={openFileDialog}
              />

              <input
                id="file-input"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileInput}
              />

              {/* Erro */}
              {fileInfo?.error && (
                <ErrorBanner message={fileInfo.error} />
              )}

              {/* Card de progresso */}
              {fileInfo && (
                <div className="rounded-lg border p-4 bg-[var(--bg-card)] border-[var(--border-subtle)]">
                  <div className="flex items-start gap-3">
                    <Film size={14} style={{ color: "var(--accent-cyan)", marginTop: 2 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[60%]">
                          {fileInfo.name}
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: STATE_CONFIG[fileInfo.state].colorVar }}
                        >
                          {STATE_CONFIG[fileInfo.state].label}
                        </span>
                      </div>

                      <div className="h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${fileInfo.progress}%`,
                            background: progressBarColor,
                          }}
                        />
                      </div>

                      {fileInfo.state === "done" && (
                        <p className="mt-2 p-2 bg-emerald-500/5 text-emerald-400 text-[11px] rounded border border-emerald-500/10">
                          ✓ Vídeo processado! {fileInfo.resultEvents.length} evento(s) injetado(s) no Mapa tático.
                        </p>
                      )}

                      {(fileInfo.state === "done" || fileInfo.state === "error") && (
                        <button
                          onClick={reset}
                          className="mt-2 flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                        >
                          <RotateCcw size={10} /> Processar outro vídeo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes isolados (sem estado próprio — puramente apresentacionais)
// ---------------------------------------------------------------------------

function TabButton({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors cursor-pointer"
      style={{
        borderColor: active ? "var(--accent-cyan)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ModuleRow({
  label, description, enabled, onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--bg-hover)]/30 px-2 rounded-lg transition-colors"
      onClick={onToggle}
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-[var(--text-primary)]">{label}</div>
        <div className="text-[11px] mt-0.5 text-[var(--text-muted)] truncate">{description}</div>
      </div>
      <div
        className="flex-shrink-0 w-8 h-4 rounded-full transition-all relative"
        style={{
          backgroundColor: enabled ? "var(--accent-cyan)" : "var(--bg-elevated)",
          border: `1px solid ${enabled ? "var(--accent-cyan)" : "var(--border-strong)"}`,
        }}
      >
        <span
          className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-all"
          style={{ left: enabled ? "calc(100% - 12px)" : "2px" }}
        />
      </div>
    </div>
  );
}

function SystemBadge({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-[var(--bg-card)] border-[var(--border-subtle)]">
      <div
        className="flex items-center justify-center w-7 h-7 rounded-md"
        style={{ backgroundColor: `${color}10`, border: `1px solid ${color}20` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">{label}</div>
        <div className="text-xs font-bold text-[var(--text-primary)] mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function DropZone({
  dragOver, disabled, onDragOver, onDragLeave, onDrop, onClick,
}: {
  dragOver: boolean;
  disabled: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}) {
  return (
    <div
      className="relative rounded-xl border border-dashed p-8 flex flex-col items-center justify-center text-center bg-[var(--bg-card)] transition-all"
      style={{
        borderColor: dragOver ? "var(--accent-cyan)" : "var(--border-default)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        pointerEvents: disabled ? "none" : "auto",
      }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
    >
      <Upload size={22} className="mb-2 text-[var(--text-muted)]" />
      <p className="text-xs font-semibold text-[var(--text-primary)]">
        {disabled ? "Processamento em andamento..." : "Arraste o vídeo operacional aqui"}
      </p>
      <p className="text-[11px] text-[var(--text-muted)] mt-1">
        {disabled ? "Aguarde a conclusão para enviar outro arquivo" : "O processamento da IA iniciará imediatamente"}
      </p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center gap-2">
      <AlertCircle size={14} />
      <span>{message}</span>
    </div>
  );
}
