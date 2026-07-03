from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter()

@router.get("/{empresa_id}", response_model=List[schemas.LicitacionResponse])
def get_licitaciones(empresa_id: int, db: Session = Depends(get_db)):
    return db.query(models.Licitacion).filter(models.Licitacion.empresa_id == empresa_id).all()

@router.post("/{empresa_id}", response_model=schemas.LicitacionResponse)
def create_licitacion(empresa_id: int, licitacion: schemas.LicitacionCreate, db: Session = Depends(get_db)):
    licitacion.empresa_id = empresa_id
    db_licitacion = models.Licitacion(**licitacion.model_dump())
    db.add(db_licitacion)
    db.commit()
    db.refresh(db_licitacion)
    return db_licitacion

@router.put("/{id}", response_model=schemas.LicitacionResponse)
def update_licitacion(id: int, licitacion: schemas.LicitacionCreate, db: Session = Depends(get_db)):
    db_licitacion = db.query(models.Licitacion).filter(models.Licitacion.id == id).first()
    if not db_licitacion:
        raise HTTPException(status_code=404, detail="Licitacion no encontrada")
    
    for key, value in licitacion.model_dump(exclude_unset=True).items():
        setattr(db_licitacion, key, value)
    
    db.commit()
    db.refresh(db_licitacion)
    return db_licitacion

@router.delete("/{id}")
def delete_licitacion(id: int, db: Session = Depends(get_db)):
    db_licitacion = db.query(models.Licitacion).filter(models.Licitacion.id == id).first()
    if not db_licitacion:
        raise HTTPException(status_code=404, detail="Licitacion no encontrada")
    
    db.delete(db_licitacion)
    db.commit()
    return {"detail": "Licitacion eliminada"}
