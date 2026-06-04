import uuid
import os
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any

from app.services.video_processor import process_video_task

router = APIRouter(tags=["Processamento de Mídia"])

# Banco de dados em memória volátil para controle do ciclo de vida das tarefas
tasks_db: Dict[str, Dict[str, Any]] = {}

class TaskResponse(BaseModel):
    task_id: str
    status: str
    progress: int
    message: str

@router.post("/upload", response_model=TaskResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_video(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...)
):
    # Validação defensiva de formato de mídia
    if not file.content_type.startswith("video/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo enviado não é um arquivo de vídeo válido."
        )

    # Geração do identificador único para o processamento assíncrono
    task_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1] or ".mp4"
    saved_filename = f"{task_id}{file_extension}"
    upload_path = os.path.join(os.getenv("UPLOAD_DIR", "storage/uploads"), saved_filename)

    # Escrita do binário real recebido do frontend Next.js no disco
    try:
        with open(upload_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha física ao persistir o vídeo no servidor: {str(e)}"
        )

    # 🚨 DIRECIONAMENTO DE STREAMING: Link HTTP que o player de vídeo do frontend vai consumir
    video_url = f"http://127.0.0.1:8000/storage/uploads/{saved_filename}"

    # Inicializa o estado da tarefa injetando a URL do vídeo
    tasks_db[task_id] = {
        "status": "processing",
        "progress": 0,
        "results": None,
        "video_url": video_url
      }

    # Despacha a computação pesada da IA para segundo plano (evita travamento e timeout)
    background_tasks.add_task(process_video_task, task_id, upload_path, tasks_db)

    return TaskResponse(
        task_id=task_id,
        status="processing",
        progress=0,
        message="Vídeo recebido com sucesso. Processamento de inferência YOLOv8 iniciado."
    )

@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    # Verifica a existência do ID na base
    if task_id not in tasks_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Identificador de tarefa (task_id) inexistente ou expirado."
        )
    
    task_info = tasks_db[task_id]
    
    # Entrega o pacote de dados completo incluindo o link do vídeo para o Next.js
    return {
        "task_id": task_id,
        "status": task_info["status"],
        "progress": task_info["progress"],
        "video_url": task_info.get("video_url"),
        "events": task_info["results"] if task_info["status"] == "done" else []
    }