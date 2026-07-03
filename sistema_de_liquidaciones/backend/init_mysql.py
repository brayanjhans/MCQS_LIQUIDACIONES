import mysql.connector
import os

def init_mysql():
    try:
        # Connect to MySQL server
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="admin"
        )
        cursor = conn.cursor()

        # Read SQL file
        sql_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database.sql')
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_commands = f.read().split(';')

        # Execute commands
        for command in sql_commands:
            if command.strip():
                cursor.execute(command)
        
        conn.commit()
        cursor.close()
        conn.close()
        print("MySQL database initialized successfully.")
    except Exception as e:
        print(f"Error initializing MySQL: {e}")

if __name__ == '__main__':
    init_mysql()
