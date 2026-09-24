# Sistema de Gestión de Vacaciones

Este sistema permite a las empresas gestionar las solicitudes de vacaciones de sus empleados. Está diseñado para ser fácilmente desplegable mediante Docker o manualmente con Node.js.

## Requisitos

- Node.js (v18+)
- Docker y Docker Compose (opcional para implementación rápida)

## Instalación

### Opción 1: Usando Docker

1. Asegúrese de tener Docker instalado. Instálelo desde [https://www.docker.com/](https://www.docker.com/).
2. Clone el repositorio:
   ```bash
   git clone https://github.com/usuario/solicitud-dias.git
   cd solicitud-dias
   ```
3. Cree y levante los contenedores:
   ```bash
   docker-compose up --build
   ```
4. Acceda a la aplicación en [http://localhost:3000](http://localhost:3000).

### Opción 2: Instalación Manual

1. Clone el repositorio:
   ```bash
   git clone https://github.com/usuario/solicitud-dias.git
   cd solicitud-dias
   ```
2. En sistemas Unix, ejecute el script:
   ```bash
   bash install.sh
   ```
   En sistemas Windows:
   ```cmd
   install.bat
   ```
3. Arranque el servidor:
   ```bash
   npm start
   ```

## Uso

- Para propósitos de desarrollo, puede usar SQLite como base de datos predeterminada. Modifique el archivo `.env` si desea cambiar a MySQL (en producción).

## Notas Adicionales
- Asegúrese de configurar los valores en `.env` para enviar correos correctamente.
- El script "seed" inicializa algunos datos de ejemplo en la base de datos.