"use client";
import React, { useState, useEffect } from 'react';
import { Users, FileText, Shield, AlertTriangle, Search, Plus, Calendar, Save, CheckCircle } from 'lucide-react';

interface Trabajador {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  categoria: string;
  estado: string;
  fecha_ingreso: string;
  empresa_nombre: string;
  alertas: {
    sctr_salud_vencimiento: string | null;
    sctr_pension_vencimiento: string | null;
    emo_vencimiento: string | null;
    contrato_vencimiento: string | null;
  }
}

export default function ManoObraPage() {
  const [activeTab, setActiveTab] = useState<'personal' | 'tareo' | 'epps'>('personal');
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tareo state
  const [tareoDate, setTareoDate] = useState(new Date().toISOString().split('T')[0]);
  const [tareoData, setTareoData] = useState<any[]>([]);
  const [tareoLoading, setTareoLoading] = useState(false);

  useEffect(() => {
    fetchTrabajadores();
  }, []);

  const fetchTrabajadores = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trabajadores`)
      .then(res => res.json())
      .then(data => {
        setTrabajadores(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'tareo') {
      fetchTareo();
    }
  }, [activeTab, tareoDate]);

  const fetchTareo = () => {
    setTareoLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/tareo?fecha=${tareoDate}`)
      .then(res => res.json())
      .then(data => {
        setTareoData(data);
        setTareoLoading(false);
      });
  };

  const handleTareoChange = (workerId: number, field: string, value: any) => {
    setTareoData(prev => prev.map(t => {
      if (t.trabajador_id === workerId) {
        return {
          ...t,
          asistencia: {
            ...t.asistencia,
            [field]: value
          }
        };
      }
      return t;
    }));
  };

  const saveTareo = () => {
    const payload = tareoData.map(t => ({
      trabajador_id: t.trabajador_id,
      fecha: tareoDate,
      horas_normales: t.asistencia?.horas_normales || 0,
      horas_extras_25: t.asistencia?.horas_extras_25 || 0,
      horas_extras_35: t.asistencia?.horas_extras_35 || 0,
      horas_extras_100: t.asistencia?.horas_extras_100 || 0,
      estado: t.asistencia?.estado || 'Asistió'
    }));
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/tareo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => {
      if (res.ok) alert("Tareo guardado exitosamente");
    });
  };

  const isExpiring = (dateStr: string | null) => {
    if (!dateStr) return false;
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days <= 15;
  };

  const renderPersonal = () => {
    const filtered = trabajadores.filter(t => 
      t.nombres.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.dni.includes(searchTerm)
    );

    return (
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0] overflow-hidden flex flex-col h-[70vh]">
        <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-gray-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar DNI o Apellidos..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#3C50E0] focus:ring-1 focus:ring-[#3C50E0] outline-none text-sm transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-[#3C50E0] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={18} />
            Nuevo Trabajador
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F8FAFC] sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Trabajador</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Obra</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">SCTR Salud</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">SCTR Pensión</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">EMO</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#1E293B] group-hover:text-[#3C50E0] transition-colors">{t.apellidos}, {t.nombres}</p>
                    <p className="text-xs text-[#64748B]">DNI: {t.dni}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">{t.categoria}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{t.empresa_nombre || '-'}</td>
                  
                  {/* SCTR Salud */}
                  <td className="px-6 py-4">
                    {t.alertas.sctr_salud_vencimiento ? (
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg w-max ${isExpiring(t.alertas.sctr_salud_vencimiento) ? 'bg-[#FFF4F4] text-[#EE5D50]' : 'bg-[#ECFDF5] text-[#10B981]'}`}>
                        {isExpiring(t.alertas.sctr_salud_vencimiento) ? <AlertTriangle size={14}/> : <CheckCircle size={14}/>}
                        {t.alertas.sctr_salud_vencimiento}
                      </span>
                    ) : <span className="text-gray-400 text-xs">Sin registrar</span>}
                  </td>
                  
                  {/* SCTR Pension */}
                  <td className="px-6 py-4">
                    {t.alertas.sctr_pension_vencimiento ? (
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg w-max ${isExpiring(t.alertas.sctr_pension_vencimiento) ? 'bg-[#FFF4F4] text-[#EE5D50]' : 'bg-[#ECFDF5] text-[#10B981]'}`}>
                        {isExpiring(t.alertas.sctr_pension_vencimiento) ? <AlertTriangle size={14}/> : <CheckCircle size={14}/>}
                        {t.alertas.sctr_pension_vencimiento}
                      </span>
                    ) : <span className="text-gray-400 text-xs">Sin registrar</span>}
                  </td>
                  
                  {/* EMO */}
                  <td className="px-6 py-4">
                    {t.alertas.emo_vencimiento ? (
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg w-max ${isExpiring(t.alertas.emo_vencimiento) ? 'bg-[#FFF4F4] text-[#EE5D50]' : 'bg-[#ECFDF5] text-[#10B981]'}`}>
                        {isExpiring(t.alertas.emo_vencimiento) ? <AlertTriangle size={14}/> : <CheckCircle size={14}/>}
                        {t.alertas.emo_vencimiento}
                      </span>
                    ) : <span className="text-gray-400 text-xs">Sin registrar</span>}
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.estado === 'Activo' ? 'bg-[#F0F5FF] text-[#3C50E0]' : 'bg-gray-100 text-gray-500'}`}>
                      {t.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">No se encontraron trabajadores</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTareo = () => {
    return (
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0] overflow-hidden flex flex-col h-[70vh]">
        <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200">
              <Calendar size={18} className="text-[#3C50E0]" />
              <input 
                type="date" 
                value={tareoDate} 
                onChange={e => setTareoDate(e.target.value)}
                className="outline-none text-sm font-medium text-gray-700"
              />
            </div>
            <span className="text-sm text-gray-500 font-medium">Tareo Diario</span>
          </div>
          <button onClick={saveTareo} className="flex items-center gap-2 bg-[#10B981] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-sm">
            <Save size={18} />
            Guardar Tareo
          </button>
        </div>

        <div className="flex-1 overflow-auto p-0">
          {tareoLoading ? (
            <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-[#3C50E0] border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F8FAFC] sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Trabajador</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider w-40">Estado</th>
                  <th className="px-4 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider text-center">Horas Norm.</th>
                  <th className="px-4 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider text-center">Extras 25%</th>
                  <th className="px-4 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider text-center">Extras 35%</th>
                  <th className="px-4 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider text-center">Extras 100%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {tareoData.map(t => (
                  <tr key={t.trabajador_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="font-bold text-[#1E293B] text-sm">{t.apellidos}, {t.nombres}</p>
                      <p className="text-xs text-[#64748B]">{t.cargo || 'Sin cargo'} - {t.dni}</p>
                    </td>
                    <td className="px-6 py-3">
                      <select 
                        value={t.asistencia?.estado || 'Asistió'}
                        onChange={e => handleTareoChange(t.trabajador_id, 'estado', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#3C50E0]"
                      >
                        <option value="Asistió">Asistió</option>
                        <option value="Faltó">Faltó</option>
                        <option value="Permiso">Permiso</option>
                        <option value="Descanso">Descanso Med.</option>
                        <option value="Feriado">Feriado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" 
                        min="0" max="24" step="0.5"
                        value={t.asistencia?.horas_normales || ''}
                        onChange={e => handleTareoChange(t.trabajador_id, 'horas_normales', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1.5 text-center text-sm rounded-lg border border-gray-200 outline-none focus:border-[#3C50E0] mx-auto"
                        placeholder="8"
                        disabled={t.asistencia?.estado && t.asistencia.estado !== 'Asistió'}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" min="0" step="0.5"
                        value={t.asistencia?.horas_extras_25 || ''}
                        onChange={e => handleTareoChange(t.trabajador_id, 'horas_extras_25', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1.5 text-center text-sm rounded-lg border border-gray-200 outline-none focus:border-[#3C50E0] mx-auto"
                        disabled={t.asistencia?.estado && t.asistencia.estado !== 'Asistió'}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" min="0" step="0.5"
                        value={t.asistencia?.horas_extras_35 || ''}
                        onChange={e => handleTareoChange(t.trabajador_id, 'horas_extras_35', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1.5 text-center text-sm rounded-lg border border-gray-200 outline-none focus:border-[#3C50E0] mx-auto"
                        disabled={t.asistencia?.estado && t.asistencia.estado !== 'Asistió'}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" min="0" step="0.5"
                        value={t.asistencia?.horas_extras_100 || ''}
                        onChange={e => handleTareoChange(t.trabajador_id, 'horas_extras_100', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1.5 text-center text-sm rounded-lg border border-gray-200 outline-none focus:border-[#3C50E0] mx-auto"
                        disabled={t.asistencia?.estado && t.asistencia.estado !== 'Asistió'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderEpps = () => (
    <div className="bg-white p-12 rounded-3xl shadow-sm border border-[#E2E8F0] text-center">
      <Shield size={48} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-xl font-bold text-gray-700 mb-2">Control de EPPs</h3>
      <p className="text-gray-500 max-w-md mx-auto">Selecciona un trabajador desde el "Padrón de Personal" para registrar la entrega de equipos de protección y generar su sustento.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex flex-col">
      <main className="p-4 md:p-8 pt-6 w-full flex-1">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-8">Centro de Control Laboral</h1>
        
        {/* Pestañas */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'personal' ? 'bg-[#3C50E0] text-white shadow-lg shadow-[#3C50E0]/30' : 'bg-white text-[#64748B] hover:bg-gray-50 border border-[#E2E8F0]'}`}
          >
            <Users size={20} />
            Padrón & Documentos
          </button>
          <button 
            onClick={() => setActiveTab('tareo')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'tareo' ? 'bg-[#3C50E0] text-white shadow-lg shadow-[#3C50E0]/30' : 'bg-white text-[#64748B] hover:bg-gray-50 border border-[#E2E8F0]'}`}
          >
            <FileText size={20} />
            Tareo de Horas
          </button>
          <button 
            onClick={() => setActiveTab('epps')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'epps' ? 'bg-[#3C50E0] text-white shadow-lg shadow-[#3C50E0]/30' : 'bg-white text-[#64748B] hover:bg-gray-50 border border-[#E2E8F0]'}`}
          >
            <Shield size={20} />
            EPPs
          </button>
        </div>

        {/* Contenido Principal */}
        {loading && activeTab === 'personal' ? (
          <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-[#3C50E0] border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <>
            {activeTab === 'personal' && renderPersonal()}
            {activeTab === 'tareo' && renderTareo()}
            {activeTab === 'epps' && renderEpps()}
          </>
        )}
      </main>
    </div>
  );
}
