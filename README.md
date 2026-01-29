# 🔧 Sistema de Inventario - Rectificadora Santofimio

Sistema completo de gestión de inventario para motores que entran y salen de una rectificadora, con control de trabajos, partes y checklist de componentes.

## Características

- ✅ **Pantalla de Ingreso**: Vista principal con lista de vehículos en taller y botón para nuevo ingreso
- ✅ **Formulario de Ingreso Completo**: Registro de motores con información del cliente, vehículo, placa y items/partes ingresadas
- ✅ **Gestión de Items/Partes**: Tabla para registrar partes que ingresan con el motor (Cantidad, Descripción, Valor)
- ✅ **Orden de Trabajo**: Módulo para crear y gestionar trabajos a realizar con precios y mecánico asignado
- ✅ **Control de IVA**: Opción para incluir o excluir IVA (19%) en el cálculo del total
- ✅ **Vista de Trabajos por Ingreso**: Muestra información completa del motor, partes ingresadas y trabajos realizados
- ✅ **Checklist de Componentes**: Sistema de verificación de componentes del motor (Bloque, Cigüeñal, Culata, Bielas, etc.)
- ✅ **Estados de Trabajo**: Control de estados (En proceso, Finalizado) con colores distintivos
- ✅ **Header con Información**: Muestra nombre de la empresa, usuario y fecha/hora actual
- ✅ **Interfaz Moderna**: Diseño responsive y fácil de usar

## Tecnologías

- **Frontend**: React 18
- **Backend**: Node.js + Express
- **Base de Datos**: SQLite
- **Estilos**: CSS3 con diseño moderno

## Instalación

1. **Instalar dependencias del proyecto:**
   ```bash
   npm run install-all
   ```

2. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

   Esto iniciará:
   - Backend en `http://localhost:5000`
   - Frontend en `http://localhost:3000`

## Uso

### Pantalla Principal

La pantalla principal muestra:
- **Lista de Vehículos en Taller**: Todos los motores actualmente en proceso
- **Botón "Nuevo Ingreso"**: Para registrar un nuevo motor
- **Botón "Escanear Motor"**: Para escanear y reconocer automáticamente (próximamente)

### Registrar Entrada de Motor

1. Haz clic en "Nuevo Ingreso" desde la pantalla principal
2. Completa el formulario:
   - **Fecha de Ingreso**: Fecha en que ingresó el motor
   - **Número del Motor**: Número de serie del motor
   - **Cliente** (requerido): Nombre del cliente
   - **Celular**: Número de contacto
   - **Marca**: Marca del vehículo
   - **Vehículo**: Modelo completo (ej: Toyota Corolla 2018)
   - **Placa**: Placa del vehículo
3. **Agregar Items/Partes**: En la tabla de items, agrega las partes que ingresan con el motor:
   - Cantidad
   - Descripción
   - Valor
   - Haz clic en "Añadir línea" para agregar más items
4. Haz clic en "Registrar Ingreso"

### Gestionar Trabajos del Motor

1. Desde la pantalla principal, haz clic en "Continuar" en un vehículo
2. Se abrirá la vista de "Trabajos por Ingreso" con tres pestañas:
   - **Trabajos**: Ver y agregar trabajos a realizar
   - **Partes**: Ver las partes ingresadas con el motor
   - **Checklist**: Verificar componentes del motor
3. En la pestaña "Trabajos":
   - Haz clic en "+ Añadir Trabajo" para crear un nuevo trabajo
   - Completa: Descripción, Parte Asociada, Precio, Mecánico
   - Marca como "Finalizado" cuando el trabajo esté completo
4. **Control de IVA**: En el resumen, marca la casilla "Incluir IVA (19%)" para agregar IVA al total

### Checklist de Componentes

1. En la vista del motor, ve a la pestaña "Checklist"
2. Marca los componentes presentes en cada sección:
   - Bloque
   - Cigüeñal
   - Culata
   - Bielas
   - Arbol de Levas
   - Componentes Generales
3. Agrega observaciones si es necesario
4. Haz clic en "Guardar Checklist"

## Estructura del Proyecto

```
RectificadoraSantofimio/
├── server/
│   ├── index.js          # Servidor Express y rutas API
│   ├── database.js       # Configuración y funciones de base de datos
│   └── inventario.db     # Base de datos SQLite (se crea automáticamente)
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── services/     # Servicios API
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── package.json
└── README.md
```

## API Endpoints

### Motores
- `GET /api/motores` - Obtener motores en inventario
- `GET /api/motores/:id` - Obtener un motor por ID (con items, trabajos y checklist)
- `POST /api/motores/entrada` - Registrar entrada de motor
- `PUT /api/motores/:id` - Actualizar motor
- `POST /api/motores/salida/:id` - Registrar salida de motor
- `GET /api/historial` - Obtener historial completo

### Items/Partes
- `GET /api/motores/:id/items` - Obtener items de un motor
- `POST /api/motores/:id/items` - Agregar item a un motor
- `DELETE /api/items/:id` - Eliminar item

### Trabajos
- `GET /api/motores/:id/trabajos` - Obtener trabajos de un motor
- `POST /api/motores/:id/trabajos` - Agregar trabajo a un motor
- `PUT /api/trabajos/:id` - Actualizar trabajo
- `DELETE /api/trabajos/:id` - Eliminar trabajo

### Checklist
- `GET /api/motores/:id/checklist` - Obtener checklist de un motor
- `POST /api/motores/:id/checklist` - Actualizar checklist de un motor

## Crear Ejecutable (Portable)

Para convertir la aplicación en un ejecutable portable que no requiere Node.js instalado:

### Prerrequisitos

1. **Instalar todas las dependencias:**
   ```bash
   npm install
   cd client
   npm install
   cd ..
   ```

2. **Instalar Electron y electron-builder:**
   ```bash
   npm install --save-dev electron electron-builder wait-on
   ```

### Pasos para crear el ejecutable

1. **Construir la aplicación React:**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Crear el ejecutable portable:**
   ```bash
   npm run dist
   ```

   Esto creará dos tipos de ejecutables en la carpeta `dist/`:
   - **Portable**: `Rectificadora Santofimio-1.0.0-portable.exe` - Ejecutable portátil que puedes copiar a cualquier USB y ejecutar sin instalación
   - **Instalador**: `Rectificadora Santofimio-1.0.0-setup.exe` - Instalador tradicional para Windows

### Usar el ejecutable portable

1. Copia el archivo `Rectificadora Santofimio-1.0.0-portable.exe` a tu memoria USB
2. Ejecuta el archivo directamente desde la USB o cópialo al disco duro
3. La aplicación se ejecutará sin necesidad de instalar Node.js u otras dependencias
4. La base de datos SQLite se creará automáticamente en la misma carpeta donde está el ejecutable

### Notas importantes

- **Primera ejecución**: La primera vez puede tardar un poco más en iniciar
- **Base de datos**: Se creará automáticamente `server/inventario.db` en la carpeta del ejecutable
- **Portabilidad**: El ejecutable portable incluye todo lo necesario, incluyendo Node.js y todas las dependencias
- **Tamaño**: El ejecutable puede ser grande (100-200MB) porque incluye Node.js y todas las dependencias

### Desarrollo con Electron

Para probar la aplicación con Electron sin empaquetar:

1. **Construir React:**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Ejecutar con Electron:**
   ```bash
   npm run electron
   ```

## Notas

- La base de datos SQLite se crea automáticamente al iniciar el servidor
- El número de serie debe ser único
- Los motores con fecha de salida no aparecen en el inventario actual
- Para producción, usa el ejecutable portable que no requiere Node.js instalado