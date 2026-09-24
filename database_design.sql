-- Creación de la base de datos para el sistema de control de días de vacaciones
CREATE DATABASE vacation_system;
USE vacation_system;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(256) NOT NULL,
    rol ENUM('trabajador', 'RRHH', 'administrador') DEFAULT 'trabajador',
    numero_trabajador VARCHAR(30),
    nss VARCHAR(20),
    curp VARCHAR(18),
    fecha_ingreso DATE NOT NULL,
    antiguedad INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración de días por antigüedad
CREATE TABLE configuracion_dias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    antiguedad INT NOT NULL,
    dias_asignados INT NOT NULL
);

-- Tabla de solicitudes de vacaciones
CREATE TABLE solicitudes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trabajador_id INT NOT NULL,
    dias_solicitados INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estatus ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    comentarios TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trabajador_id) REFERENCES usuarios(id)
);

-- Tabla de control de vacaciones
CREATE TABLE control_vacaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trabajador_id INT NOT NULL,
    dias_disponibles INT NOT NULL,
    dias_usados INT DEFAULT 0,
    corte_anual DATE NOT NULL,
    FOREIGN KEY (trabajador_id) REFERENCES usuarios(id)
);