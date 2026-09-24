#!/bin/bash
# install.sh - Script de instalación para Linux/macOS
# Este script instala dependencias y configura el proyecto

set -e

echo "=== Script de Instalación - Vacation Request System ==="
echo ""

# 1. Instalar dependencias
echo "1. Instalando dependencias..."
if [ -f "package.json" ]; then
  npm install
else
  echo "ERROR: No se encontró package.json en el directorio actual"
  exit 1
fi

# 2. Verificar variables de entorno
echo ""
echo "2. Configurando variables de entorno..."
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "No existe archivo .env. Creando desde .env.example..."
    cp .env.example .env
    echo "⚠️  Recuerda editar el archivo .env con tus credenciales reales"
  else
    echo "ERROR: No existe .env.example tampoco"
    exit 1
  fi
else
  echo "Archivo .env ya existe - omitiendo copia"
fi

# 3. Crear directorios necesarios
echo ""
echo "3. Creando directorios necesarios..."
mkdir -p backend/data

# 4. Verificar SQLite
echo ""
echo "4. Verificando configuración de base de datos..."
DB_DIALECT=$(grep -o 'DB_DIALECT=[^ ]*' .env 2>/dev/null || echo "sqlite")
if [ "$DB_DIALECT" = "sqlite" ]; then
  echo "Modo SQLite detectado - no requiere servicio de base de datos externo"
  # Verificar si la base de datos existe, si no, se creará al arrancar
  if [ ! -f "database.sqlite" ]; then
    echo "Nota: database.sqlite no existirá hasta el primer arranque"
  # 5. Aplicar semillas al iniciar (inyectar ejemplo)
  echo ""
  echo "5. Ejecutando migraciones automáticas..."
  npm run seed || echo "No se completaron semillas. Revisa backend/seed.js"


  fi
fi

# 5. Resumen final
echo ""
echo "=== Instalación completada ==="
echo ""
echo "Para iniciar el servidor:"
echo "  npm run dev    # Modo desarrollo (con nodemon si está disponible)"
echo "  npm start      # Modo producción"
echo ""
echo "Para usar Docker (opcional):"
echo "  docker-compose up --build"