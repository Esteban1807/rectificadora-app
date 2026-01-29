# Script para construir el ejecutable de Electron
# Esto deshabilita la firma de código y maneja los errores de enlaces simbólicos

$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
$env:SKIP_NOTARIZATION = "true"

Write-Host "Construyendo aplicación React..." -ForegroundColor Green
cd client
npm run build
cd ..

Write-Host "Creando ejecutable portable..." -ForegroundColor Green

# Limpiar caché problemático
$cachePath = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
if (Test-Path $cachePath) {
    Remove-Item -Recurse -Force $cachePath -ErrorAction SilentlyContinue
}

# Intentar construir el ejecutable
npx electron-builder --publish=never --config.npmRebuild=false --config.win.sign=null 2>&1 | Out-String

# Verificar si el ejecutable se creó a pesar de los errores de firma
$exePath = "dist\Rectificadora Santofimio-1.0.0-portable.exe"
if (Test-Path $exePath) {
    Write-Host "`n¡Ejecutable creado exitosamente!" -ForegroundColor Green
    Write-Host "Ubicación: $exePath" -ForegroundColor Cyan
    Write-Host "`nPuedes copiar este archivo a tu memoria USB y ejecutarlo en cualquier Windows." -ForegroundColor Yellow
} else {
    Write-Host "`nEl ejecutable no se pudo crear completamente." -ForegroundColor Red
    Write-Host "`nSOLUCIÓN: Ejecuta PowerShell como Administrador y vuelve a ejecutar este script." -ForegroundColor Yellow
    Write-Host "O habilita el modo desarrollador en Windows:" -ForegroundColor Yellow
    Write-Host "1. Configuración > Actualización y seguridad > Para desarrolladores" -ForegroundColor Yellow
    Write-Host "2. Activa 'Modo de desarrollador'" -ForegroundColor Yellow
}
