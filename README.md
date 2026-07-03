# MCQS-JCQ — Panel de Gestión de Consorcios y Obras

Sistema web de administración para la gestión de consorcios, obras de construcción y empleados.

## Estructura del Proyecto

```
MCQS-JCQ/
├── backend/       → Servidor Express.js + MySQL
├── frontend/      → Dashboard con Tailwind CSS + Alpine.js
```

## Requisitos

- **Node.js** 18.x o superior
- **MySQL Server** 5.7+ corriendo en localhost

## Instalación

### 1. Backend

```bash
cd backend
npm install
node db-setup.js    # Crea la base de datos y usuario admin
npm start           # Inicia el servidor en http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run start       # Inicia el dev server en http://localhost:3000
```

## Acceso

Después del setup, inicia sesión con:

- **Email:** admin@mcqs.com
- **Password:** admin123

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML, Tailwind CSS v4, Alpine.js |
| Bundler | Webpack 5 |
| Backend | Express.js |
| Base de Datos | MySQL |
| Auth | JWT (JSON Web Tokens) |

## Licencia

MIT License
