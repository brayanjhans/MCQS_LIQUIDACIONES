from database import SessionLocal
import models
import s3_client

def sync():
    db = SessionLocal()
    try:
        carpetas = s3_client.listar_carpetas()
        count = 0
        for c in carpetas:
            nombre = c['nombre']
            if not nombre:
                continue
            existing = db.query(models.Empresa).filter(models.Empresa.nombre == nombre).first()
            if not existing:
                new_emp = models.Empresa(nombre=nombre)
                db.add(new_emp)
                count += 1
        db.commit()
        print(f"Sincronizados {count} nuevos consorcios/obras desde S3.")
    finally:
        db.close()

if __name__ == "__main__":
    sync()
