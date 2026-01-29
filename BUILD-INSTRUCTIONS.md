# Instrucciones para crear el ejecutable portable

## Problema de permisos en Windows

Si ves errores sobre "El cliente no dispone de un privilegio requerido" al crear el ejecutable, tienes dos opciones:

### Opción 1: Ejecutar PowerShell como Administrador (RECOMENDADO)

1. Busca "PowerShell" en el menú de inicio
2. Haz clic derecho en "Windows PowerShell"
3. Selecciona "Ejecutar como administrador"
4. Navega a tu proyecto:
   ```powershell
   cd "D:\juani\Documents\RectificadoraSantofimio"
   ```
5. Ejecuta el build:
   ```powershell
   npm run dist
   ```

### Opción 2: Habilitar Modo Desarrollador en Windows

1. Abre **Configuración** de Windows (Win + I)
2. Ve a **Actualización y seguridad** > **Para desarrolladores**
3. Activa **Modo de desarrollador**
4. Espera a que se instalen los componentes necesarios
5. Ejecuta el build normalmente:
   ```powershell
   npm run dist
   ```

### Opción 3: Usar una versión más antigua de electron-builder

Si ninguna de las opciones anteriores funciona, puedes usar electron-packager como alternativa:

```bash
npm install --save-dev electron-packager
```

Luego modifica el script `dist` en `package.json` para usar electron-packager.

## Pasos normales (cuando no hay problemas de permisos)

1. **Instalar dependencias** (si aún no lo has hecho):
   ```bash
   npm install
   ```

2. **Construir la aplicación React**:
   ```bash
   cd client
   npm run build
   cd ..
   ```

3. **Crear el ejecutable portable**:
   ```bash
   npm run dist
   ```

El ejecutable se creará en la carpeta `dist/` con el nombre:
- `Rectificadora Santofimio-1.0.0-portable.exe`

## Notas importantes

- El ejecutable será grande (~150-200MB) porque incluye Node.js y todas las dependencias
- La base de datos SQLite se creará automáticamente en la carpeta de datos del usuario al ejecutar el portable
- El ejecutable es completamente portable: puedes copiarlo a una USB y ejecutarlo en cualquier Windows sin instalación
