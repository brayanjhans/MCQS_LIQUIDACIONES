import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import os
import logging
import tempfile
import zipfile
from dotenv import load_dotenv

# Configurar logger
logger = logging.getLogger(__name__)

# Credenciales de Backblaze B2 (según código proporcionado)
R2_ACCESS_KEY = "004d1de66d475ce0000000002"
R2_SECRET_KEY = "K004o675vO+bpThtXw5owlNWtEO/+P8"
R2_ENDPOINT = "https://s3.us-west-004.backblazeb2.com"
R2_BUCKET = "remote-mcqs" # Utilizando el bucket que aparece en la imagen proporcionada

# Inicializar cliente de boto3
s3_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="us-west-004"
)

# Credenciales para Fianzas y Facturas
FF_ACCESS_KEY = "004d1de66d475ce0000000003"
FF_SECRET_KEY = "K0043dsZtqB/pVMVsVgJWSPt2gxyAFE"
FF_BUCKET = "FIANZA-FACTURAS"

ff_s3_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=FF_ACCESS_KEY,
    aws_secret_access_key=FF_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="us-west-004"
)

def url_firmada(r2_key: str, expira_segundos: int = 900, download: bool = False) -> str | None:
    """
    Genera una URL temporal firmada para descarga o vista.
    Por defecto expira en 15 minutos (900 segundos).
    Retorna None si falla.
    """
    try:
        params = {"Bucket": R2_BUCKET, "Key": r2_key}
        if download:
            filename = r2_key.split('/')[-1]
            params['ResponseContentDisposition'] = f'attachment; filename="{filename}"'
        else:
            params['ResponseContentDisposition'] = 'inline'
            lower_key = r2_key.lower()
            if lower_key.endswith('.pdf'):
                params['ResponseContentType'] = 'application/pdf'
            elif lower_key.endswith('.jpg') or lower_key.endswith('.jpeg'):
                params['ResponseContentType'] = 'image/jpeg'
            elif lower_key.endswith('.png'):
                params['ResponseContentType'] = 'image/png'
            
        url = s3_client.generate_presigned_url(
            "get_object",
            Params=params,
            ExpiresIn=expira_segundos
        )
        logger.info(f"URL firmada generada para {r2_key} (expira en {expira_segundos}s)")
        return url
    except ClientError as e:
        logger.error(f"Error generando URL firmada para {r2_key}: {e}")
        return None

def eliminar_objeto(r2_key: str) -> bool:
    """
    Elimina un objeto del bucket R2.
    Retorna True si tuvo éxito (o si el objeto no existía), False si falló.
    """
    try:
        s3_client.delete_object(Bucket=R2_BUCKET, Key=r2_key)
        logger.info(f"Eliminado de R2: {r2_key}")
        return True
    except ClientError as e:
        logger.error(f"Error eliminando {r2_key}: {e}")
        return False

def subir_archivo_objeto(file_obj, r2_key: str) -> str:
    """
    Sube un archivo a Backblaze B2 usando el cliente S3 desde un objeto file (UploadFile.file).
    """
    try:
        logger.info(f"Subiendo archivo a R2 como {r2_key}...")
        s3_client.upload_fileobj(file_obj, R2_BUCKET, r2_key)
        logger.info(f"Subida exitosa: {r2_key}")
        return r2_key
    except ClientError as e:
        logger.error(f"Error de boto3 al subir a R2: {e}")
        return None
    except Exception as e:
        logger.error(f"Error inesperado al subir a R2: {e}")
        return None

def subir_archivo_ff(file_obj, key: str, content_type: str = None) -> str:
    """
    Sube un archivo al bucket FIANZA-FACTURAS.
    """
    try:
        logger.info(f"Subiendo a FIANZA-FACTURAS: {key}")
        ExtraArgs = {'ContentType': content_type} if content_type else None
        ff_s3_client.upload_fileobj(file_obj, FF_BUCKET, key, ExtraArgs=ExtraArgs)
        logger.info(f"Subida exitosa: {key}")
        return key
    except Exception as e:
        logger.error(f"Error subiendo a FIANZA-FACTURAS: {e}")
        return None

def url_firmada_ff(key: str, expiration=3600, download=False):
    try:
        params = {'Bucket': FF_BUCKET, 'Key': key}
        if download:
            filename = key.split('/')[-1]
            params['ResponseContentDisposition'] = f'attachment; filename="{filename}"'
            
        url = ff_s3_client.generate_presigned_url(
            'get_object',
            Params=params,
            ExpiresIn=expiration
        )
        return url
    except ClientError as e:
        logger.error(f"Error generando URL firmada para FF: {e}")
        return None

_cached_carpetas_con_fecha = []
_last_cache_time = 0

def listar_carpetas() -> list:
    """
    Lista las carpetas de primer nivel en el bucket con su fecha de modificacion más reciente.
    Usa caché para no demorar 10 segundos en cada llamada.
    """
    global _cached_carpetas_con_fecha, _last_cache_time
    import time
    if time.time() - _last_cache_time < 300 and _cached_carpetas_con_fecha:
        return _cached_carpetas_con_fecha

    carpetas_dict = {}
    try:
        logger.info("Listando carpetas desde S3 usando Delimiter (Instantáneo)...")
        paginator = s3_client.get_paginator('list_objects_v2')
        
        for page in paginator.paginate(Bucket=R2_BUCKET, Delimiter='/'):
            # Carpetas reales (CommonPrefixes)
            for cp in page.get('CommonPrefixes', []):
                folder_name = cp.get('Prefix', '').rstrip('/')
                if folder_name:
                    carpetas_dict[folder_name] = None
                    
            # Archivos sueltos en la raíz
            for obj in page.get('Contents', []):
                key = obj.get('Key', '')
                if key and not key.endswith('.bzEmpty') and '/' not in key:
                    carpetas_dict[key] = obj.get('LastModified')
        
        # Format dates as ISO string for JSON serialization
        _cached_carpetas_con_fecha = [
            {"nombre": k, "fecha": v.isoformat() if v else None} 
            for k, v in carpetas_dict.items()
        ]
        _last_cache_time = time.time()
        logger.info(f"Caché de carpetas actualizado: {len(_cached_carpetas_con_fecha)} carpetas encontradas.")
    except ClientError as e:
        logger.error(f"Error listando carpetas en R2: {e}")
    return _cached_carpetas_con_fecha

def listar_archivos_de_carpeta(nombre_carpeta: str) -> list:
    """
    Lista los archivos y subcarpetas dentro de un prefijo específico.
    Utiliza Delimiter='/' para no aplanar la estructura.
    """
    prefix = nombre_carpeta if nombre_carpeta.endswith('/') else f"{nombre_carpeta}/"
    archivos = []
    try:
        paginator = s3_client.get_paginator('list_objects_v2')
        for page in paginator.paginate(Bucket=R2_BUCKET, Prefix=prefix, Delimiter='/'):
            # Carpetas (CommonPrefixes)
            for cp in page.get('CommonPrefixes', []):
                subfolder_key = cp.get('Prefix')
                archivos.append({
                    "tipo": "carpeta",
                    "key": subfolder_key,
                    "nombre": subfolder_key[len(prefix):].rstrip('/'),
                    "tamano_bytes": 0,
                    "ultima_modificacion": None
                })
            # Archivos (Contents)
            for obj in page.get('Contents', []):
                key = obj.get('Key')
                if key != prefix and not key.endswith('.bzEmpty'):
                    archivos.append({
                        "tipo": "archivo",
                        "key": key,
                        "nombre": key[len(prefix):],
                        "tamano_bytes": obj.get('Size', 0),
                        "ultima_modificacion": obj.get('LastModified').isoformat() if obj.get('LastModified') else None
                    })
    except ClientError as e:
        logger.error(f"Error listando archivos de '{nombre_carpeta}' en R2: {e}")
    return archivos

def crear_carpeta(nombre_carpeta: str) -> bool:
    """
    Crea una 'carpeta' subiendo un objeto vacío con el nombre terminado en /.
    También crea un archivo .bzEmpty para asegurar que B2 lo registre.
    """
    global _cached_carpetas_con_fecha
    import datetime
    if not nombre_carpeta.endswith('/'):
        nombre_carpeta += '/'
    
    try:
        s3_client.put_object(Bucket=R2_BUCKET, Key=nombre_carpeta)
        # B2 a veces ignora carpetas completamente vacías, creamos un marcador
        s3_client.put_object(Bucket=R2_BUCKET, Key=f"{nombre_carpeta}.bzEmpty")
        logger.info(f"Carpeta creada en R2: {nombre_carpeta}")
        
        # Update cache directly to avoid 10s wait on next load
        folder_name = nombre_carpeta.rstrip('/')
        _cached_carpetas_con_fecha.append({
            "nombre": folder_name,
            "fecha": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })
        return True
    except ClientError as e:
        logger.error(f"Error creando carpeta '{nombre_carpeta}': {e}")
        return False

def eliminar_carpeta(nombre_carpeta: str) -> bool:
    """
    Elimina una carpeta y TODO su contenido.
    """
    prefix = nombre_carpeta if nombre_carpeta.endswith('/') else f"{nombre_carpeta}/"
    try:
        paginator = s3_client.get_paginator('list_objects_v2')
        for page in paginator.paginate(Bucket=R2_BUCKET, Prefix=prefix):
            objects = [{'Key': obj['Key']} for obj in page.get('Contents', [])]
            if objects:
                # Boto3 allows deleting up to 1000 objects at once
                for i in range(0, len(objects), 1000):
                    s3_client.delete_objects(
                        Bucket=R2_BUCKET,
                        Delete={'Objects': objects[i:i+1000]}
                    )
        logger.info(f"Carpeta eliminada en R2: {prefix}")
        return True
    except ClientError as e:
        logger.error(f"Error eliminando carpeta '{prefix}': {e}")
        return False

def descargar_carpeta_zip(nombre_carpeta: str) -> str | None:
    """
    Genera un archivo ZIP local temporal con todo el contenido de una carpeta (prefix) de S3.
    Retorna la ruta absoluta del archivo .zip local o None si hay un error.
    """
    prefix = nombre_carpeta if nombre_carpeta.endswith('/') else f"{nombre_carpeta}/"
    try:
        temp_dir = tempfile.gettempdir()
        safe_name = nombre_carpeta.strip('/').replace('/', '_').replace('\\', '_')
        if not safe_name:
            safe_name = "descarga"
        zip_path = os.path.join(temp_dir, f"{safe_name}.zip")
        
        paginator = s3_client.get_paginator('list_objects_v2')
        # Usamos ZIP_DEFLATED.
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for page in paginator.paginate(Bucket=R2_BUCKET, Prefix=prefix):
                for obj in page.get('Contents', []):
                    key = obj.get('Key')
                    if not key or key.endswith('/') or key.endswith('.bzEmpty'): 
                        continue
                    
                    # El nombre dentro del zip será relativo a la carpeta descargada
                    arcname = key[len(prefix):]
                    
                    # Descargamos directamente al zip en streaming
                    s3_obj = s3_client.get_object(Bucket=R2_BUCKET, Key=key)
                    with zipf.open(arcname, 'w') as zfile:
                        for chunk in s3_obj['Body'].iter_chunks(chunk_size=1024*1024):
                            zfile.write(chunk)
                            
        logger.info(f"ZIP generado exitosamente para {nombre_carpeta} en {zip_path}")
        return zip_path
    except Exception as e:
        logger.error(f"Error creando zip para '{nombre_carpeta}': {e}")
        return None
