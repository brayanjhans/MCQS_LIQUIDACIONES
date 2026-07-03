"use client";
import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { UploadCloud, File, Trash2, Download } from 'lucide-react';

export default function EmpresaArchivosPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [empresa, setEmpresa] = useState<any>(null);
  const [archivos, setArchivos] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState('Contrato Principal');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    if (id) {
      fetch(`http://localhost:8000/api/empresas/${id}`)
        .then(res => res.json())
        .then(data => setEmpresa(data));

      fetch(`http://localhost:8000/api/archivos/${id}`)
        .then(res => res.json())
        .then(data => setArchivos(data));
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("categoria", categoria);

    try {
      const res = await fetch(`http://localhost:8000/api/archivos/${id}`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadData();
      } else {
        alert("Error subiendo el archivo");
      }
    } catch (e) {
      console.error(e);
      alert("Error subiendo el archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (archivoId: number) => {
    if (!confirm("¿Estás seguro de eliminar este archivo?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/archivos/${archivoId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = async (archivoId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/archivos/descargar/${archivoId}`);
      if (res.ok) {
        const data = await res.json();
        window.open(data.url, '_blank');
      } else {
        alert("Error obteniendo el link de descarga");
      }
    } catch (e) {
      console.error(e);
      alert("Error al descargar");
    }
  };

  if (!empresa) return <div className="p-8 text-center text-[#64748B]">Cargando...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 bg-[#F1F5F9] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">Gestión de Archivos</h1>
          <p className="mt-1 text-sm text-[#64748B]">{empresa.nombre}</p>
        </div>
        <Link href="/liquidaciones" className="px-4 py-2 border border-[#E2E8F0] bg-white rounded text-sm font-medium hover:bg-gray-50 text-black">
          Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="xl:col-span-1 rounded-sm border border-[#E2E8F0] bg-white p-6 shadow-default">
          <h2 className="text-lg font-semibold text-black mb-4">Subir Nuevo Archivo</h2>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#3C50E0] bg-[#F1F5F9] rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#E2E8F0] transition-colors"
          >
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <UploadCloud className="text-[#3C50E0]" size={24} />
            </div>
            {selectedFile ? (
              <h3 className="font-bold text-[#3C50E0] text-sm mb-1">{selectedFile.name}</h3>
            ) : (
              <>
                <h3 className="font-bold text-black text-sm mb-1">Haz clic para elegir</h3>
                <p className="text-[10px] text-[#64748B] mt-2">Cualquier tipo de documento (Max 10MB)</p>
              </>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-xs font-medium text-black mb-2">Categoría del Archivo</label>
            <select 
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="w-full rounded border border-[#E2E8F0] px-4 py-2 text-sm focus:border-[#3C50E0] outline-none"
            >
              <option>Contrato Principal</option>
              <option>Valorizaciones</option>
              <option>Resoluciones</option>
              <option>Planos</option>
              <option>Otros</option>
            </select>
          </div>

          <button 
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full mt-6 bg-[#3C50E0] text-white py-2 rounded text-sm font-bold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Subiendo...' : 'Subir Documento'}
          </button>
        </div>

        {/* Files List */}
        <div className="xl:col-span-2 rounded-sm border border-[#E2E8F0] bg-white p-6 shadow-default h-[500px] flex flex-col">
          <h2 className="text-lg font-semibold text-black border-b border-[#E2E8F0] pb-3 mb-4">Archivos Recientes</h2>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            {archivos.map(archivo => (
              <div key={archivo.id} className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg hover:border-[#3C50E0] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="bg-[#F1F5F9] p-3 rounded text-[#3C50E0]">
                    <File size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black text-sm">{archivo.nombre_original}</h4>
                    <p className="text-xs text-[#64748B]">
                      {archivo.categoria} • {new Date(archivo.fecha_subida).toLocaleDateString()} • {(archivo.tamano_bytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDownload(archivo.id)}
                    className="p-2 text-[#64748B] hover:text-[#3C50E0] bg-[#F1F5F9] rounded block"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(archivo.id)}
                    className="p-2 text-[#64748B] hover:text-[#FF6766] bg-[#F1F5F9] rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {archivos.length === 0 && (
              <div className="text-center py-10 text-[#64748B]">
                Aún no has subido archivos para esta empresa.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
