import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch
from datetime import datetime
from flask import send_file

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'pdf'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Database connection (MySQL)
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="admin",
        database="sistema_liquidaciones"
    )

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    from decimal import Decimal
    from datetime import date, datetime
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError ("Type %s not serializable" % type(obj))

def serialize_rows(rows):
    return [ { k: (v.isoformat() if hasattr(v, 'isoformat') else float(v) if hasattr(v, 'real') and not isinstance(v, (int, float, bool)) else v) for k, v in row.items() } for row in rows]

# --- Auth Routes ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuarios WHERE username = %s", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        # Check password (supporting both plain text for initial admin and hashed)
        if user['password'] == password or check_password_hash(user['password'], password):
            return jsonify({
                "id": user['id'],
                "username": user['username'],
                "role": user['role']
            })
    
    return jsonify({"error": "Credenciales inválidas"}), 401

# --- User Management ---

@app.route('/api/usuarios', methods=['GET', 'POST'])
def manage_usuarios():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method == 'GET':
        cursor.execute("SELECT id, username, role, created_at FROM usuarios")
        users = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(users)
    elif request.method == 'POST':
        data = request.json
        username = data.get('username')
        password = generate_password_hash(data.get('password'))
        role = data.get('role', 'user')
        try:
            cursor.execute("INSERT INTO usuarios (username, password, role) VALUES (%s, %s, %s)", 
                           (username, password, role))
            conn.commit()
            conn.close()
            return jsonify({"message": "Usuario creado"}), 201
        except Exception as err:
            return jsonify({"error": str(err)}), 400

@app.route('/api/usuarios/<int:id>', methods=['DELETE'])
def delete_usuario(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("DELETE FROM usuarios WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Usuario eliminado"})

# --- Business Routes (Empresas, Fianzas, Facturas) ---
# ... (rest of the code remains the same as previous cleanup)

@app.route('/api/empresas', methods=['GET', 'POST'])
def manage_empresas():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method == 'GET':
        cursor.execute("SELECT * FROM empresas")
        empresas = serialize_rows(cursor.fetchall())
        conn.close()
        return jsonify(empresas)
    elif request.method == 'POST':
        data = request.json
        nombre = data.get('nombre')
        ruc = data.get('ruc')
        representante = data.get('representante')
        descripcion = data.get('descripcion')
        nomenclatura = data.get('nomenclatura')
        monto_obra = float(data.get('monto_obra') or 0)
        fecha_inicio = data.get('fecha_inicio_obra')
        if not fecha_inicio: fecha_inicio = None
        fecha_fin = data.get('fecha_fin_obra')
        if not fecha_fin: fecha_fin = None
        suma_asegurada = float(data.get('suma_asegurada') or 0)
        monto_garantia = float(data.get('monto_garantia') or 0)
        monto_liberado = float(data.get('monto_liberado') or 0)
        observaciones = data.get('observaciones') or ''
        
        try:
            cursor.execute("""
                INSERT INTO empresas (nombre, ruc, representante, descripcion, nomenclatura, monto_obra, fecha_inicio_obra, fecha_fin_obra, suma_asegurada, monto_garantia, monto_liberado, observaciones) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (nombre, ruc, representante, descripcion, nomenclatura, monto_obra, fecha_inicio, fecha_fin, suma_asegurada, monto_garantia, monto_liberado, observaciones))
            conn.commit()
            new_id = cursor.lastrowid
            conn.close()
            return jsonify({"id": new_id, "nombre": nombre}), 201
        except Exception as err:
            if conn: conn.close()
            return jsonify({"error": str(err)}), 400

@app.route('/api/empresas/<int:id>', methods=['PUT', 'DELETE', 'POST'])
def update_delete_empresa(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method in ['PUT', 'POST']:
        data = request.json
        nombre = data.get('nombre')
        ruc = data.get('ruc')
        representante = data.get('representante')
        descripcion = data.get('descripcion')
        nomenclatura = data.get('nomenclatura')
        monto_obra = float(data.get('monto_obra') or 0)
        fecha_inicio = data.get('fecha_inicio_obra')
        if not fecha_inicio: fecha_inicio = None
        fecha_fin = data.get('fecha_fin_obra')
        if not fecha_fin: fecha_fin = None
        suma_asegurada = float(data.get('suma_asegurada') or 0)
        monto_garantia = float(data.get('monto_garantia') or 0)
        monto_liberado = float(data.get('monto_liberado') or 0)
        observaciones = data.get('observaciones') or ''
        
        try:
            cursor.execute("""
                UPDATE empresas 
                SET nombre = %s, ruc = %s, representante = %s, descripcion = %s, 
                    nomenclatura = %s, monto_obra = %s, fecha_inicio_obra = %s, fecha_fin_obra = %s,
                    suma_asegurada = %s, monto_garantia = %s, monto_liberado = %s, observaciones = %s
                WHERE id = %s
            """, (nombre, ruc, representante, descripcion, nomenclatura, monto_obra, fecha_inicio, fecha_fin, suma_asegurada, monto_garantia, monto_liberado, observaciones, id))
            conn.commit()
            return jsonify({"message": "Empresa actualizada"})
        except Exception as err:
            return jsonify({"error": str(err)}), 500
        finally:
            if conn: conn.close()
    elif request.method == 'DELETE':
        try:
            cursor.execute("DELETE FROM empresas WHERE id = %s", (id,))
            conn.commit()
            return jsonify({"success": True, "message": "Empresa eliminada"})
        except Exception as err:
            return jsonify({"success": False, "error": str(err)}), 500
        finally:
            if conn: conn.close()

@app.route('/api/cartas_fianzas', methods=['GET', 'POST'])
def manage_cartas_fianzas():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method == 'GET':
        cursor.execute("SELECT cf.*, e.nombre as empresa_nombre FROM cartas_fianzas cf JOIN empresas e ON cf.empresa_id = e.id")
        fianzas = serialize_rows(cursor.fetchall())
        conn.close()
        return jsonify(fianzas)
    elif request.method == 'POST':
        empresa_id = request.form.get('empresa_id')
        tipo = request.form.get('tipo')
        numero = request.form.get('numero')
        fecha_inicio = request.form.get('fecha_inicio')
        fecha_vencimiento = request.form.get('fecha_vencimiento')
        monto = request.form.get('monto')
        observaciones = request.form.get('observaciones') or ''
        pdf_filename = None
        if 'pdf' in request.files:
            file = request.files['pdf']
            if file and allowed_file(file.filename):
                pdf_filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], pdf_filename))
        try:
            cursor.execute("INSERT INTO cartas_fianzas (empresa_id, tipo, numero, fecha_inicio, fecha_vencimiento, monto, pdf_path, observaciones) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
                           (empresa_id, tipo, numero, fecha_inicio, fecha_vencimiento, monto, pdf_filename, observaciones))
            conn.commit()
            return jsonify({"message": "Carta fianza registrada"}), 201
        except Exception as err:
            return jsonify({"error": str(err)}), 500
        finally:
            if conn: conn.close()

@app.route('/api/cartas_fianzas/<int:id>', methods=['PUT', 'DELETE', 'POST'])
def update_delete_fianza(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method in ['PUT', 'POST']:
        empresa_id = request.form.get('empresa_id')
        tipo = request.form.get('tipo')
        numero = request.form.get('numero')
        fecha_inicio = request.form.get('fecha_inicio')
        fecha_vencimiento = request.form.get('fecha_vencimiento')
        monto = request.form.get('monto')
        observaciones = request.form.get('observaciones') or ''
        cursor.execute("SELECT pdf_path FROM cartas_fianzas WHERE id = %s", (id,))
        row = cursor.fetchone()
        pdf_filename = row['pdf_path'] if row else None
        if 'pdf' in request.files:
            file = request.files['pdf']
            if file and allowed_file(file.filename):
                pdf_filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], pdf_filename))
        try:
            cursor.execute("UPDATE cartas_fianzas SET empresa_id = %s, tipo = %s, numero = %s, fecha_inicio = %s, fecha_vencimiento = %s, monto = %s, pdf_path = %s, observaciones = %s WHERE id = %s", 
                           (empresa_id, tipo, numero, fecha_inicio, fecha_vencimiento, monto, pdf_filename, observaciones, id))
            conn.commit()
            return jsonify({"message": "Carta fianza actualizada"})
        except Exception as err:
            return jsonify({"error": str(err)}), 500
        finally:
            if conn: conn.close()
    elif request.method == 'DELETE':
        try:
            cursor.execute("DELETE FROM cartas_fianzas WHERE id = %s", (id,))
            conn.commit()
            return jsonify({"message": "Carta fianza eliminada"})
        except Exception as err:
            return jsonify({"error": str(err)}), 500
        finally:
            if conn: conn.close()

@app.route('/api/facturas', methods=['GET', 'POST'])
def manage_facturas():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method == 'GET':
        cursor.execute("SELECT f.*, e.nombre as empresa_nombre FROM facturas f JOIN empresas e ON f.empresa_id = e.id")
        facturas = serialize_rows(cursor.fetchall())
        conn.close()
        return jsonify(facturas)
    elif request.method == 'POST':
        empresa_id = request.form.get('empresa_id')
        numero = request.form.get('numero')
        monto = request.form.get('monto')
        tipo_fianza = request.form.get('tipo_fianza_relacionada')
        if not tipo_fianza: tipo_fianza = None
        numero_fianza = request.form.get('numero_fianza_relacionada')
        fecha_salida = request.form.get('fecha_salida')
        pdf_filename = None
        if 'pdf' in request.files:
            file = request.files['pdf']
            if file and allowed_file(file.filename):
                pdf_filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], pdf_filename))
        observacion = request.form.get('observacion')
        es_observada = request.form.get('es_observada') == 'true'
        try:
            cursor.execute("INSERT INTO facturas (empresa_id, numero, monto, tipo_fianza_relacionada, numero_fianza_relacionada, fecha_salida, pdf_path, observacion, es_observada) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)", 
                           (empresa_id, numero, monto, tipo_fianza, numero_fianza, fecha_salida, pdf_filename, observacion, es_observada))
            conn.commit()
            return jsonify({"message": "Factura registrada"}), 201
        except Exception as err:
            return jsonify({"error": str(err)}), 500
        finally:
            if conn: conn.close()

@app.route('/api/facturas/<int:id>', methods=['PUT', 'DELETE', 'POST'])
def update_delete_factura(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method in ['PUT', 'POST']:
        empresa_id = request.form.get('empresa_id')
        numero = request.form.get('numero')
        monto = request.form.get('monto')
        tipo_fianza = request.form.get('tipo_fianza_relacionada')
        if not tipo_fianza: tipo_fianza = None
        numero_fianza = request.form.get('numero_fianza_relacionada')
        fecha_salida = request.form.get('fecha_salida')
        cursor.execute("SELECT pdf_path FROM facturas WHERE id = %s", (id,))
        row = cursor.fetchone()
        pdf_filename = row['pdf_path'] if row else None
        if 'pdf' in request.files:
            file = request.files['pdf']
            if file and allowed_file(file.filename):
                pdf_filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], pdf_filename))
        observacion = request.form.get('observacion')
        es_observada = request.form.get('es_observada') == 'true'
        cursor.execute("UPDATE facturas SET empresa_id = %s, numero = %s, monto = %s, tipo_fianza_relacionada = %s, numero_fianza_relacionada = %s, fecha_salida = %s, pdf_path = %s, observacion = %s, es_observada = %s WHERE id = %s", 
                       (empresa_id, numero, monto, tipo_fianza, numero_fianza, fecha_salida, pdf_filename, observacion, es_observada, id))
        conn.commit()
        conn.close()
        return jsonify({"message": "Factura actualizada"})
    elif request.method == 'DELETE':
        cursor.execute("DELETE FROM facturas WHERE id = %s", (id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Factura eliminada"})

@app.route('/api/licitaciones', methods=['GET', 'POST'])
def manage_licitaciones():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        if request.method == 'GET':
            cursor.execute("SELECT * FROM licitaciones")
            rows = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return jsonify(rows)
        elif request.method == 'POST':
            data = request.json
            # Basic validation/cleaning
            monto = data.get('monto')
            if monto == '': monto = 0
            
            cursor.execute("""
                INSERT INTO licitaciones (empresa_id, codigo_proceso, objeto, entidad, monto, fecha_contrato)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (data.get('empresa_id'), data.get('codigo_proceso'), data.get('objeto'), 
                  data.get('entidad'), monto, data.get('fecha_contrato')))
            conn.commit()
            conn.close()
            return jsonify({"success": True, "message": "Licitación agregada"})
    except Exception as err:
        if conn: conn.close()
        return jsonify({"success": False, "error": str(err)}), 500

@app.route('/api/reporte/empresa/<int:id>')
def generate_empresa_report(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Fetch Company Data
    cursor.execute("SELECT * FROM empresas WHERE id = %s", (id,))
    empresa = cursor.fetchone()
    if not empresa:
        conn.close()
        return "Empresa no encontrada", 404
        
    # 2. Fetch Fianzas
    cursor.execute("SELECT * FROM cartas_fianzas WHERE empresa_id = %s", (id,))
    fianzas = cursor.fetchall()
    
    # 3. Fetch Facturas
    cursor.execute("SELECT * FROM facturas WHERE empresa_id = %s", (id,))
    facturas = cursor.fetchall()
    
    conn.close()
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), rightMargin=20, leftMargin=20, topMargin=30, bottomMargin=30)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor("#0f172a"), spaceAfter=20, fontName='Helvetica-Bold')
    header_style = ParagraphStyle('HeaderStyle', parent=styles['Heading2'], fontSize=12, textColor=colors.HexColor("#2563eb"), spaceAfter=10, fontName='Helvetica-Bold', textTransform='uppercase')
    normal_style = styles['Normal']
    label_style = ParagraphStyle('LabelStyle', parent=styles['Normal'], fontSize=8, textColor=colors.grey, fontName='Helvetica-Bold')
    
    elements = []
    
    # --- Header with Logos ---
    logo_path = os.path.join(app.static_folder, 'assets', 'logo-mqs.png')
    header_data = []
    if os.path.exists(logo_path):
        logo = Image(logo_path, width=1.5*inch, height=0.5*inch)
        header_data.append([logo, Paragraph(f"REPORTE GENERAL: {empresa['nombre']}", title_style)])
    else:
        header_data.append(["", Paragraph(f"REPORTE GENERAL: {empresa['nombre']}", title_style)])
    
    t_header = Table(header_data, colWidths=[2*inch, 5*inch])
    t_header.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE')]))
    elements.append(t_header)
    elements.append(Paragraph(f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M')}", normal_style))
    elements.append(Spacer(1, 0.3 * inch))
    
    # --- Section: Ficha Técnica ---
    elements.append(Paragraph("FICHA TÉCNICA", header_style))
    info_data = [
        [Paragraph("RAZÓN SOCIAL", label_style), Paragraph(empresa['nombre'], normal_style)],
        [Paragraph("RUC", label_style), Paragraph(empresa['ruc'] or "---", normal_style)],
        [Paragraph("REPRESENTANTE", label_style), Paragraph(empresa['representante'] or "---", normal_style)]
    ]
    t_info = Table(info_data, colWidths=[2 * inch, 4 * inch])
    t_info.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('BOTTOMPADDING', (0,0), (-1,-1), 10)]))
    elements.append(t_info)
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("INFORMACIÓN SEACE / LICITACIÓN", header_style))
    seace_data = [
        [Paragraph("NOMENCLATURA", label_style), Paragraph(empresa['nomenclatura'] or "---", normal_style)],
        [Paragraph("MONTO OBRA", label_style), Paragraph(f"S/ {empresa['monto_obra']:,.2f}" if empresa['monto_obra'] else "S/ 0.00", normal_style)],
        [Paragraph("DESCRIPCIÓN", label_style), Paragraph(empresa['descripcion'] or "Sin descripción", normal_style)]
    ]
    t_seace = Table(seace_data, colWidths=[2 * inch, 4 * inch])
    t_seace.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('BOTTOMPADDING', (0,0), (-1,-1), 10)]))
    elements.append(t_seace)
    elements.append(Spacer(1, 0.3 * inch))
    
    # --- Section: Datos de Control ---
    elements.append(Paragraph("DATOS DE CONTROL (SECRETARÍA)", header_style))
    control_data = [
        [Paragraph("SUMA ASEGURADA", label_style), Paragraph(f"S/ {empresa['suma_asegurada']:,.2f}" if empresa.get('suma_asegurada') else "S/ 0.00", normal_style)],
        [Paragraph("MONTO GARANTÍA", label_style), Paragraph(f"S/ {empresa['monto_garantia']:,.2f}" if empresa.get('monto_garantia') else "S/ 0.00", normal_style)],
        [Paragraph("MONTO LIBERADO", label_style), Paragraph(f"S/ {empresa['monto_liberado']:,.2f}" if empresa.get('monto_liberado') else "S/ 0.00", ParagraphStyle('Lib', parent=normal_style, textColor=colors.HexColor("#10b981"), fontName='Helvetica-Bold'))]
    ]
    if empresa.get('observaciones'):
        control_data.append([Paragraph("OBSERVACIONES", label_style), Paragraph(empresa['observaciones'], ParagraphStyle('Obs', parent=normal_style, textColor=colors.HexColor("#64748b")))])
        
    t_control = Table(control_data, colWidths=[2 * inch, 4 * inch])
    t_control.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'), 
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0"))
    ]))
    elements.append(t_control)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Helper to get invoice type
    def get_invoice_type(f):
        if f.get('tipo_fianza_relacionada'): return f['tipo_fianza_relacionada']
        if not f.get('numero_fianza_relacionada'): return 'Fiel Cumplimiento'
        match = next((b for b in fianzas if b['numero'].strip() == f.get('numero_fianza_relacionada', '').strip()), None)
        return match['tipo'] if match else 'Fiel Cumplimiento'

    # --- Section: Agrupación por Tipo de Fianza (Unified Table) ---
    fianza_types = ['Fiel Cumplimiento', 'Adelanto de Materiales', 'Adelanto Directo']
    
    for f_type in fianza_types:
        fianzas_of_type = [f for f in fianzas if f['tipo'] == f_type]
        facturas_of_type = [f for f in facturas if get_invoice_type(f) == f_type]
        
        if fianzas_of_type or facturas_of_type:
            # Title block above the table
            t_title = Table([[(Paragraph(f"<b>{f_type.upper()}</b>", normal_style))]], colWidths=[2.5*inch])
            t_title.setStyle(TableStyle([
                ('BOX', (0,0), (-1,-1), 1, colors.black),
                ('PADDING', (0,0), (-1,-1), 4),
                ('ALIGN', (0,0), (-1,-1), 'CENTER')
            ]))
            elements.append(t_title)
            elements.append(Spacer(1, 0.1 * inch))
            
            # Table Headers
            headers = ["TIPO DE\nCARTA FIANZA", "NUMERO DE\nFIANZA", "MONTO DE\nFIANZA", "FECHA DE\nINICIO", "FECHA DE\nVENCIMIENTO", "NUMERO DE\nFACTURA", "MONTO DE\nFACTURA", "FECHA DE SALIDA\nDE LA FACTURA", "OBSERVACIONES"]
            table_data = [headers]
            
            # Process fianzas and their related facturas
            processed_facturas = set()
            f_type_wrapped = f_type.upper().replace(' ', '\n')
            
            for fianza in fianzas_of_type:
                rel_facturas = [f for f in facturas_of_type if f.get('numero_fianza_relacionada') and f.get('numero_fianza_relacionada').strip() == fianza['numero'].strip()]
                
                fianza_info = [
                    f_type_wrapped,
                    fianza['numero'],
                    f"S/ {fianza['monto']:,.2f}",
                    fianza['fecha_inicio'].strftime('%d/%m/%Y'),
                    fianza['fecha_vencimiento'].strftime('%d/%m/%Y')
                ]
                
                if not rel_facturas:
                    fianza_obs = fianza.get('observaciones') or ""
                    obs_para = Paragraph(fianza_obs, ParagraphStyle('ObsSmall', parent=normal_style, fontSize=6, leading=7)) if fianza_obs else ""
                    table_data.append(fianza_info + ["---", "---", "---", obs_para])
                else:
                    for fact in rel_facturas:
                        processed_facturas.add(fact['id'])
                        obs_parts = []
                        if fianza.get('observaciones'): obs_parts.append(fianza['observaciones'])
                        if fact.get('observacion'): obs_parts.append(fact['observacion'])
                        obs_combined = "\n".join(obs_parts)
                        fact_info = [
                            fact['numero'],
                            f"S/ {fact['monto']:,.2f}",
                            fact['fecha_salida'].strftime('%d/%m/%Y'),
                            Paragraph(obs_combined, ParagraphStyle('ObsSmall', parent=normal_style, fontSize=6, leading=7)) if obs_combined else ""
                        ]
                        table_data.append(fianza_info + fact_info)
                            
            # Process orphaned facturas of this type
            for fact in facturas_of_type:
                if fact['id'] not in processed_facturas:
                    obs_combined = fact.get('observacion') or ""
                    fact_info = [
                        fact['numero'],
                        f"S/ {fact['monto']:,.2f}",
                        fact['fecha_salida'].strftime('%d/%m/%Y'),
                        Paragraph(obs_combined, ParagraphStyle('ObsSmall', parent=normal_style, fontSize=6, leading=7)) if obs_combined else ""
                    ]
                    table_data.append([f_type_wrapped, "---", "---", "---", "---"] + fact_info)
            
            # Define column widths for Landscape layout (~10 inches)
            col_widths = [1.1*inch, 1.4*inch, 1.1*inch, 0.9*inch, 0.9*inch, 1.1*inch, 1.1*inch, 0.9*inch, 1.6*inch]
            
            t_unified = Table(table_data, colWidths=col_widths, repeatRows=1)
            t_unified.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#bfdbfe")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 7),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTSIZE', (0, 1), (-1, -1), 7),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('PADDING', (0, 0), (-1, -1), 4),
                ('WORDWRAP', (0, 0), (-1, -1), True)
            ]))
            elements.append(t_unified)
            elements.append(Spacer(1, 0.3 * inch))

    doc.build(elements)
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f"Reporte_{empresa['nombre']}.pdf", mimetype='application/pdf')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
