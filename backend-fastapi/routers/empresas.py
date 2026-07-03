from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from database import get_db
import models, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.EmpresaResponse])
def get_empresas(q: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Empresa)
    if q:
        query = query.filter(
            or_(
                models.Empresa.nombre.ilike(f"%{q}%"),
                models.Empresa.fianzas.any(models.CartaFianza.numero.ilike(f"%{q}%")),
                models.Empresa.facturas.any(models.Factura.numero.ilike(f"%{q}%"))
            )
        )
    return query.all()

@router.get("/{id}", response_model=schemas.EmpresaResponse)
def get_empresa(id: int, db: Session = Depends(get_db)):
    empresa = db.query(models.Empresa).filter(models.Empresa.id == id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return empresa

@router.post("/", response_model=schemas.EmpresaResponse)
def create_empresa(empresa: schemas.EmpresaCreate, db: Session = Depends(get_db)):
    db_empresa = models.Empresa(**empresa.model_dump())
    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)
    return db_empresa

@router.put("/{id}", response_model=schemas.EmpresaResponse)
def update_empresa(id: int, empresa: schemas.EmpresaCreate, db: Session = Depends(get_db)):
    db_empresa = db.query(models.Empresa).filter(models.Empresa.id == id).first()
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    for key, value in empresa.model_dump(exclude_unset=True).items():
        setattr(db_empresa, key, value)
    
    db.commit()
    db.refresh(db_empresa)
    return db_empresa

@router.delete("/{id}")
def delete_empresa(id: int, db: Session = Depends(get_db)):
    db_empresa = db.query(models.Empresa).filter(models.Empresa.id == id).first()
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    db.delete(db_empresa)
    db.commit()
    return {"detail": "Empresa eliminada exitosamente"}
