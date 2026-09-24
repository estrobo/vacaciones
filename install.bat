@echo off
setlocal enabledelayedexpansion

echo === Script de Instalación (Windows) - Vacation Request System ===
echo.

REM 1) Instalar dependencias
echo 1) Instalando dependencias...
if exist "package.json" (
  npm install
) else (
  echo ERROR: No se encontro package.json en el directorio actual.
  exit /b 1
)

REM 2) Configurar .env
echo.
echo 2) Configurando variables de entorno...
if not exist ".env" (
  if exist ".env.example" (
    copy /Y .env.example .env >nul
    echo No existe .env. Se copio .env.example a .env.
    echo ATENCION: edita .env con tus valores reales.
  ) else (
    echo ERROR: No existe .env.example.
    exit /b 1
  )
) else (
  echo Archivo .env ya existe - se omite copia.
)

echo.
echo 4) Ejecutando migraciones iniciales...
npm run seed
if errorlevel 1 (
  echo Aviso: No se completaron las semillas. Revisa backend/seed.js
)

echo.
echo 5) Creando directorios necesarios...
if not exist "backend\data" mkdir backend\data

echo.
echo === Instalacion completada ===
echo.
echo Para iniciar:
echo   npm run dev
echo   npm start

echo Para usar Docker (opcional):
echo   docker-compose up --build

echo.
endlocal
exit /b 0
