"use client";
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, Plus, Briefcase, TrendingUp, AlertTriangle, ShieldCheck,
  ChevronRight, Trash2, Edit3, FolderOpen, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newNombre, setNewNombre] = useState('');

  // Modal de Eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [fianzasVencer, setFianzasVencer] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);

  const loadFianzasVencer = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/fianzas/vencimientos/proximos`)
      .then(res => res.json())
      .then(data => setFianzasVencer(data))
      .catch(err => console.error(err));
  };

  const loadEmpresas = (term: string = '') => {
    setIsLoading(true);
    const url = term ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/empresas/?q=${encodeURIComponent(term)}` : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/empresas/`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setEmpresas(data);
        setTimeout(() => setIsLoading(false), 200);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadEmpresas(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    loadFianzasVencer();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/empresas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newNombre })
      });
      if (res.ok) {
        setNewNombre('');
        setShowModal(false);
        loadEmpresas(searchTerm);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEmpresa = (id: number) => {
    setDeleteTargetId(id);
    setDeletePin('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deletePin !== "0077") {
      setDeleteError("PIN incorrecto.");
      return;
    }
    if (!deleteTargetId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/empresas/${deleteTargetId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setShowDeleteModal(false);
        loadEmpresas(searchTerm);
      } else {
        setDeleteError("Error al eliminar la empresa.");
      }
    } catch (e) {
      console.error(e);
      setDeleteError("Error de conexión.");
    }
  };

  // KPIs
  const totalCapital = useMemo(() => empresas.reduce((acc, curr) => acc + (parseFloat(curr.monto_obra) || 0), 0), [empresas]);
  const activeConsorcios = empresas.length;

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-6 lg:p-10 font-sans text-[#1B254B]">
      
      {/* ---------------- CABECERA ---------------- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#E0E5F2] flex items-center justify-center text-[#4318FF]">
            <Briefcase size={24} />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-[#1B254B] leading-tight">Consorcios y Obras</h1>
            <p className="text-[#A3AED0] text-sm font-medium">Gestión Financiera Avanzada y Monitoreo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3AED0]" size={18} />
            <input
              type="text"
              placeholder="Buscar consorcio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-transparent rounded-[20px] py-3 pl-12 pr-4 outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] text-sm text-[#1B254B] shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all font-medium"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-2 bg-[#4318FF] hover:bg-[#3311DB] text-white px-5 py-3 rounded-[20px] text-sm font-bold transition-all shadow-[0_4px_24px_rgba(67,24,255,0.25)] shrink-0"
          >
            <Plus size={18} /> Nuevo Consorcio
          </button>
        </div>
      </header>

      {/* ---------------- ALERTA DE FIANZAS (CAROUSEL) ---------------- */}
      {fianzasVencer.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-[#FEF0C7] text-[#D97706] flex items-center justify-center shadow-sm">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-[#1B254B] text-2xl font-bold">Fianzas Próximas a Vencer</h2>
          </div>
          
          <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-4 snap-x">
            {fianzasVencer.map((f, idx) => (
              <div key={`venc-${f.id}-${idx}`} className="min-w-[340px] bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border-l-[4px] border-[#F59E0B] snap-start flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-5">
                  <span className="bg-[#FEF3C7] text-[#D97706] text-xs font-bold px-3 py-1 rounded-full">Expira pronto</span>
                  <span className="text-[#EF4444] font-bold text-sm tracking-wide">{f.fecha_vencimiento}</span>
                </div>
                
                <h4 className="font-bold text-[#1B254B] text-base leading-tight mb-1 truncate" title={f.empresa_nombre}>{f.empresa_nombre}</h4>
                <p className="text-[#A3AED0] text-sm font-medium mb-5">Fiel Cumplimiento</p>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-[#A3AED0] text-[11px] font-bold tracking-wider uppercase mb-1">N° FIANZA</p>
                    <p className="text-[#4318FF] text-[15px] font-bold tracking-wide">{f.numero}</p>
                  </div>
                  <div>
                    <p className="text-[#A3AED0] text-[11px] font-bold tracking-wider uppercase mb-1">MONTO</p>
                    <p className="text-[#1B254B] text-xl font-bold">S/ {parseFloat(f.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <Link href={`/liquidaciones/${f.empresa_id}?hl=${encodeURIComponent(f.numero)}`} className="w-full mt-auto bg-white border border-[#E0E5F2] hover:bg-[#F4F7FE] text-[#1B254B] text-center py-3 rounded-[12px] text-sm font-bold transition-colors">
                  Ver Detalles Completos
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- KPI CARDS ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        
        {/* KPI 1: Consorcios Registrados */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative">
          <div className="absolute top-6 right-6 bg-[#E9EDF7] text-[#4318FF] text-xs font-bold px-2 py-1 rounded-md">
            Total
          </div>
          <div className="w-12 h-12 rounded-full bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] mb-4">
            <Briefcase size={22} />
          </div>
          <p className="text-[#A3AED0] text-sm font-medium mb-1">Consorcios Registrados</p>
          <h3 className="text-[#1B254B] text-3xl font-bold">{activeConsorcios}</h3>
        </div>

        {/* KPI 2: Capital Controlado */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative">
          <div className="absolute top-6 right-6 bg-[#E6F8E8] text-[#05CD99] text-xs font-bold px-2 py-1 rounded-md">
            +Activo
          </div>
          <div className="w-12 h-12 rounded-full bg-[#F4F7FE] flex items-center justify-center text-[#7000FF] mb-4">
            <TrendingUp size={22} />
          </div>
          <p className="text-[#A3AED0] text-sm font-medium mb-1">Capital Controlado</p>
          <h3 className="text-[#1B254B] text-3xl font-bold">
            S/ {(totalCapital / 1000000).toFixed(1)}M
          </h3>
        </div>

        {/* KPI 3: Fianzas por Vencer */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative">
          <div className="absolute top-6 right-6 bg-[#FFF4F4] text-[#EE5D50] text-xs font-bold px-2 py-1 rounded-md">
            Atención
          </div>
          <div className="w-12 h-12 rounded-full bg-[#FFF4F4] flex items-center justify-center text-[#EE5D50] mb-4">
            <AlertTriangle size={22} />
          </div>
          <p className="text-[#A3AED0] text-sm font-medium mb-1">Riesgo (Fianzas Vencer)</p>
          <h3 className="text-[#1B254B] text-3xl font-bold">{fianzasVencer.length}</h3>
        </div>

        {/* KPI 4: Estado General */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative">
          <div className="absolute top-6 right-6 bg-[#F4F7FE] text-[#1B254B] text-xs font-bold px-2 py-1 rounded-md">
            100%
          </div>
          <div className="w-12 h-12 rounded-full bg-[#E6F8E8] flex items-center justify-center text-[#05CD99] mb-4">
            <ShieldCheck size={22} />
          </div>
          <p className="text-[#A3AED0] text-sm font-medium mb-1">Estado del Sistema</p>
          <h3 className="text-[#1B254B] text-3xl font-bold">Óptimo</h3>
        </div>

      </div>

      {/* ---------------- GRILLA DE DATOS (CONSORCIOS) ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`skel-${i}`} className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] min-h-[220px] flex flex-col justify-between">
              <div className="h-6 w-2/3 bg-[#F4F7FE] rounded animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 w-1/3 bg-[#F4F7FE] rounded animate-pulse"></div>
                <div className="h-10 w-full bg-[#F4F7FE] rounded-[10px] animate-pulse"></div>
              </div>
            </div>
          ))
        ) : empresas.length === 0 ? (
          <div className="col-span-full bg-white rounded-[20px] p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <p className="text-[#A3AED0] font-medium">No se encontraron consorcios.</p>
          </div>
        ) : (
          <AnimatePresence>
            {empresas.map((empresa, index) => (
              <motion.div 
                key={empresa.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all group relative flex flex-col min-h-[240px]"
              >
                
                {/* Cabecera Tarjeta */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-[#1B254B] leading-tight pr-12 line-clamp-2">
                    {empresa.nombre}
                  </h3>
                  
                  {/* Menú Flotante Hover */}
                  <div className="absolute top-5 right-5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
                    <Link href={`/liquidaciones/${empresa.id}/editar`} className="p-2 text-[#A3AED0] hover:text-[#4318FF] bg-[#F4F7FE] rounded-lg transition-colors" title="Editar">
                      <Edit3 size={16} />
                    </Link>
                    <button onClick={() => handleDeleteEmpresa(empresa.id)} className="p-2 text-[#A3AED0] hover:text-[#EE5D50] bg-[#FFF4F4] rounded-lg transition-colors" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Info Textual */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center border-b border-[#F4F7FE] pb-2">
                    <span className="text-[#A3AED0] text-sm font-medium">Entidad</span>
                    <span className="text-[#1B254B] text-sm font-bold truncate max-w-[60%]">{empresa.entidad || 'No definida'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#F4F7FE] pb-2">
                    <span className="text-[#A3AED0] text-sm font-medium">Proceso</span>
                    <span className="text-[#1B254B] text-sm font-bold truncate max-w-[60%] bg-[#F4F7FE] px-2 py-0.5 rounded">{empresa.nomenclatura || 'Sin código'}</span>
                  </div>
                </div>

                {/* Monto y Acciones al final */}
                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <p className="text-[#A3AED0] text-xs font-medium mb-1">Monto de Obra</p>
                    <p className="text-[#1B254B] text-[22px] font-bold">
                      S/ {empresa.monto_obra ? parseFloat(empresa.monto_obra).toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '0.00'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/liquidaciones/${empresa.id}/archivos`} className="w-10 h-10 rounded-[10px] bg-[#F4F7FE] text-[#4318FF] flex items-center justify-center hover:bg-[#E0E5F2] transition-colors" title="Ver Archivos">
                      <FolderOpen size={18} />
                    </Link>
                    <Link href={`/liquidaciones/${empresa.id}`} className="w-10 h-10 rounded-[10px] bg-[#4318FF] text-white flex items-center justify-center hover:bg-[#3311DB] transition-colors shadow-sm" title="Detalles Completos">
                      <ChevronRight size={20} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* ---------------- MODALES ---------------- */}
      
      {/* Modal Nuevo */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B254B]/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[20px] shadow-2xl w-full max-w-md p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-[#1B254B]">Nuevo Consorcio</h3>
                <button onClick={() => setShowModal(false)} className="text-[#A3AED0] hover:text-[#1B254B]"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#1B254B] mb-2">Razón Social</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ej. Consorcio San Pedro..."
                    value={newNombre}
                    onChange={e => setNewNombre(e.target.value)}
                    className="w-full rounded-[15px] border border-[#E0E5F2] bg-white px-5 py-3.5 text-[#1B254B] outline-none transition-colors focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] font-medium"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-[15px] bg-[#F4F7FE] py-3.5 text-sm font-bold text-[#1B254B] hover:bg-[#E0E5F2] transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 rounded-[15px] bg-[#4318FF] py-3.5 text-sm font-bold text-white hover:bg-[#3311DB] shadow-[0_4px_24px_rgba(67,24,255,0.25)] transition-colors">
                    Crear Registro
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Eliminar */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B254B]/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[20px] shadow-2xl w-full max-w-sm p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#FFF4F4] text-[#EE5D50] flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} />
              </div>
              <h3 className="font-bold text-xl text-[#1B254B] mb-2">Eliminar Definitivamente</h3>
              <p className="text-sm text-[#A3AED0] mb-6 font-medium">Esta acción borrará la obra y sus archivos. Ingresa tu PIN.</p>
              
              <input 
                type="password" 
                placeholder="PIN" 
                className={`w-full text-center rounded-[15px] border ${deleteError ? 'border-[#EE5D50] focus:ring-[#EE5D50]' : 'border-[#E0E5F2] focus:border-[#4318FF] focus:ring-[#4318FF]'} px-5 py-3 text-lg tracking-[0.4em] outline-none mb-2 font-bold text-[#1B254B] transition-colors`}
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
              <div className="h-6">
                {deleteError && <p className="text-xs text-[#EE5D50] font-bold">{deleteError}</p>}
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 rounded-[15px] bg-[#F4F7FE] py-3.5 text-sm font-bold text-[#1B254B] hover:bg-[#E0E5F2] transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmDelete} className="flex-1 rounded-[15px] bg-[#EE5D50] py-3.5 text-sm font-bold text-white hover:bg-[#D54336] transition-colors shadow-[0_4px_24px_rgba(238,93,80,0.25)]">
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
