from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
import models

router = APIRouter(
    prefix="/api/search",
    tags=["Search"]
)

@router.get("/")
def global_search(q: str = "", db: Session = Depends(get_db)):
    if not q or len(q) < 2:
        return {"obras": [], "trabajadores": [], "fianzas": []}
    
    term = f"%{q}%"

    # Search Obras (Empresas)
    obras = db.query(models.Empresa).filter(
        or_(
            models.Empresa.nombre.ilike(term),
            models.Empresa.ruc.ilike(term)
        )
    ).limit(5).all()

    # Search Trabajadores
    trabajadores = db.query(models.Trabajador).filter(
        or_(
            models.Trabajador.dni.ilike(term),
            models.Trabajador.nombres.ilike(term),
            models.Trabajador.apellidos.ilike(term)
        )
    ).limit(5).all()

    # Search Fianzas
    fianzas = db.query(models.CartaFianza).filter(
        models.CartaFianza.numero.ilike(term)
    ).limit(5).all()

    return {
        "obras": [{"id": o.id, "nombre": o.nombre, "ruc": o.ruc} for o in obras],
        "trabajadores": [{"id": t.id, "dni": t.dni, "nombres": t.nombres, "apellidos": t.apellidos, "cargo": t.cargo} for t in trabajadores],
        "fianzas": [{"id": f.id, "numero": f.numero, "tipo": f.tipo_garantia} for f in fianzas]
    }
