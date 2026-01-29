@echo off
echo ========================================
echo Iniciando Rectificadora Santofimio
echo ========================================
echo.

REM Verificar si node_modules existe en la raiz
if not exist "node_modules" (
    echo Instalando dependencias del servidor...
    call npm install
    if errorlevel 1 (
        echo Error al instalar dependencias del servidor
        pause
        exit /b 1
    )
)

REM Verificar si node_modules existe en client
if not exist "client\node_modules" (
    echo Instalando dependencias del cliente...
    cd client
    call npm install
    cd ..
    if errorlevel 1 (
        echo Error al instalar dependencias del cliente
        pause
        exit /b 1
    )
)

echo.
echo Iniciando servidor y cliente...
echo.

REM Iniciar ambos procesos
call npm start

pause
