from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
import os
from fastapi.staticfiles import StaticFiles
from routers import empresas, fianzas, facturas, licitaciones, auth, consorciados, archivos, reporte, licitaciones_s3, finanzas, hitos, trabajadores, tareo, search

# Create tables
models.Base.metadata.create_all(bind=engine)

os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="MCQS-JCQ Liquidaciones API", version="1.0.0")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(empresas.router, prefix="/api/empresas", tags=["Empresas"])
app.include_router(consorciados.router, prefix="/api/consorciados", tags=["Consorciados"])
app.include_router(fianzas.router, prefix="/api/fianzas", tags=["Cartas Fianzas"])
app.include_router(facturas.router, prefix="/api/facturas", tags=["Facturas"])
app.include_router(licitaciones.router, prefix="/api/licitaciones", tags=["Licitaciones"])
app.include_router(licitaciones_s3.router, prefix="/api/licitaciones-s3", tags=["Licitaciones S3"])
app.include_router(archivos.router, prefix="/api/archivos", tags=["Archivos"])
app.include_router(reporte.router, prefix="/api/reporte", tags=["Reportes PDF"])
app.include_router(finanzas.router, prefix="/api/finanzas", tags=["Finanzas"])
app.include_router(hitos.router)
app.include_router(trabajadores.router)
app.include_router(tareo.router)
app.include_router(search.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "FastAPI is running"}

import threading
import time
from database import SessionLocal
from routers.auth import check_and_send_whatsapp_alerts

def run_daily_whatsapp_check():
    # Wait for the server to spin up completely
    time.sleep(10)
    while True:
        db = SessionLocal()
        try:
            check_and_send_whatsapp_alerts(db)
        except Exception as e:
            print(f"Error in automatic daily WhatsApp alerts check: {e}")
        finally:
            db.close()
        # Sleep 24 hours
        time.sleep(86400)

@app.on_event("startup")
def startup_event():
    threading.Thread(target=run_daily_whatsapp_check, daemon=True).start()
