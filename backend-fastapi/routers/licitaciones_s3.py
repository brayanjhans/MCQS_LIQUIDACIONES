from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, BackgroundTasks, Depends
from sqlalchemy.orm import Session
import models
from database import get_db
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import s3_client

router = APIRouter()

class CarpetaCreate(BaseModel):
    nombre: str

@router.get("/carpetas")
def get_carpetas():
    carpetas = s3_client.listar_carpetas()
    return carpetas

@router.post("/carpetas")
def create_carpeta(carpeta: CarpetaCreate, db: Session = Depends(get_db)):
    if not carpeta.nombre:
        raise HTTPException(status_code=400, detail="El nombre de la carpeta es requerido")
    success = s3_client.crear_carpeta(carpeta.nombre)
    if not success:
        raise HTTPException(status_code=500, detail="Error al crear la carpeta en B2")
        
    # Sincronización automática con la base de datos (Liquidaciones)
    existing = db.query(models.Empresa).filter(models.Empresa.nombre == carpeta.nombre).first()
    if not existing:
        new_emp = models.Empresa(nombre=carpeta.nombre)
        db.add(new_emp)
        db.commit()
        
    return {"message": "Carpeta creada exitosamente", "nombre": carpeta.nombre}

@router.delete("/carpetas")
def delete_carpeta(carpeta: str = Query(...)):
    success = s3_client.eliminar_carpeta(carpeta)
    if not success:
        raise HTTPException(status_code=500, detail="Error al eliminar la carpeta en B2")
    return {"message": "Carpeta eliminada exitosamente"}

@router.get("/carpetas/descargar-zip")
def descargar_carpeta_zip(background_tasks: BackgroundTasks, carpeta: str = Query(...)):
    zip_path = s3_client.descargar_carpeta_zip(carpeta)
    if not zip_path or not os.path.exists(zip_path):
        raise HTTPException(status_code=500, detail="Error al generar el archivo ZIP")
        
    def cleanup(path):
        try:
            if os.path.exists(path):
                os.remove(path)
        except:
            pass
            
    background_tasks.add_task(cleanup, zip_path)
    
    safe_name = carpeta.strip('/').split('/')[-1]
    if not safe_name:
        safe_name = "descarga"
        
    return FileResponse(
        path=zip_path,
        filename=f"{safe_name}.zip",
        media_type="application/zip"
    )

@router.get("/archivos")
def get_archivos(carpeta: str = Query(...)):
    archivos = s3_client.listar_archivos_de_carpeta(carpeta)
    return archivos

@router.post("/archivos")
async def upload_archivo(
    carpeta: str = Form(...),
    file: UploadFile = File(...)
):
    clean_filename = file.filename.replace(" ", "_")
    carpeta_limpia = carpeta.rstrip('/')
    r2_key = f"{carpeta_limpia}/{clean_filename}"
    
    uploaded_key = s3_client.subir_archivo_objeto(file.file, r2_key)
    if not uploaded_key:
        raise HTTPException(status_code=500, detail="Error al subir el archivo a B2")
    
    return {"message": "Archivo subido exitosamente", "key": uploaded_key}

@router.delete("/archivos")
def delete_archivo(key: str = Query(...)):
    success = s3_client.eliminar_objeto(key)
    if not success:
        raise HTTPException(status_code=500, detail="Error al eliminar el archivo en B2")
    return {"message": "Archivo eliminado exitosamente"}

@router.get("/archivos/descargar")
def get_download_url(key: str = Query(...), inline: bool = Query(False)):
    url = s3_client.url_firmada(key, download=not inline)
    if not url:
        raise HTTPException(status_code=500, detail="Error al generar URL de descarga")
    return {"url": url}
