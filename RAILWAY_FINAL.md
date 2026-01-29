# 🚀 INSTRUCCIONES FINALES - Railway Setup

## ✅ Cambios implementados:

1. **railway.json** - Configuración explícita de Railway
2. **Procfile** - Define comando de inicio
3. **.railwayignore** - Excluye directorios innecesarios
4. **server/index.js** - Escucha en 0.0.0.0 (requerido en Railway)
5. **client/build/** - React compilado localmente

---

## 📋 Configurar Variables en Railway Dashboard:

Ve a: https://railway.app → Tu proyecto → Variables

Agrega estas variables (EXACTAMENTE así):

```
MYSQLHOST=${{RAILWAY_PRIVATE_DOMAIN}}
MYSQLUSER=root
MYSQLPASSWORD=uYwBKpKjBWqxTNPqrwOekKICBpWXSjVc
MYSQLDATABASE=${{MYSQL_DATABASE}}
MYSQLPORT=3306
NODE_ENV=production
PORT=8080
```

---

## 🔄 Trigger Manual Build en Railway:

1. Ve a: https://railway.app
2. Selecciona tu proyecto "web"
3. Click en los 3 puntos (...) → "Rebuild"
4. Espera 3-5 minutos

---

## ✔️ Verificar que funcione:

Una vez que el build esté "Success":

1. Ve a "Deployments" → El más reciente
2. Busca "Public URL" (algo como: `web-production-xxxx.up.railway.app`)
3. Abre en navegador: `https://web-production-xxxx.up.railway.app`

Deberías ver la interfaz de tu app.

---

## 🔗 Actualizar API en Cliente:

Una vez que funcione en Railway, actualiza `client/src/services/api.js`:

```javascript
const API_URL = 'https://tu-url-de-railway.up.railway.app/api';
```

Luego:
```bash
npm run build
git add .
git commit -m "Update API URL to Railway"
git push
```

---

## ❌ Si falla de nuevo:

Ve a "Build Logs" en Railway y busca:
- Errores de MySQL (conexión)
- Errores de Node.js

Si es error de MySQL → Verifica credenciales en Variables

---

## ✅ Una vez funcione en Railway:

Puedes compilar Electron para Windows:
```bash
npm run dist
```

Y tendrás tu app desktop + web + Android (próximamente)
