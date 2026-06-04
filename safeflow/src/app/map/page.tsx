"use client";

import { useState, useMemo, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import {
  Video,
  Search,
  Activity,
  Clock,
  ChevronRight,
  Radio,
  ZapOff,
  Flame,
  HeartPulse,
  Navigation,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface AiBox {
  label: string;
  conf: string;
  top: string;
  left: string;
  w: string;
  h: string;
  color: string;
}

interface MapCamera {
  id: string;
  name: string;
  region: "Norte" | "Sul" | "Leste" | "Oeste" | "Centro";
  city: string;
  status: "online" | "offline" | "alert";
  incident: "accident" | "congestion" | "stopped_vehicle" | "none";
  location: string;
  fullLocation: string;
  lastUpdate: string;
  events: number;
  aiActive: boolean;
  x: number;
  y: number;
  risk: "low" | "medium" | "high";
  lastDetection: string;
  lastAnalysis: string;
  recentEvents: string[];
  aiBoxes: AiBox[];
  livePayload?: any;
}

// ---------------------------------------------------------------------------
// Dados estáticos (fora do componente)
// ---------------------------------------------------------------------------

const INITIAL_CAMERAS: MapCamera[] = [
  {
    id: "CAM-01",
    name: "CAM-01 - Rodovia Ayrton Senna, Km 18",
    region: "Leste",
    city: "São Paulo",
    status: "online",
    incident: "none",
    location: "Complexo Viário Penha",
    fullLocation: "Rodovia Ayrton Senna, Km 18 - Sentido Interior",
    lastUpdate: "18:12",
    events: 0,
    aiActive: true,
    x: 74,
    y: 38,
    risk: "low",
    lastDetection: "Fluxo livre em conformidade operacional",
    lastAnalysis: "18:22:45",
    recentEvents: ["14:22 - Filtro adaptativo de ruído térmico calibrado"],
    aiBoxes: [
      { label: "Carro", conf: "92%", top: "40%", left: "20%", w: "60px", h: "50px", color: "var(--accent-cyan)" },
      { label: "Carro", conf: "96%", top: "22%", left: "60%", w: "70px", h: "55px", color: "var(--accent-blue)" },
    ],
  },
  {
    id: "CAM-03",
    name: "CAM-03 - Marginal Tietê, Alça Ponte Freguesia",
    region: "Norte",
    city: "São Paulo",
    status: "alert",
    incident: "congestion",
    location: "Ponte da Freguesia do Ó",
    fullLocation: "Marginal Tietê, Sentido Castelo Branco, Km 12",
    lastUpdate: "18:24",
    events: 3,
    aiActive: true,
    x: 35,
    y: 25,
    risk: "high",
    lastDetection: "Retenção severa decorrente de impacto cinético na faixa 01",
    lastAnalysis: "18:24:10",
    recentEvents: ["18:24 - Alerta Crítico: Desaceleração brusca detectada pela IA"],
    aiBoxes: [
      { label: "CONGESTIONAMENTO", conf: "98%", top: "35%", left: "25%", w: "160px", h: "100px", color: "var(--severity-critical)" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function LiveMapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [incidentFilter, setIncidentFilter] = useState("all");
  const [dispatchStatus, setDispatchStatus] = useState<"idle" | "dispatched">("idle");
  const [camerasList, setCamerasList] = useState<MapCamera[]>(INITIAL_CAMERAS);
  const [selectedCamera, setSelectedCamera] = useState<MapCamera | null>(INITIAL_CAMERAS[0]);

  // Relógio
  const [timeString, setTimeString] = useState("");
  useEffect(() => {
    setTimeString(new Date().toLocaleTimeString("pt-BR"));
    const t = setInterval(() => setTimeString(new Date().toLocaleTimeString("pt-BR")), 1000);
    return () => clearInterval(t);
  }, []);

  // Carrega eventos reais do localStorage (resultado do upload + YOLO)
  useEffect(() => {
    const raw = localStorage.getItem("safeflow_real_events");
    if (!raw) return;

    let events: any[] = [];
    try { events = JSON.parse(raw); } catch { return; }
    if (!events.length) return;

    const latest = events[0];

    // ── Boxes reais do backend (normalizadas 0.0–1.0) ──────────────────────
    // Se o backend já mandou detected_boxes, usa elas direto.
    // Se não (vídeo processado antes da atualização), cai no fallback antigo.
    const detectedBoxes: any[] = latest.incident_details?.detected_boxes ?? [];

    let dynamicBoxes: AiBox[];

    if (detectedBoxes.length > 0) {
      // Converte de fração (0.0-1.0) para string percentual para o CSS
      dynamicBoxes = detectedBoxes.map((b: any) => {
        const topPct   = (b.y1_pct * 100).toFixed(1) + "%";
        const leftPct  = (b.x1_pct * 100).toFixed(1) + "%";
        const widthPct = ((b.x2_pct - b.x1_pct) * 100).toFixed(1) + "%";
        const heightPct= ((b.y2_pct - b.y1_pct) * 100).toFixed(1) + "%";

        const isVehicle = b.label !== "Pedestre";
        return {
          label: b.label.toUpperCase(),
          conf: `${b.confidence}%`,
          top: topPct,
          left: leftPct,
          w: widthPct,
          h: heightPct,
          color: isVehicle ? "var(--severity-critical)" : "var(--accent-violet)",
        };
      });
    } else {
      // Fallback para eventos antigos sem detected_boxes
      dynamicBoxes = (latest.incident_details?.vehicles_involved ?? []).map(
        (vehicle: string, idx: number) => ({
          label: vehicle.toUpperCase(),
          conf: `${latest.confidence}%`,
          top: `${25 + idx * 18}%`,
          left: `${15 + idx * 15}%`,
          w: "110px",
          h: "75px",
          color: "var(--severity-critical)",
        })
      );
      dynamicBoxes.unshift({
        label: "COLISÃO DETECTADA",
        conf: `${latest.confidence}%`,
        top: "42%",
        left: "30%",
        w: "180px",
        h: "110px",
        color: "var(--severity-critical)",
      });
    }

    const ingestCam: MapCamera = {
      id: latest.camera ?? "CAM-INGESTÃO",
      name: `INGESTÃO — ${(latest.type ?? "").toUpperCase()}`,
      region: "Centro",
      city: "São Paulo",
      status: "alert",
      incident: "accident",
      location: latest.location ?? "Canal de Vídeo Importado",
      fullLocation: "Eixo Rodoviário Concessionado — Monitoramento de Mídia Externa",
      lastUpdate: (latest.timestamp ?? "").split(" ")[1] ?? "--:--",
      events: events.length,
      aiActive: true,
      x: 52,
      y: 55,
      risk: "high",
      lastDetection: latest.description ?? "",
      lastAnalysis: latest.timestamp ?? "",
      recentEvents: events.map((e: any) => `${(e.timestamp ?? "").split(" ")[1]} - ${e.type}`),
      aiBoxes: dynamicBoxes,
      livePayload: latest,
    };

    setCamerasList([ingestCam, ...INITIAL_CAMERAS]);
    setSelectedCamera(ingestCam);
  }, []);

  // Filtragem
  const filteredCameras = useMemo(() => {
    return camerasList.filter((cam) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        cam.name.toLowerCase().includes(q) ||
        cam.id.toLowerCase().includes(q) ||
        cam.location.toLowerCase().includes(q);
      return (
        matchSearch &&
        (regionFilter === "all" || cam.region === regionFilter) &&
        (cityFilter === "all" || cam.city === cityFilter) &&
        (statusFilter === "all" || cam.status === statusFilter) &&
        (incidentFilter === "all" || cam.incident === incidentFilter)
      );
    });
  }, [searchQuery, regionFilter, cityFilter, statusFilter, incidentFilter, camerasList]);

  const uniqueCities = useMemo(
    () => Array.from(new Set(camerasList.map((c) => c.city))),
    [camerasList],
  );

  const selectCamera = (cam: MapCamera) => {
    setSelectedCamera(cam);
    setDispatchStatus("idle");
  };

  const isAlert = selectedCamera?.status === "alert";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col flex-1 pb-20 lg:pb-0 bg-[var(--bg-base)]">
      <Topbar
        title="Monitoramento Cartográfico Tático"
        subtitle="Painel unificado de geolocalização viária e inferências neurais de tráfego"
      />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

        {/* ── Filtros ── */}
        <div className="rounded-xl border bg-[var(--bg-card)] border-[var(--border-subtle)] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Busca */}
            <div className="relative flex items-center h-9">
              <Search
                size={13}
                className="absolute left-3 text-[var(--text-muted)] pointer-events-none"
              />
              <input
                type="text"
                placeholder="ID ou localização..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full rounded-lg border text-xs bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none placeholder-[var(--text-muted)] pl-9 pr-3"
              />
            </div>

            {[
              {
                value: regionFilter, setter: setRegionFilter,
                options: [["all", "Todas as Regiões"], ["Centro", "Centro"], ["Norte", "Norte"], ["Sul", "Sul"], ["Leste", "Leste"]],
              },
              {
                value: cityFilter, setter: setCityFilter,
                options: [["all", "Todas as Cidades"], ...uniqueCities.map((c) => [c, c])],
              },
              {
                value: statusFilter, setter: setStatusFilter,
                options: [["all", "Todos os Status"], ["online", "Online"], ["alert", "Em Alerta"]],
              },
              {
                value: incidentFilter, setter: setIncidentFilter,
                options: [["all", "Todos os Incidentes"], ["accident", "Acidente"], ["congestion", "Congestionamento"]],
              },
            ].map(({ value, setter, options }, i) => (
              <select
                key={i}
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="px-3 h-9 rounded-lg border text-xs bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-none cursor-pointer"
              >
                {options.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* ── Grid principal ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

          {/* ── Coluna esquerda (3/4) ── */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* Card do player */}
            <div className="rounded-xl border bg-[var(--bg-card)] border-[var(--border-subtle)] p-5 flex flex-col gap-4">

              {/* Cabeçalho do canal */}
              <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono font-bold text-[var(--accent-cyan)] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    {selectedCamera?.id ?? "SISTEMA"}
                  </span>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1.5 truncate">
                    {selectedCamera?.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-mono text-[var(--text-muted)] hidden sm:block">
                    COORD: {selectedCamera?.x}°N {selectedCamera?.y}°W
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                      isAlert
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {isAlert ? "OCORRÊNCIA CRÍTICA" : "FEED ESTÁVEL"}
                  </span>
                </div>
              </div>

              {/* ── Player de vídeo ── */}
              <div className="relative w-full rounded-lg border border-[var(--border-default)] overflow-hidden bg-zinc-950 aspect-video">

                {/* Vídeo real (quando vem do upload) */}
                {selectedCamera?.livePayload?.video_url ? (
                  <video
                    src={selectedCamera.livePayload.video_url}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-20 select-none">
                    <Video size={32} className="text-zinc-500" />
                    <span className="text-[10px] font-mono text-zinc-500">SEM FEED ATIVO</span>
                  </div>
                )}

                {/* Grade CCTV */}
                <div
                  className="absolute inset-0 pointer-events-none z-10 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(18,18,21,0) 95%, rgba(0,212,255,0.1) 95%), linear-gradient(90deg, rgba(18,18,21,0) 97%, rgba(0,212,255,0.05) 97%)",
                    backgroundSize: "100% 6px, 28px 100%",
                  }}
                />

                {/* Linha de scan */}
                <div className="absolute top-0 inset-x-0 h-px bg-indigo-400/20 shadow-[0_0_12px_rgba(99,102,241,0.5)] animate-scan z-10 pointer-events-none" />

                {/* Mira central */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-[0.04]">
                  <div className="w-16 h-16 border-2 border-dashed border-white rounded-full" />
                  <div className="absolute w-36 h-px bg-white" />
                  <div className="absolute h-36 w-px bg-white" />
                </div>

                {/* HUD superior esquerdo */}
                <div className="absolute top-3 left-3 z-20 pointer-events-none font-mono text-[10px] text-zinc-400 bg-black/60 backdrop-blur-sm p-2 rounded border border-white/5 flex flex-col gap-0.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isAlert ? "bg-rose-500 animate-ping" : "bg-emerald-400"
                      }`}
                    />
                    CANAL: {selectedCamera?.id}
                  </span>
                  <span className="text-zinc-500">LOC: {selectedCamera?.location}</span>
                </div>

                {/* HUD superior direito */}
                <div className="absolute top-3 right-3 z-20 pointer-events-none font-mono text-[10px] text-right bg-black/60 backdrop-blur-sm p-2 rounded border border-white/5">
                  <div className="font-bold text-white">SFW-CORE v3.5</div>
                  <div className="text-[9px] text-indigo-400 mt-0.5 font-bold flex items-center gap-1 justify-end">
                    <Radio size={9} className="animate-pulse" /> LIVE STREAM
                  </div>
                </div>

                {/* Bounding boxes do YOLO */}
                {selectedCamera?.aiBoxes.map((box, idx) => (
                  <div
                    key={idx}
                    className="absolute border font-mono text-[9px] font-bold pointer-events-none rounded z-20 transition-all duration-300"
                    style={{
                      borderColor: box.color,
                      top: box.top,
                      left: box.left,
                      width: box.w,
                      height: box.h,
                      color: box.color,
                      backgroundColor: `${box.color}0A`,
                      boxShadow:
                        box.color === "var(--severity-critical)"
                          ? "0 0 10px rgba(244,63,94,0.2)"
                          : "none",
                    }}
                  >
                    <span
                      className="absolute bottom-full left-0 bg-zinc-950/90 border border-b-0 px-1.5 py-0.5 rounded-t flex items-center gap-1 whitespace-nowrap"
                      style={{ borderColor: box.color }}
                    >
                      {box.label} {box.conf}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Telemetria inferior ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Inspeção de fluxo */}
                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[var(--text-secondary)] border-b border-white/5 pb-1.5">
                    <Activity size={11} className="text-[var(--accent-cyan)] animate-pulse" />
                    INSPEÇÃO DE FLUXO
                  </div>
                  <p className="font-mono text-[11px] text-zinc-300 leading-snug">
                    {selectedCamera?.lastDetection}
                  </p>
                </div>

                {/* Auditoria */}
                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[var(--text-secondary)] border-b border-white/5 pb-1.5">
                    <Clock size={11} />
                    AUDITORIA E SINCRONIA
                  </div>
                  <div className="font-mono text-[11px] text-[var(--text-secondary)] space-y-1">
                    <div>Log Captura: {selectedCamera?.lastUpdate}</div>
                    <div className="truncate">Varredura IA: {selectedCamera?.lastAnalysis ?? "--"}</div>
                  </div>
                </div>

                {/* Botão de despacho */}
                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center">
                  <button
                    onClick={() => setDispatchStatus("dispatched")}
                    disabled={!isAlert || dispatchStatus === "dispatched"}
                    className={`w-full py-2.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5 ${
                      dispatchStatus === "dispatched"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-not-allowed"
                        : isAlert
                        ? "bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-900/30 cursor-pointer"
                        : "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    <Navigation
                      size={11}
                      className={
                        dispatchStatus !== "dispatched" && isAlert ? "animate-bounce" : ""
                      }
                    />
                    {dispatchStatus === "dispatched"
                      ? "AGÊNCIAS NOTIFICADAS"
                      : "HOMOLOGAR DESPACHO BR-101"}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Cards de triagem (só com livePayload) ── */}
            {selectedCamera?.livePayload && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Vítimas */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200 border-b border-white/5 pb-2">
                    <HeartPulse size={13} className="text-rose-500" />
                    Triagem de Vítimas
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Pessoas em risco:</span>
                    <span className="font-mono font-bold text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                      {selectedCamera.livePayload.victim_estimation?.detected_count ?? 0} vítima(s)
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 bg-[var(--bg-surface)] p-2 rounded font-mono leading-snug">
                    {selectedCamera.livePayload.victim_estimation?.notes ?? "Nenhum pedestre detectado na pista."}
                  </p>
                </div>

                {/* Riscos estruturais */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200 border-b border-white/5 pb-2">
                    <ZapOff size={13} className="text-amber-500" />
                    Riscos Estruturais
                  </div>
                  <div className="space-y-1.5 font-mono text-[10px] text-zinc-400">
                    <div className="flex justify-between gap-2">
                      <span>Dano estrutural:</span>
                      <span className="text-zinc-200 text-right">
                        {selectedCamera.livePayload.cascading_risks?.structural_damage?.object_affected
                          ? "Poste afetado"
                          : "Nenhum"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Rede elétrica:</span>
                      <span
                        className={
                          selectedCamera.livePayload.cascading_risks?.electrical_hazards?.downed_power_lines
                            ? "text-rose-400 font-bold"
                            : "text-zinc-500"
                        }
                      >
                        {selectedCamera.livePayload.cascading_risks?.electrical_hazards?.downed_power_lines
                          ? "ROMPIDA"
                          : "Íntegra"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Riscos ambientais */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200 border-b border-white/5 pb-2">
                    <Flame size={13} className="text-orange-500" />
                    Riscos Ambientais
                  </div>
                  <div className="space-y-1.5 font-mono text-[10px] text-zinc-400">
                    <div className="flex justify-between gap-2">
                      <span>Combustível:</span>
                      <span
                        className={
                          selectedCamera.livePayload.cascading_risks?.environmental_hazards?.fuel_leak_detected
                            ? "text-amber-400 font-bold"
                            : "text-zinc-500"
                        }
                      >
                        {selectedCamera.livePayload.cascading_risks?.environmental_hazards?.fuel_leak_detected
                          ? "VAZAMENTO"
                          : "Negativo"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Isolamento:</span>
                      <span className="text-orange-400 font-bold">
                        {selectedCamera.livePayload.automated_response_protocol?.isolation_area_required_meters ?? 15}m
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ── Tabela de canais ── */}
            <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-[var(--bg-surface)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="px-4 py-3">ID Canal</th>
                      <th className="px-4 py-3">Localização</th>
                      <th className="px-4 py-3">Região</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Logs</th>
                      <th className="px-4 py-3">IA</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {filteredCameras.map((cam) => {
                      const isSel = selectedCamera?.id === cam.id;
                      return (
                        <tr
                          key={cam.id}
                          onClick={() => selectCamera(cam)}
                          className="cursor-pointer transition-colors text-xs hover:bg-[var(--bg-hover)]"
                          style={{ backgroundColor: isSel ? "var(--bg-hover)" : "transparent" }}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-[var(--accent-cyan)]">
                            {cam.id}
                          </td>
                          <td className="px-4 py-3 font-medium text-zinc-200 max-w-[180px] truncate">
                            {cam.location}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            {cam.region} — {cam.city}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                cam.status === "alert"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              }`}
                            >
                              {cam.status === "alert" ? "ALERTA" : "NORMAL"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-500">
                            {cam.events} logs
                          </td>
                          <td
                            className="px-4 py-3 font-bold text-[10px]"
                            style={{
                              color: cam.aiActive ? "var(--accent-emerald)" : "var(--text-muted)",
                            }}
                          >
                            {cam.aiActive ? "ATIVO" : "OFFLINE"}
                          </td>
                          <td className="pr-4 text-right">
                            <ChevronRight size={13} className="text-[var(--text-muted)] inline" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* ── Coluna direita (radar + relatório) ── */}
          <div className="lg:col-span-1 flex flex-col gap-6">

            {/* Radar */}
            <div
              className="rounded-xl border border-[var(--border-subtle)] bg-zinc-950 overflow-hidden relative"
              style={{ height: "280px" }}
            >
              {/* Grade de fundo */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:22px_22px]" />

              {/* SVG de círculos e eixos */}
              <svg className="absolute inset-0 w-full h-full fill-none pointer-events-none opacity-25" style={{ stroke: "var(--border-subtle)" }}>
                <circle cx="50%" cy="50%" r="22%" strokeDasharray="3 3" />
                <circle cx="50%" cy="50%" r="40%" strokeDasharray="2 2" />
                <line x1="0" y1="50%" x2="100%" y2="50%" />
                <line x1="50%" y1="0" x2="50%" y2="100%" />
              </svg>

              {/* Marcadores */}
              {filteredCameras.map((cam) => {
                const isSel = selectedCamera?.id === cam.id;
                const color =
                  cam.status === "online"
                    ? "var(--accent-emerald)"
                    : "var(--severity-critical)";
                return (
                  <button
                    key={cam.id}
                    onClick={() => selectCamera(cam)}
                    className="absolute z-20 cursor-pointer -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
                    style={{ left: `${cam.x}%`, top: `${cam.y}%` }}
                  >
                    {cam.status === "alert" && (
                      <span className="absolute w-5 h-5 rounded-full bg-rose-500/40 animate-ping -left-1 -top-1" />
                    )}
                    <div
                      className="w-2.5 h-2.5 rounded-full border-2 transition-transform group-hover:scale-125"
                      style={{
                        backgroundColor: color,
                        borderColor: isSel ? "#fff" : "rgba(0,0,0,0.4)",
                        transform: isSel ? "scale(1.3)" : undefined,
                        boxShadow: isSel ? `0 0 8px ${color}` : "none",
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Relatório do canal */}
            {selectedCamera && (
              <div className="rounded-xl border bg-[var(--bg-card)] border-[var(--border-subtle)] p-4 flex flex-col gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                    Localização Operacional
                  </span>
                  <p className="text-zinc-300 font-medium leading-snug">
                    {selectedCamera.fullLocation}
                  </p>
                </div>

                {selectedCamera.livePayload?.automated_response_protocol && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                      Plano de Resposta
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedCamera.livePayload.automated_response_protocol.required_agencies.map(
                        (agency: string) => (
                          <span
                            key={agency}
                            className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[9px] font-bold uppercase rounded"
                          >
                            {agency}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                    Logs de Atividade
                  </span>
                  {selectedCamera.recentEvents.length > 0 ? (
                    <div className="space-y-1 font-mono text-[10px] text-zinc-400 bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-subtle)]">
                      {selectedCamera.recentEvents.map((evt, i) => (
                        <div key={i} className="truncate">
                          {evt}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-[var(--text-muted)] italic bg-[var(--bg-surface)] p-2 rounded border border-dashed border-[var(--border-subtle)]">
                      Nenhum evento registrado hoje.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
