"use client";
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Wallet, PiggyBank, AlertTriangle, TrendingUp, Landmark, ShieldAlert
} from 'lucide-react';

const COLORS = ['#3C50E0', '#10B981', '#F59E0B', '#EF4444'];

// Mock Data para Gráficos
const vencimientosData = [
  { name: 'Jul', monto: 1200000 },
  { name: 'Ago', monto: 800000 },
  { name: 'Sep', monto: 2500000 },
  { name: 'Oct', monto: 1500000 },
  { name: 'Nov', monto: 400000 },
  { name: 'Dic', monto: 3200000 },
];

const tiposData = [
  { name: 'Fiel Cumplimiento', value: 45 },
  { name: 'Adelanto Directo', value: 35 },
  { name: 'Adelanto de Materiales', value: 20 },
];

const bancosData = [
  { name: 'BCP', ocupado: 85, total: 100 },
  { name: 'BBVA', ocupado: 40, total: 100 },
  { name: 'Interbank', ocupado: 60, total: 100 },
];

export default function FinanzasPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [tasaRenovacion, setTasaRenovacion] = useState<number>(1.5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finanzas/kpis`)
      .then(res => res.json())
      .then(data => {
        setKpis(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando KPIs", err);
        setLoading(false);
      });
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  if (loading) {
    return <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3C50E0]"></div></div>;
  }

  return (
    <div className="p-6 md:p-8 xl:p-10 bg-[#FAFAFA] min-h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C2434] mb-2">Dashboard Financiero</h1>
        <p className="text-sm text-[#64748B]">Centro de control de liquidez, fianzas y riesgo operativo.</p>
      </div>

      {/* ZONA 1: KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#E2E8F0] hover:shadow-[0_4px_24px_rgba(60,80,224,0.1)] transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[#8A99AF] uppercase tracking-wider mb-1">Fianzas Vigentes</p>
              <h3 className="text-2xl font-bold text-[#1C2434]">{kpis ? formatMoney(kpis.total_fianzas_vigentes) : 'S/ 0.00'}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#3C50E0]/10 flex items-center justify-center text-[#3C50E0]">
              <Wallet size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#10B981] font-bold flex items-center"><TrendingUp size={14} className="mr-1" /> Riesgo Controlado</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#E2E8F0] hover:shadow-[0_4px_24px_rgba(60,80,224,0.1)] transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[#8A99AF] uppercase tracking-wider mb-1">Total Amortizado</p>
              <h3 className="text-2xl font-bold text-[#1C2434]">{kpis ? formatMoney(kpis.total_amortizado) : 'S/ 0.00'}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
              <PiggyBank size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748B]">Liquidez liberada al momento</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#E2E8F0] hover:shadow-[0_4px_24px_rgba(245,158,11,0.15)] transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[#8A99AF] uppercase tracking-wider mb-1">Riesgo a 30 Días</p>
              <h3 className="text-2xl font-bold text-[#1C2434]">{kpis ? kpis.fianzas_en_riesgo : 0} <span className="text-sm font-medium text-gray-400">fianzas</span></h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#F59E0B] font-bold">Requieren renovación urgente</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#E2E8F0] hover:shadow-[0_4px_24px_rgba(60,80,224,0.1)] transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[#8A99AF] uppercase tracking-wider mb-1">Presupuesto Global</p>
              <h3 className="text-2xl font-bold text-[#1C2434]">{kpis ? formatMoney(kpis.valor_total_obras) : 'S/ 0.00'}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#8A99AF]/10 flex items-center justify-center text-[#8A99AF]">
              <Landmark size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748B]">Valor total de obras registradas</span>
          </div>
        </div>
      </div>

      {/* ZONA 2: Gráficos de Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Gráfico de Barras: Vencimientos */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#E2E8F0]">
          <h3 className="text-lg font-bold text-[#1C2434] mb-6">Proyección de Vencimientos (Próx. 6 meses)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vencimientosData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `S/${val/1000000}M`} />
                <RechartsTooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(value) => [formatMoney(value as number), 'Monto a vencer']}
                />
                <Bar dataKey="monto" fill="#3C50E0" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Dona: Composición */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#E2E8F0]">
          <h3 className="text-lg font-bold text-[#1C2434] mb-2">Composición de Fianzas</h3>
          <p className="text-xs text-[#64748B] mb-6">Distribución por tipo de riesgo</p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tiposData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tiposData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(value) => [`${value}%`, 'Porcentaje']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {tiposData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                  <span className="text-[#64748B]">{item.name}</span>
                </div>
                <span className="font-bold text-[#1C2434]">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ZONA 3: Módulos Operativos (Mockup de Alto Nivel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Simulador de Costos */}
        <div className="bg-gradient-to-br from-[#1C2434] to-[#2C3A53] rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2"><Wallet size={20} className="text-[#10B981]" /> Simulador de Renovación</h3>
          </div>
          <p className="text-xs text-gray-300 mb-4">Calcula el costo proyectado de renovar las fianzas en riesgo este mes.</p>
          
          <div className="bg-white/10 rounded-xl p-4 mb-4 backdrop-blur-sm border border-white/10">
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Tasa Bancaria Estimada (%)</label>
            <input 
              type="number" 
              step="0.1" 
              value={tasaRenovacion}
              onChange={(e) => setTasaRenovacion(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent border-b-2 border-white/20 pb-2 text-2xl font-bold text-white focus:outline-none focus:border-[#10B981] transition-colors"
            />
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-400 mb-1">Costo Proyectado</p>
              <h4 className="text-2xl font-bold text-[#10B981]">{formatMoney((1200000 * (tasaRenovacion / 100)))}</h4>
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors border border-white/20">
              Ver Detalle
            </button>
          </div>
        </div>

        {/* Líneas de Crédito Bancario */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#E2E8F0]">
          <h3 className="text-lg font-bold text-[#1C2434] mb-2 flex items-center gap-2">
            <Landmark size={20} className="text-[#3C50E0]" /> Líneas de Crédito
          </h3>
          <p className="text-xs text-[#64748B] mb-6">Saturación por entidad bancaria</p>
          
          <div className="space-y-5">
            {bancosData.map((banco, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span className="text-[#1C2434]">{banco.name}</span>
                  <span className={banco.ocupado > 80 ? 'text-[#EF4444]' : 'text-[#64748B]'}>{banco.ocupado}% Consumido</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${banco.ocupado > 80 ? 'bg-[#EF4444]' : 'bg-[#3C50E0]'}`} 
                    style={{ width: `${banco.ocupado}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-[#3C50E0] font-semibold hover:bg-[#3C50E0]/5 rounded-lg transition-colors border border-transparent hover:border-[#3C50E0]/20">
            Gestionar Bancos
          </button>
        </div>

        {/* Alertas de Obras (Curva S Mockup) */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#E2E8F0]">
          <h3 className="text-lg font-bold text-[#1C2434] mb-2 flex items-center gap-2">
            <ShieldAlert size={20} className="text-[#EF4444]" /> Alertas de Cumplimiento
          </h3>
          <p className="text-xs text-[#64748B] mb-6">Desbalance Físico vs Financiero</p>
          
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 mb-3">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-bold text-[#991B1B]">CONSORCIO HUANUCO</span>
              <span className="bg-[#EF4444] text-white text-[10px] px-2 py-0.5 rounded font-bold">ALERTA ALTA</span>
            </div>
            <p className="text-xs text-[#7F1D1D] mb-2">Avance financiero (75%) supera ampliamente el avance físico reportado (40%).</p>
          </div>

          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-bold text-[#92400E]">CONSORCIO RIO GRANDE</span>
              <span className="bg-[#F59E0B] text-white text-[10px] px-2 py-0.5 rounded font-bold">ALERTA MEDIA</span>
            </div>
            <p className="text-xs text-[#92400E]">Fianza de Adelanto Directo próxima a vencer sin amortización registrada este mes.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
