"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { EventsTable } from "@/components/dashboard/EventsTable";
import { mockEvents } from "@/data/mock";
import { AnomalyEvent } from "@/types";

export default function EventsPage() {
  const [eventsList, setEventsList] = useState<AnomalyEvent[]>(mockEvents);

  useEffect(() => {
    const realAiEventsRaw = localStorage.getItem("safeflow_real_events");
    if (realAiEventsRaw) {
      const realAiEvents: AnomalyEvent[] = JSON.parse(realAiEventsRaw);
      if (realAiEvents.length > 0) {
        setEventsList([...realAiEvents, ...mockEvents]);
      }
    }
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-grid" style={{ backgroundColor: "var(--bg-base)" }}>
      <Topbar title="Eventos Detectados" subtitle="Histórico completo de anomalias identificadas pela IA" />
      <div className="flex-1 p-6">
        <EventsTable events={eventsList} />
      </div>
    </div>
  );
}