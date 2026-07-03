from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
import os
import shutil
import s3_client

router = APIRouter()

@router.post("/{empresa_id}", response_model=schemas.ArchivoResponse)
async def upload_archivo(
    empresa_id: int, 
    file: UploadFile = File(...),
    categoria: str = Form(...),
    db: Session = Depends(get_db)
):
    empresa = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Subir a Backblaze B2
    clean_filename = file.filename.replace(" ", "_")
    r2_key = f"{empresa_id}/{clean_filename}"
    
    # We don't have file size easily from stream without reading it, but we can seek
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    
    uploaded_key = s3_client.subir_archivo_objeto(file.file, r2_key)
    if not uploaded_key:
        raise HTTPException(status_code=500, detail="Error al subir el archivo a B2")
    
    db_archivo = models.Archivo(
        empresa_id=empresa_id,
        nombre_original=clean_filename,
        ruta_fisica=uploaded_key,
        categoria=categoria,
        tamano_bytes=file_size
    )
    db.add(db_archivo)
    db.commit()
    db.refresh(db_archivo)
    return db_archivo

@router.get("/{empresa_id}", response_model=list[schemas.ArchivoResponse])
def read_archivos(empresa_id: int, db: Session = Depends(get_db)):
    return db.query(models.Archivo).filter(models.Archivo.empresa_id == empresa_id).all()

@router.get("/descargar/{archivo_id}")
def get_download_url(archivo_id: int, db: Session = Depends(get_db)):
    archivo = db.query(models.Archivo).filter(models.Archivo.id == archivo_id).first()
    if not archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    url = s3_client.url_firmada(archivo.ruta_fisica)
    if not url:
        raise HTTPException(status_code=500, detail="Error al generar URL de descarga")
        
    return {"url": url}

@router.delete("/{archivo_id}")
def delete_archivo(archivo_id: int, db: Session = Depends(get_db)):
    archivo = db.query(models.Archivo).filter(models.Archivo.id == archivo_id).first()
    if not archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
        
    # Delete from B2
    s3_client.eliminar_objeto(archivo.ruta_fisica)
        
    db.delete(archivo)
    db.commit()
    return {"message": "Archivo eliminado exitosamente"}
