import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Carrega as variáveis de ambiente antes da inicialização
load_dotenv()

from app.api.upload import router as upload_router

app = FastAPI(
    title="SafeFlow AI Core",
    description="Engine de Visão Computacional e Inferência de Tráfego em Tempo Real",
    version="2.4.1"
)

# Configuração rigorosa de CORS para o Next.js (porta 3000) se comunicar com a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🚨 A MÁGICA DO STREAMING: Expõe as pastas locais via HTTP para o player do Next.js dar "Play"
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

@app.on_event("startup")
def startup_event():
    """Garante a existência física dos diretórios de persistência de mídia"""
    os.makedirs(os.getenv("UPLOAD_DIR", "storage/uploads"), exist_ok=True)
    os.makedirs(os.getenv("OUTPUT_DIR", "storage/outputs"), exist_ok=True)

@app.get("/health", tags=["Infraestrutura"])
async def health_check():
    """Endpoint tático de verificação de saúde da API"""
    return {
        "status": "healthy",
        "service": "safeflow-ai-core",
        "hardware": "CPU/GPU active"
    }

# Acoplamento dos roteadores operacionais da API v1
app.include_router(upload_router, prefix="/api/v1")