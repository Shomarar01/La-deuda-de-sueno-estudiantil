-- 1. CREACIÓN DE LA BASE DE DATOS
DROP DATABASE IF EXISTS alerta_sueno_db;
CREATE DATABASE alerta_sueno_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alerta_sueno_db;

-- 2. TABLA PRINCIPAL: USUARIOS (Autenticación)
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL, -- VARCHAR largo para soportar encriptación bcrypt
    rol ENUM('alumno', 'administrador') NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA HIJA: ALUMNOS
CREATE TABLE alumno (
    id_alumno INT PRIMARY KEY, -- FK que también es PK (Relación 1:1 con usuario)
    matricula VARCHAR(20) UNIQUE NOT NULL,
    carrera VARCHAR(100) NOT NULL,
    division VARCHAR(50) NOT NULL,
    trimestre_ingreso VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_alumno) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- 4. TABLA HIJA: ADMINISTRADORES
CREATE TABLE administrador (
    id_admin INT PRIMARY KEY, -- FK que también es PK (Relación 1:1 con usuario)
    cargo VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_admin) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- 5. TABLA: PERIODOS DE APLICACIÓN
CREATE TABLE periodo_aplicacion (
    id_periodo INT AUTO_INCREMENT PRIMARY KEY,
    codigo_periodo VARCHAR(20) UNIQUE NOT NULL, -- Ej: '26-O', '26-I'
    nombre_descriptivo VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado ENUM('activo', 'cerrado') DEFAULT 'activo'
);

-- 6. TABLA: RESPUESTAS (Historial Longitudinal)
CREATE TABLE respuesta_cuestionario (
    id_respuesta INT AUTO_INCREMENT PRIMARY KEY,
    id_alumno INT NOT NULL,
    id_periodo INT NOT NULL,
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Métricas del Cuestionario
    horas_sueno DECIMAL(4,2) NOT NULL,
    calidad_sueno INT NOT NULL CHECK (calidad_sueno BETWEEN 1 AND 5), -- 1: Pésima, 5: Excelente
    uso_pantallas BOOLEAN NOT NULL, -- 1: Sí (riesgo), 0: No
    consumo_cafeina BOOLEAN NOT NULL, -- 1: Sí (riesgo), 0: No
    jetlag_social_horas DECIMAL(4,2) NOT NULL,
    
    -- Resultado Calculado
    nivel_riesgo ENUM('Bajo', 'Medio', 'Alto', 'Crítico') NOT NULL,
    
    FOREIGN KEY (id_alumno) REFERENCES alumno(id_alumno) ON DELETE CASCADE,
    FOREIGN KEY (id_periodo) REFERENCES periodo_aplicacion(id_periodo) ON DELETE RESTRICT,
    UNIQUE(id_alumno, id_periodo) -- Un alumno solo puede contestar 1 vez por periodo
);

-- ==========================================
-- INSERCIÓN DE DATOS DE PRUEBA (DUMMY DATA)
-- ==========================================

-- Insertar Administrador
INSERT INTO usuario (correo, contrasena, rol) VALUES ('bienestar@cua.uam.mx', 'hash_secreto_admin', 'administrador');
INSERT INTO administrador (id_admin, cargo, departamento) VALUES (1, 'Coordinadora de Apoyo Estudiantil', 'Servicios Escolares');

-- Insertar Alumnos
INSERT INTO usuario (correo, contrasena, rol) VALUES ('al.219304@cua.uam.mx', 'hash_secreto_1', 'alumno');
INSERT INTO alumno (id_alumno, matricula, carrera, division, trimestre_ingreso) VALUES (2, '219304111', 'Tecnologías y Sistemas de Información', 'CCD', '23-O');

INSERT INTO usuario (correo, contrasena, rol) VALUES ('al.220102@cua.uam.mx', 'hash_secreto_2', 'alumno');
INSERT INTO alumno (id_alumno, matricula, carrera, division, trimestre_ingreso) VALUES (3, '220102222', 'Diseño', 'CCD', '24-I');

-- Insertar Periodos
INSERT INTO periodo_aplicacion (codigo_periodo, nombre_descriptivo, fecha_inicio, fecha_fin, estado) 
VALUES 
('26-O', 'Trimestre Otoño 2026', '2026-10-01', '2026-10-31', 'cerrado'),
('26-I', 'Trimestre Invierno 2026', '2026-11-01', '2026-11-30', 'activo');

-- Insertar Respuestas (Historial del Alumno 2: Empeoró en Invierno)
INSERT INTO respuesta_cuestionario (id_alumno, id_periodo, horas_sueno, calidad_sueno, uso_pantallas, consumo_cafeina, jetlag_social_horas, nivel_riesgo)
VALUES 
(2, 1, 7.5, 4, 0, 0, 1.0, 'Bajo'), -- Bien en Otoño
(2, 2, 4.5, 2, 1, 1, 3.5, 'Crítico'); -- Mal en Invierno (Burnout)

-- Insertar Respuestas (Alumno 3)
INSERT INTO respuesta_cuestionario (id_alumno, id_periodo, horas_sueno, calidad_sueno, uso_pantallas, consumo_cafeina, jetlag_social_horas, nivel_riesgo)
VALUES (3, 2, 6.0, 3, 1, 0, 2.0, 'Medio');