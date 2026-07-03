from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(
    prefix="/api/hitos",
    tags=["hitos"]
)

@router.get("/")
def get_hitos(db: Session = Depends(get_db)):
    empresas = db.query(models.Empresa).all()
    fianzas = db.query(models.CartaFianza).all()

    obras_data = []
    for emp in empresas:
        if emp.fecha_inicio_obra and emp.fecha_fin_obra:
            obras_data.append({
                "id": emp.id,
                "empresa": emp.nombre,
                "fecha_inicio": emp.fecha_inicio_obra.isoformat(),
                "fecha_fin": emp.fecha_fin_obra.isoformat(),
            })
            
    fianzas_data = []
    for f in fianzas:
        if f.fecha_vencimiento:
            fianzas_data.append({
                "id": f.id,
                "empresa_id": f.empresa_id,
                "empresa_nombre": f.empresa.nombre if f.empresa else "Desconocida",
                "tipo": f.tipo,
                "numero": f.numero,
                "fecha_inicio": f.fecha_inicio.isoformat() if f.fecha_inicio else None,
                "fecha_vencimiento": f.fecha_vencimiento.isoformat(),
                "monto": float(f.monto)
            })
            
    return {
        "obras": obras_data,
        "fianzas": fianzas_data
    }
