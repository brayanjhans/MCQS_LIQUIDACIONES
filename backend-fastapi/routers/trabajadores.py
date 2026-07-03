from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
import models
import os
import uuid
import shutil
from typing import Optional
from datetime import date

router = APIRouter(
    prefix="/api/trabajadores",
    tags=["Trabajadores"]
)

@router.get("/")
def get_trabajadores(db: Session = Depends(get_db)):
    trabajadores = db.query(models.Trabajador).all()
    result = []
    for t in trabajadores:
        docs = db.query(models.DocumentoTrabajador).filter(models.DocumentoTrabajador.trabajador_id == t.id).all()
        
        # Helper to find latest document of a type
        def get_latest(tipo):
            t_docs = [d for d in docs if d.tipo == tipo]
            if not t_docs: return None
            return sorted(t_docs, key=lambda x: x.fecha_vencimiento or date.min, reverse=True)[0]

        sctr_salud = get_latest('SCTR_Salud')
        sctr_pension = get_latest('SCTR_Pension')
        emo = get_latest('EMO')
        contrato = get_latest('Contrato')

        result.append({
            "id": t.id,
            "dni": t.dni,
            "nombres": t.nombres,
            "apellidos": t.apellidos,
            "cargo": t.cargo,
            "categoria": t.categoria,
            "estado": t.estado,
            "fecha_ingreso": t.fecha_ingreso.isoformat() if t.fecha_ingreso else None,
            "empresa_nombre": t.empresa.nombre if t.empresa else None,
            "alertas": {
                "sctr_salud_vencimiento": sctr_salud.fecha_vencimiento.isoformat() if sctr_salud and sctr_salud.fecha_vencimiento else None,
                "sctr_pension_vencimiento": sctr_pension.fecha_vencimiento.isoformat() if sctr_pension and sctr_pension.fecha_vencimiento else None,
                "emo_vencimiento": emo.fecha_vencimiento.isoformat() if emo and emo.fecha_vencimiento else None,
                "contrato_vencimiento": contrato.fecha_vencimiento.isoformat() if contrato and contrato.fecha_vencimiento else None,
            }
        })
    return result

@router.post("/")
def create_trabajador(
    dni: str = Form(...),
    nombres: str = Form(...),
    apellidos: str = Form(...),
    cargo: str = Form(None),
    categoria: str = Form(...),
    empresa_id: Optional[int] = Form(None),
    fecha_ingreso: Optional[date] = Form(None),
    db: Session = Depends(get_db)
):
    # Check if exists
    existing = db.query(models.Trabajador).filter(models.Trabajador.dni == dni).first()
    if existing:
        raise HTTPException(status_code=400, detail="El DNI ya está registrado")

    nuevo = models.Trabajador(
        dni=dni,
        nombres=nombres,
        apellidos=apellidos,
        cargo=cargo,
        categoria=categoria,
        empresa_id=empresa_id,
        fecha_ingreso=fecha_ingreso
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/{id}")
def get_trabajador(id: int, db: Session = Depends(get_db)):
    t = db.query(models.Trabajador).filter(models.Trabajador.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    
    documentos = db.query(models.DocumentoTrabajador).filter(models.DocumentoTrabajador.trabajador_id == id).all()
    epps = db.query(models.EntregaEPP).filter(models.EntregaEPP.trabajador_id == id).all()
    
    return {
        "id": t.id,
        "dni": t.dni,
        "nombres": t.nombres,
        "apellidos": t.apellidos,
        "cargo": t.cargo,
        "categoria": t.categoria,
        "estado": t.estado,
        "fecha_ingreso": t.fecha_ingreso,
        "empresa": {"id": t.empresa.id, "nombre": t.empresa.nombre} if t.empresa else None,
        "documentos": documentos,
        "epps": epps
    }

@router.post("/{id}/documentos")
def add_documento(
    id: int,
    tipo: str = Form(...),
    fecha_emision: Optional[date] = Form(None),
    fecha_vencimiento: Optional[date] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    t = db.query(models.Trabajador).filter(models.Trabajador.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = models.DocumentoTrabajador(
        trabajador_id=id,
        tipo=tipo,
        fecha_emision=fecha_emision,
        fecha_vencimiento=fecha_vencimiento,
        archivo_pdf=filepath
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.post("/{id}/epps")
def add_epp(
    id: int,
    descripcion: str = Form(...),
    fecha_entrega: date = Form(...),
    cantidad: int = Form(1),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    filepath = None
    if file:
        ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join("uploads", filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    epp = models.EntregaEPP(
        trabajador_id=id,
        descripcion=descripcion,
        fecha_entrega=fecha_entrega,
        cantidad=cantidad,
        firma_pdf=filepath
    )
    db.add(epp)
    db.commit()
    db.refresh(epp)
    return epp
