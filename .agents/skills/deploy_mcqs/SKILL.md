---
name: Deploy MCQS JCQ Project
description: Instrucciones paso a paso para hacer deploy o actualizar el proyecto MCQS-JCQ en el VPS de producción.
---
# Deploy MCQS JCQ Project

Este proyecto consta de un frontend en Next.js y un backend en FastAPI, hospedado en un VPS gestionado con CloudPanel.

## Credenciales y Datos del Servidor
- **IP VPS:** 72.61.219.79
- **Usuario SSH:** root / Contra159753#
- **Ruta del Repositorio en VPS:** `/home/admin/repositories/mcqs-jcq`
- **Dominios:** 
  - Frontend: `mcqs-consultoria.site` (puerto local 3100)
  - Backend API: `api.mcqs-consultoria.site` (puerto local 8100)
  - *Ambos gestionados por CloudPanel como "Proxy Inverso" con HTTPS (Let's Encrypt).*
- **Base de Datos:** MySQL (gestionado por CloudPanel)
  - Nombre: `mcqsoperaciones`
  - Usuario: `liquser`
  - Contraseña: `LiqMcqs2026#`
- **Procesos (PM2):** 
  - `frontend-mcqs-jcq` 
  - `api-mcqs-jcq` 

## Pasos para actualizar (Deploy)
Cuando el usuario pida aplicar nuevos cambios subidos al repositorio:

1. **Obtener el código (Pull)**
   Conéctate por SSH y baja los cambios de GitHub:
   ```bash
   cd /home/admin/repositories/mcqs-jcq
   git pull origin main
   ```

2. **Deploy del Backend (FastAPI)**
   Si hubo cambios en requerimientos o código Python:
   ```bash
   cd backend-fastapi
   source venv/bin/activate
   pip install -r requirements.txt
   pm2 restart api-mcqs-jcq --update-env
   ```

3. **Deploy del Frontend (Next.js)**
   El frontend DEBE recompilarse (`npm run build`) para que los cambios se reflejen.
   ```bash
   cd frontend-next
   npm install
   npm run build
   pm2 restart frontend-mcqs-jcq --update-env
   ```
   *(Nota: Asegúrate de que el archivo `.env` en esa carpeta tenga `NEXT_PUBLIC_API_URL=https://api.mcqs-consultoria.site` antes del build).*

4. **Base de Datos (Migraciones)**
   Si el usuario agregó nuevas columnas o tablas, debes aplicar el SQL en el servidor. Usa este comando rápido:
   ```bash
   mysql -uliquser -p'LiqMcqs2026#' mcqsoperaciones -e "ALTER TABLE tu_tabla ADD COLUMN nueva_columna VARCHAR(255);"
   ```

5. **Verificación final**
   Comprueba los logs para asegurarte de que levantaron sin error:
   ```bash
   pm2 logs api-mcqs-jcq --lines 15
   pm2 logs frontend-mcqs-jcq --lines 15
   ```
