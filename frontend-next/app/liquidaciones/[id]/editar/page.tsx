"use client";
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { FileCheck, FileText, X, Download, Pencil, Trash2, Eye, ArrowLeft, Save, Plus, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export default function EmpresaDetallePageEditable({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [empresa, setEmpresa] = useState<any>(null);
  const [fianzas, setFianzas] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [consorciados, setConsorciados] = useState<any[]>([]);

  // States for Ficha Técnica
  const [montoObra, setMontoObra] = useState(0);
  const [sumaAsegurada, setSumaAsegurada] = useState(0);
  const [montoGarantia, setMontoGarantia] = useState(0);
  const [montoLiberado, setMontoLiberado] = useState(0);
  const [representante, setRepresentante] = useState('');
  const [entidad, setEntidad] = useState('');
  const [ruc, setRuc] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [nomenclatura, setNomenclatura] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // States for Modals
  const [showFianzaModal, setShowFianzaModal] = useState(false);
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [showConsorciadoModal, setShowConsorciadoModal] = useState(false);

  const [editingFianzaId, setEditingFianzaId] = useState<number | null>(null);
  const [editingFacturaId, setEditingFacturaId] = useState<number | null>(null);

  // Modal de Eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'fianza' | 'factura', id: number} | null>(null);
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Modal Vista Previa
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Modal Éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Edición de Nombre de Empresa
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const [hl, setHl] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setHl(urlParams.get('hl'));
    }
  }, []);

  useEffect(() => {
    if (hl && (fianzas.length > 0 || facturas.length > 0)) {
      setTimeout(() => {
        const el = document.getElementById('highlighted-row');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [hl, fianzas, facturas]);

  const openNewFianzaModal = () => {
    setEditingFianzaId(null);
    setFianzaForm({ numero: '', tipo: 'Fiel Cumplimiento', monto: 0, fecha_inicio: '', fecha_vencimiento: '', vigencia_dias: 0, archivo: null });
    setShowFianzaModal(true);
  };

  const openNewFacturaModal = () => {
    setEditingFacturaId(null);
    setFacturaForm({ numero: '', monto: 0, fecha_salida: '', tipo_fianza_relacionada: '', numero_fianza_relacionada: '', es_observada: false, observacion: '', archivo: null });
    setShowFacturaModal(true);
  };

  // Consorciado Form State
  const [consorciadoForm, setConsorciadoForm] = useState({
    nombre: '',
    ruc: '',
    porcentaje_participacion: 0
  });

  // Fianza Form State
  const [fianzaForm, setFianzaForm] = useState({
    numero: '',
    tipo: 'Fiel Cumplimiento',
    monto: 0,
    fecha_inicio: '',
    fecha_vencimiento: '',
    vigencia_dias: 0,
    archivo: null as File | null
  });

  // Factura Form State
  const [facturaForm, setFacturaForm] = useState({
    numero: '',
    monto: 0,
    fecha_salida: '',
    tipo_fianza_relacionada: '',
    numero_fianza_relacionada: '',
    es_observada: false,
    observacion: '',
    archivo: null as File | null
  });

  const getFianzaBadge = (fechaVencimiento: string) => {
    if (!fechaVencimiento) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = fechaVencimiento.split('-');
    const venc = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const diffTime = venc.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="px-2 py-0.5 text-[10px] font-bold text-[#EE5D50] bg-[#FFF4F4] rounded-md ml-2 shadow-sm">VENCIDA</span>;
    } else if (diffDays <= 30) {
      return <span className="px-2 py-0.5 text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] rounded-md ml-2 shadow-sm">VENCE EN {diffDays} DÍAS</span>;
    }
    return null;
  };

  const loadData = () => {
    if (id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/empresas/${id}`)
        .then(res => res.json())
        .then(data => {
          setEmpresa(data);
          setEditedName(data.nombre);
          setMontoObra(data.monto_obra || 0);
          setSumaAsegurada(data.suma_asegurada || 0);
          setMontoGarantia(data.monto_garantia || 0);
          setMontoLiberado(data.monto_liberado || 0);
          setRepresentante(data.representante || '');
          setEntidad(data.entidad || '');
          setRuc(data.ruc || '');
          setFechaInicio(data.fecha_inicio_obra || '');
          setFechaFin(data.fecha_fin_obra || '');
          setNomenclatura(data.nomenclatura || '');
          setDescripcion(data.descripcion || '');
        });

      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/consorciados/${id}`)
        .then(res => res.json())
        .then(data => setConsorciados(data));

      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/fianzas/${id}`)
        .then(res => res.json())
        .then(data => setFianzas(data));

      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/facturas/${id}`)
        .then(res => res.json())
        .then(data => setFacturas(data));
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleGuardarFicha = async () => {
    try {
      const payload = {
        nombre: empresa.nombre,
        monto_obra: montoObra,
        suma_asegurada: sumaAsegurada,
        monto_garantia: montoGarantia,
        monto_liberado: montoLiberado,
        representante: representante,
        entidad: entidad || undefined,
        ruc: ruc,
        fecha_inicio_obra: fechaInicio || undefined,
        fecha_fin_obra: fechaFin || undefined,
        nomenclatura: nomenclatura || undefined,
        descripcion: descripcion || undefined
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/empresas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setSuccessMessage('Ficha técnica actualizada correctamente');
        setShowSuccessModal(true);
      }
    } catch (e) {
      console.error(e);
      alert('Error al guardar');
    }
  };

  const handleSaveConsorciado = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/consorciados/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consorciadoForm)
      });
      if (res.ok) {
        setShowConsorciadoModal(false);
        loadData();
        setConsorciadoForm({ nombre: '', ruc: '', porcentaje_participacion: 0 });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFianza = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFianzaId ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/fianzas/${editingFianzaId}` : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/fianzas/${id}`;
      const method = editingFianzaId ? 'PUT' : 'POST';
      
      const formData = new FormData();
      formData.append('numero', fianzaForm.numero);
      formData.append('tipo', fianzaForm.tipo);
      formData.append('monto', fianzaForm.monto.toString());
      formData.append('fecha_inicio', fianzaForm.fecha_inicio);
      formData.append('fecha_vencimiento', fianzaForm.fecha_vencimiento);
      formData.append('vigencia_dias', fianzaForm.vigencia_dias.toString());
      if (fianzaForm.archivo) {
        formData.append('archivo', fianzaForm.archivo);
      }

      const res = await fetch(url, {
        method,
        body: formData
      });
      
      if (res.ok) {
        setShowFianzaModal(false);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFacturaId ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/facturas/${editingFacturaId}` : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/facturas/${id}`;
      const method = editingFacturaId ? 'PUT' : 'POST';
      
      const formData = new FormData();
      formData.append('numero', facturaForm.numero);
      formData.append('monto', facturaForm.monto.toString());
      formData.append('fecha_salida', facturaForm.fecha_salida);
      if (facturaForm.tipo_fianza_relacionada) formData.append('tipo_fianza_relacionada', facturaForm.tipo_fianza_relacionada);
      if (facturaForm.numero_fianza_relacionada) formData.append('numero_fianza_relacionada', facturaForm.numero_fianza_relacionada);
      formData.append('es_observada', facturaForm.es_observada ? 'true' : 'false');
      if (facturaForm.observacion) formData.append('observacion', facturaForm.observacion);
      if (facturaForm.archivo) {
        formData.append('archivo', facturaForm.archivo);
      }

      const res = await fetch(url, {
        method,
        body: formData
      });
      
      if (res.ok) {
        setShowFacturaModal(false);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };


  const handleDownloadFianza = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/fianzas/download/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setPreviewUrl(data.url);
          setDownloadUrl(data.download_url || data.url);
          setShowPreviewModal(true);
        }
      } else {
        alert("Archivo no encontrado o no disponible.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al intentar descargar el documento.");
    }
  };

  const handleDownloadFactura = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/facturas/download/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setPreviewUrl(data.url);
          setDownloadUrl(data.download_url || data.url);
          setShowPreviewModal(true);
        }
      } else {
        alert("Archivo no encontrado o no disponible.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al intentar descargar el documento.");
    }
  };
  const handleEditFianza = (f: any) => {
    setEditingFianzaId(f.id);
    setFianzaForm({
      numero: f.numero,
      tipo: f.tipo,
      monto: f.monto,
      fecha_inicio: f.fecha_inicio,
      fecha_vencimiento: f.fecha_vencimiento,
      vigencia_dias: f.vigencia_dias || 0,
      archivo: null
    });
    setShowFianzaModal(true);
  };

  const handleDeleteFianza = (fianzaId: number) => {
    setDeleteTarget({ type: 'fianza', id: fianzaId });
    setDeletePin('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleEditFactura = (f: any) => {
    setEditingFacturaId(f.id);
    setFacturaForm({
      numero: f.numero,
      monto: f.monto,
      fecha_salida: f.fecha_salida || '',
      tipo_fianza_relacionada: f.tipo_fianza_relacionada || '',
      numero_fianza_relacionada: f.numero_fianza_relacionada || '',
      es_observada: f.es_observada || false,
      observacion: f.observacion || '',
      archivo: null
    });
    setShowFacturaModal(true);
  };

  const handleDeleteFactura = (facturaId: number) => {
    setDeleteTarget({ type: 'factura', id: facturaId });
    setDeletePin('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deletePin !== "0077") {
      setDeleteError("PIN incorrecto.");
      return;
    }
    if (!deleteTarget) return;

    if (deleteTarget.type === 'fianza') {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/fianzas/${deleteTarget.id}`, { method: 'DELETE' });
    } else if (deleteTarget.type === 'factura') {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/facturas/${deleteTarget.id}`, { method: 'DELETE' });
    }
    
    setShowDeleteModal(false);
    loadData();
  };

  const handleExportarReporte = () => {
    if (!empresa) return;

    const resumenData = [
      ["REPORTE DE LIQUIDACIÓN Y CONTROL DE OBRA"],
      [""],
      ["Datos de la Empresa/Consorcio"],
      ["Nombre", empresa.nombre],
      ["RUC", ruc || "---"],
      ["Representante Legal", representante || "---"],
      ["Fecha Inicio Obra", fechaInicio || "---"],
      ["Fecha Fin Obra", fechaFin || "---"],
      [""],
      ["Control Financiero"],
      ["Monto Adjudicado (S/)", montoObra],
      ["Suma Asegurada (S/)", sumaAsegurada],
      ["Fondo de Garantía Retenido (S/)", montoGarantia],
      ["Monto Liberado (S/)", montoLiberado]
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);

    const consorciadosData = consorciados.map(c => ({
      "Nombre / Razón Social": c.nombre,
      "RUC": c.ruc || "---",
      "Participación (%)": c.porcentaje_participacion
    }));
    const wsConsorciados = XLSX.utils.json_to_sheet(consorciadosData.length ? consorciadosData : [{"Mensaje": "Sin consorciados"}]);

    const fianzasData = fianzas.map(f => ({
      "N° Documento": f.numero,
      "Tipo de Fianza": f.tipo,
      "Monto (S/)": f.monto,
      "Fecha Inicio": f.fecha_inicio,
      "Fecha Vencimiento": f.fecha_vencimiento
    }));
    const wsFianzas = XLSX.utils.json_to_sheet(fianzasData.length ? fianzasData : [{"Mensaje": "Sin fianzas registradas"}]);

    const facturasData = facturas.map(f => ({
      "N° Factura": f.numero,
      "Fecha Emisión": f.fecha_salida,
      "Monto (S/)": f.monto,
      "Amortiza A (Tipo)": f.tipo_fianza_relacionada || "---",
      "Amortiza A (N°)": f.numero_fianza_relacionada || "---",
      "Estado": f.es_observada ? "OBSERVADA" : "Registrada"
    }));
    const wsFacturas = XLSX.utils.json_to_sheet(facturasData.length ? facturasData : [{"Mensaje": "Sin facturas registradas"}]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen General");
    XLSX.utils.book_append_sheet(wb, wsConsorciados, "Consorciados");
    XLSX.utils.book_append_sheet(wb, wsFianzas, "Fianzas");
    XLSX.utils.book_append_sheet(wb, wsFacturas, "Facturas (Amortizaciones)");

    XLSX.writeFile(wb, `Liquidacion_${empresa.nombre.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleExportarWord = () => {
    if (!empresa) return;
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/reporte/empresa/${id}/word`, '_blank');
  };

  const inputClass = "mt-1 block w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm font-medium text-[#1B254B] focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider";

  if (!empresa) return <div className="p-10 text-center text-[#A3AED0] font-bold">Cargando modo edición...</div>;

  return (
    <div className="space-y-8 w-full p-6 lg:p-10 bg-[#F4F7FE] min-h-screen font-sans text-[#1B254B]">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          {isEditingName ? (
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="text" 
                value={editedName}
                onChange={e => setEditedName(e.target.value)}
                className="text-3xl font-bold text-[#1B254B] border-b-2 border-[#4318FF] outline-none bg-transparent px-1 min-w-[400px]"
                autoFocus
              />
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/empresas/${id}`, {
                      method: 'PUT',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({nombre: editedName})
                    });
                    if(res.ok) {
                      setEmpresa({...empresa, nombre: editedName});
                      setIsEditingName(false);
                    }
                  } catch(e) {}
                }}
                className="text-xs font-bold text-white bg-[#05CD99] hover:bg-emerald-600 px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                Guardar
              </button>
              <button onClick={() => {setIsEditingName(false); setEditedName(empresa.nombre);}} className="text-xs font-bold text-white bg-[#EE5D50] hover:bg-red-600 px-4 py-2 rounded-lg transition-colors shadow-sm">
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 group mb-2">
              <h1 className="text-3xl font-bold text-[#1B254B] leading-tight">{empresa.nombre}</h1>
              <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 text-[#4318FF] hover:bg-[#F4F7FE] p-2 rounded-xl transition-all shadow-sm">
                <Pencil size={18} />
              </button>
            </div>
          )}
          <p className="mt-1 text-sm font-bold text-[#A3AED0]">Modo Edición - Panel de Control de Obra y Liquidación</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/reporte/empresa/${id}`, '_blank')}
            className="px-5 py-2.5 bg-[#FFF4F4] rounded-[15px] text-sm font-bold text-[#EE5D50] hover:bg-[#FEE2E2] flex items-center gap-2 shadow-sm transition-colors"
          >
            <Download size={18} /> Reporte (PDF)
          </button>
          <button 
            onClick={handleExportarWord}
            className="px-5 py-2.5 bg-[#F4F7FE] rounded-[15px] text-sm font-bold text-[#4318FF] hover:bg-[#E0E5F2] flex items-center gap-2 shadow-sm transition-colors"
          >
            <Download size={18} /> Exportar (Word)
          </button>
          <Link href={`/liquidaciones/${id}`} className="px-5 py-2.5 bg-white rounded-[15px] text-sm font-bold text-[#1B254B] hover:bg-[#E0E5F2] flex items-center gap-2 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-colors">
            <ArrowLeft size={18} /> Volver a Vista
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Ficha Técnica Completada */}
        <div className="xl:col-span-3 rounded-[20px] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative">
          <h2 className="text-xl font-bold text-[#1B254B] border-b border-[#F4F7FE] pb-4 mb-6">Ficha Técnica Integral</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
            {/* Datos Generales */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-[#4318FF] uppercase tracking-wider flex items-center gap-2">
                 Datos de la Empresa
              </h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>RUC</label>
                  <input type="text" value={ruc} onChange={e => setRuc(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Representante Legal</label>
                  <input type="text" value={representante} onChange={e => setRepresentante(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Fecha Inicio Obra</label>
                  <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Fecha Fin Obra</label>
                  <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Control Financiero */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-[#4318FF] uppercase tracking-wider flex items-center gap-2">
                 Control Financiero
              </h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Monto Adjudicado (S/)</label>
                  <input type="number" value={montoObra} onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setMontoObra(val);
                    setSumaAsegurada(Number((val * 0.10).toFixed(2)));
                    setMontoGarantia(Number((val * 0.10 * 0.20).toFixed(2)));
                  }} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Suma Asegurada (S/)</label>
                  <input type="number" value={sumaAsegurada} onChange={e => setSumaAsegurada(parseFloat(e.target.value))} className={`mt-1 block w-full rounded-xl border border-[#4318FF]/20 bg-[#F4F7FE] px-4 py-2.5 text-sm font-bold text-[#4318FF] outline-none shadow-sm`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Fondo Garantía (Retenido)</label>
                  <input type="number" value={montoGarantia} onChange={e => setMontoGarantia(parseFloat(e.target.value))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Monto Liberado (S/)</label>
                  <input type="number" value={montoLiberado} onChange={e => setMontoLiberado(parseFloat(e.target.value))} className={inputClass} />
                </div>
              </div>
            </div>
          </div>
          
          {/* SEACE / Licitación */}
          <div className="mt-8 pt-8 border-t border-[#F4F7FE]">
            <h3 className="text-sm font-bold text-[#4318FF] uppercase tracking-wider mb-5">Información SEACE / Licitación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Entidad (MTC, Gob. Regional, etc.)</label>
                <input type="text" value={entidad} onChange={e => setEntidad(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nomenclatura (Código de Proceso)</label>
                <input type="text" value={nomenclatura} onChange={e => setNomenclatura(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Descripción (Objeto de la Obra)</label>
                <textarea rows={1} value={descripcion} onChange={e => setDescripcion(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
          
          <div className="pt-8 mt-8 border-t border-[#F4F7FE] flex justify-end">
            <button onClick={handleGuardarFicha} className="bg-[#4318FF] text-white px-8 py-3 rounded-[15px] text-sm font-bold hover:bg-[#3311DB] transition-all shadow-[0_4px_24px_rgba(67,24,255,0.25)] flex items-center gap-2">
              <Save size={18} /> Guardar Ficha Técnica
            </button>
          </div>
        </div>

        {/* Consorciados */}
        <div className="xl:col-span-3 rounded-[20px] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center border-b border-[#F4F7FE] pb-4 mb-6">
            <h2 className="text-xl font-bold text-[#1B254B]">Empresas Consorciadas</h2>
            <button onClick={() => setShowConsorciadoModal(true)} className="text-sm font-bold text-[#4318FF] bg-[#F4F7FE] hover:bg-[#E0E5F2] px-4 py-2 rounded-xl transition-colors flex items-center gap-2 shadow-sm">
              <Plus size={16} /> Agregar Consorciado
            </button>
          </div>
          {consorciados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {consorciados.map(c => (
                <div key={c.id} className="border border-[#E0E5F2] rounded-2xl p-5 bg-white shadow-sm flex flex-col hover:border-[#4318FF] transition-colors">
                  <h4 className="font-bold text-[#1B254B] text-base mb-1">{c.nombre}</h4>
                  <div className="text-xs font-medium text-[#A3AED0] mb-4">RUC: {c.ruc || 'N/A'}</div>
                  <div className="mt-auto pt-4 border-t border-[#F4F7FE] flex justify-between items-center">
                    <span className="text-xs font-bold text-[#A3AED0] uppercase">Participación</span>
                    <span className="text-sm font-bold text-[#4318FF] bg-[#F4F7FE] px-2 py-1 rounded-md">{c.porcentaje_participacion}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm font-medium text-[#A3AED0] py-8 bg-[#F4F7FE] rounded-2xl border border-dashed border-[#E0E5F2]">
              Este consorcio no tiene empresas registradas.
            </div>
          )}
        </div>

        {/* Fianzas */}
        <div className="xl:col-span-1 rounded-[20px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col h-[550px] overflow-hidden">
          <div className="p-6 border-b border-[#F4F7FE] flex justify-between items-center bg-white">
            <h3 className="font-bold text-[#1B254B] text-lg flex items-center gap-2">
              Fianzas
            </h3>
            <button onClick={openNewFianzaModal} className="text-sm font-bold text-[#4318FF] bg-[#F4F7FE] hover:bg-[#E0E5F2] p-2 rounded-xl transition-colors">
              <Plus size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#F4F7FE] p-2">
            {fianzas.map(f => {
              const isHighlighted = hl && f.numero.toLowerCase().includes(hl.toLowerCase());
              return (
              <div key={f.id} id={isHighlighted ? 'highlighted-row' : undefined} className={`p-4 rounded-xl mb-2 ${isHighlighted ? 'bg-[#FEF3C7]' : 'hover:bg-[#F4F7FE]'} transition-colors group relative`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-[#1B254B] flex items-center">{f.numero}</p>
                    <div className="mt-1 mb-2">{getFianzaBadge(f.fecha_vencimiento)}</div>
                    <span className="text-xs font-medium text-[#A3AED0] block">
                      {f.tipo} <br/> 
                      {f.vigencia_dias ? `Vigencia: ${f.vigencia_dias} días | ` : ''} 
                      Vence: <strong className="text-[#1B254B]">{f.fecha_vencimiento}</strong>
                    </span>
                    {f.pdf_path && f.pdf_path !== "null" && f.pdf_path !== "None" && f.pdf_path.trim() !== "" && (
                      <button onClick={() => handleDownloadFianza(f.id)} className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#4318FF] hover:bg-[#4318FF] hover:text-white transition-all duration-300 text-[11px] font-bold shadow-sm">
                        <Eye size={14} className="transition-transform" /> 
                        <span>VER DOC</span>
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#1B254B] block mb-2 text-sm">S/ {f.monto}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => handleEditFianza(f)} className="text-[#4318FF] hover:bg-[#E0E5F2] p-1.5 rounded-lg bg-white shadow-sm"><Pencil size={14}/></button>
                      <button onClick={() => handleDeleteFianza(f.id)} className="text-[#EE5D50] hover:bg-[#FEE2E2] p-1.5 rounded-lg bg-white shadow-sm"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
            {fianzas.length === 0 && <div className="p-8 text-center text-sm font-medium text-[#A3AED0]">No hay fianzas registradas</div>}
          </div>
        </div>

        {/* Facturas */}
        <div className="xl:col-span-2 rounded-[20px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col h-[550px] overflow-hidden">
          <div className="p-6 border-b border-[#F4F7FE] flex justify-between items-center bg-white">
            <h3 className="font-bold text-[#1B254B] text-lg flex items-center gap-2">
              Facturas (Amortizaciones)
            </h3>
            <button onClick={openNewFacturaModal} className="text-sm font-bold text-white bg-[#4318FF] hover:bg-[#3311DB] px-5 py-2.5 rounded-[12px] transition-colors shadow-sm flex items-center gap-2">
              <Plus size={16} /> Registrar Factura
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-max w-full text-left">
              <thead className="bg-white sticky top-0 border-b border-[#E0E5F2]">
                <tr>
                  <th className="font-bold text-[11px] text-[#A3AED0] uppercase tracking-wider px-6 py-4">N° Factura</th>
                  <th className="font-bold text-[11px] text-[#A3AED0] uppercase tracking-wider px-6 py-4">Monto</th>
                  <th className="font-bold text-[11px] text-[#A3AED0] uppercase tracking-wider px-6 py-4">Amortiza a</th>
                  <th className="font-bold text-[11px] text-[#A3AED0] uppercase tracking-wider px-6 py-4">Estado</th>
                  <th className="text-right font-bold text-[11px] text-[#A3AED0] uppercase tracking-wider px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F7FE]">
                {facturas.map(f => {
                  const isHighlighted = hl && f.numero.toLowerCase().includes(hl.toLowerCase());
                  return (
                  <tr key={f.id} id={isHighlighted ? 'highlighted-row' : undefined} className={`${isHighlighted ? 'bg-[#FEF3C7]' : 'hover:bg-[#F4F7FE]'} transition-colors group`}>
                    <td className="px-6 py-4 font-bold text-[#1B254B] text-sm">{f.numero}</td>
                    <td className="px-6 py-4 font-bold text-[#1B254B] text-sm">S/ {f.monto}</td>
                    <td className="px-6 py-4 text-xs font-medium text-[#A3AED0]">
                      {f.tipo_fianza_relacionada ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1B254B]">{f.tipo_fianza_relacionada}</span>
                          <span>{f.numero_fianza_relacionada}</span>
                        </div>
                      ) : '---'}
                    </td>
                    <td className="px-6 py-4">
                      {f.es_observada ? 
                        <span className="px-3 py-1 text-[11px] font-bold text-[#EE5D50] bg-[#FFF4F4] rounded-lg inline-block mb-1 shadow-sm">OBSERVADA</span> : 
                        <span className="px-3 py-1 text-[11px] font-bold text-[#05CD99] bg-[#E6F8E8] rounded-lg inline-block mb-1 shadow-sm">REGISTRADA</span>
                      }
                      {f.pdf_path && f.pdf_path !== "null" && f.pdf_path !== "None" && f.pdf_path.trim() !== "" && (
                        <button onClick={() => handleDownloadFactura(f.id)} className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#4318FF] border border-[#E0E5F2] hover:bg-[#4318FF] hover:text-white hover:border-[#4318FF] transition-all duration-300 text-[11px] font-bold shadow-sm block w-max">
                          <Eye size={14} className="transition-transform" /> 
                          <span>VER DOC</span>
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditFactura(f)} className="text-[#4318FF] hover:bg-[#E0E5F2] p-2 rounded-xl bg-white shadow-sm"><Pencil size={16}/></button>
                        <button onClick={() => handleDeleteFactura(f.id)} className="text-[#EE5D50] hover:bg-[#FEE2E2] p-2 rounded-xl bg-white shadow-sm"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {facturas.length === 0 && <tr><td colSpan={5} className="py-10 text-center font-medium text-[#A3AED0]">No hay facturas registradas en el sistema.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL CONSORCIADO */}
      {showConsorciadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B254B]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-[#F4F7FE]">
              <h3 className="font-bold text-xl text-[#1B254B]">Agregar Consorciado</h3>
              <button onClick={() => setShowConsorciadoModal(false)} className="text-[#A3AED0] hover:text-[#1B254B] bg-[#F4F7FE] p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveConsorciado} className="p-6 space-y-5">
              <div>
                <label className={labelClass}>Nombre / Razón Social</label>
                <input required type="text" className={inputClass} value={consorciadoForm.nombre} onChange={e => setConsorciadoForm({...consorciadoForm, nombre: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>RUC</label>
                <input type="text" className={inputClass} value={consorciadoForm.ruc} onChange={e => setConsorciadoForm({...consorciadoForm, ruc: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>% de Participación</label>
                <input required type="number" step="0.01" max="100" className={inputClass} value={consorciadoForm.porcentaje_participacion} onChange={e => setConsorciadoForm({...consorciadoForm, porcentaje_participacion: parseFloat(e.target.value)})} />
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-[#F4F7FE]">
                <button type="button" onClick={() => setShowConsorciadoModal(false)} className="px-6 py-2.5 text-sm text-[#1B254B] font-bold bg-[#F4F7FE] hover:bg-[#E0E5F2] rounded-[12px] transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-[#4318FF] text-white text-sm font-bold rounded-[12px] hover:bg-[#3311DB] shadow-[0_4px_24px_rgba(67,24,255,0.25)] transition-colors">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FIANZA */}
      {showFianzaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B254B]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-[#F4F7FE]">
              <h3 className="font-bold text-xl text-[#1B254B]">{editingFianzaId ? 'Editar Fianza' : 'Agregar Fianza'}</h3>
              <button onClick={() => setShowFianzaModal(false)} className="text-[#A3AED0] hover:text-[#1B254B] bg-[#F4F7FE] p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveFianza} className="p-6 space-y-5">
              <div>
                <label className={labelClass}>N° Documento</label>
                <input required type="text" className={inputClass} value={fianzaForm.numero} onChange={e => setFianzaForm({...fianzaForm, numero: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Tipo de Fianza</label>
                <select className={inputClass} value={fianzaForm.tipo} onChange={e => setFianzaForm({...fianzaForm, tipo: e.target.value})}>
                  <option>Fiel Cumplimiento</option>
                  <option>Adelanto de Materiales</option>
                  <option>Adelanto Directo</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Monto (S/)</label>
                  <input required type="number" step="0.01" className={inputClass} value={Number.isNaN(fianzaForm.monto) ? '' : fianzaForm.monto} onChange={e => setFianzaForm({...fianzaForm, monto: e.target.value === '' ? NaN : parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className={labelClass}>Vigencia (días)</label>
                  <input required type="number" min="0" className={inputClass}
                    value={fianzaForm.vigencia_dias} 
                    onChange={e => {
                      const vigencia = parseInt(e.target.value) || 0;
                      let newVenc = fianzaForm.fecha_vencimiento;
                      if (fianzaForm.fecha_inicio && vigencia > 0) {
                        const date = new Date(fianzaForm.fecha_inicio + 'T00:00:00');
                        date.setDate(date.getDate() + vigencia);
                        newVenc = date.toISOString().split('T')[0];
                      }
                      setFianzaForm({...fianzaForm, vigencia_dias: vigencia, fecha_vencimiento: newVenc});
                    }} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Fecha Inicio</label>
                  <input required type="date" className={inputClass}
                    value={fianzaForm.fecha_inicio} 
                    onChange={e => {
                      const newInicio = e.target.value;
                      let newVenc = fianzaForm.fecha_vencimiento;
                      if (newInicio && fianzaForm.vigencia_dias > 0) {
                        const date = new Date(newInicio + 'T00:00:00');
                        date.setDate(date.getDate() + fianzaForm.vigencia_dias);
                        newVenc = date.toISOString().split('T')[0];
                      }
                      setFianzaForm({...fianzaForm, fecha_inicio: newInicio, fecha_vencimiento: newVenc});
                    }} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Fecha Venc. (Auto)</label>
                  <input readOnly type="date" className={`mt-1 block w-full rounded-xl border border-[#F4F7FE] bg-[#F4F7FE] px-4 py-2.5 text-sm font-bold text-[#A3AED0] outline-none cursor-not-allowed`} value={fianzaForm.fecha_vencimiento} />
                </div>
              </div>
              
              <div className="pt-2">
                <label className={labelClass}>Documento Adjunto (PDF)</label>
                <div className="mt-2 border-2 border-dashed border-[#E0E5F2] rounded-xl p-4 text-center hover:border-[#4318FF] transition-colors bg-[#F4F7FE]/50">
                  <input
                    type="file"
                    onChange={e => setFianzaForm({...fianzaForm, archivo: e.target.files ? e.target.files[0] : null})}
                    className="w-full text-sm text-[#A3AED0] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#4318FF] file:text-white hover:file:bg-[#3311DB] transition-all cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-[#F4F7FE]">
                <button type="button" onClick={() => setShowFianzaModal(false)} className="w-1/2 rounded-[12px] bg-[#F4F7FE] py-3 text-sm font-bold text-[#1B254B] hover:bg-[#E0E5F2] transition-colors">Cancelar</button>
                <button type="submit" className="w-1/2 rounded-[12px] bg-[#4318FF] py-3 text-sm font-bold text-white hover:bg-[#3311DB] shadow-[0_4px_24px_rgba(67,24,255,0.25)] transition-colors">Guardar Fianza</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FACTURA */}
      {showFacturaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B254B]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-[#F4F7FE]">
              <h3 className="font-bold text-xl text-[#1B254B]">{editingFacturaId ? 'Editar Factura' : 'Registrar Factura'}</h3>
              <button onClick={() => setShowFacturaModal(false)} className="text-[#A3AED0] hover:text-[#1B254B] bg-[#F4F7FE] p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveFactura} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>N° Factura</label>
                  <input required type="text" className={inputClass} value={facturaForm.numero} onChange={e => setFacturaForm({...facturaForm, numero: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Monto (S/)</label>
                  <input required type="number" step="0.01" className={inputClass} value={Number.isNaN(facturaForm.monto) ? '' : facturaForm.monto} onChange={e => setFacturaForm({...facturaForm, monto: e.target.value === '' ? NaN : parseFloat(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Fecha Emisión / Salida</label>
                <input required type="date" className={inputClass} value={facturaForm.fecha_salida} onChange={e => setFacturaForm({...facturaForm, fecha_salida: e.target.value})} />
              </div>
              
              <div className="p-5 bg-[#F4F7FE] rounded-[15px] border border-[#E0E5F2]">
                <p className="text-sm font-bold text-[#4318FF] mb-4">Relación a Fianza (Amortización)</p>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Tipo de Fianza</label>
                    <select className={inputClass} value={facturaForm.tipo_fianza_relacionada} onChange={e => setFacturaForm({...facturaForm, tipo_fianza_relacionada: e.target.value})}>
                      <option value="">-- Ninguna --</option>
                      <option value="Fiel Cumplimiento">Fiel Cumplimiento</option>
                      <option value="Adelanto de Materiales">Adelanto de Materiales</option>
                      <option value="Adelanto Directo">Adelanto Directo</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>N° Fianza Específica</label>
                    <input type="text" className={inputClass} placeholder="Ej. 15413-0498-2024-000" value={facturaForm.numero_fianza_relacionada} onChange={e => setFacturaForm({...facturaForm, numero_fianza_relacionada: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <input type="checkbox" id="obs" className="w-5 h-5 rounded-[6px] border-[#E0E5F2] text-[#EE5D50] focus:ring-[#EE5D50] transition-all cursor-pointer" checked={facturaForm.es_observada} onChange={e => setFacturaForm({...facturaForm, es_observada: e.target.checked})} />
                <label htmlFor="obs" className="text-sm font-bold text-[#EE5D50] cursor-pointer">Marcar como Factura Observada</label>
              </div>

              {facturaForm.es_observada && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="block text-[11px] font-bold text-[#EE5D50] uppercase tracking-wider mb-1">Motivo de Observación</label>
                  <textarea className="mt-1 block w-full rounded-xl border border-[#EE5D50]/30 bg-[#FFF4F4] px-4 py-2.5 text-sm font-medium text-[#1B254B] focus:border-[#EE5D50] focus:ring-1 focus:ring-[#EE5D50] outline-none transition-all shadow-sm" value={facturaForm.observacion} onChange={e => setFacturaForm({...facturaForm, observacion: e.target.value})}></textarea>
                </div>
              )}

              <div className="pt-2">
                <label className={labelClass}>Documento Adjunto (PDF)</label>
                <div className="mt-2 border-2 border-dashed border-[#E0E5F2] rounded-xl p-4 text-center hover:border-[#4318FF] transition-colors bg-[#F4F7FE]/50">
                  <input
                    type="file"
                    onChange={e => setFacturaForm({...facturaForm, archivo: e.target.files ? e.target.files[0] : null})}
                    className="w-full text-sm text-[#A3AED0] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#4318FF] file:text-white hover:file:bg-[#3311DB] transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-[#F4F7FE]">
                <button type="button" onClick={() => setShowFacturaModal(false)} className="w-1/2 rounded-[12px] bg-[#F4F7FE] py-3 text-sm font-bold text-[#1B254B] hover:bg-[#E0E5F2] transition-colors">Cancelar</button>
                <button type="submit" className="w-1/2 rounded-[12px] bg-[#4318FF] py-3 text-sm font-bold text-white hover:bg-[#3311DB] shadow-[0_4px_24px_rgba(67,24,255,0.25)] transition-colors">Guardar Factura</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1B254B]/60 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF4F4] mb-6 shadow-sm">
              <Trash2 className="h-8 w-8 text-[#EE5D50]" />
            </div>
            <h3 className="text-xl font-bold text-[#1B254B] mb-2">¿Eliminar Registro?</h3>
            <p className="text-sm font-medium text-[#A3AED0] mb-6">
              Esta acción no se puede deshacer. Por seguridad, ingresa el PIN de autorización.
            </p>
            
            <input 
              type="password" 
              placeholder="PIN de seguridad (0077)" 
              className={`w-full text-center rounded-xl border ${deleteError ? 'border-[#EE5D50] bg-[#FFF4F4] text-[#EE5D50]' : 'border-[#E0E5F2] bg-[#F4F7FE]'} px-4 py-3 text-sm font-bold focus:border-[#EE5D50] focus:ring-1 focus:ring-[#EE5D50] outline-none mb-2 transition-colors`}
              value={deletePin}
              onChange={e => {
                setDeletePin(e.target.value);
                setDeleteError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmDelete();
              }}
              autoFocus
            />
            {deleteError && <p className="text-xs text-[#EE5D50] font-bold mb-4">{deleteError}</p>}
            {!deleteError && <div className="h-4 mb-4"></div>}

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="flex-1 px-4 py-3 text-sm font-bold text-[#1B254B] bg-[#F4F7FE] rounded-[12px] hover:bg-[#E0E5F2] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-[#EE5D50] rounded-[12px] hover:bg-red-600 transition-colors shadow-[0_4px_24px_rgba(238,93,80,0.25)]"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISTA PREVIA */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1B254B]/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[#F4F7FE] bg-white">
              <h3 className="font-bold text-lg text-[#1B254B]">Vista Previa del Documento</h3>
              <div className="flex gap-3 items-center">
                <a href={downloadUrl || previewUrl} download className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-[#4318FF] bg-[#F4F7FE] hover:bg-[#4318FF] hover:text-white rounded-[12px] transition-colors shadow-sm">
                  <Download size={16}/> Descargar Original
                </a>
                <button onClick={() => { setShowPreviewModal(false); setPreviewUrl(null); setDownloadUrl(null); }} className="p-2.5 text-[#A3AED0] hover:text-[#1B254B] bg-[#F4F7FE] hover:bg-[#E0E5F2] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-[#F4F7FE] p-4">
              <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-0 rounded-xl bg-white shadow-sm" title="Vista Previa Documento" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1B254B]/60 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F8E8] mb-6 shadow-sm">
              <CheckCircle className="h-8 w-8 text-[#05CD99]" />
            </div>
            <h3 className="text-xl font-bold text-[#1B254B] mb-2">¡Éxito!</h3>
            <p className="text-sm font-medium text-[#A3AED0] mb-8">
              {successMessage}
            </p>
            <button 
              onClick={() => setShowSuccessModal(false)} 
              className="w-full px-4 py-3 text-sm font-bold text-white bg-[#4318FF] rounded-[12px] hover:bg-[#3311DB] transition-colors shadow-[0_4px_24px_rgba(67,24,255,0.25)]"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
