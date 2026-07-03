import mysql.connector
conn = mysql.connector.connect(host='localhost', user='root', password='admin', database='sistema_liquidaciones')
cursor = conn.cursor()
cursor.execute("UPDATE empresas SET nombre='CONSORCIO SUPERVISION HUANUCO', ruc=NULL WHERE id=1")
conn.commit()
conn.close()
