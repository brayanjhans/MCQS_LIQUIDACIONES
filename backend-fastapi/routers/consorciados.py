from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter()

@router.get("/{empresa_id}", response_model=List[schemas.ConsorciadoResponse])
def get_consorciados(empresa_id: int, db: Session = Depends(get_db)):
    return db.query(models.Consorciado).filter(models.Consorciado.empresa_id == empresa_id).all()

@router.post("/{empresa_id}", response_model=schemas.ConsorciadoResponse)
def create_consorciado(empresa_id: int, consorciado: schemas.ConsorciadoCreate, db: Session = Depends(get_db)):
    consorciado.empresa_id = empresa_id
    db_consorciado = models.Consorciado(**consorciado.model_dump())
    db.add(db_consorciado)
    db.commit()
    db.refresh(db_consorciado)
    return db_consorciado

@router.delete("/{id}")
def delete_consorciado(id: int, db: Session = Depends(get_db)):
    db_consorciado = db.query(models.Consorciado).filter(models.Consorciado.id == id).first()
    if not db_consorciado:
        raise HTTPException(status_code=404, detail="Consorciado no encontrado")
    
    db.delete(db_consorciado)
    db.commit()
    return {"detail": "Consorciado eliminado"}
