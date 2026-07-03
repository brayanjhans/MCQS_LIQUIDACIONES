from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import models, schemas
import json
import os
from datetime import datetime
from s3_client import s3_client, ff_s3_client, R2_BUCKET, FF_BUCKET

router = APIRouter()

SETTINGS_FILE = "settings.json"
AUDIT_LOG_FILE = "audit_logs.json"

def get_settings():
    default_settings = {
        "fianzas_dias_previos": 30,
        "sctr_dias_previos": 15,
        "emo_dias_previos": 30,
        "whatsapp_enabled": False,
        "whatsapp_recipient": "",
        "evolution_api_url": "http://localhost:8080",
        "evolution_api_key": "your_api_key",
        "evolution_instance_name": "mcqs_instance"
    }
    if not os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(default_settings, f, indent=4)
        return default_settings
    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Merge defaults for any missing keys
            for k, v in default_settings.items():
                if k not in data:
                    data[k] = v
            return data
    except Exception:
        return default_settings

def save_settings(settings):
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=4)

def log_audit(username: str, action: str, details: str):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "username": username,
        "action": action,
        "details": details
    }
    logs = []
    if os.path.exists(AUDIT_LOG_FILE):
        try:
            with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
                logs = json.load(f)
        except Exception:
            logs = []
    logs.insert(0, log_entry) # Put newest logs first
    # Keep only the last 100 logs
    logs = logs[:100]
    with open(AUDIT_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=4)

@router.post("/login")
def login(user_data: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.username == user_data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # Very basic check for migration purposes
    if user.password != user_data.password and "scrypt" not in user.password:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    log_audit(user.username, "Login", "Inicio de sesión exitoso")

    return {
        "access_token": "fake-jwt-token-fastapi",
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }

# User CRUD: List
@router.get("/users", response_model=list[schemas.UsuarioResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()

# User CRUD: Create
@router.post("/users", response_model=schemas.UsuarioResponse)
def create_user(user_data: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(models.Usuario).filter(models.Usuario.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    new_user = models.Usuario(
        username=user_data.username,
        password=user_data.password, # plain text matching backend structure
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    log_audit("admin_system", "Creación de Usuario", f"Usuario creado: {new_user.username} con rol {new_user.role}")
    return new_user

# User CRUD: Delete
@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if user.username == "admin":
        raise HTTPException(status_code=400, detail="No se puede eliminar el usuario admin principal")
    
    username = user.username
    db.delete(user)
    db.commit()
    log_audit("admin_system", "Eliminación de Usuario", f"Usuario de baja: {username}")
    return {"message": "Usuario eliminado correctamente"}

# Connection Status
@router.get("/connection-status")
def connection_status(db: Session = Depends(get_db)):
    mysql_status = "ok"
    mysql_error = None
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        mysql_status = "error"
        mysql_error = str(e)

    s3_remote_status = "ok"
    s3_remote_error = None
    try:
        s3_client.list_objects_v2(Bucket=R2_BUCKET, MaxKeys=1)
    except Exception as e:
        s3_remote_status = "error"
        s3_remote_error = str(e)

    s3_fianzas_status = "ok"
    s3_fianzas_error = None
    try:
        ff_s3_client.list_objects_v2(Bucket=FF_BUCKET, MaxKeys=1)
    except Exception as e:
        s3_fianzas_status = "error"
        s3_fianzas_error = str(e)

    return {
        "mysql": {"status": mysql_status, "error": mysql_error},
        "s3_remote": {"status": s3_remote_status, "error": s3_remote_error},
        "s3_fianzas": {"status": s3_fianzas_status, "error": s3_fianzas_error}
    }

# Settings
@router.get("/settings")
def get_settings_endpoint():
    return get_settings()

@router.post("/settings")
def save_settings_endpoint(settings: dict):
    save_settings(settings)
    log_audit("admin_system", "Configuración Guardada", "Límites de alertas actualizados")
    return {"message": "Configuración guardada correctamente"}

# Audit Logs
@router.get("/audit-logs")
def get_audit_logs():
    if not os.path.exists(AUDIT_LOG_FILE):
        return []
    try:
        with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

# WhatsApp Alerts Logic
def check_and_send_whatsapp_alerts(db: Session):
    settings = get_settings()
    enabled = settings.get("whatsapp_enabled", False)
    if not enabled:
        return {"status": "disabled", "message": "WhatsApp alerts are disabled"}
    
    fianzas_days = settings.get("fianzas_dias_previos", 30)
    sctr_days = settings.get("sctr_dias_previos", 15)
    emo_days = settings.get("emo_dias_previos", 30)
    
    from datetime import date
    hoy = date.today()
    alert_messages = []
    
    # 1. Check Fianzas
    fianzas = db.query(models.CartaFianza).all()
    for f in fianzas:
        if f.fecha_vencimiento:
            days_left = (f.fecha_vencimiento - hoy).days
            if 0 <= days_left <= fianzas_days:
                emp_name = f.empresa.nombre if f.empresa else "Desconocida"
                alert_messages.append(f"• Fianza {f.tipo} Nº {f.numero} ({emp_name}) vence el {f.fecha_vencimiento} (Quedan {days_left} días).")
                
    # 2. Check Documentos de Trabajadores
    docs = db.query(models.DocumentoTrabajador).all()
    for d in docs:
        if d.fecha_vencimiento:
            days_left = (d.fecha_vencimiento - hoy).days
            trab = d.trabajador
            trab_name = f"{trab.apellidos}, {trab.nombres}" if trab else "Trabajador Desconocido"
            
            if d.tipo in ['SCTR_Salud', 'SCTR_Pension'] and 0 <= days_left <= sctr_days:
                alert_messages.append(f"• {d.tipo} de {trab_name} vence el {d.fecha_vencimiento} (Quedan {days_left} días).")
            elif d.tipo == 'EMO' and 0 <= days_left <= emo_days:
                alert_messages.append(f"• EMO de {trab_name} vence el {d.fecha_vencimiento} (Quedan {days_left} días).")
                
    if not alert_messages:
        return {"status": "no_alerts", "message": "No document alerts for today"}
        
    header = "⚠️ *Notificación de Vencimientos MCQS-JCQ*\n\nSe han detectado los siguientes documentos próximos a vencer:\n\n"
    full_message = header + "\n".join(alert_messages) + "\n\nFavor de tomar las previsiones del caso."
    
    from whatsapp_client import send_whatsapp_message
    res = send_whatsapp_message(full_message)
    return res

@router.post("/whatsapp-trigger")
def trigger_alerts(db: Session = Depends(get_db)):
    res = check_and_send_whatsapp_alerts(db)
    log_audit("admin_system", "Envío de Alertas WhatsApp", f"Resultado del envío de alertas: {res.get('status')}")
    return res

@router.post("/whatsapp-test")
def test_whatsapp():
    from whatsapp_client import send_whatsapp_message
    res = send_whatsapp_message("📲 *MCQS-JCQ Prueba de WhatsApp*\n\n¡Felicidades! La conexión del sistema con Evolution API se ha establecido correctamente para el envío de alertas automáticas.")
    log_audit("admin_system", "Prueba WhatsApp", f"Resultado de mensaje de prueba: {res.get('status')}")
    return res

