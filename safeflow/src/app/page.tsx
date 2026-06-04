"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EventsTable } from "@/components/dashboard/EventsTable";
import { DetectionTimeline } from "@/components/dashboard/DetectionTimeline";
import { TrafficChart } from "@/components/dashboard/TrafficChart";
import { LiveCameras } from "@/components/dashboard/LiveCameras";
import { mockEvents, mockTimeline, mockTrafficData } from "@/data/mock";
import { AnomalyEvent } from "@/types";
import { AlertTriangle, Video, Eye, Activity } from "lucide-react";

export default function DashboardPage() {
  const [allEvents, setAllEvents] = useState<AnomalyEvent[]>(mockEvents);
  const [activeAnomaliesCount, setActiveAnomaliesCount] = useState<number>(41);
  const [hasCriticalLive, setHasCriticalLive] = useState<boolean>(false);

  // EFEITO DE CAPTURA DO HIPER-PROCESSAMENTO DA IA REAL
  useEffect(() => {
    // Procura se o ecrã de upload salvou algum evento real gerado pela IA
    const realAiEventsRaw = localStorage.getItem("safeflow_real_events");
    
    if (realAiEventsRaw) {
      const realAiEvents: AnomalyEvent[] = JSON.parse(realAiEventsRaw);
      
      if (realAiEvents.length > 0) {
        // Une as detecções reais da IA no topo da lista com os dados mock anteriores
        setAllEvents([...realAiEvents, ...mockEvents]);
        
        // Atualiza dinamicamente o contador de métricas somando as novas ocorrências
        setActiveAnomaliesCount(41 + realAiEvents.length);

        // Se houver algum sinistro crítico ou de alta severidade na gravação, aciona o Banner Vermelho
        const containsCritical = realAiEvents.some(e => e.severity === "critical" || e.severity === "high");
        if (containsCritical) {
          setHasCriticalLive(true);
        }
      }
    }
  }, []);

  const metrics = [
    {
      label: "Anomalias Hoje",
      value: activeAnomaliesCount, // Valor Dinâmico atualizado pela IA
      delta: `+${activeAnomaliesCount - 29}%`,
      trend: "up" as const,
      icon: <AlertTriangle size={15} />,
      accentColor: "var(--severity-critical)",
      description: `${allEvents.filter(e => e.status === 'active' || e.status === 'investigating').length} pendentes de triagem`,
    },
    {
      label: "Câmeras Ativas",
      value: "16/18",
      delta: "-2",
      trend: "down" as const,
      icon: <Video size={15} />,
      accentColor: "var(--accent-cyan)",
      description: "CAM-11 e 15 em manutenção",
    },
    {
      label: "Monitoramento RT",
      value: 3,
      delta: "Live",
      trend: "neutral" as const,
      icon: <Eye size={15} />,
      accentColor: "var(--accent-emerald)",
      description: "Processamento ativo",
    },
    {
      label: "Precisão Global",
      value: "94.2%",
      delta: "+1.3%",
      trend: "up" as const,
      icon: <Activity size={16} />,
      accentColor: "var(--accent-violet)",
      description: "Modelo YOLOv8-LiveCore",
    },
  ];

  return (
    <div className="flex flex-col flex-1 pb-20 lg:pb-0 bg-[var(--bg-base)]">
      <Topbar title="Dashboard Operacional" subtitle="Centro unificado de inteligência e triagem de tráfego analítico" />
      
      <div className="flex-1 flex flex-col overflow-y-auto" style={{ padding: "32px", gap: "32px" }}>
        
        {/* BANNER DE NOTIFICAÇÃO TÁTICO INTEGRADO À IA */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl border bg-[var(--bg-card)] border-[var(--border-subtle)]"
          style={{ borderColor: hasCriticalLive ? "rgba(244,63,94,0.4)" : "rgba(244,63,94,0.2)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full bg-[var(--severity-critical)] flex-shrink-0 ${hasCriticalLive ? 'animate-ping bg-rose-500' : 'animate-pulse-glow'}`} />
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">
              <span className="font-semibold text-[var(--severity-critical)]">
                {hasCriticalLive ? "ALERTA MÁXIMO DE IMPACTO DETECTADO POR IA" : "2 Ocorrências Críticas Ativas"}
              </span>
              <span className="text-[var(--text-secondary)]">
                {hasCriticalLive 
                  ? " — Um novo sinistro rodoviário em tempo real foi catalogado pelo canal de ingestão externa." 
                  : " — Atenção recomendada para as estações secundárias de monitoramento CAM-07 e CAM-12."}
              </span>
            </p>
          </div>
          <button className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--severity-critical)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer flex-shrink-0">
            Acompanhar
          </button>
        </div>

        {/* Grade de Métricas Dinâmicas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <TrafficChart data={mockTrafficData} />
            {/* Tabela de Eventos agora consome a variável de estado dinâmico da IA */}
            <EventsTable events={allEvents} />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-8">
            <LiveCameras />
            <DetectionTimeline entries={mockTimeline} />
          </div>
        </div>

      </div>
    </div>
  );
}