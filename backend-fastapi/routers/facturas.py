from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from datetime import date
import models, schemas
import s3_client

router = APIRouter()

@router.get("/{empresa_id}", response_model=List[schemas.FacturaResponse])
def get_facturas(empresa_id: int, db: Session = Depends(get_db)):
    return db.query(models.Factura).filter(models.Factura.empresa_id == empresa_id).order_by(models.Factura.id.desc()).all()

@router.post("/{empresa_id}", response_model=schemas.FacturaResponse)
def create_factura(
    empresa_id: int,
    numero: str = Form(...),
    monto: float = Form(...),
    fecha_salida: date = Form(...),
    tipo_fianza_relacionada: Optional[str] = Form(None),
    numero_fianza_relacionada: Optional[str] = Form(None),
    es_observada: bool = Form(False),
    observacion: Optional[str] = Form(None),
    archivo: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    empresa = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    pdf_path = None
    if archivo and archivo.filename:
        ext = archivo.filename.split('.')[-1]
        key = f"{empresa.nombre}/Facturas/{numero}.{ext}"
        pdf_path = s3_client.subir_archivo_ff(archivo.file, key, archivo.content_type)
        
    db_factura = models.Factura(
        empresa_id=empresa_id,
        numero=numero,
        monto=monto,
        fecha_salida=fecha_salida,
        tipo_fianza_relacionada=tipo_fianza_relacionada,
        numero_fianza_relacionada=numero_fianza_relacionada,
        es_observada=es_observada,
        observacion=observacion,
        pdf_path=pdf_path
    )
    db.add(db_factura)
    db.commit()
    db.refresh(db_factura)
    return db_factura

@router.put("/{id}", response_model=schemas.FacturaResponse)
def update_factura(
    id: int,
    numero: Optional[str] = Form(None),
    monto: Optional[float] = Form(None),
    fecha_salida: Optional[date] = Form(None),
    tipo_fianza_relacionada: Optional[str] = Form(None),
    numero_fianza_relacionada: Optional[str] = Form(None),
    es_observada: Optional[bool] = Form(None),
    observacion: Optional[str] = Form(None),
    archivo: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    db_factura = db.query(models.Factura).filter(models.Factura.id == id).first()
    if not db_factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
        
    if archivo and archivo.filename:
        ext = archivo.filename.split('.')[-1]
        empresa = db.query(models.Empresa).filter(models.Empresa.id == db_factura.empresa_id).first()
        numero_actual = numero if numero else db_factura.numero
        key = f"{empresa.nombre}/Facturas/{numero_actual}.{ext}"
        new_pdf_path = s3_client.subir_archivo_ff(archivo.file, key, archivo.content_type)
        if new_pdf_path:
            db_factura.pdf_path = new_pdf_path

    if numero is not None: db_factura.numero = numero
    if monto is not None: db_factura.monto = monto
    if fecha_salida is not None: db_factura.fecha_salida = fecha_salida
    if tipo_fianza_relacionada is not None: db_factura.tipo_fianza_relacionada = tipo_fianza_relacionada
    if numero_fianza_relacionada is not None: db_factura.numero_fianza_relacionada = numero_fianza_relacionada
    if es_observada is not None: db_factura.es_observada = es_observada
    if observacion is not None: db_factura.observacion = observacion
    
    db.commit()
    db.refresh(db_factura)
    return db_factura

@router.get("/download/{id}")
def download_factura(id: int, db: Session = Depends(get_db)):
    factura = db.query(models.Factura).filter(models.Factura.id == id).first()
    if not factura or not factura.pdf_path:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    url = s3_client.url_firmada_ff(factura.pdf_path)
    download_url = s3_client.url_firmada_ff(factura.pdf_path, download=True)
    if not url:
        raise HTTPException(status_code=500, detail="Error al generar URL")
    return {"url": url, "download_url": download_url}

@router.delete("/{id}")
def delete_factura(id: int, db: Session = Depends(get_db)):
    db_factura = db.query(models.Factura).filter(models.Factura.id == id).first()
    if not db_factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    db.delete(db_factura)
    db.commit()
    return {"detail": "Factura eliminada"}
