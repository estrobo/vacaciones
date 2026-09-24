# Dockerfile - Sistema de Gestión de Vacaciones
# Uso: docker-compose up --build

FROM node:18-alpine

WORKDIR /app

# Copiar package.json y instalar dependencias
COPY package.json ./
RUN npm install --only=production

# Copiar el código fuente
COPY backend/ ./backend/
COPY public/ ./public/
COPY backend/server.js ./backend/

# Exponer puerto
EXPOSE 3000

# Variables de entorno con valores por defecto para desarrollo
ENV DB_DIALECT=sqlite
ENV DB_NAME=vacation_system
ENV DB_USER=root
ENV DB_PASSWORD=
ENV DB_HOST=localhost
ENV JWT_SECRET=cambia_esta_clave_secreta_en_produccion
ENV JWT_EXPIRES=8h
ENV PORT=3000

# Ejecutar el servidor
CMD ["node", "server.js"]