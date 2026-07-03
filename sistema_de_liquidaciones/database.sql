CREATE DATABASE IF NOT EXISTS sistema_liquidaciones;
USE sistema_liquidaciones;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user (password: admin)
INSERT IGNORE INTO usuarios (username, password, role) VALUES ('admin', 'admin', 'admin');

CREATE TABLE IF NOT EXISTS empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    ruc VARCHAR(20),
    representante VARCHAR(255),
    descripcion TEXT,
    nomenclatura VARCHAR(100),
    monto_obra DECIMAL(15, 2),
    fecha_inicio_obra DATE,
    fecha_fin_obra DATE,
    suma_asegurada DECIMAL(15, 2) DEFAULT 0.00,
    monto_garantia DECIMAL(15, 2) DEFAULT 0.00,
    monto_liberado DECIMAL(15, 2) DEFAULT 0.00,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cartas_fianzas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT,
    tipo ENUM('Fiel Cumplimiento', 'Adelanto de Materiales', 'Adelanto Directo') NOT NULL,
    numero VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    monto DECIMAL(15, 2) NOT NULL,
    pdf_path VARCHAR(500),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT,
    numero VARCHAR(100) NOT NULL,
    monto DECIMAL(15, 2) NOT NULL,
    tipo_fianza_relacionada ENUM('Fiel Cumplimiento', 'Adelanto de Materiales', 'Adelanto Directo'),
    numero_fianza_relacionada VARCHAR(100),
    fecha_salida DATE NOT NULL,
    pdf_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS licitaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT,
    codigo_proceso VARCHAR(100),
    objeto VARCHAR(500),
    entidad VARCHAR(255),
    monto DECIMAL(15, 2),
    fecha_contrato DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);
