"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Bell, Database, Clock, ShieldAlert, ShieldCheck, 
  Trash2, Plus, RefreshCw, CheckCircle, AlertTriangle, Save, 
  User, Crown, Shield, Key, Eye, EyeOff, Loader, Check, Trash,
  MessageSquare, Send, Smartphone
} from 'lucide-react';

interface UserItem {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

interface AuditLog {
  timestamp: string;
  username: string;
  action: string;
  details: string;
}

interface ConnectionItem {
  status: 'ok' | 'error';
  error: string | null;
}

interface ConnectionStatus {
  mysql: ConnectionItem;
  s3_remote: ConnectionItem;
  s3_fianzas: ConnectionItem;
}

export default function AdministrationPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'alerts' | 'connections' | 'audit'>('users');
  
  // Users CRUD state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  
  // Connection states
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [checkingConnections, setCheckingConnections] = useState(false);

  // Settings states
  const [settings, setSettings] = useState({
    fianzas_dias_previos: 30,
    sctr_dias_previos: 15,
    emo_dias_previos: 30,
    whatsapp_enabled: false,
    whatsapp_recipient: '',
    evolution_api_url: 'http://localhost:8080',
    evolution_api_key: 'your_api_key',
    evolution_instance_name: 'mcqs_instance'
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [triggeringWhatsApp, setTriggeringWhatsApp] = useState(false);
  const [whatsappResult, setWhatsappResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  // Audit Logs states
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchLogQuery, setSearchLogQuery] = useState('');

  // Validate authentication
  useEffect(() => {
    const storedRole = localStorage.getItem('user_role');
    setRole(storedRole);
    if (storedRole === 'admin' || storedRole === 'director') {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, []);

  // Fetch data depending on active tab
  useEffect(() => {
    if (authorized === true) {
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'connections') {
        fetchConnections();
      } else if (activeTab === 'alerts') {
        fetchSettings();
      } else if (activeTab === 'audit') {
        fetchLogs();
      }
    }
  }, [authorized, activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUserError('');
    try {
      const res = await fetch('http://localhost:8000/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setUserError('Error al listar los usuarios.');
      }
    } catch {
      setUserError('No se pudo conectar al servidor de autenticación.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');
    if (!newUsername.trim() || !newPassword.trim()) {
      setUserError('Nombre de usuario y contraseña son requeridos.');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole
        })
      });

      if (res.ok) {
        setUserSuccess('Usuario registrado con éxito.');
        setNewUsername('');
        setNewPassword('');
        setNewRole('user');
        fetchUsers();
      } else {
        const err = await res.json();
        setUserError(err.detail || 'Error al registrar el usuario.');
      }
    } catch {
      setUserError('Error al conectar con la base de datos.');
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar al usuario "${username}"?`)) {
      return;
    }
    setUserError('');
    setUserSuccess('');

    try {
      const res = await fetch(`http://localhost:8000/api/auth/users/${userId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setUserSuccess(`Usuario "${username}" eliminado correctamente.`);
        fetchUsers();
      } else {
        const err = await res.json();
        setUserError(err.detail || 'Error al eliminar el usuario.');
      }
    } catch {
      setUserError('Error de red al intentar eliminar el usuario.');
    }
  };

  const fetchConnections = async () => {
    setCheckingConnections(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/connection-status');
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus(data);
      } else {
        console.error('Error al comprobar conexiones.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingConnections(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);

    try {
      const res = await fetch('http://localhost:8000/api/auth/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setTestingWhatsApp(true);
    setWhatsappResult(null);
    try {
      const res = await fetch('http://localhost:8000/api/auth/whatsapp-test', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setWhatsappResult({ status: 'success', message: 'Mensaje de prueba enviado exitosamente a WhatsApp.' });
      } else {
        setWhatsappResult({ status: 'error', message: data.message || data.detail || 'Error al enviar el mensaje de prueba.' });
      }
    } catch (err) {
      setWhatsappResult({ status: 'error', message: 'No se pudo conectar con el servidor para la prueba.' });
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleTriggerWhatsApp = async () => {
    setTriggeringWhatsApp(true);
    setWhatsappResult(null);
    try {
      const res = await fetch('http://localhost:8000/api/auth/whatsapp-trigger', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        if (data.status === 'success') {
          setWhatsappResult({ status: 'success', message: 'Alertas procesadas y enviadas exitosamente vía WhatsApp.' });
        } else if (data.status === 'no_alerts') {
          setWhatsappResult({ status: 'success', message: 'Escaneo completado: No se encontraron documentos próximos a vencer hoy.' });
        } else {
          setWhatsappResult({ status: 'error', message: data.message || 'Error desconocido al ejecutar alertas.' });
        }
      } else {
        setWhatsappResult({ status: 'error', message: data.detail || 'Error en el procesamiento de alertas.' });
      }
    } catch (err) {
      setWhatsappResult({ status: 'error', message: 'No se pudo conectar con el servidor para la ejecución.' });
    } finally {
      setTriggeringWhatsApp(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render Skeleton while validating access
  if (authorized === null) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-[#1E40AF] mx-auto mb-4" size={40} />
          <p className="text-slate-500 font-semibold">Cargando módulo de administración...</p>
        </div>
      </div>
    );
  }

  // Render Access Denied
  if (authorized === false) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-slate-700 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Acceso Denegado</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
            Lo sentimos, no tienes los permisos necesarios para ver esta sección. Este panel es exclusivo para usuarios con roles de <strong>Administrador</strong> o <strong>Director</strong>.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-[#1E40AF] hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20 text-sm cursor-pointer"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // Filter audit logs based on search query
  const filteredLogs = logs.filter(log => {
    const q = searchLogQuery.toLowerCase();
    return (
      log.username.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-900 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1C2434] dark:text-white">Panel de Administración</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configuración global, límites de alertas, usuarios y monitoreo de la infraestructura.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-[#1E40AF] dark:text-blue-300 rounded-full text-xs font-bold">
              <Crown size={14} />
              Rol: {role === 'admin' ? 'Administrador' : 'Director'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[#E2E8F0] dark:border-slate-700 flex gap-6">
          <button 
            onClick={() => setActiveTab('users')} 
            className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'users' ? 'border-[#1E40AF] text-[#1E40AF]' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
          >
            <Users size={18} />
            Gestión de Usuarios
          </button>
          <button 
            onClick={() => setActiveTab('alerts')} 
            className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'alerts' ? 'border-[#1E40AF] text-[#1E40AF]' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
          >
            <Bell size={18} />
            Límites de Alertas
          </button>
          <button 
            onClick={() => setActiveTab('connections')} 
            className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'connections' ? 'border-[#1E40AF] text-[#1E40AF]' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
          >
            <Database size={18} />
            Monitoreo DB / S3
          </button>
          <button 
            onClick={() => setActiveTab('audit')} 
            className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'audit' ? 'border-[#1E40AF] text-[#1E40AF]' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
          >
            <Clock size={18} />
            Registro de Auditoría
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-6">
          
          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left: User list table */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-[#E2E8F0] dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-[#1C2434] dark:text-white">Usuarios Activos</h3>
                  <button 
                    onClick={fetchUsers}
                    className="p-2 text-slate-500 hover:text-[#1E40AF] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                    title="Actualizar lista"
                  >
                    <RefreshCw size={18} className={loadingUsers ? "animate-spin" : ""} />
                  </button>
                </div>

                {userError && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
                    {userError}
                  </div>
                )}
                {userSuccess && (
                  <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium">
                    {userSuccess}
                  </div>
                )}

                {loadingUsers ? (
                  <div className="py-20 text-center">
                    <Loader className="animate-spin text-[#1E40AF] mx-auto mb-2" size={24} />
                    <p className="text-slate-400 text-sm">Obteniendo lista de usuarios...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] dark:border-slate-700 text-slate-500 font-semibold text-sm">
                          <th className="pb-3 px-4">Usuario</th>
                          <th className="pb-3 px-4">Rol</th>
                          <th className="pb-3 px-4">Fecha de Alta</th>
                          <th className="pb-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700 text-slate-700 dark:text-slate-300 text-sm">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-[#1C2434] dark:text-white flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-[#1E40AF] flex items-center justify-center font-bold text-xs">
                                {u.username.substring(0, 2).toUpperCase()}
                              </div>
                              {u.username}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                u.role === 'admin' 
                                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 border border-purple-200' 
                                  : u.role === 'director'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-[#1E40AF] dark:text-blue-300 border border-blue-200'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}>
                                {u.role === 'admin' ? 'Administrador' : u.role === 'director' ? 'Director' : 'Usuario'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES') : '-'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {u.username !== 'admin' ? (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all cursor-pointer"
                                  title="Dar de baja"
                                >
                                  <Trash2 size={16} />
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic pr-2">Sistema</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right: Add new user form */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-[#E2E8F0] dark:border-slate-700">
                <h3 className="text-lg font-bold text-[#1C2434] dark:text-white mb-6">Alta de Usuario</h3>
                <form onSubmit={handleCreateUser} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombre de Usuario</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <User size={16} />
                      </span>
                      <input 
                        type="text" 
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        placeholder="Ej. mgarcia"
                        className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#1E40AF]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Contraseña Temporal</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Key size={16} />
                      </span>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Contraseña"
                        className="w-full pl-10 pr-10 py-3 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#1E40AF]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1E40AF]"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Rol del Sistema</label>
                    <select
                      value={newRole}
                      onChange={e => setNewRole(e.target.value)}
                      className="w-full px-4 py-3 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#1E40AF]"
                    >
                      <option value="user">Usuario Común</option>
                      <option value="director">Director</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1E40AF] hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-[#1E40AF]/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <Plus size={18} />
                    Guardar Acceso
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 2: ALERTS */}
          {activeTab === 'alerts' && (
            <div className="max-w-3xl bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-[#E2E8F0] dark:border-slate-700">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#1C2434] dark:text-white">Configuración de Umbrales</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Establece cuántos días antes del vencimiento oficial los documentos se considerarán en estado de advertencia (color amarillo/rojo en las tablas).
                </p>
              </div>

              {settingsSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium flex items-center gap-2">
                  <CheckCircle size={18} />
                  Parámetros guardados con éxito en settings.json
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* Fianzas */}
                <div className="p-4 bg-slate-50 dark:bg-slate-700/20 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block text-sm">Cartas Fianzas</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Días previos para avisar vencimiento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      min="1"
                      max="180"
                      value={settings.fianzas_dias_previos}
                      onChange={e => setSettings({...settings, fianzas_dias_previos: parseInt(e.target.value) || 30})}
                      className="w-24 text-center py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1E40AF] font-bold"
                      required
                    />
                    <span className="text-sm font-semibold text-slate-500">días</span>
                  </div>
                </div>

                {/* SCTR */}
                <div className="p-4 bg-slate-50 dark:bg-slate-700/20 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block text-sm">SCTR - Salud y Pensión</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Notificación previa para renovación</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      min="1"
                      max="90"
                      value={settings.sctr_dias_previos}
                      onChange={e => setSettings({...settings, sctr_dias_previos: parseInt(e.target.value) || 15})}
                      className="w-24 text-center py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1E40AF] font-bold"
                      required
                    />
                    <span className="text-sm font-semibold text-slate-500">días</span>
                  </div>
                </div>

                {/* EMO */}
                <div className="p-4 bg-slate-50 dark:bg-slate-700/20 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block text-sm">EMO (Examen Médico Ocupacional)</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Notificación previa para re-evaluación</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      min="1"
                      max="120"
                      value={settings.emo_dias_previos}
                      onChange={e => setSettings({...settings, emo_dias_previos: parseInt(e.target.value) || 30})}
                      className="w-24 text-center py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1E40AF] font-bold"
                      required
                    />
                    <span className="text-sm font-semibold text-slate-500">días</span>
                  </div>
                </div>

                {/* Alertas de WhatsApp - Evolution API */}
                <div className="pt-6 border-t border-[#E2E8F0] dark:border-slate-700 space-y-6">
                  <div>
                    <h4 className="text-base font-bold text-[#1C2434] dark:text-white flex items-center gap-2">
                      <MessageSquare className="text-[#1E40AF]" size={20} />
                      Notificaciones por WhatsApp (Evolution API)
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                      Configura el gateway de mensajería para recibir alertas automáticas diarias sobre los vencimientos en tu celular.
                    </p>
                  </div>

                  {/* Toggle Activar */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/20 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white block text-sm">Habilitar canal de WhatsApp</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Activar o desactivar las alertas automáticas por WhatsApp</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.whatsapp_enabled}
                        onChange={e => setSettings({...settings, whatsapp_enabled: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#1E40AF]"></div>
                    </label>
                  </div>

                  {/* Configuración Adicional si está habilitado */}
                  {settings.whatsapp_enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-blue-50/50 dark:bg-slate-700/10 rounded-2xl border border-blue-100 dark:border-slate-700/50 animate-fadeIn">
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Número Destinatario (con código de país)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Smartphone size={16} />
                          </span>
                          <input 
                            type="text" 
                            value={settings.whatsapp_recipient || ''}
                            onChange={e => setSettings({...settings, whatsapp_recipient: e.target.value})}
                            placeholder="Ej. 51999888777"
                            className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-sm focus:outline-none bg-white dark:bg-slate-805 focus:border-[#1E40AF]"
                            required={settings.whatsapp_enabled}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">URL de Evolution API</label>
                        <input 
                          type="text" 
                          value={settings.evolution_api_url || ''}
                          onChange={e => setSettings({...settings, evolution_api_url: e.target.value})}
                          placeholder="Ej. http://localhost:8080"
                          className="w-full px-4 py-2.5 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-sm focus:outline-none bg-white dark:bg-slate-805 focus:border-[#1E40AF]"
                          required={settings.whatsapp_enabled}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">API Key (Token de Autorización)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Key size={16} />
                          </span>
                          <input 
                            type="password" 
                            value={settings.evolution_api_key || ''}
                            onChange={e => setSettings({...settings, evolution_api_key: e.target.value})}
                            placeholder="Ingrese su API Key"
                            className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-sm focus:outline-none bg-white dark:bg-slate-805 focus:border-[#1E40AF]"
                            required={settings.whatsapp_enabled}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombre de la Instancia</label>
                        <input 
                          type="text" 
                          value={settings.evolution_instance_name || ''}
                          onChange={e => setSettings({...settings, evolution_instance_name: e.target.value})}
                          placeholder="Ej. mcqs_instance"
                          className="w-full px-4 py-2.5 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-sm focus:outline-none bg-white dark:bg-slate-805 focus:border-[#1E40AF]"
                          required={settings.whatsapp_enabled}
                        />
                      </div>

                    </div>
                  )}

                  {/* Sección de Pruebas */}
                  {settings.whatsapp_enabled && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/20 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white block text-sm">Pruebas de Conectividad</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Prueba la conexión enviando un mensaje o ejecuta las alertas manuales de hoy.</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleTestWhatsApp}
                          disabled={testingWhatsApp || savingSettings || triggeringWhatsApp}
                          className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {testingWhatsApp ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                          Enviar Prueba
                        </button>
                        <button
                          type="button"
                          onClick={handleTriggerWhatsApp}
                          disabled={triggeringWhatsApp || savingSettings || testingWhatsApp}
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-[#1E40AF] dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {triggeringWhatsApp ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                          Forzar Alertas
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Resultados de Pruebas */}
                  {whatsappResult && (
                    <div className={`p-4 rounded-xl text-xs font-semibold border ${
                      whatsappResult.status === 'success' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                    }`}>
                      {whatsappResult.message}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-3 bg-[#1E40AF] hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-[#1E40AF]/20 flex items-center gap-2 cursor-pointer text-sm"
                  >
                    {savingSettings ? (
                      <Loader className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CONNECTIONS */}
          {activeTab === 'connections' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-[#1C2434] dark:text-white">Estado de la Infraestructura</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Conectividad en tiempo real de los servicios y bases de datos asociados.</p>
                </div>
                <button
                  onClick={fetchConnections}
                  disabled={checkingConnections}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-2 shadow-sm transition-all cursor-pointer text-sm disabled:opacity-50"
                >
                  <RefreshCw size={16} className={checkingConnections ? "animate-spin" : ""} />
                  Volver a verificar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. MySQL */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-[#E2E8F0] dark:border-slate-700 flex flex-col justify-between min-h-[200px]">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-[#1E40AF] rounded-2xl">
                        <Database size={24} />
                      </div>
                      {connectionStatus ? (
                        connectionStatus.mysql.status === 'ok' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold">
                            <CheckCircle size={12} />
                            En Línea
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full text-xs font-bold">
                            <ShieldAlert size={12} />
                            Error
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-xs italic">Verificando...</span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-800 dark:text-white mt-4 text-base">Base de Datos MySQL</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Conexión local al motor de almacenamiento relacional.</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
                    <span>Host: localhost</span>
                    <span>Puerto: 3306</span>
                  </div>
                  {connectionStatus?.mysql.error && (
                    <div className="mt-2 text-[10px] text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg truncate">
                      {connectionStatus.mysql.error}
                    </div>
                  )}
                </div>

                {/* 2. S3 remote-mcqs */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-[#E2E8F0] dark:border-slate-700 flex flex-col justify-between min-h-[200px]">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-[#1E40AF] rounded-2xl">
                        <Database size={24} />
                      </div>
                      {connectionStatus ? (
                        connectionStatus.s3_remote.status === 'ok' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold">
                            <CheckCircle size={12} />
                            En Línea
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full text-xs font-bold">
                            <ShieldAlert size={12} />
                            Error
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-xs italic">Verificando...</span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-800 dark:text-white mt-4 text-base">Backblaze S3 (General)</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Archivos de obras, contratos y documentos de trabajadores.</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
                    <span>Bucket: remote-mcqs</span>
                    <span>AWS-SDK S3</span>
                  </div>
                  {connectionStatus?.s3_remote.error && (
                    <div className="mt-2 text-[10px] text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg truncate">
                      {connectionStatus.s3_remote.error}
                    </div>
                  )}
                </div>

                {/* 3. S3 FIANZA-FACTURAS */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-[#E2E8F0] dark:border-slate-700 flex flex-col justify-between min-h-[200px]">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-[#1E40AF] rounded-2xl">
                        <Database size={24} />
                      </div>
                      {connectionStatus ? (
                        connectionStatus.s3_fianzas.status === 'ok' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold">
                            <CheckCircle size={12} />
                            En Línea
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full text-xs font-bold">
                            <ShieldAlert size={12} />
                            Error
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-xs italic">Verificando...</span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-800 dark:text-white mt-4 text-base">Backblaze S3 (FF)</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Archivos adjuntos para Cartas Fianzas y Facturas.</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
                    <span>Bucket: FIANZA-FACTURAS</span>
                    <span>AWS-SDK S3</span>
                  </div>
                  {connectionStatus?.s3_fianzas.error && (
                    <div className="mt-2 text-[10px] text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg truncate">
                      {connectionStatus.s3_fianzas.error}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-[#E2E8F0] dark:border-slate-700 space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#1C2434] dark:text-white">Registro de Actividad</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Auditoría del sistema con las últimas 100 operaciones críticas registradas.</p>
                </div>
                
                {/* Search input */}
                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    value={searchLogQuery}
                    onChange={e => setSearchLogQuery(e.target.value)}
                    placeholder="Filtrar por acción, usuario o detalles..."
                    className="w-full px-4 py-2 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#1E40AF] pr-10"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-slate-700 text-slate-500 font-semibold text-sm">
                      <th className="pb-3 px-4">Fecha / Hora</th>
                      <th className="pb-3 px-4">Usuario</th>
                      <th className="pb-3 px-4">Operación</th>
                      <th className="pb-3 px-4">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700 text-slate-700 dark:text-slate-300 text-xs">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('es-ES')}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                            {log.username}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              log.action.includes("Creación") 
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
                                : log.action.includes("Eliminación") 
                                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" 
                                  : "bg-blue-50 dark:bg-blue-900/20 text-[#1E40AF] dark:text-blue-300"
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-sm truncate" title={log.details}>
                            {log.details}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-slate-400 italic">
                          No se encontraron registros de auditoría que coincidan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
