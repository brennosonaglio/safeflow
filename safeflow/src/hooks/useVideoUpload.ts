"use client";

/**
 * SafeFlow AI - useVideoUpload hook
 *
 * Encapsula toda a máquina de estados do fluxo de upload:
 *   idle → uploading → processing → done | error
 *
 * Responsabilidades:
 *   ✓ Upload do arquivo via service layer
 *   ✓ Polling de status com AbortController (sem memory leak)
 *   ✓ Persistência do task_id ativo no sessionStorage (sobrevive F5)
 *   ✓ Retomada automática de tarefa em andamento ao montar o componente
 *   ✓ Cleanup garantido no unmount (clearInterval + abort)
 *
 * O componente de UI consome apenas o objeto retornado — sem fetch, sem timers.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  uploadVideo,
  fetchTaskStatus,
  hydrateEventsWithUrl,
  UploadNetworkError,
  TaskPollingError,
  type VideoEvent,
} from "@/services/videoUploadService";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 1500;
const SESSION_KEY = "safeflow_active_task_id";
const STORAGE_KEY = "safeflow_real_events";

// ---------------------------------------------------------------------------
// Tipos públicos do hook
// ---------------------------------------------------------------------------

export type UploadState = "idle" | "uploading" | "processing" | "done" | "error";

export interface UploadFileInfo {
  name: string;
  sizeMb: string;
  progress: number;
  state: UploadState;
  resultEvents: VideoEvent[];
  error: string | null;
}

export interface UseVideoUploadReturn {
  fileInfo: UploadFileInfo | null;
  startUpload: (file: File) => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVideoUpload(): UseVideoUploadReturn {
  const [fileInfo, setFileInfo] = useState<UploadFileInfo | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ---------------------------------------------------------------------------
  // Helpers internos
  // ---------------------------------------------------------------------------

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const persistEvents = useCallback((events: VideoEvent[]) => {
    const existing: VideoEvent[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...events, ...existing]));
  }, []);

  const setError = useCallback(
    (message: string) => {
      stopPolling();
      sessionStorage.removeItem(SESSION_KEY);
      setFileInfo((prev) =>
        prev ? { ...prev, state: "error", error: message } : null,
      );
    },
    [stopPolling],
  );

  // ---------------------------------------------------------------------------
  // Polling de status
  // ---------------------------------------------------------------------------

  const startPolling = useCallback(
    (taskId: string) => {
      stopPolling();

      intervalRef.current = setInterval(async () => {
        try {
          const task = await fetchTaskStatus(taskId);

          setFileInfo((prev) =>
            prev ? { ...prev, progress: task.progress } : null,
          );

          if (task.status === "done") {
            stopPolling();
            sessionStorage.removeItem(SESSION_KEY);

            const rawEvents = task.events ?? [];
            const hydrated = hydrateEventsWithUrl(rawEvents, task.video_url);
            persistEvents(hydrated);

            setFileInfo((prev) =>
              prev
                ? {
                    ...prev,
                    state: "done",
                    progress: 100,
                    resultEvents: hydrated,
                    error: null,
                  }
                : null,
            );
          } else if (task.status === "failed") {
            setError(task.error ?? "A análise YOLOv8 falhou sem detalhes.");
          }
        } catch (err) {
          if (err instanceof TaskPollingError) {
            setError(`Polling perdido: ${err.message}`);
          } else {
            setError("Erro inesperado durante checagem de progresso.");
          }
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling, persistEvents, setError],
  );

  // ---------------------------------------------------------------------------
  // Retomada de tarefa após F5 / navegação
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const savedTaskId = sessionStorage.getItem(SESSION_KEY);
    if (!savedTaskId) return;

    setFileInfo({
      name: "Tarefa retomada",
      sizeMb: "—",
      progress: 0,
      state: "processing",
      resultEvents: [],
      error: null,
    });

    startPolling(savedTaskId);

    return () => stopPolling();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Upload inicial
  // ---------------------------------------------------------------------------

  const startUpload = useCallback(
    async (file: File) => {
      stopPolling();

      setFileInfo({
        name: file.name,
        sizeMb: (file.size / 1_048_576).toFixed(1),
        progress: 5,
        state: "uploading",
        resultEvents: [],
        error: null,
      });

      try {
        const { task_id } = await uploadVideo(file);

        sessionStorage.setItem(SESSION_KEY, task_id);

        setFileInfo((prev) =>
          prev ? { ...prev, state: "processing", progress: 15 } : null,
        );

        startPolling(task_id);
      } catch (err) {
        if (err instanceof UploadNetworkError) {
          setError(err.message);
        } else {
          setError("SafeFlow AI Core fora do ar ou inacessível.");
        }
      }
    },
    [stopPolling, startPolling, setError],
  );

  // ---------------------------------------------------------------------------
  // Reset manual
  // ---------------------------------------------------------------------------

  const reset = useCallback(() => {
    stopPolling();
    sessionStorage.removeItem(SESSION_KEY);
    setFileInfo(null);
  }, [stopPolling]);

  // ---------------------------------------------------------------------------
  // Cleanup global no unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { fileInfo, startUpload, reset };
}