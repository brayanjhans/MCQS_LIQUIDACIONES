import sqlite3
import os

def init_db():
    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Schema adjusted for SQLite
    cursor.executescript('''
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO usuarios (username, password, role) VALUES ('admin', 'admin', 'admin');

    CREATE TABLE IF NOT EXISTS empresas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cartas_fianzas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER,
        tipo TEXT NOT NULL,
        numero TEXT NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_vencimiento DATE NOT NULL,
        monto DECIMAL(15, 2) NOT NULL,
        pdf_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS facturas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER,
        numero TEXT NOT NULL,
        monto DECIMAL(15, 2) NOT NULL,
        tipo_fianza_relacionada TEXT,
        numero_fianza_relacionada TEXT,
        fecha_salida DATE NOT NULL,
        pdf_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
    );
    ''')

    conn.commit()
    conn.close()
    print("Database initialized successfully at:", db_path)

if __name__ == '__main__':
    init_db()
