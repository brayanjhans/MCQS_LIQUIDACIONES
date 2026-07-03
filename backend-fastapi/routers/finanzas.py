from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from database import get_db
import models

router = APIRouter()

@router.get("/kpis")
def get_finanzas_kpis(db: Session = Depends(get_db)):
    hoy = date.today()
    
    # 1. Total en Fianzas Vigentes
    total_fianzas = db.query(func.sum(models.CartaFianza.monto)).filter(models.CartaFianza.fecha_vencimiento >= hoy).scalar() or 0
    
    # 2. Total Monto Liberado (from facturas/amortizaciones)
    total_amortizado = db.query(func.sum(models.Factura.monto)).scalar() or 0
    
    # 3. Fianzas en Riesgo (vencen en los próximos 30 días)
    limite_riesgo = hoy + timedelta(days=30)
    riesgo_count = db.query(models.CartaFianza).filter(
        models.CartaFianza.fecha_vencimiento >= hoy,
        models.CartaFianza.fecha_vencimiento <= limite_riesgo
    ).count()

    # 4. Suma total de Obras
    total_obras = db.query(func.sum(models.Empresa.monto_obra)).scalar() or 0

    return {
        "total_fianzas_vigentes": float(total_fianzas),
        "total_amortizado": float(total_amortizado),
        "fianzas_en_riesgo": riesgo_count,
        "valor_total_obras": float(total_obras)
    }
