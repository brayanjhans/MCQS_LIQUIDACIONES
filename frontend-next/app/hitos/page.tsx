"use client";
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';

interface Obra {
  id: number;
  empresa: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface Fianza {
  id: number;
  empresa_id: number;
  empresa_nombre: string;
  tipo: string;
  numero: string;
  fecha_inicio: string | null;
  fecha_vencimiento: string;
  monto: number;
}

export default function HitosPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [fianzas, setFianzas] = useState<Fianza[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'timeline'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/hitos`)
      .then(res => res.json())
      .then(data => {
        setObras(data.obras || []);
        setFianzas(data.fianzas || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // --- Estadísticas y Alertas ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysDiff = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diffTime = d.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const vencimientos7dias = fianzas.filter(f => {
    const diff = getDaysDiff(f.fecha_vencimiento);
    return diff >= 0 && diff <= 7;
  }).length;

  const vencimientos30dias = fianzas.filter(f => {
    const diff = getDaysDiff(f.fecha_vencimiento);
    return diff > 7 && diff <= 30;
  }).length;

  const vencidas = fianzas.filter(f => getDaysDiff(f.fecha_vencimiento) < 0).length;

  // --- Lógica del Calendario Mensual ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayIndex = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const renderCalendar = () => {
    // Si firstDayIndex es 0 (Domingo), en Lunes como primer día son 6 espacios. Si no, firstDayIndex - 1.
    const blanksCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const blanks = Array.from({ length: blanksCount }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#1E293B] capitalize">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#64748B] transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#64748B] font-medium text-sm transition-colors">Hoy</button>
            <button onClick={nextMonth} className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#64748B] transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-4">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(day => (
            <div key={day} className="text-center text-sm font-bold text-[#64748B] uppercase tracking-wider">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {blanks.map(b => (
            <div key={`blank-${b}`} className="min-h-[120px] rounded-2xl bg-[#F8FAFC]/50 border border-transparent"></div>
          ))}
          {days.map(d => {
            const currentCellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
            currentCellDate.setHours(0,0,0,0);
            
            const isToday = currentCellDate.getTime() === today.getTime();
            
            // Buscar fianzas que vencen este día
            const dayFianzas = fianzas.filter(f => {
               const parts = f.fecha_vencimiento.split('-');
               const v = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
               v.setHours(0,0,0,0);
               return v.getTime() === currentCellDate.getTime();
            });

            return (
              <div key={d} className={`min-h-[120px] p-3 rounded-2xl border transition-all hover:shadow-md flex flex-col ${isToday ? 'border-[#3C50E0] bg-[#F0F5FF]' : 'border-[#E2E8F0] bg-white'}`}>
                <div className={`text-right text-sm font-bold mb-2 ${isToday ? 'text-[#3C50E0]' : 'text-[#64748B]'}`}>{d}</div>
                <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
                  {dayFianzas.map(f => {
                    const isVencida = getDaysDiff(f.fecha_vencimiento) < 0;
                    return (
                      <div key={f.id} className={`px-2 py-1.5 rounded-lg border text-xs ${isVencida ? 'bg-[#FFF4F4] border-[#FEE2E2]' : 'bg-[#F0F5FF] border-[#E0E7FF]'}`}>
                        <span className={`font-bold block truncate ${isVencida ? 'text-[#EE5D50]' : 'text-[#3C50E0]'}`}>{f.tipo}</span>
                        <span className="text-[#64748B] truncate block" title={f.empresa_nombre}>{f.empresa_nombre}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Lógica de la Línea de Tiempo (Gantt) ---
  const renderTimeline = () => {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0]">
        <h2 className="text-xl font-bold text-[#1E293B] mb-6">Línea de Tiempo de Obras</h2>
        <div className="flex flex-col gap-6">
          {obras.length === 0 && <p className="text-[#64748B]">No hay obras con fechas definidas.</p>}
          {obras.map(obra => {
            const partsStart = obra.fecha_inicio.split('-');
            const partsEnd = obra.fecha_fin.split('-');
            const start = new Date(Number(partsStart[0]), Number(partsStart[1])-1, Number(partsStart[2])).getTime();
            const end = new Date(Number(partsEnd[0]), Number(partsEnd[1])-1, Number(partsEnd[2])).getTime();
            const current = today.getTime();
            
            const totalDuration = end - start;
            let progress = 0;
            if (current > end) progress = 100;
            else if (current > start) progress = ((current - start) / totalDuration) * 100;

            const isFinished = progress === 100;

            return (
              <div key={obra.id} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="font-bold text-[#1E293B] text-sm">{obra.empresa}</h3>
                    <p className="text-xs text-[#64748B]">{obra.fecha_inicio} al {obra.fecha_fin}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isFinished ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F0F5FF] text-[#3C50E0]'}`}>
                    {Math.round(progress)}% completado
                  </span>
                </div>
                <div className="h-3 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isFinished ? 'bg-[#10B981]' : 'bg-[#3C50E0]'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex flex-col">
      <main className="p-4 md:p-8 pt-6 w-full flex-1">
        {/* Tarjetas de Alerta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#FFF4F4] flex items-center justify-center text-[#EE5D50]">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#64748B]">Vencen en 7 días</p>
              <h3 className="text-2xl font-bold text-[#1E293B]">{vencimientos7dias} Fianzas</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#FFFBEB] flex items-center justify-center text-[#F59E0B]">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#64748B]">Vencen en 30 días</p>
              <h3 className="text-2xl font-bold text-[#1E293B]">{vencimientos30dias} Fianzas</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#64748B]">Fianzas Vencidas</p>
              <h3 className="text-2xl font-bold text-[#1E293B]">{vencidas}</h3>
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'calendar' ? 'bg-[#3C50E0] text-white shadow-lg shadow-[#3C50E0]/30' : 'bg-white text-[#64748B] hover:bg-gray-50 border border-[#E2E8F0]'}`}
          >
            <CalendarIcon size={20} />
            Vista Mensual
          </button>
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'timeline' ? 'bg-[#3C50E0] text-white shadow-lg shadow-[#3C50E0]/30' : 'bg-white text-[#64748B] hover:bg-gray-50 border border-[#E2E8F0]'}`}
          >
            <BarChart2 size={20} />
            Línea de Tiempo
          </button>
        </div>

        {/* Contenido Principal */}
        {loading ? (
          <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-[#3C50E0] border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          activeTab === 'calendar' ? renderCalendar() : renderTimeline()
        )}

      </main>
    </div>
  );
}
