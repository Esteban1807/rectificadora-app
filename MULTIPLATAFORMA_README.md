# Rectificadora Santofimio - App Multiplataforma

Sistema de inventario para motores con base de datos centralizada MySQL. Disponible en:
- **PC (Windows, macOS, Linux)** - Electron
- **Android** - APK
- **Web** - React

## Características

- Gestión de motores en inventario
- Registro de trabajos y componentes
- Checklist de componentes
- Historial completo de motores
- Base de datos centralizada en MySQL
- Mismo acceso desde cualquier dispositivo

## Instalación

### 1. Requisitos
- Node.js 16+
- npm o yarn
- Git

### 2. Instalación local

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/rectificadora-app.git
cd rectificadora-app

# Instalar todas las dependencias
npm run install-all
```

### 3. Variables de entorno

Crear `.env` en la raíz del proyecto con credenciales de MySQL.

## Desarrollo

### PC (Electron + Node.js)

```bash
# En terminal 1: Servidor
npm run server

# En terminal 2: Cliente
npm run client

# O ambos simultáneamente (concurrently)
npm run dev
```

### Electron Dev

```bash
npm run electron:dev
```

## Compilación

### Windows/macOS/Linux (Electron)

```bash
npm run dist
```

Los ejecutables se encontrarán en `dist/`

### Android

Se necesita React Native CLI:
```bash
# Próximamente
```

## Base de Datos

- **Tipo**: MySQL
- **Host**: Railway (servidor centralizado)
- **Credenciales**: Configuradas en `.env`

## Deploy

Ver [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) para instrucciones de despliegue en Railway.

## Estructura del Proyecto

```
├── server/
│   ├── index.js          # Servidor Express
│   └── database.js       # Funciones MySQL
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── services/     # API client
│   │   └── App.js
│   └── package.json
├── electron-main.js      # Punto de entrada Electron
├── package.json
└── .env                  # Configuración (NO versionar)
```

## Licencia

ISC
