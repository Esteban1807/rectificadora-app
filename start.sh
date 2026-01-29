#!/bin/bash

echo "========================================"
echo "Iniciando Rectificadora Santofimio"
echo "========================================"
echo ""

# Verificar si node_modules existe en la raiz
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del servidor..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error al instalar dependencias del servidor"
        exit 1
    fi
fi

# Verificar si node_modules existe en client
if [ ! -d "client/node_modules" ]; then
    echo "Instalando dependencias del cliente..."
    cd client
    npm install
    cd ..
    if [ $? -ne 0 ]; then
        echo "Error al instalar dependencias del cliente"
        exit 1
    fi
fi

echo ""
echo "Iniciando servidor y cliente..."
echo ""

# Iniciar ambos procesos
npm start
