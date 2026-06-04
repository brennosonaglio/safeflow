/**
 * SafeFlow AI - Video Upload Service
 *
 * Camada de serviço pura: zero React, zero estado, zero side-effects.
 * Qualquer componente ou hook pode consumir essas funções sem acoplamento.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export interface UploadResponse {
  task_id: string;
}

export interface TaskStatus {
  status: "pending" | "processing" | "done" | "failed";
  progress: number;
  events?: VideoEvent[];
  video_url?: string;
  error?: string;
}

export interface VideoEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
  video_url?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Erros tipados — permite tratamento granular no consumidor
// ---------------------------------------------------------------------------

export class UploadNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadNetworkError";
  }
}

export class TaskPollingError extends Error {
  constructor(
    message: string,
    public readonly taskId: string,
  ) {
    super(message);
    this.name = "TaskPollingError";
  }
}

// ---------------------------------------------------------------------------
// Funções de API
// ---------------------------------------------------------------------------

/**
 * Envia o arquivo de vídeo ao backend e retorna o task_id gerado.
 * Lança UploadNetworkError em caso de falha HTTP.
 */
export async function uploadVideo(file: File): Promise<UploadResponse> {
  const body = new FormData();
  body.append("file", file);

  const res = await fetch(`${API_BASE}/api/v1/upload`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new UploadNetworkError(
      `Upload falhou (HTTP ${res.status}): ${detail}`,
    );
  }

  return res.json() as Promise<UploadResponse>;
}

/**
 * Consulta o status de uma tarefa em andamento.
 * Lança TaskPollingError se a resposta HTTP não for 2xx.
 */
export async function fetchTaskStatus(taskId: string): Promise<TaskStatus> {
  const res = await fetch(`${API_BASE}/api/v1/tasks/${taskId}`);

  if (!res.ok) {
    throw new TaskPollingError(
      `Polling falhou (HTTP ${res.status}) para task ${taskId}`,
      taskId,
    );
  }

  return res.json() as Promise<TaskStatus>;
}

/**
 * Injeta a video_url em cada evento retornado pelo backend.
 * Operação pura — não modifica o original.
 */
export function hydrateEventsWithUrl(
  events: VideoEvent[],
  videoUrl: string | undefined,
): VideoEvent[] {
  if (!videoUrl) return events;
  return events.map((evt) => ({ ...evt, video_url: videoUrl }));
}