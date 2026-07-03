"use client";
import React, { useEffect, useState, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Users, Package, ArrowUpRight, ArrowDownRight, MoreVertical, Calendar, Download, Monitor, MessageSquare, Play, Pause, Search, Maximize2, Minimize2, Cpu, Settings, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export default function Dashboard() {
  const [empresasCount, setEmpresasCount] = useState(0);
  const [fianzasCount, setFianzasCount] = useState(0);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiChat, setAiChat] = useState<{sender: 'ai'|'user', text: string}[]>([
    { sender: 'ai', text: 'Hola, soy MCQS AI. ¿Qué datos financieros necesitas analizar hoy?' }
  ]);

  const [timeValue, setTimeValue] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // MOCK DATA GENERATORS based on timeValue (Time Scrubber)
  const dynamicSales = (base: number) => Math.max(10, Math.floor(base * (timeValue / 100)));
  const barData = [
    { name: 'Ene', sales: dynamicSales(150) },
    { name: 'Feb', sales: dynamicSales(380) },
    { name: 'Mar', sales: dynamicSales(200) },
    { name: 'Abr', sales: dynamicSales(290) },
    { name: 'May', sales: dynamicSales(180) },
    { name: 'Jun', sales: dynamicSales(190) },
  ];

  const complianceValue = Math.min(100, Math.max(0, 75.55 * (timeValue / 100) + 5));

  useEffect(() => {
    fetch('http://localhost:8000/api/empresas/')
      .then(res => res.json())
      .then(data => setEmpresasCount(data.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeValue(prev => {
          if (prev >= 100) { setIsPlaying(false); return 100; }
          return prev + 5;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      // Export with a specific background color to avoid grey edges from the body
      const dataUrl = await toPng(dashboardRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: '#F1F5F9' // Matches the min-h-screen bg
      });
      
      const nodeWidth = dashboardRef.current.offsetWidth;
      const nodeHeight = dashboardRef.current.offsetHeight;
      
      // Create a PDF with EXACT dimensions of the dashboard node
      const pdf = new jsPDF({
        orientation: nodeWidth > nodeHeight ? 'l' : 'p',
        unit: 'px',
        format: [nodeWidth, nodeHeight]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, nodeWidth, nodeHeight);
      pdf.save("Reporte_Directivo_MCQS.pdf");
    } catch (err) {
      console.error("Error generating PDF:", err);
    }
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;
    setAiChat(prev => [...prev, { sender: 'user', text: aiMessage }]);
    setAiMessage("");
    setTimeout(() => {
      setAiChat(prev => [...prev, { sender: 'ai', text: 'Analizando... Las fluctuaciones recientes indican una reducción de riesgo del 4% en el último mes.' }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 2xl:p-10">
      
      <div ref={dashboardRef} className="max-w-[1600px] mx-auto p-4 md:p-8 bg-[#F1F5F9]">
        
        {/* HEADER EXTRAORDINARIO */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-black">
              <Cpu className="text-[#3C50E0]" size={32} />
              Centro de Mando MCQS
            </h1>
            <p className="mt-1 text-sm font-medium text-[#64748B]">
              Inteligencia Financiera Avanzada y Monitoreo de Obras
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
            >
              <Download size={18} /> Exportar PDF
            </motion.button>
          </div>
        </div>

        {/* TIME SCRUBBER (MÁQUINA DEL TIEMPO) */}
        <motion.div className="mb-8 p-6 rounded-xl border backdrop-blur-md flex items-center gap-4 transition-colors duration-500 bg-white border-[#E2E8F0] shadow-sm">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-full transition-colors duration-500 bg-[#EFF4FB] hover:bg-[#E2E8F0] text-[#3C50E0]"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider transition-colors duration-500 text-slate-500">Simulador de Tiempo (Histórico a Actual)</span>
              <span className="text-xs font-bold font-mono transition-colors duration-500 text-[#3C50E0]">{timeValue === 100 ? 'HOY' : `Hace ${100 - timeValue} Días`}</span>
            </div>
            <input 
              type="range" min="0" max="100" value={timeValue} onChange={(e) => {setTimeValue(Number(e.target.value)); setIsPlaying(false);}}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </motion.div>

        {/* SMART INSIGHTS */}
        <motion.div className="mb-6 p-4 rounded-xl border-l-4 border-blue-500 flex items-start gap-4 transition-colors duration-500 bg-blue-50 border-blue-200">
           <div className="p-2 rounded-full transition-colors duration-500 bg-blue-100 text-blue-700">
             <Cpu size={24} />
           </div>
           <div>
             <h4 className="text-sm font-bold mb-1 transition-colors duration-500 text-blue-900">Smart Insight</h4>
             <p className="text-sm transition-colors duration-500 text-blue-800">
               Basado en la posición de tiempo actual ({timeValue}%): El riesgo global de cartera está contenido. {timeValue < 50 ? 'En este periodo hubo un pico de valorizaciones.' : 'Se recomienda revisar las renovaciones bancarias para el próximo trimestre.'}
             </p>
           </div>
        </motion.div>

        {/* TOP CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Empresas Registradas", val: Math.max(1, Math.floor((empresasCount > 0 ? empresasCount : 24) * (timeValue/100))), icon: Users, lightIconBg: "bg-blue-50 text-blue-600", trend: "+12%" },
            { title: "Fianzas Activas", val: Math.max(10, Math.floor(535 * (timeValue/100))), icon: Package, lightIconBg: "bg-indigo-50 text-indigo-600", trend: "+5%" },
            { title: "Riesgo de Liquidez", val: `S/ ${(45.2 * (timeValue/100)).toFixed(1)}M`, icon: AlertTriangle, lightIconBg: "bg-rose-50 text-rose-600", trend: "-2%" },
            { title: "Líneas de Crédito", val: `${Math.floor(68 * (timeValue/100))}%`, icon: CreditCard, lightIconBg: "bg-emerald-50 text-emerald-600", trend: "Estable" },
          ].map((card, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5, scale: 1.02 }}
              className="p-6 rounded-2xl border backdrop-blur-lg transition-all duration-500 bg-white border-slate-200 shadow-xl shadow-slate-200/50"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl transition-colors duration-500 ${card.lightIconBg}`}>
                  <card.icon size={24} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${card.trend.includes('+') ? 'bg-emerald-100 text-emerald-700' : card.trend.includes('-') ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                  {card.trend}
                </span>
              </div>
              <h3 className="text-sm font-semibold mb-1 transition-colors duration-500 text-slate-500">{card.title}</h3>
              <h2 className="text-3xl font-black tracking-tight transition-colors duration-500 text-slate-900">{card.val}</h2>
            </motion.div>
          ))}
        </div>

        {/* CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Main Bar Chart */}
          <div className="lg:col-span-2 p-6 rounded-2xl border transition-all duration-500 bg-white border-slate-200 shadow-lg shadow-slate-200/30">
            <h3 className="text-lg font-bold mb-6 transition-colors duration-500 text-slate-800">Ejecución de Obras vs Tiempo</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke='#E2E8F0' />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dx={-10} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#FFFFFF', border: 'none', borderRadius: '8px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#F1F5F9' }} />
                  <Bar dataKey="sales" fill="#3C50E0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compliance Gauge */}
          <div className="p-6 rounded-2xl border flex flex-col items-center justify-center relative transition-all duration-500 bg-white border-slate-200 shadow-lg shadow-slate-200/30">
            <h3 className="text-lg font-bold absolute top-6 left-6 transition-colors duration-500 text-slate-800">Avance Global</h3>
            <div className="h-[220px] w-full mt-8 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: complianceValue }, { value: 100 - complianceValue }]}
                    cx="50%" cy="100%"
                    startAngle={180} endAngle={0}
                    innerRadius={90} outerRadius={120}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill='#3C50E0' />
                    <Cell fill='#E2E8F0' />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-4 flex flex-col items-center">
                <span className="text-4xl font-black transition-colors duration-500 text-slate-900">{complianceValue.toFixed(1)}%</span>
                <span className="text-sm font-medium text-emerald-500 mt-1">Óptimo</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* MCQS AI ASSISTANT (Chat Bubble) */}
      <div className="fixed bottom-6 right-6 z-[110]">
        <AnimatePresence>
          {isAiOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-16 right-0 w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[450px]"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <Cpu size={20} />
                  <span className="font-bold">MCQS AI Asistente</span>
                </div>
                <button onClick={() => setIsAiOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={18} /></button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3 custom-scrollbar">
                {aiChat.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAiSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input 
                  type="text" value={aiMessage} onChange={e => setAiMessage(e.target.value)}
                  placeholder="Pregunta algo al sistema..."
                  className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button 
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setIsAiOpen(!isAiOpen)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-2xl shadow-blue-600/40 hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          {isAiOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </motion.button>
      </div>

    </div>
  );
}

// Missing icons fallback for lucide-react (Added explicitly for this component)
const AlertTriangle = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);
const CreditCard = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
);
