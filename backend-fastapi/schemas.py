from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# --- Empresa ---
class EmpresaBase(BaseModel):
    nombre: str
    ruc: Optional[str] = None
    representante: Optional[str] = None
    entidad: Optional[str] = None
    descripcion: Optional[str] = None
    nomenclatura: Optional[str] = None
    monto_obra: Optional[Decimal] = None
    fecha_inicio_obra: Optional[date] = None
    fecha_fin_obra: Optional[date] = None
    suma_asegurada: Optional[Decimal] = 0.00
    monto_garantia: Optional[Decimal] = 0.00
    monto_liberado: Optional[Decimal] = 0.00
    observaciones: Optional[str] = None

class EmpresaCreate(EmpresaBase):
    pass

class EmpresaResponse(EmpresaBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# --- Consorciado ---
class ConsorciadoBase(BaseModel):
    empresa_id: Optional[int] = None
    nombre: str
    ruc: Optional[str] = None
    porcentaje_participacion: Optional[Decimal] = 0.00

class ConsorciadoCreate(ConsorciadoBase):
    pass

class ConsorciadoResponse(ConsorciadoBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# --- Carta Fianza ---
class CartaFianzaBase(BaseModel):
    empresa_id: Optional[int] = None
    tipo: str
    numero: str
    fecha_inicio: date
    fecha_vencimiento: date
    vigencia_dias: Optional[int] = 0
    monto: Decimal
    pdf_path: Optional[str] = None
    observaciones: Optional[str] = None

class CartaFianzaCreate(CartaFianzaBase):
    pass

class CartaFianzaResponse(CartaFianzaBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# --- Factura ---
class FacturaBase(BaseModel):
    empresa_id: Optional[int] = None
    numero: str
    monto: Decimal
    tipo_fianza_relacionada: Optional[str] = None
    numero_fianza_relacionada: Optional[str] = None
    fecha_salida: date
    pdf_path: Optional[str] = None
    observacion: Optional[str] = None
    es_observada: Optional[bool] = False

class FacturaCreate(FacturaBase):
    pass

class FacturaResponse(FacturaBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# --- Licitacion ---
class LicitacionBase(BaseModel):
    empresa_id: Optional[int] = None
    codigo_proceso: Optional[str] = None
    objeto: Optional[str] = None
    entidad: Optional[str] = None
    monto: Optional[Decimal] = None
    fecha_contrato: Optional[date] = None

class LicitacionCreate(LicitacionBase):
    pass

class LicitacionResponse(LicitacionBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# --- Usuario ---
class UsuarioBase(BaseModel):
    username: str
    role: Optional[str] = 'user'

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioResponse(UsuarioBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# --- Archivo ---
class ArchivoResponse(BaseModel):
    id: int
    empresa_id: Optional[int] = None
    nombre_original: str
    ruta_fisica: str
    categoria: Optional[str] = None
    tamano_bytes: Optional[int] = None
    fecha_subida: Optional[datetime]

    class Config:
        from_attributes = True
