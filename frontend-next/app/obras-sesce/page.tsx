"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Folder, FileText, UploadCloud, Trash2, Download, Plus, Search, ArrowDownAZ, 
  ArrowUpZA, Clock, LayoutGrid, List, Info, Link as LinkIcon, Tag, Database, 
  Command, File as FileIcon, FileImage, FileSpreadsheet, X, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Definición de tipos
type Archivo = {
  key: string;
  nombre: string;
  size: number;
  fecha: string | null;
  tipo: 'archivo' | 'carpeta';
  tamano_bytes?: number;
};

export default function ExploradorDiosS3() {
  const [carpetas, setCarpetas] = useState<{nombre: string, fecha: string | null}[]>([]);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Modals & Menus
  const [deleteConfirm, setDeleteConfirm] = useState<{tipo: 'archivo' | 'carpeta', key: string, name?: string} | null>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, item?: Archivo} | null>(null);
  const [leftContextMenu, setLeftContextMenu] = useState<{x: number, y: number} | null>(null);
  const [showNuevaCarpetaModal, setShowNuevaCarpetaModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  // Data States
  const [nuevaCarpetaNombre, setNuevaCarpetaNombre] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<'az' | 'za' | 'newest' | 'oldest'>('az');
  const [downloadingZip, setDownloadingZip] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<Archivo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // HOTKEYS & DRAG N DROP
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setContextMenu(null);
        setPreviewFile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (currentPath) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!currentPath) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleMultipleUploads(Array.from(files));
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setLeftContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // -------------------------------------------------------------
  // API FETCHING
  // -------------------------------------------------------------
  const loadCarpetas = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/licitaciones-s3/carpetas');
      const data = await res.json();
      setCarpetas(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadArchivos = async (carpeta: string) => {
    setFilesLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/licitaciones-s3/archivos?carpeta=${encodeURIComponent(carpeta)}`);
      const data = await res.json();
      setArchivos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setFilesLoading(false), 400); // Shimmer effect delay for premium feel
    }
  };

  useEffect(() => {
    const initData = async () => {
      await loadCarpetas();
      setLoading(false);
    };
    initData();
  }, []);

  useEffect(() => {
    if (currentPath) loadArchivos(currentPath);
    else setArchivos([]);
  }, [currentPath]);

  // -------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------
  const handleBack = () => {
    if (!currentPath) return;
    const cleanPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
    const parts = cleanPath.split('/');
    parts.pop();
    if (parts.length === 0) setCurrentPath(null);
    else setCurrentPath(parts.join('/'));
  };

  const handleCrearCarpeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCarpetaNombre.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/licitaciones-s3/carpetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevaCarpetaNombre.trim() })
      });
      if (res.ok) {
        setShowNuevaCarpetaModal(false);
        setNuevaCarpetaNombre('');
        loadCarpetas();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMultipleUploads = async (files: File[]) => {
    if (!currentPath) return;
    setUploading(true);
    
    // Subir todos los archivos secuencialmente (o en paralelo)
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("carpeta", currentPath);
      try {
        await fetch('http://localhost:8000/api/licitaciones-s3/archivos', {
          method: 'POST', body: formData,
        });
      } catch (err) {
        console.error(err);
      }
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadArchivos(currentPath);
    setUploading(false);
  };

  const handleDelete = async (key: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/licitaciones-s3/archivos?key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });
      if (res.ok && currentPath) {
        loadArchivos(currentPath);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCarpeta = async (carpeta: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/licitaciones-s3/carpetas?carpeta=${encodeURIComponent(carpeta)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (carpeta === currentPath) {
           handleBack();
           loadCarpetas();
        } else {
           if (currentPath) loadArchivos(currentPath);
           loadCarpetas();
        }
      } else {
        setCurrentPath(null);
        loadCarpetas();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadZip = async (carpeta_path: string) => {
    try {
      setDownloadingZip(carpeta_path);
      const url = `http://localhost:8000/api/licitaciones-s3/carpetas/descargar-zip?carpeta=${encodeURIComponent(carpeta_path)}`;
      const a = document.createElement('a');
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => setDownloadingZip(null), 3000);
    } catch (error) {
      console.error(error);
      setDownloadingZip(null);
    }
  };

  const handleDownload = async (key: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/licitaciones-s3/archivos/descargar?key=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        window.open(data.url, '_blank');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateMagicLink = (key: string) => {
    setMagicLink(`https://s3.mcqs.com/secure-link/${Math.random().toString(36).substring(7)}`);
    setTimeout(() => setMagicLink(null), 3000);
  };

  const openPreview = async (file: Archivo) => {
    setPreviewFile(file);
    setPreviewUrl(null);
    try {
      const res = await fetch(`http://localhost:8000/api/licitaciones-s3/archivos/descargar?key=${encodeURIComponent(file.key)}&inline=true`);
      if (res.ok) {
        const data = await res.json();
        setPreviewUrl(data.url);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // UTILS (Icons & Tags)
  // -------------------------------------------------------------
  const getFileIcon = (filename: string, size = 20) => {
    const name = filename.toLowerCase();
    if (name.endsWith('.pdf')) return <FileText size={size} className="text-rose-500" />;
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return <FileSpreadsheet size={size} className="text-emerald-500" />;
    if (name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.jpeg')) return <FileImage size={size} className="text-blue-400" />;
    if (name.endsWith('.doc') || name.endsWith('.docx')) return <FileText size={size} className="text-blue-600" />;
    return <FileIcon size={size} className="text-slate-400" />;
  };

  const getSmartTags = (filename: string) => {
    const name = filename.toLowerCase();
    const tags = [];
    if (name.includes('contrato')) tags.push({ text: 'CONTRATO', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' });
    if (name.includes('fianza') || name.includes('garantia')) tags.push({ text: 'FIANZA', classes: 'bg-rose-100 text-rose-700 border-rose-200' });
    if (name.includes('factura') || name.includes('pagare')) tags.push({ text: 'FINANCIERO', classes: 'bg-indigo-100 text-indigo-700 border-indigo-200' });
    if (tags.length === 0) tags.push({ text: 'DOC S3', classes: 'bg-slate-100 text-slate-600 border-slate-200' });
    return tags;
  };

  const formatBytes = (bytes: number = 0) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // -------------------------------------------------------------
  // SORTING & FILTERING
  // -------------------------------------------------------------
  const filteredCarpetas = carpetas
    .filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === 'az') return a.nombre.localeCompare(b.nombre, undefined, { numeric: true });
      if (sortMode === 'za') return b.nombre.localeCompare(a.nombre, undefined, { numeric: true });
      if (sortMode === 'newest') return (b.fecha ? new Date(b.fecha).getTime() : 0) - (a.fecha ? new Date(a.fecha).getTime() : 0);
      return (a.fecha ? new Date(a.fecha).getTime() : 0) - (b.fecha ? new Date(b.fecha).getTime() : 0);
    });

  const sortedArchivos = [...archivos].sort((a, b) => {
    if (a.tipo === 'carpeta' && b.tipo !== 'carpeta') return -1;
    if (a.tipo !== 'carpeta' && b.tipo === 'carpeta') return 1;
    if (sortMode === 'az') return a.nombre.localeCompare(b.nombre, undefined, { numeric: true });
    if (sortMode === 'za') return b.nombre.localeCompare(a.nombre, undefined, { numeric: true });
    if (sortMode === 'newest') return (b.fecha ? new Date(b.fecha).getTime() : 0) - (a.fecha ? new Date(a.fecha).getTime() : 0);
    return (a.fecha ? new Date(a.fecha).getTime() : 0) - (b.fecha ? new Date(b.fecha).getTime() : 0);
  });

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans text-slate-800 overflow-hidden">
      
      {/* ---------------- SIDEBAR (LEFT) ---------------- */}
      <div className="w-[300px] shrink-0 border-r border-slate-200 bg-white flex flex-col z-10 shadow-sm relative">
        <div className="p-5 border-b border-slate-100">
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="text-blue-600" size={24} /> S3 Explorer
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Conexión Directa AWS Nivel Dios</p>
          
          <button 
            onClick={() => setShowCommandPalette(true)}
            className="mt-5 w-full flex items-center justify-between bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Search size={16} /> <span>Buscar globalmente...</span>
            </div>
            <div className="flex gap-1">
              <kbd className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-mono shadow-sm">Ctrl</kbd>
              <kbd className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-mono shadow-sm">K</kbd>
            </div>
          </button>
        </div>

        {/* Action Bar (Sort / Add) */}
        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200 shadow-inner">
            <button onClick={() => setSortMode('az')} className={`p-1.5 rounded-sm transition-all ${sortMode === 'az' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`} title="A-Z"><ArrowDownAZ size={14}/></button>
            <button onClick={() => setSortMode('newest')} className={`p-1.5 rounded-sm transition-all ${sortMode === 'newest' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`} title="Recientes"><Clock size={14}/></button>
          </div>
          <button onClick={() => setShowNuevaCarpetaModal(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm shadow-blue-600/20">
            <Plus size={14} /> Nueva Obra
          </button>
        </div>

        {/* Tree View */}
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar p-3"
          onContextMenu={(e) => { e.preventDefault(); setLeftContextMenu({ x: e.pageX, y: e.pageY }); }}
        >
          {loading ? (
             <div className="space-y-2">
               {[1,2,3,4,5,6].map(i => <div key={i} className="h-10 bg-slate-100 rounded-md animate-pulse"></div>)}
             </div>
          ) : (
            <ul className="space-y-0.5">
              {filteredCarpetas.map(c => (
                <li key={c.nombre}>
                  <button
                    onClick={() => { setCurrentPath(c.nombre); setFilesLoading(true); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between transition-all group ${currentPath?.startsWith(c.nombre) ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <Folder size={18} fill={currentPath?.startsWith(c.nombre) ? "rgba(255,255,255,0.4)" : "rgba(148,163,184,0.3)"} className={currentPath?.startsWith(c.nombre) ? 'text-white' : 'text-slate-400'} />
                      <span className="truncate" title={c.nombre}>{c.nombre}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ---------------- MAIN CONTENT (CENTER) ---------------- */}
      <div 
        className={`flex-1 flex flex-col relative transition-colors duration-300 ${isDragging ? 'bg-blue-50/50' : 'bg-[#F1F5F9]'}`}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-blue-600/10 backdrop-blur-[2px] border-4 border-blue-500 border-dashed m-4 rounded-3xl flex flex-col items-center justify-center pointer-events-none"
            >
              <UploadCloud size={80} className="text-blue-600 mb-4 animate-bounce" />
              <h2 className="text-3xl font-black text-blue-900 tracking-tight">Suelta aquí para subir a S3</h2>
              <p className="text-blue-700 font-medium mt-2">Los archivos se subirán automáticamente a {currentPath?.split('/').pop()}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!currentPath ? (
          /* Empty State Principal */
          <div className="flex-1 flex flex-col items-center justify-center bg-white m-4 rounded-3xl shadow-sm border border-slate-200">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <div className="w-48 h-48 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-blue-100">
                <Database size={80} strokeWidth={1} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Bóveda Documental S3</h2>
              <p className="text-slate-500 text-center max-w-md">Selecciona una obra del panel izquierdo para explorar sus documentos o crea una nueva para comenzar.</p>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Header (Glassmorphism) */}
            <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={handleBack} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Folder className="text-blue-600" fill="currentColor" fillOpacity={0.2} size={22} />
                    {currentPath.replace(/\/$/, '').split('/').pop()}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-1">
                    {currentPath}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 shadow-inner mr-2">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16}/></button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}><List size={16}/></button>
                </div>
                
                <input type="file" multiple ref={fileInputRef} onChange={(e) => { if(e.target.files) handleMultipleUploads(Array.from(e.target.files)) }} className="hidden" />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <UploadCloud size={16} /> {uploading ? 'Subiendo...' : 'Subir Documento'}
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div 
              className="flex-1 p-6 overflow-y-auto custom-scrollbar"
              onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.pageX, y: e.pageY }); }}
            >
              {filesLoading ? (
                /* Skeletons */
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse shadow-sm"></div>)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-white rounded-lg border border-slate-200 animate-pulse"></div>)}
                  </div>
                )
              ) : sortedArchivos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="w-24 h-24 mb-4 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                    <Folder size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-600">Carpeta Vacía</h3>
                  <p className="text-sm">Arrastra documentos aquí para subirlos a S3.</p>
                </div>
              ) : viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {sortedArchivos.map(a => (
                    <motion.div 
                      key={a.key} layoutId={`file-${a.key}`}
                      onClick={(e) => { e.stopPropagation(); a.tipo === 'carpeta' ? setCurrentPath(a.key) : openPreview(a); }}
                      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.pageX, y: e.pageY, item: a }); }}
                      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-lg hover:border-blue-300 group flex flex-col items-center text-center h-36 ${previewFile?.key === a.key ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200'}`}
                    >
                      <div className="flex-1 flex items-center justify-center">
                        {a.tipo === 'carpeta' ? <Folder size={48} fill="#3C50E0" className="opacity-80 text-blue-600" /> : getFileIcon(a.nombre, 48)}
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm truncate w-full mt-2" title={a.nombre}>{a.nombre}</h4>
                      {a.tipo !== 'carpeta' && <p className="text-[10px] text-slate-400 mt-1 font-mono">{formatBytes(a.tamano_bytes)}</p>}
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* LIST (TABLE) VIEW */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-4 py-3 w-10"></th>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3 hidden md:table-cell">Etiquetas</th>
                        <th className="px-4 py-3">Modificado</th>
                        <th className="px-4 py-3 text-right">Tamaño</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedArchivos.map(a => (
                        <tr 
                          key={a.key} 
                          onClick={(e) => { e.stopPropagation(); a.tipo === 'carpeta' ? setCurrentPath(a.key) : openPreview(a); }}
                          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.pageX, y: e.pageY, item: a }); }}
                          className={`border-b border-slate-100 cursor-pointer transition-colors ${previewFile?.key === a.key ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-4 py-3 text-center">
                            {a.tipo === 'carpeta' ? <Folder size={20} fill="#3C50E0" className="text-blue-600 opacity-80" /> : getFileIcon(a.nombre)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-sm text-slate-800 truncate max-w-[200px]" title={a.nombre}>{a.nombre}</td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {a.tipo !== 'carpeta' && (
                              <div className="flex gap-1 flex-wrap">
                                {getSmartTags(a.nombre).map((tag, i) => (
                                  <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tag.classes}`}>{tag.text}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 font-mono">{a.fecha ? new Date(a.fecha).toLocaleDateString() : '--'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 font-mono text-right">{a.tipo === 'carpeta' ? '--' : formatBytes(a.tamano_bytes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ---------------- CUSTOM CONTEXT MENU ---------------- */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-xl py-2 z-[100] min-w-[200px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {contextMenu.item ? (
              <>
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-800 truncate" title={contextMenu.item.nombre}>{contextMenu.item.nombre}</p>
                </div>
                {contextMenu.item.tipo === 'archivo' && (
                  <>
                    <button onClick={() => { openPreview(contextMenu.item as Archivo); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"><FileImage size={14} /> Ver Vista Previa</button>
                    <button onClick={() => { handleDownload(contextMenu.item!.key); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"><Download size={14} /> Descargar</button>
                    <button onClick={() => { handleGenerateMagicLink(contextMenu.item!.key); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2"><LinkIcon size={14} /> Copiar Enlace Mágico</button>
                  </>
                )}
                {contextMenu.item.tipo === 'carpeta' && (
                  <button onClick={() => { handleDownloadZip(contextMenu.item!.key); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"><Download size={14} /> Descargar ZIP</button>
                )}
                <div className="my-1 border-t border-slate-100"></div>
                <button onClick={() => { setDeleteConfirm({tipo: contextMenu.item!.tipo, key: contextMenu.item!.key, name: contextMenu.item!.nombre}); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"><Trash2 size={14} /> Eliminar</button>
              </>
            ) : (
              <>
                <button onClick={() => { setContextMenu(null); const name = prompt('Nombre de nueva subcarpeta:'); if(name) { fetch('http://localhost:8000/api/licitaciones-s3/carpetas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: `${currentPath?.replace(/\/$/, '')}/${name.trim()}` }) }).then(() => loadArchivos(currentPath!)); } }} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"><Folder size={14} className="text-blue-500" /> Nueva Carpeta Aquí</button>
                <button onClick={() => { setContextMenu(null); fileInputRef.current?.click(); }} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"><UploadCloud size={14} className="text-emerald-500" /> Subir Archivo</button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- COMMAND PALETTE (Ctrl+K) ---------------- */}
      <AnimatePresence>
        {showCommandPalette && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCommandPalette(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <Search size={20} className="text-blue-500" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Busca contratos, fianzas, carpetas... (Simulado)"
                  className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 placeholder-slate-400 font-medium"
                  value={globalSearchTerm}
                  onChange={e => setGlobalSearchTerm(e.target.value)}
                />
                <kbd className="bg-slate-100 border border-slate-200 text-slate-500 rounded px-2 py-1 text-xs font-mono">ESC</kbd>
              </div>
              <div className="p-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                {globalSearchTerm.length > 2 ? (
                  <div className="p-4 text-center text-sm text-slate-500 flex flex-col items-center">
                    <Command size={24} className="mb-2 opacity-50" />
                    Buscando "{globalSearchTerm}" en todo el almacenamiento...
                    <br/><span className="text-[10px] mt-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Nota: Función simulada para demo. En pro requiere indexación Elasticsearch.</span>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-slate-400">Escribe al menos 3 caracteres para buscar globalmente</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODALS ---------------- */}
      {/* Eliminar Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Confirmar Eliminación</h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">
                {deleteConfirm.tipo === 'carpeta' 
                  ? `Se eliminará la carpeta "${deleteConfirm.name}" y todo su contenido en S3. Esta acción es destructiva e irreversible.`
                  : `Se eliminará el archivo "${deleteConfirm.name}" permanentemente de S3.`}
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 rounded-lg text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancelar</button>
                <button onClick={() => { deleteConfirm.tipo === 'carpeta' ? handleDeleteCarpeta(deleteConfirm.key) : handleDelete(deleteConfirm.key); setDeleteConfirm(null); }} className="px-5 py-2.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/30">Sí, Eliminar Permanentemente</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Nueva Carpeta */}
      <AnimatePresence>
        {showNuevaCarpetaModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowNuevaCarpetaModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2"><Folder className="text-blue-600"/> Nueva Obra</h3>
                <button onClick={() => setShowNuevaCarpetaModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={20}/></button>
              </div>
              <form onSubmit={handleCrearCarpeta} className="p-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de la Carpeta Raíz</label>
                <input 
                  autoFocus required type="text" placeholder="Ej. 100 CONSORCIO ALPHA 2024"
                  className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-sm focus:border-blue-500 outline-none mb-6 font-medium text-slate-900 transition-colors"
                  value={nuevaCarpetaNombre} onChange={e => setNuevaCarpetaNombre(e.target.value)} 
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowNuevaCarpetaModal(false)} className="px-5 py-2.5 text-sm text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors">Crear Obra en S3</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- RIGHT PANEL (PREVIEW & DETAILS) ---------------- */}
      <AnimatePresence>
        {previewFile && (
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-[50vw] max-w-[800px] shrink-0 border-l border-slate-200 bg-white flex flex-col z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.1)] relative"
          >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 truncate pr-4">
                <FileImage className="text-indigo-600 shrink-0" size={18} /> 
                <span className="truncate" title={previewFile.nombre}>{previewFile.nombre}</span>
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleDownload(previewFile.key)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors">
                  <Download size={16} /> Descargar
                </button>
                <button onClick={() => setPreviewFile(null)} className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden">
              {!previewUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <div className="animate-spin w-10 h-10 border-4 border-t-transparent border-indigo-500 rounded-full mb-4"></div>
                  <p>Cargando vista previa segura...</p>
                </div>
              ) : (
                previewFile.nombre.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={`${previewUrl}#view=FitH&navpanes=0`} className="w-full h-full border-none bg-white" title="PDF Preview" />
                ) : previewFile.nombre.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                  <div className="w-full h-full flex items-center justify-center p-4 bg-slate-200/50">
                    <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded shadow-sm" />
                  </div>
                ) : previewFile.nombre.toLowerCase().match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/) ? (
                  <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`} className="w-full h-full border-none bg-white" title="Office Preview" />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-white">
                    <FileIcon size={64} className="mb-4 text-slate-300" />
                    <p className="text-lg font-medium text-slate-600">Formato no soportado para vista previa</p>
                    <p className="text-sm mt-1 mb-6 text-slate-400">Este tipo de archivo debe descargarse para visualizarse.</p>
                    <button onClick={() => handleDownload(previewFile.key)} className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-lg shadow-md transition-colors flex items-center gap-2">
                      <Download size={16} /> Descargar archivo
                    </button>
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
