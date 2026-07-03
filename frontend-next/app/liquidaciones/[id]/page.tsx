"use client";
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Pencil, Eye, Download, X, ArrowLeft, Building2, Wallet, ShieldCheck, FileText } from 'lucide-react';

export default function EmpresaDetallePageReadOnly({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [empresa, setEmpresa] = useState<any>(null);
  const [fianzas, setFianzas] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [consorciados, setConsorciados] = useState<any[]>([]);

  const [hl, setHl] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setHl(urlParams.get('hl'));
    }
  }, []);

  useEffect(() => {
    if (hl && fianzas.length > 0) {
      setTimeout(() => {
        const el = document.getElementById('highlighted-row');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [hl, fianzas, facturas]);

  // Modal Vista Previa
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleDownloadFianza = async (fianzaId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/fianzas/download/${fianzaId}`);
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
      alert("Error de conexión");
    }
  };

  const handleDownloadFactura = async (facturaId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/facturas/download/${facturaId}`);
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
      alert("Error de conexión");
    }
  };

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:8000/api/empresas/${id}`)
        .then(res => res.json())
        .then(data => setEmpresa(data));

      fetch(`http://localhost:8000/api/consorciados/${id}`)
        .then(res => res.json())
        .then(data => setConsorciados(data));

      fetch(`http://localhost:8000/api/fianzas/${id}`)
        .then(res => res.json())
        .then(data => setFianzas(data));

      fetch(`http://localhost:8000/api/facturas/${id}`)
        .then(res => res.json())
        .then(data => setFacturas(data));
    }
  }, [id]);

  if (!empresa) return <div className="p-10 text-center text-[#A3AED0] font-bold">Cargando datos del sistema...</div>;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  };

  const montoObra = parseFloat(empresa.monto_obra) || 0;
  const fcAsegurada = montoObra * 0.10;
  const fcGarantia = fcAsegurada * 0.20;
  const adAsegurada = montoObra * 0.10;
  const adGarantia = adAsegurada * 0.20;

  const checkHighlight = (str1?: string | null, str2?: string | null) => {
    if (!hl) return false;
    const match = hl.toLowerCase();
    return (str1 && str1.toLowerCase().includes(match)) || (str2 && str2.toLowerCase().includes(match));
  };

  const renderFianzaRows = (tipoFianza: string) => {
    const filteredFianzas = fianzas.filter(f => f.tipo.toUpperCase() === tipoFianza.toUpperCase());
    
    if (filteredFianzas.length === 0) {
      return (
        <tr>
          <td colSpan={10} className="px-5 py-8 text-center text-[#A3AED0] font-medium text-sm">
            No hay registros de {tipoFianza} en la base de datos.
          </td>
        </tr>
      );
    }

    return filteredFianzas.flatMap((fianza) => {
      const matchingFacturas = facturas.filter(fac => fac.numero_fianza_relacionada === fianza.numero);

      if (matchingFacturas.length === 0) {
        const isHighlighted = checkHighlight(fianza.numero);
        return (
          <tr 
            key={`f-${fianza.id}-0`} 
            id={isHighlighted ? 'highlighted-row' : undefined}
            className={`${isHighlighted ? 'bg-[#FEF3C7]' : 'hover:bg-[#F4F7FE]'} transition-colors border-b border-[#E0E5F2] last:border-0`}
          >
            <td className="px-5 py-4 text-sm font-bold text-[#1B254B]">{tipoFianza.toUpperCase()}</td>
            <td className="px-5 py-4 text-sm font-bold text-[#4318FF]">{fianza.numero}</td>
            <td className="px-5 py-4 text-sm font-bold text-[#1B254B]">{formatCurrency(fianza.monto)}</td>
            <td className="px-5 py-4 text-sm font-medium text-[#A3AED0]">{fianza.fecha_inicio}</td>
            <td className="px-5 py-4 text-sm font-medium text-[#A3AED0]">{fianza.fecha_vencimiento}</td>
            <td className="px-5 py-4 text-sm font-medium text-[#A3AED0]">---</td>
            <td className="px-5 py-4 text-sm font-medium text-[#A3AED0]">---</td>
            <td className="px-5 py-4 text-sm font-medium text-[#A3AED0]">---</td>
            <td className="px-5 py-4 text-xs font-medium text-[#A3AED0] truncate max-w-[150px]">{fianza.observaciones || '---'}</td>
            <td className="px-5 py-4 text-sm">
              {fianza.pdf_path && fianza.pdf_path !== "null" && fianza.pdf_path !== "None" && fianza.pdf_path.trim() !== "" && (
                <button onClick={() => handleDownloadFianza(fianza.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4F7FE] text-[#4318FF] hover:bg-[#4318FF] hover:text-white text-[11px] font-bold transition-all shadow-sm">
                   <Eye size={14} /> VER FIANZA
                </button>
              )}
            </td>
          </tr>
        );
      }

      return matchingFacturas.map((fac) => {
        const isHighlighted = checkHighlight(fianza.numero, fac.numero);
        return (
          <tr 
            key={`f-${fianza.id}-${fac.id}`} 
            id={isHighlighted ? 'highlighted-row' : undefined}
            className={`${isHighlighted ? 'bg-[#FEF3C7]' : 'hover:bg-[#F4F7FE]'} transition-colors border-b border-[#E0E5F2] last:border-0`}
          >
          <td className="px-5 py-4 text-sm font-bold text-[#1B254B]">{tipoFianza.toUpperCase()}</td>
          <td className="px-5 py-4 text-sm font-bold text-[#4318FF]">{fianza.numero}</td>
          <td className="px-5 py-4 text-sm font-bold text-[#1B254B]">{formatCurrency(fianza.monto)}</td>
          <td className="px-5 py-4 text-sm font-medium text-[#A3AED0]">{fianza.fecha_inicio}</td>
          <td className="px-5 py-4 text-sm font-medium text-[#A3AED0]">{fianza.fecha_vencimiento}</td>
          <td className="px-5 py-4 text-sm font-bold text-[#05CD99]">{fac.numero}</td>
          <td className="px-5 py-4 text-sm font-bold text-[#1B254B]">{formatCurrency(fac.monto)}</td>
          <td className="px-5 py-4 text-sm font-medium text-[#A3AED0]">{fac.fecha_salida}</td>
          <td className="px-5 py-4 text-xs font-medium text-[#A3AED0]">
            <span className="block truncate max-w-[150px]" title={fac.observacion || fianza.observaciones || ''}>
              {fac.observacion || fianza.observaciones || '---'}
            </span>
            {fac.es_observada && <span className="mt-1 px-2 py-0.5 text-[10px] font-bold text-[#EE5D50] bg-[#FFF4F4] rounded-md inline-block">OBSERVADA</span>}
          </td>
          <td className="px-5 py-4 text-sm">
            <div className="flex flex-col gap-2">
              {fianza.pdf_path && fianza.pdf_path !== "null" && fianza.pdf_path !== "None" && fianza.pdf_path.trim() !== "" && (
                <button onClick={() => handleDownloadFianza(fianza.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4F7FE] text-[#4318FF] hover:bg-[#4318FF] hover:text-white text-[11px] font-bold transition-all shadow-sm">
                   <Eye size={14} /> FIANZA
                </button>
              )}
              {fac.pdf_path && fac.pdf_path !== "null" && fac.pdf_path !== "None" && fac.pdf_path.trim() !== "" && (
                <button onClick={() => handleDownloadFactura(fac.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E6F8E8] text-[#05CD99] hover:bg-[#05CD99] hover:text-white text-[11px] font-bold transition-all shadow-sm">
                   <Eye size={14} /> FACTURA
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    });
  });
};

  const TableHeader = () => (
    <thead className="bg-white border-b border-[#E0E5F2]">
      <tr>
        <th className="px-5 py-4 text-left text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">TIPO DE CARTA FIANZA</th>
        <th className="px-5 py-4 text-left text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">NÚMERO DE FIANZA</th>
        <th className="px-5 py-4 text-left text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">MONTO DE FIANZA</th>
        <th className="px-5 py-4 text-left text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">FECHA DE INICIO</th>
        <th className="px-5 py-4 text-left text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">FECHA DE VENCIMIENTO</th>
        <th className="px-5 py-4 text-left text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">NÚMERO DE FACTURA</th>
        <th className="px-5 py-4 text-left text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">MONTO DE FACTURA</th>
        <th className="px-5 py-4 text-left text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">FECHA SALIDA FACTURA</th>
        <th className="px-5 py-4 text-left text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">OBSERVACIONES</th>
        <th className="px-5 py-4 text-left text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">DOCUMENTOS</th>
      </tr>
    </thead>
  );

  return (
    <div className="space-y-8 w-full p-6 lg:p-10 bg-[#F4F7FE] min-h-screen font-sans text-[#1B254B]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#1B254B] leading-tight">{empresa.nombre}</h1>
          <p className="mt-1 text-sm font-medium text-[#A3AED0]">Liquidación de Contrato - RUC: <strong className="text-[#1B254B]">{empresa.ruc || '---'}</strong></p>
        </div>
        <div className="flex gap-3">
          <Link href="/liquidaciones" className="px-5 py-2.5 bg-white rounded-[15px] text-sm font-bold hover:bg-[#E0E5F2] text-[#1B254B] shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-colors flex items-center gap-2">
            <ArrowLeft size={18} /> Volver
          </Link>
          <Link href={`/liquidaciones/${id}/editar`} className="px-5 py-2.5 bg-[#4318FF] rounded-[15px] text-sm font-bold text-white hover:bg-[#3311DB] flex items-center gap-2 shadow-[0_4px_24px_rgba(67,24,255,0.25)] transition-all">
            <Pencil size={18} /> Editar Datos
          </Link>
        </div>
      </div>

      {/* 4 Cards Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Card 1: Monto */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-center relative">
          <div className="w-12 h-12 rounded-full bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] mb-4">
            <Wallet size={22} />
          </div>
          <h3 className="text-sm font-bold text-[#A3AED0] mb-2">Monto Total de Obra</h3>
          <p className="text-[#1B254B] text-3xl font-bold tracking-tight">
            {formatCurrency(montoObra)}
          </p>
        </div>

        {/* Card 2: Garantias */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-[#E6F8E8] flex items-center justify-center text-[#05CD99]">
              <ShieldCheck size={22} />
            </div>
          </div>
          <h3 className="text-sm font-bold text-[#A3AED0] mb-4">Detalle de Garantías</h3>
          <div className="space-y-3">
             <div className="flex justify-between items-center border-b border-[#F4F7FE] pb-2">
               <span className="text-[#1B254B] font-bold text-sm">FC (10%)</span>
               <span className="text-[#05CD99] font-bold text-sm">{formatCurrency(fcAsegurada)}</span>
             </div>
             <div className="flex justify-between items-center pt-1">
               <span className="text-[#1B254B] font-bold text-sm">AD (10%)</span>
               <span className="text-[#05CD99] font-bold text-sm">{formatCurrency(adAsegurada)}</span>
             </div>
          </div>
        </div>

        {/* Card 3: Licitacion */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative flex flex-col">
          <div className="w-12 h-12 rounded-full bg-[#FFF4F4] flex items-center justify-center text-[#EE5D50] mb-4">
            <FileText size={22} />
          </div>
          <h3 className="text-sm font-bold text-[#A3AED0] mb-4">Datos del SEACE</h3>
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center border-b border-[#F4F7FE] pb-2">
              <p className="text-[11px] font-bold text-[#A3AED0] uppercase">Nomenclatura</p>
              <p className="text-sm font-bold text-[#1B254B] bg-[#F4F7FE] px-2 py-0.5 rounded">{empresa.nomenclatura || '---'}</p>
            </div>
            <div className="flex gap-4 justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#A3AED0] uppercase mb-1">Inicio</p>
                <p className="text-sm text-[#1B254B] font-bold">{empresa.fecha_inicio_obra || '---'}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-[#A3AED0] uppercase mb-1">Final</p>
                <p className="text-sm text-[#1B254B] font-bold">{empresa.fecha_fin_obra || '---'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Consorcio */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col relative">
          <div className="w-12 h-12 rounded-full bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] mb-4">
            <Building2 size={22} />
          </div>
          <h3 className="text-sm font-bold text-[#A3AED0] mb-4">Estructura del Consorcio</h3>
          <div className="space-y-4 flex-1">
            <div className="border-b border-[#F4F7FE] pb-2">
              <p className="text-[11px] font-bold text-[#A3AED0] uppercase mb-1">Representante Legal</p>
              <p className="text-sm font-bold text-[#1B254B]">{empresa.representante || '---'}</p>
            </div>
            
            {consorciados.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-[#A3AED0] uppercase mb-2">Empresas Participantes</p>
                <ul className="space-y-2">
                  {consorciados.map(c => (
                    <li key={c.id} className="text-xs flex justify-between items-center bg-[#F4F7FE] px-3 py-2 rounded-[10px]">
                      <span className="text-[#1B254B] font-bold truncate pr-2">{c.nombre}</span>
                      <span className="font-bold text-[#4318FF] bg-white px-2 py-0.5 rounded shadow-sm">{c.porcentaje_participacion}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tablas de Análisis */}
      <div className="space-y-6">
        
        <div className="rounded-[20px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-[#E0E5F2] bg-white">
            <h2 className="text-xl font-bold text-[#1B254B]">Análisis: Fiel Cumplimiento</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <TableHeader />
              <tbody className="bg-white">
                {renderFianzaRows('Fiel Cumplimiento')}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[20px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-[#E0E5F2] bg-white">
            <h2 className="text-xl font-bold text-[#1B254B]">Análisis: Adelanto de Materiales</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <TableHeader />
              <tbody className="bg-white">
                {renderFianzaRows('Adelanto de Materiales')}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[20px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-[#E0E5F2] bg-white">
            <h2 className="text-xl font-bold text-[#1B254B]">Análisis: Adelanto Directo</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <TableHeader />
              <tbody className="bg-white">
                {renderFianzaRows('Adelanto Directo')}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen Facturas */}
        <div className="rounded-[20px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden mt-8">
          <div className="p-6 border-b border-[#E0E5F2] bg-white">
            <h2 className="text-xl font-bold text-[#1B254B]">Resumen Global de Facturas (Amortizaciones)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white border-b border-[#E0E5F2]">
                <tr>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">NÚMERO DE FACTURA</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">MONTO</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">AMORTIZA A</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">FECHA SALIDA</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">ESTADO</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">DOCUMENTOS</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {facturas.map((fac) => {
                  const isHighlighted = checkHighlight(null, fac.numero);
                  return (
                    <tr 
                      key={`fac-resumen-${fac.id}`} 
                      id={isHighlighted ? 'highlighted-row' : undefined}
                      className={`${isHighlighted ? 'bg-[#FEF3C7]' : 'hover:bg-[#F4F7FE]'} transition-colors border-b border-[#E0E5F2] last:border-0`}
                    >
                      <td className="px-5 py-4 text-sm font-bold text-[#05CD99]">{fac.numero}</td>
                      <td className="px-5 py-4 text-sm font-bold text-[#1B254B]">{formatCurrency(fac.monto)}</td>
                      <td className="px-5 py-4 text-xs font-medium text-[#A3AED0]">
                        {fac.tipo_fianza_relacionada ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-[#1B254B]">{fac.tipo_fianza_relacionada}</span>
                            <span>{fac.numero_fianza_relacionada}</span>
                          </div>
                        ) : '---'}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-[#A3AED0]">{fac.fecha_salida}</td>
                      <td className="px-5 py-4">
                        {fac.es_observada ? 
                          <span className="px-3 py-1 text-[11px] font-bold text-[#EE5D50] bg-[#FFF4F4] rounded-lg inline-block shadow-sm">OBSERVADA</span> : 
                          <span className="px-3 py-1 text-[11px] font-bold text-[#05CD99] bg-[#E6F8E8] rounded-lg inline-block shadow-sm">PAGADA</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {fac.pdf_path && fac.pdf_path !== "null" && fac.pdf_path !== "None" && fac.pdf_path.trim() !== "" && (
                          <button onClick={() => handleDownloadFactura(fac.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E6F8E8] text-[#05CD99] hover:bg-[#05CD99] hover:text-white text-[11px] font-bold transition-all shadow-sm">
                            <Eye size={14} /> FACTURA
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {facturas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#A3AED0] font-medium text-sm">
                      No hay facturas registradas en el sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Previsualización */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#1B254B]/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[20px] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#E0E5F2] bg-white">
              <h2 className="text-base font-bold text-[#1B254B]">Vista Previa del Documento</h2>
              <div className="flex items-center gap-3">
                <a href={downloadUrl || previewUrl} download className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-[#4318FF] bg-[#F4F7FE] hover:bg-[#4318FF] hover:text-white rounded-[12px] transition-colors shadow-sm">
                  <Download size={16} /> Descargar Original
                </a>
                <button onClick={() => {setShowPreviewModal(false); setPreviewUrl(null); setDownloadUrl(null);}} className="p-2 text-[#A3AED0] hover:text-[#1B254B] bg-[#F4F7FE] hover:bg-[#E0E5F2] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-[#F4F7FE] p-4">
              <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-0 rounded-xl bg-white shadow-sm" title="Vista Previa" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
