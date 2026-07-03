"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, Building2, Calendar, Users, 
  Landmark, Settings, ChevronDown, Bell, User, Crown
} from 'lucide-react';

export default function Sidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen?: boolean, setSidebarOpen?: (open: boolean) => void }) {
  const pathname = usePathname();
  const [activeModule, setActiveModule] = useState('apps');
  const [role, setRole] = useState<string | null>(null);

  // Determinar el módulo activo basado en la URL inicial
  useEffect(() => {
    const storedRole = localStorage.getItem('user_role');
    setRole(storedRole);
    
    const isAllowed = storedRole === 'admin' || storedRole === 'director';
    if (pathname.startsWith('/finanzas')) {
      setActiveModule('finanzas');
    } else if (pathname.startsWith('/administracion') && isAllowed) {
      setActiveModule('settings');
    } else {
      setActiveModule('apps');
    }
  }, [pathname]);

  const modules = [
    { id: 'apps', icon: <LayoutDashboard size={24} strokeWidth={2.5} />, tooltip: 'Apps Principales' },
    { id: 'finanzas', icon: <Landmark size={24} strokeWidth={2.5} />, tooltip: 'Finanzas' },
    { id: 'settings', icon: <Settings size={24} strokeWidth={2.5} />, tooltip: 'Ajustes' }
  ];

  const visibleModules = modules.filter(mod => {
    if (mod.id === 'settings') {
      return role === 'admin' || role === 'director';
    }
    return true;
  });

  const subMenus: Record<string, {title: string, items: any[]}> = {
    'apps': {
      title: 'General',
      items: [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
        { name: 'OBRAS SECREX CESCE', path: '/obras-sesce', icon: <FileText size={18} /> },
        { name: 'Liquidaciones', path: '/liquidaciones', icon: <Building2 size={18} /> },
        { name: 'Calendario', path: '/hitos', icon: <Calendar size={18} /> },
        { name: 'Mano de Obra', path: '/tareo', icon: <Users size={18} /> },
      ]
    },
    'finanzas': {
      title: 'Reportes Financieros',
      items: [
        { name: 'Finanzas Generales', path: '/finanzas', icon: <Landmark size={18} /> },
      ]
    },
    'settings': {
      title: 'Sistema',
      items: [
        { name: 'Administración', path: '/administracion', icon: <Settings size={18} /> },
      ]
    }
  };

  const currentMenu = subMenus[activeModule];

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={() => setSidebarOpen?.(false)}
        ></div>
      )}
      <aside className={`fixed left-0 top-0 z-40 flex h-screen w-[320px] bg-white dark:bg-[#1E293B] border-r border-[#E2E8F0] dark:border-gray-700 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      
      {/* TIER 1: Left Icon Strip */}
      <div className="w-[80px] bg-white dark:bg-[#0F172A] border-r border-[#E2E8F0] dark:border-gray-700 flex flex-col items-center py-6 h-full shrink-0 transition-colors duration-300">
        {/* Brand Icon */}
        <Link href="/" className="mb-8 relative group">
          <div className="flex items-center justify-center w-12 h-12 bg-[#1E40AF] rounded-xl shadow-[0_8px_16px_rgba(30,64,175,0.3)] transition-transform group-hover:scale-105">
            <div className="flex gap-1">
              <div className="w-[3px] h-3 bg-white rounded-full"></div>
              <div className="w-[3px] h-5 bg-white rounded-full"></div>
              <div className="w-[3px] h-3 bg-white rounded-full"></div>
            </div>
          </div>
        </Link>

        {/* Modules */}
        <div className="flex flex-col gap-4 w-full px-4 flex-1">
          {visibleModules.map(mod => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`w-full aspect-square flex items-center justify-center rounded-2xl transition-all duration-300 relative
                ${activeModule === mod.id 
                  ? 'bg-[#1E40AF]/10 text-[#1E40AF] shadow-[inset_0_0_0_1px_rgba(30,64,175,0.1)]' 
                  : 'text-[#64748B] hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'}
              `}
              title={mod.tooltip}
            >
              {mod.icon}
              {activeModule === mod.id && (
                <div className="absolute -left-4 w-1.5 h-8 bg-[#1E40AF] rounded-r-full shadow-[0_0_10px_rgba(30,64,175,0.5)]"></div>
              )}
            </button>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-4 w-full px-4 mb-2">
          <button className="w-full aspect-square flex items-center justify-center rounded-2xl text-[#64748B] hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white transition-all">
            <Bell size={22} strokeWidth={2.5} />
          </button>
          <div className="w-full aspect-square flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold border-2 border-white dark:border-gray-600 shadow-sm overflow-hidden mt-2 cursor-pointer hover:ring-2 ring-[#1E40AF] transition-all">
             <User size={20} />
          </div>
        </div>
      </div>

      {/* TIER 2: Sub-menu Panel */}
      <div className="w-[240px] bg-[#FAFAFA] dark:bg-[#1E293B] flex flex-col h-full shrink-0 transition-colors duration-300">
        
        {/* Workspace Header */}
        <div className="h-[88px] flex items-center px-6">
          <div className="w-full flex justify-between items-center bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-gray-600 py-2 px-4 rounded-full shadow-sm cursor-pointer hover:border-[#1E40AF] transition-colors">
            <span className="font-bold text-[#1C2434] dark:text-white text-sm">MCQS Admin</span>
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <h3 className="mb-4 px-2 text-[11px] font-bold text-[#8A99AF] uppercase tracking-wider">
            {currentMenu.title}
          </h3>
          <ul className="space-y-1.5">
            {currentMenu.items.map((item) => {
              const isActive = pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/');
              return (
                <li key={item.name}>
                  <Link 
                    href={item.path}
                    className={`group relative flex items-center gap-3 rounded-full px-4 py-2.5 font-semibold text-sm transition-all duration-200 ease-in-out
                      ${isActive ? 'text-[#1E40AF] bg-[#1E40AF]/10 shadow-sm' : 'text-[#64748B] hover:bg-white dark:hover:bg-gray-700 hover:text-black dark:hover:text-white hover:shadow-sm'}
                    `}
                  >
                    {item.icon}
                    <span className="truncate">{item.name}</span>
                    
                    {item.badge && (
                      <span className={`ml-auto py-0.5 px-2 rounded-full text-[9px] font-bold tracking-wider ${item.badge === 'NEW' ? 'bg-[#10B981] text-white shadow-sm' : 'bg-[#1E40AF] text-white shadow-sm'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

      </div>

    </aside>
    </>
  );
}
