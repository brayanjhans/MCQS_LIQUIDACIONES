import os
import sys
import s3_client
from s3_client import s3_client as boto_client, R2_BUCKET
import time

# Forzar utf-8 para los prints y evitar UnicodeEncodeError en consola de Windows
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"\\Servidor_001\f\000 OBRAS SECREX CESCE"

def get_existing_keys():
    print("Obteniendo lista de archivos existentes en la nube...")
    keys = set()
    try:
        paginator = boto_client.get_paginator('list_objects_v2')
        for page in paginator.paginate(Bucket=R2_BUCKET):
            for obj in page.get('Contents', []):
                keys.add(obj['Key'])
    except Exception as e:
        print(f"Error listando la nube: {e}")
    return keys

def main():
    if not os.path.exists(BASE_DIR):
        print(f"Error: La ruta {BASE_DIR} no existe o no es accesible.")
        return

    existing_keys = get_existing_keys()
    
    files_to_upload = []
    print("Escaneando directorio local...")
    for root, dirs, files in os.walk(BASE_DIR):
        for f in files:
            local_path = os.path.join(root, f)
            # Calcular ruta relativa para S3 Key
            rel_path = os.path.relpath(local_path, BASE_DIR)
            s3_key = rel_path.replace('\\', '/')
            
            # Skip hidden files or useless OS files if you want, but we'll upload everything
            if s3_key in existing_keys:
                continue
            
            files_to_upload.append((local_path, s3_key))
            
    print(f"Archivos nuevos a subir: {len(files_to_upload)}")
    
    if len(files_to_upload) == 0:
        print("Todo esta sincronizado.")
        return

    uploaded_count = 0
    error_count = 0
    for local_path, s3_key in files_to_upload:
        try:
            safe_print_key = s3_key.encode('utf-8', 'replace').decode('utf-8')
            print(f"[{uploaded_count+1}/{len(files_to_upload)}] Subiendo: {safe_print_key}...")
            # upload_file maneja archivos grandes automáticamente
            boto_client.upload_file(local_path, R2_BUCKET, s3_key)
            uploaded_count += 1
        except Exception as e:
            try:
                print(f"Error al subir {s3_key.encode('utf-8', 'replace').decode('utf-8')}: {e}")
            except:
                pass
            error_count += 1
            
    print(f"\nResumen:")
    print(f"Subidos con éxito: {uploaded_count}")
    print(f"Errores: {error_count}")

if __name__ == '__main__':
    main()
