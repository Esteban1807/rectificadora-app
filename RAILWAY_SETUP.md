# Instrucciones para desplegar en Railway

## 1. Inicializar Git

```powershell
cd D:\juani\escritorio\RectificadoraSantofimio
git init
git add .
git commit -m "Initial commit - MySQL migration"
```

## 2. Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Crea un repositorio llamado "rectificadora-app"
3. NO inicialices con README

## 3. Conectar tu repositorio local a GitHub

```powershell
git remote add origin https://github.com/TU_USUARIO/rectificadora-app.git
git branch -M main
git push -u origin main
```

## 4. Desplegar en Railway

### Opción A: Usar Railway CLI (Recomendado)
```powershell
npm install -g @railway/cli
railway login
railway init
railway up
```

### Opción B: Conectar directamente en Railway
1. Ve a https://railway.app
2. Inicia sesión con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecciona el repositorio "rectificadora-app"
5. Railway detectará automáticamente que es un Node.js app

## 5. Configurar variables de entorno en Railway

En el dashboard de Railway, ve a "Variables" y añade:
- `NODE_ENV`: production
- `MYSQLHOST`: ${{RAILWAY_PRIVATE_DOMAIN}}
- `MYSQLUSER`: root
- `MYSQLPASSWORD`: uYwBKpKjBWqxTNPqrwOekKICBpWXSjVc
- `MYSQLDATABASE`: ${{MYSQL_DATABASE}}
- `MYSQLPORT`: 3306

## 6. Obtener URL pública del servidor

Una vez deployado, verás la URL pública en el dashboard (ej: https://rectificadora-app-production.up.railway.app)

## 7. Actualizar API_URL en client

Actualiza este valor en `client/src/services/api.js`:
```javascript
const API_URL = 'https://tu-url-railway.railway.app/api';
```

## 8. Recompilar y desplegar Electron

```powershell
npm run dist
```

Ahora tu app Electron usará el servidor remoto en lugar del local.
