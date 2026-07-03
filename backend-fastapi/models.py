from sqlalchemy import Column, Integer, String, Enum, Text, DECIMAL, Date, ForeignKey, TIMESTAMP, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum('admin', 'user', 'director'), default='user')
    created_at = Column(TIMESTAMP, server_default=func.now())

class Empresa(Base):
    __tablename__ = "empresas"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(255), unique=True, nullable=False)
    ruc = Column(String(20))
    representante = Column(String(100))
    entidad = Column(String(255))
    descripcion = Column(Text)
    nomenclatura = Column(String(255))
    monto_obra = Column(DECIMAL(15, 2))
    fecha_inicio_obra = Column(Date)
    fecha_fin_obra = Column(Date)
    suma_asegurada = Column(DECIMAL(15, 2), default=0.00)
    monto_garantia = Column(DECIMAL(15, 2), default=0.00)
    monto_liberado = Column(DECIMAL(15, 2), default=0.00)
    observaciones = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    fianzas = relationship("CartaFianza", back_populates="empresa", cascade="all, delete-orphan")
    facturas = relationship("Factura", back_populates="empresa", cascade="all, delete-orphan")
    licitaciones = relationship("Licitacion", back_populates="empresa", cascade="all, delete-orphan")
    consorciados = relationship("Consorciado", back_populates="empresa", cascade="all, delete-orphan")
    archivos = relationship("Archivo", back_populates="empresa", cascade="all, delete-orphan")

class Archivo(Base):
    __tablename__ = "archivos"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"))
    nombre_original = Column(String(500), nullable=False)
    ruta_fisica = Column(String(500), nullable=False)
    categoria = Column(String(100))
    tamano_bytes = Column(Integer)
    fecha_subida = Column(TIMESTAMP, server_default=func.now())

    empresa = relationship("Empresa", back_populates="archivos")

class Consorciado(Base):
    __tablename__ = "consorciados"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"))
    nombre = Column(String(255), nullable=False)
    ruc = Column(String(20))
    porcentaje_participacion = Column(DECIMAL(5, 2), default=0.00)
    created_at = Column(TIMESTAMP, server_default=func.now())

    empresa = relationship("Empresa", back_populates="consorciados")

class CartaFianza(Base):
    __tablename__ = "cartas_fianzas"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"))
    tipo = Column(Enum('Fiel Cumplimiento', 'Adelanto de Materiales', 'Adelanto Directo'), nullable=False)
    numero = Column(String(100), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    vigencia_dias = Column(Integer, default=0)
    monto = Column(DECIMAL(15, 2), nullable=False)
    pdf_path = Column(String(500))
    observaciones = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    empresa = relationship("Empresa", back_populates="fianzas")

class Factura(Base):
    __tablename__ = "facturas"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"))
    numero = Column(String(100), nullable=False)
    monto = Column(DECIMAL(15, 2), nullable=False)
    tipo_fianza_relacionada = Column(Enum('Fiel Cumplimiento', 'Adelanto de Materiales', 'Adelanto Directo'))
    numero_fianza_relacionada = Column(String(100))
    fecha_salida = Column(Date, nullable=False)
    pdf_path = Column(String(500))
    observacion = Column(Text)
    es_observada = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    empresa = relationship("Empresa", back_populates="facturas")

class Licitacion(Base):
    __tablename__ = "licitaciones"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"))
    codigo_proceso = Column(String(100))
    objeto = Column(String(500))
    entidad = Column(String(255))
    monto = Column(DECIMAL(15, 2))
    fecha_contrato = Column(Date)
    created_at = Column(TIMESTAMP, server_default=func.now())

    empresa = relationship("Empresa", back_populates="licitaciones")


class Trabajador(Base):
    __tablename__ = "trabajadores"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=True)
    dni = Column(String(20), unique=True, nullable=False)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    cargo = Column(String(100))
    categoria = Column(Enum('Operario', 'Oficial', 'Peón', 'Empleado', 'Ingeniero'), default='Peón')
    estado = Column(Enum('Activo', 'Cesado'), default='Activo')
    fecha_ingreso = Column(Date)
    created_at = Column(TIMESTAMP, server_default=func.now())

    empresa = relationship("Empresa")
    asistencias = relationship("Asistencia", back_populates="trabajador", cascade="all, delete-orphan")
    documentos = relationship("DocumentoTrabajador", back_populates="trabajador", cascade="all, delete-orphan")
    epps = relationship("EntregaEPP", back_populates="trabajador", cascade="all, delete-orphan")

class Asistencia(Base):
    __tablename__ = "asistencias"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trabajador_id = Column(Integer, ForeignKey("trabajadores.id", ondelete="CASCADE"))
    fecha = Column(Date, nullable=False)
    horas_normales = Column(DECIMAL(4, 2), default=0.00)
    horas_extras_25 = Column(DECIMAL(4, 2), default=0.00)
    horas_extras_35 = Column(DECIMAL(4, 2), default=0.00)
    horas_extras_100 = Column(DECIMAL(4, 2), default=0.00)
    estado = Column(Enum('Asistió', 'Faltó', 'Permiso', 'Descanso', 'Feriado'), default='Asistió')
    created_at = Column(TIMESTAMP, server_default=func.now())

    trabajador = relationship("Trabajador", back_populates="asistencias")

class DocumentoTrabajador(Base):
    __tablename__ = "documentos_trabajador"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trabajador_id = Column(Integer, ForeignKey("trabajadores.id", ondelete="CASCADE"))
    tipo = Column(Enum('SCTR_Salud', 'SCTR_Pension', 'EMO', 'Contrato', 'DNI', 'Antecedentes', 'Otro'), nullable=False)
    fecha_emision = Column(Date)
    fecha_vencimiento = Column(Date)
    archivo_pdf = Column(String(500))
    created_at = Column(TIMESTAMP, server_default=func.now())

    trabajador = relationship("Trabajador", back_populates="documentos")

class EntregaEPP(Base):
    __tablename__ = "entregas_epp"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trabajador_id = Column(Integer, ForeignKey("trabajadores.id", ondelete="CASCADE"))
    descripcion = Column(String(255), nullable=False)
    fecha_entrega = Column(Date, nullable=False)
    cantidad = Column(Integer, default=1)
    firma_pdf = Column(String(500))
    created_at = Column(TIMESTAMP, server_default=func.now())

    trabajador = relationship("Trabajador", back_populates="epps")
