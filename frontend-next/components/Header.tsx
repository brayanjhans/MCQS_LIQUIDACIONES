"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Moon, Sun, Bell, Menu, ChevronDown, LogOut, HelpCircle, FileText, Users, AlertTriangle } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  
  // States for dropdowns
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Data states
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{obras: any[], trabajadores: any[], fianzas: any[]}>({obras: [], trabajadores: [], fianzas: []});
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs for clicking outside
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) setIsHelpOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    // Command+K listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        // Focus the input
        setTimeout(() => document.getElementById('global-search-input')?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // Fetch Notifications (Fianzas vencidas o por vencer en 15 dias)
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/hitos`)
      .then(res => res.json())
      .then(data => {
         const fianzas = data.fianzas || [];
         const alerts = fianzas.filter((f: any) => {
            const diff = new Date(f.fecha_vencimiento).getTime() - new Date().getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            return days <= 15;
         }).slice(0, 5); // top 5
         setNotifications(alerts);
      }).catch(err => console.error("Error fetching notifications", err));
      
    // Check dark mode initial state
    if (document.documentElement.classList.contains('dark')) setDarkMode(true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Search Effect
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults({obras: [], trabajadores: [], fianzas: []});
      return;
    }
    
    setIsSearching(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data);
          setIsSearching(false);
        })
        .catch(err => {
          console.error(err);
          setIsSearching(false);
        });
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setDarkMode(isDark);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-30 flex w-full bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-gray-700 transition-colors">
      <div className="flex flex-grow items-center justify-between py-4 px-4 shadow-sm md:px-6 2xl:px-11">
        
        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          <button className="z-50 block rounded-sm border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 shadow-sm">
            <Menu size={20} className="text-black dark:text-white" />
          </button>
        </div>

        {/* INLINE SEARCH BAR */}
        <div className="hidden sm:block relative w-full max-w-lg" ref={searchRef}>
          <div className="relative group flex items-center">
            <button className="absolute left-0 pl-2">
              <Search size={20} className="text-[#8A99AF] group-hover:text-[#1E40AF] transition-colors" />
            </button>
            <input 
              id="global-search-input"
              type="text"
              className="w-full bg-transparent pl-10 pr-12 py-1.5 text-gray-800 dark:text-white xl:w-125 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-[#1E40AF] dark:focus:border-[#1E40AF] focus:bg-white dark:focus:bg-[#0F172A] rounded-lg outline-none transition-all"
              placeholder="Search or type command..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => setIsSearchOpen(true)}
            />
            <div className="absolute right-2 border border-[#E2E8F0] dark:border-gray-600 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#8A99AF] pointer-events-none">
              ⌘ K
            </div>
          </div>

          {/* SEARCH DROPDOWN */}
          {isSearchOpen && (
            <div className="absolute left-0 mt-2 w-full max-w-md bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {searchQuery.length > 0 ? (
                  <div className="p-2">
                    {isSearching ? (
                      <div className="text-center text-gray-500 py-4 text-sm">Buscando...</div>
                    ) : (
                      <>
                        {searchResults.obras?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">Obras / Consorcios</p>
                            {searchResults.obras.map((o: any) => (
                              <button key={o.id} onClick={() => {router.push('/liquidaciones'); closeSearch();}} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg transition-colors">
                                <span className="font-medium text-sm dark:text-white block">{o.nombre}</span>
                                <span className="text-[11px] text-gray-500">RUC: {o.ruc}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.trabajadores?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">Trabajadores</p>
                            {searchResults.trabajadores.map((t: any) => (
                              <button key={t.id} onClick={() => {router.push('/tareo'); closeSearch();}} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg transition-colors">
                                <span className="font-medium text-sm dark:text-white block">{t.apellidos}, {t.nombres}</span>
                                <span className="text-[11px] text-gray-500">DNI: {t.dni}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.fianzas?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">Cartas Fianza</p>
                            {searchResults.fianzas.map((f: any) => (
                              <button key={f.id} onClick={() => {router.push('/finanzas'); closeSearch();}} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg transition-colors">
                                <span className="font-medium text-sm dark:text-white block">Nº {f.numero}</span>
                                <span className="text-[11px] text-gray-500">Tipo: {f.tipo}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.obras?.length === 0 && searchResults.trabajadores?.length === 0 && searchResults.fianzas?.length === 0 && (
                          <div className="text-center text-gray-500 py-4 text-sm">No se encontraron resultados para "{searchQuery}"</div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Accesos Rápidos</p>
                    <button onClick={() => {router.push('/liquidaciones'); closeSearch();}} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg flex items-center gap-3 transition-colors">
                      <FileText size={16} className="text-[#1E40AF]" />
                      <span className="text-sm font-medium dark:text-gray-200">Ir a Liquidaciones</span>
                    </button>
                    <button onClick={() => {router.push('/tareo'); closeSearch();}} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg flex items-center gap-3 transition-colors">
                      <Users size={16} className="text-[#1E40AF]" />
                      <span className="text-sm font-medium dark:text-gray-200">Ir a Mano de Obra</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 2xsm:gap-7 ml-auto">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            
            {/* Dark Mode */}
            <li>
              <button onClick={toggleDarkMode} className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#E2E8F0] dark:border-gray-600 bg-[#EFF4FB] dark:bg-gray-800 hover:text-[#1E40AF] text-[#64748B] dark:text-gray-300 transition-colors cursor-pointer">
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </li>

            {/* Help Button */}
            <li className="relative" ref={helpRef}>
              <button 
                onClick={() => setIsHelpOpen(!isHelpOpen)}
                className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#E2E8F0] dark:border-gray-600 bg-[#EFF4FB] dark:bg-gray-800 hover:text-[#1E40AF] text-[#64748B] dark:text-gray-300 transition-colors cursor-pointer"
              >
                <HelpCircle size={16} />
              </button>
              {isHelpOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-50">
                  <div className="p-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ayuda y Soporte</p>
                    <ul className="space-y-1 text-sm dark:text-gray-200">
                      <li className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">Atajos de Teclado (⌘K)</li>
                      <li className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">Manual de Usuario</li>
                      <li className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer text-[#1E40AF] font-medium">Contactar Soporte</li>
                    </ul>
                  </div>
                </div>
              )}
            </li>

            {/* Notifications */}
            <li className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#E2E8F0] dark:border-gray-600 bg-[#EFF4FB] dark:bg-gray-800 hover:text-[#1E40AF] text-[#64748B] dark:text-gray-300 transition-colors cursor-pointer"
              >
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 z-1 h-2 w-2 rounded-full bg-[#FF6766]">
                    <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-[#FF6766] opacity-75"></span>
                  </span>
                )}
                <Bell size={16} />
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden flex flex-col z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Notificaciones</span>
                    <span className="text-xs bg-[#3C50E0] text-white px-2 py-0.5 rounded-full">{notifications.length} nuevas</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No hay alertas urgentes</div>
                    ) : (
                      notifications.map((n, i) => (
                        <div key={i} className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex gap-3">
                          <div className="mt-0.5"><AlertTriangle size={16} className="text-[#EE5D50]"/></div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{n.tipo} por vencer</p>
                            <p className="text-xs text-gray-500">{n.empresa_nombre}</p>
                            <p className="text-xs font-medium text-[#EE5D50] mt-1">Vence: {n.fecha_vencimiento}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </li>
          </ul>

          {/* User Profile - Make the entire container clickable */}
          <div className="relative ml-2" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-4 outline-none cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className="hidden text-right lg:block">
                <span className="block text-sm font-medium text-black dark:text-white">Administrador</span>
                <span className="block text-xs font-medium text-[#64748B]">MCQS</span>
              </span>

              <span className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-[#1E40AF] text-white font-bold shadow-sm">
                A
              </span>
              <ChevronDown size={16} className={`text-[#64748B] transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden z-50">
                <div className="p-2">
                  <button onClick={() => { setIsProfileOpen(false); alert('Módulo de perfil próximamente. Tu usuario actual es: Administrador MCQS'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                    Mi Perfil
                  </button>
                  <button onClick={() => { setIsProfileOpen(false); router.push('/administracion'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                    Configuración
                  </button>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-2 mx-2"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium cursor-pointer"
                  >
                    <LogOut size={16} />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
