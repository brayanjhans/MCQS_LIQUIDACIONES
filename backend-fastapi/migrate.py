import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

connection = pymysql.connect(
    host=os.getenv("DB_HOST", "localhost"),
    user=os.getenv("DB_USER", "root"),
    password=os.getenv("DB_PASSWORD", "123456789"),
    database=os.getenv("DB_NAME", "sistema_liquidaciones")
)

with connection.cursor() as cursor:
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS `consorciados` (
      `id` int NOT NULL AUTO_INCREMENT,
      `empresa_id` int NOT NULL,
      `nombre` varchar(255) NOT NULL,
      `ruc` varchar(20) DEFAULT NULL,
      `porcentaje_participacion` decimal(5,2) DEFAULT '0.00',
      `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      KEY `empresa_id` (`empresa_id`),
      CONSTRAINT `consorciados_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    """)
    connection.commit()

print("Migration successful")
