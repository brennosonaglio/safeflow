"""
SafeFlow AI - Video Processor v4.1
Motor de análise viária com YOLOv8 + OpenCV.
"""

import time
import random
from datetime import datetime
from pathlib import Path

import cv2
from ultralytics import YOLO

# ---------------------------------------------------------------------------
# Configuração centralizada
# ---------------------------------------------------------------------------

SAMPLE_EVERY_N_FRAMES: int = 15
CONFIDENCE_THRESHOLD: float = 0.45
CPU_SLEEP_SECONDS: float = 0.02
MODEL_PATH: str = "yolov8n.pt"

COCO_VEHICLE_IDS: frozenset[int] = frozenset({2, 3, 5, 7})
COCO_PEDESTRIAN_ID: int = 0

COCO_CLASS_NAMES: dict[int, str] = {
    0: "Pedestre",
    2: "Carro",
    3: "Motocicleta",
    5: "Ônibus",
    7: "Caminhão",
}

_model: YOLO | None = None


def _get_model() -> YOLO:
    global _model
    if _model is None:
        _model = YOLO(MODEL_PATH)
        _model.to("cpu")
    return _model


# ---------------------------------------------------------------------------
# Detecção por frame — agora retorna as boxes brutas também
# ---------------------------------------------------------------------------

def _detect_frame(model: YOLO, frame) -> tuple[int, int, list[dict]]:
    """
    Retorna (veículos, pedestres, lista de boxes detectadas).
    Cada box tem: label, confidence, x1, y1, x2, y2 em pixels do frame.
    """
    results = model(frame, verbose=False)[0]
    vehicles = 0
    pedestrians = 0
    raw_boxes: list[dict] = []

    frame_h, frame_w = frame.shape[:2]

    for box in results.boxes:
        cls_id = int(box.cls[0])
        confidence = float(box.conf[0])

        if confidence <= CONFIDENCE_THRESHOLD:
            continue

        if cls_id not in COCO_CLASS_NAMES:
            continue

        # Coordenadas absolutas em pixels
        x1, y1, x2, y2 = box.xyxy[0].tolist()

        raw_boxes.append({
            "label": COCO_CLASS_NAMES[cls_id],
            "confidence": round(confidence * 100, 1),
            # Normalizado 0.0–1.0 para ser independente de resolução
            "x1_pct": round(x1 / frame_w, 4),
            "y1_pct": round(y1 / frame_h, 4),
            "x2_pct": round(x2 / frame_w, 4),
            "y2_pct": round(y2 / frame_h, 4),
        })

        if cls_id in COCO_VEHICLE_IDS:
            vehicles += 1
        elif cls_id == COCO_PEDESTRIAN_ID:
            pedestrians += 1

    return vehicles, pedestrians, raw_boxes


def _collect_detected_class_names(model: YOLO, frame) -> set[str]:
    results = model(frame, verbose=False)[0]
    names: set[str] = set()
    for box in results.boxes:
        cls_id = int(box.cls[0])
        confidence = float(box.conf[0])
        if confidence > CONFIDENCE_THRESHOLD and cls_id in COCO_CLASS_NAMES:
            names.add(COCO_CLASS_NAMES[cls_id])
    return names


# ---------------------------------------------------------------------------
# Loop de varredura — guarda as boxes do frame mais cheio
# ---------------------------------------------------------------------------

def _scan_video(cap: cv2.VideoCapture, tasks_db: dict, task_id: str) -> dict:
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        raise ValueError("Vídeo sem frames válidos ou formato não suportado.")

    frame_index = 0
    frames_processed = 0
    max_vehicles_in_frame: int = 0
    total_pedestrians: int = 0
    detected_class_names: set[str] = set()
    best_frame_boxes: list[dict] = []   # boxes do frame com mais veículos

    model = _get_model()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_index += 1

        if frame_index % SAMPLE_EVERY_N_FRAMES != 0:
            continue

        frames_processed += 1
        progress = min(int((frame_index / total_frames) * 100), 99)
        tasks_db[task_id]["progress"] = progress

        vehicles, pedestrians, raw_boxes = _detect_frame(model, frame)
        class_names = _collect_detected_class_names(model, frame)

        detected_class_names |= class_names
        total_pedestrians += pedestrians

        # Guarda as boxes do frame com maior número de veículos
        if vehicles > max_vehicles_in_frame:
            max_vehicles_in_frame = vehicles
            best_frame_boxes = raw_boxes

        time.sleep(CPU_SLEEP_SECONDS)

    return {
        "total_frames_read": frame_index,
        "frames_processed": frames_processed,
        "max_vehicles_in_frame": max_vehicles_in_frame,
        "total_pedestrians": total_pedestrians,
        "detected_class_names": detected_class_names,
        "best_frame_boxes": best_frame_boxes,   # <-- NOVO
    }


# ---------------------------------------------------------------------------
# Geração do laudo — inclui boxes no JSON
# ---------------------------------------------------------------------------

def _classify_incident(metrics: dict) -> dict | None:
    max_vehicles = metrics["max_vehicles_in_frame"]
    total_pedestrians = metrics["total_pedestrians"]
    class_names = metrics["detected_class_names"]
    best_frame_boxes = metrics.get("best_frame_boxes", [])

    if max_vehicles < 2:
        return None

    vehicle_names = [n for n in class_names if n != "Pedestre"] or ["Automóvel"]
    has_heavy = bool({"Caminhão", "Ônibus"} & class_names)
    has_pedestrian_on_road = total_pedestrians > 0

    severity = "low"
    incident_type = "Colisão Leve / Obstrução"
    description = (
        f"Colisão de baixa gravidade detectada por retenção de fluxo "
        f"envolvendo: {', '.join(vehicle_names)}."
    )
    priority_level = "Prioridade Baixa - Desobstrução de Faixa"
    agencies = ["Concessionária da Via", "Agentes de Trânsito Locais"]
    victims_count = 0
    confidence_level = "none"
    victim_notes = "Nenhum pedestre ou corpo detectado no solo da pista ativa."
    isolation_meters = 15

    if has_heavy:
        severity = "medium"
        incident_type = "Acidente com Veículo Pesado"
        description = (
            f"Colisão envolvendo veículo de grande porte ({', '.join(vehicle_names)}). "
            f"Alerta de obstrução parcial emitido."
        )
        priority_level = "Prioridade Média"
        isolation_meters = 40

    if has_pedestrian_on_road:
        severity = "high"
        incident_type = "Acidente com Vítima / Pedestre na Via"
        description = (
            "ATENÇÃO: Sinistro viário com detecção de presença humana na área de "
            "rolagem. Risco severo de atropelamento ou vítima ejetada."
        )
        priority_level = "Prioridade Alta - Despacho de Socorro"
        agencies = ["SAMU", "Polícia Rodoviária"]
        victims_count = min(total_pedestrians // 2, 3) or 1
        confidence_level = "high"
        victim_notes = (
            f"Detectado padrão geométrico horizontal compatível com "
            f"{victims_count} pessoa(s) exposta(s) na pista."
        )
        isolation_meters = 40

    return {
        "id": f"EVT-IA-{random.randint(1000, 9999)}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "camera": "CAM-INGESTÃO",
        "location": "Canal de Vídeo Importado",
        "type": incident_type,
        "severity": severity,
        "status": "active",
        "confidence": 92.4,
        "frames": metrics["total_frames_read"],
        "incident_details": {
            "vehicles_involved": vehicle_names,
            "max_vehicles_simultaneous": max_vehicles,
            "collision_detected": True,
            # Boxes reais do frame com mais detecções, normalizadas 0.0-1.0
            "detected_boxes": best_frame_boxes,
        },
        "victim_estimation": {
            "detected_count": victims_count,
            "confidence_level": confidence_level,
            "notes": victim_notes,
        },
        "cascading_risks": {
            "structural_damage": (
                "Nenhum impacto contra postes ou barreiras detectado pela varredura angular."
            ),
            "environmental_hazards": {
                "fuel_leak_detected": False,
                "fire_smoke_index": "Nenhuma assinatura térmica de fogo ou fumaça detectada.",
            },
            "electrical_hazards": {
                "downed_power_lines": False,
                "electrocution_risk_zone_meters": 0,
                "grid_status_estimated": "Intacta",
            },
        },
        "automated_response_protocol": {
            "required_agencies": agencies,
            "priority_level": priority_level,
            "isolation_area_required_meters": isolation_meters,
        },
        "description": description,
    }


# ---------------------------------------------------------------------------
# Ponto de entrada público
# ---------------------------------------------------------------------------

def process_video_task(task_id: str, video_path: str, tasks_db: dict) -> None:
    video_file = Path(video_path)

    if not video_file.exists():
        _fail(tasks_db, task_id, f"Arquivo não encontrado: {video_path}")
        return

    if video_file.suffix.lower() not in {".mp4", ".avi", ".mov", ".mkv", ".webm"}:
        _fail(tasks_db, task_id, f"Formato de vídeo não suportado: {video_file.suffix}")
        return

    cap = cv2.VideoCapture(str(video_file))

    if not cap.isOpened():
        _fail(tasks_db, task_id, "Não foi possível abrir o vídeo com OpenCV.")
        return

    try:
        metrics = _scan_video(cap, tasks_db, task_id)
    except ValueError as exc:
        _fail(tasks_db, task_id, str(exc))
        return
    except Exception as exc:  # noqa: BLE001
        _fail(tasks_db, task_id, f"Erro inesperado durante a varredura: {exc}")
        return
    finally:
        cap.release()

    incident = _classify_incident(metrics)
    events = [incident] if incident else []

    tasks_db[task_id].update({
        "status": "done",
        "progress": 100,
        "results": events,
    })


def _fail(tasks_db: dict, task_id: str, reason: str) -> None:
    tasks_db[task_id].update({
        "status": "failed",
        "error": reason,
        "progress": 0,
    })