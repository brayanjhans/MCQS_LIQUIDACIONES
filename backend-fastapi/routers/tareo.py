from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from datetime import date
from typing import List
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/tareo",
    tags=["Tareo"]
)

@router.get("/")
def get_tareo_fecha(fecha: date, empresa_id: int = None, db: Session = Depends(get_db)):
    # Returns all workers and their attendance for a specific date
    query = db.query(models.Trabajador).filter(models.Trabajador.estado == 'Activo')
    if empresa_id:
        query = query.filter(models.Trabajador.empresa_id == empresa_id)
        
    trabajadores = query.all()
    
    result = []
    for t in trabajadores:
        asistencia = db.query(models.Asistencia).filter(
            models.Asistencia.trabajador_id == t.id,
            models.Asistencia.fecha == fecha
        ).first()
        
        result.append({
            "trabajador_id": t.id,
            "dni": t.dni,
            "nombres": t.nombres,
            "apellidos": t.apellidos,
            "cargo": t.cargo,
            "asistencia": {
                "id": asistencia.id,
                "estado": asistencia.estado,
                "horas_normales": float(asistencia.horas_normales),
                "horas_extras_25": float(asistencia.horas_extras_25),
                "horas_extras_35": float(asistencia.horas_extras_35),
                "horas_extras_100": float(asistencia.horas_extras_100),
            } if asistencia else None
        })
    return result

class AsistenciaInput(BaseModel):
    trabajador_id: int
    fecha: date
    horas_normales: float
    horas_extras_25: float = 0
    horas_extras_35: float = 0
    horas_extras_100: float = 0
    estado: str = "Asistió"

@router.post("/")
def save_tareo(data: List[AsistenciaInput], db: Session = Depends(get_db)):
    for item in data:
        # Check if exists
        existing = db.query(models.Asistencia).filter(
            models.Asistencia.trabajador_id == item.trabajador_id,
            models.Asistencia.fecha == item.fecha
        ).first()
        
        if existing:
            existing.horas_normales = item.horas_normales
            existing.horas_extras_25 = item.horas_extras_25
            existing.horas_extras_35 = item.horas_extras_35
            existing.horas_extras_100 = item.horas_extras_100
            existing.estado = item.estado
        else:
            nueva = models.Asistencia(
                trabajador_id=item.trabajador_id,
                fecha=item.fecha,
                horas_normales=item.horas_normales,
                horas_extras_25=item.horas_extras_25,
                horas_extras_35=item.horas_extras_35,
                horas_extras_100=item.horas_extras_100,
                estado=item.estado
            )
            db.add(nueva)
    db.commit()
    return {"message": "Tareo guardado exitosamente"}
