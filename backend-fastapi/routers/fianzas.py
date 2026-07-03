from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from datetime import date
import models, schemas
import s3_client

router = APIRouter()

@router.get("/vencimientos/proximos")
def get_proximos_vencimientos(db: Session = Depends(get_db)):
    hoy = date.today()
    fianzas = db.query(models.CartaFianza).filter(models.CartaFianza.fecha_vencimiento >= hoy).order_by(models.CartaFianza.fecha_vencimiento.asc()).limit(8).all()
    result = []
    for f in fianzas:
        result.append({
            "id": f.id,
            "empresa_id": f.empresa_id,
            "empresa_nombre": f.empresa.nombre if f.empresa else "Desconocido",
            "tipo": f.tipo,
            "numero": f.numero,
            "fecha_vencimiento": f.fecha_vencimiento,
            "monto": f.monto
        })
    return result

@router.get("/{empresa_id}", response_model=List[schemas.CartaFianzaResponse])
def get_fianzas(empresa_id: int, db: Session = Depends(get_db)):
    return db.query(models.CartaFianza).filter(models.CartaFianza.empresa_id == empresa_id).order_by(models.CartaFianza.id.desc()).all()

@router.post("/{empresa_id}", response_model=schemas.CartaFianzaResponse)
def create_fianza(
    empresa_id: int,
    tipo: str = Form(...),
    numero: str = Form(...),
    fecha_inicio: date = Form(...),
    fecha_vencimiento: date = Form(...),
    vigencia_dias: int = Form(0),
    monto: float = Form(...),
    observaciones: Optional[str] = Form(None),
    archivo: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    empresa = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    pdf_path = None
    if archivo and archivo.filename:
        ext = archivo.filename.split('.')[-1]
        key = f"{empresa.nombre}/Fianzas/{numero}.{ext}"
        pdf_path = s3_client.subir_archivo_ff(archivo.file, key, archivo.content_type)
        
    db_fianza = models.CartaFianza(
        empresa_id=empresa_id,
        tipo=tipo,
        numero=numero,
        fecha_inicio=fecha_inicio,
        fecha_vencimiento=fecha_vencimiento,
        vigencia_dias=vigencia_dias,
        monto=monto,
        observaciones=observaciones,
        pdf_path=pdf_path
    )
    db.add(db_fianza)
    db.commit()
    db.refresh(db_fianza)
    return db_fianza

@router.put("/{id}", response_model=schemas.CartaFianzaResponse)
def update_fianza(
    id: int,
    tipo: Optional[str] = Form(None),
    numero: Optional[str] = Form(None),
    fecha_inicio: Optional[date] = Form(None),
    fecha_vencimiento: Optional[date] = Form(None),
    vigencia_dias: Optional[int] = Form(None),
    monto: Optional[float] = Form(None),
    observaciones: Optional[str] = Form(None),
    archivo: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    db_fianza = db.query(models.CartaFianza).filter(models.CartaFianza.id == id).first()
    if not db_fianza:
        raise HTTPException(status_code=404, detail="Fianza no encontrada")
        
    if archivo and archivo.filename:
        ext = archivo.filename.split('.')[-1]
        empresa = db.query(models.Empresa).filter(models.Empresa.id == db_fianza.empresa_id).first()
        numero_actual = numero if numero else db_fianza.numero
        key = f"{empresa.nombre}/Fianzas/{numero_actual}.{ext}"
        new_pdf_path = s3_client.subir_archivo_ff(archivo.file, key, archivo.content_type)
        if new_pdf_path:
            db_fianza.pdf_path = new_pdf_path

    if tipo is not None: db_fianza.tipo = tipo
    if numero is not None: db_fianza.numero = numero
    if fecha_inicio is not None: db_fianza.fecha_inicio = fecha_inicio
    if fecha_vencimiento is not None: db_fianza.fecha_vencimiento = fecha_vencimiento
    if vigencia_dias is not None: db_fianza.vigencia_dias = vigencia_dias
    if monto is not None: db_fianza.monto = monto
    if observaciones is not None: db_fianza.observaciones = observaciones
    
    db.commit()
    db.refresh(db_fianza)
    return db_fianza

@router.get("/download/{id}")
def download_fianza(id: int, db: Session = Depends(get_db)):
    fianza = db.query(models.CartaFianza).filter(models.CartaFianza.id == id).first()
    if not fianza or not fianza.pdf_path:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    url = s3_client.url_firmada_ff(fianza.pdf_path)
    download_url = s3_client.url_firmada_ff(fianza.pdf_path, download=True)
    if not url:
        raise HTTPException(status_code=500, detail="Error al generar URL")
    return {"url": url, "download_url": download_url}

@router.delete("/{id}")
def delete_fianza(id: int, db: Session = Depends(get_db)):
    db_fianza = db.query(models.CartaFianza).filter(models.CartaFianza.id == id).first()
    if not db_fianza:
        raise HTTPException(status_code=404, detail="Fianza no encontrada")
    
    db.delete(db_fianza)
    db.commit()
    return {"detail": "Fianza eliminada"}
