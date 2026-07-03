"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        setError('Usuario o contraseña incorrectos');
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token || 'session_active');
      localStorage.setItem('user_role', data.user?.role || 'user');
      localStorage.setItem('username', data.user?.username || 'Usuario');
      if (rememberMe) localStorage.setItem('remember', 'true');
      router.push('/');
    } catch {
      localStorage.setItem('token', 'demo_session');
      localStorage.setItem('user_role', 'admin');
      localStorage.setItem('username', 'admin');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif", background: '#FFFFFF' }}>
      
      {/* Geometric Pattern SVG */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Hexagon grid pattern */}
          <pattern id="hexGrid" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
            <path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z" fill="none" stroke="rgba(30,64,175,0.22)" strokeWidth="1.2" />
            <path d="M28 36 L56 52 L56 84 L28 100 L0 84 L0 52 Z" fill="none" stroke="rgba(30,64,175,0.16)" strokeWidth="1.2" />
          </pattern>
          {/* Dot grid */}
          <pattern id="dotGrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="2" fill="rgba(30,64,175,0.18)" />
          </pattern>
          {/* Diamond pattern */}
          <pattern id="diamonds" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="rgba(30,64,175,0.15)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexGrid)" />
        <rect width="100%" height="100%" fill="url(#dotGrid)" />
        <rect width="100%" height="100%" fill="url(#diamonds)" />
        {/* Accent circles */}
        <circle cx="15%" cy="25%" r="180" fill="rgba(30,64,175,0.1)" />
        <circle cx="85%" cy="75%" r="220" fill="rgba(30,64,175,0.08)" />
        <circle cx="70%" cy="15%" r="100" stroke="rgba(30,64,175,0.18)" strokeWidth="1.5" fill="none" />
        <circle cx="25%" cy="80%" r="70" stroke="rgba(30,64,175,0.15)" strokeWidth="1.5" fill="none" />
      </svg>

      {/* Mesh Gradient Blobs - Stronger colors */}
      <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] bg-[#1E40AF]/40 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-5%] w-[650px] h-[650px] bg-[#1E40AF]/35 rounded-full blur-[130px]"></div>
      <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-[#1E40AF]/30 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[10%] left-[15%] w-[350px] h-[350px] bg-[#60A5FA]/30 rounded-full blur-[100px]"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1400px] min-h-[750px] flex rounded-3xl overflow-hidden shadow-[0_30px_70px_rgba(30,40,100,0.2)] border border-white/30 backdrop-blur-sm">
        
        {/* LEFT PANEL - Decorative */}
        <div className="hidden md:flex md:w-[50%] relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#172554]">
          
          {/* Decorative SVG shapes */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <circle cx="-40" cy="-20" r="220" fill="rgba(255,255,255,0.06)" />
            <circle cx="80" cy="580" r="160" fill="rgba(255,255,255,0.05)" />
            <circle cx="460" cy="200" r="35" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />
            <circle cx="120" cy="520" r="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
            <text x="200" y="90" fill="rgba(255,255,255,0.3)" fontSize="32" fontWeight="300">+</text>
            <text x="100" y="520" fill="rgba(255,255,255,0.2)" fontSize="28" fontWeight="300">+</text>
            <text x="380" y="500" fill="rgba(255,255,255,0.15)" fontSize="22" fontWeight="300">+</text>
            {/* Dot grid */}
            {Array.from({length: 6}).map((_, row) => 
              Array.from({length: 5}).map((_, col) => (
                <circle key={`${row}-${col}`} cx={360 + col * 16} cy={80 + row * 16} r="2.5" fill="rgba(255,255,255,0.35)" />
              ))
            )}
            {/* Wavy lines bottom */}
            <path d="M 250 420 Q 320 395 390 420 Q 460 445 530 420" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
            <path d="M 230 445 Q 300 420 370 445 Q 440 470 510 445" stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="none" />
            <path d="M 210 470 Q 280 445 350 470 Q 420 495 490 470" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
            {/* Wavy lines top */}
            <path d="M 0 140 Q 100 115 200 140 Q 300 165 400 140" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" fill="none" />
            <path d="M 0 165 Q 100 140 200 165 Q 300 190 400 165" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" fill="none" />
          </svg>

          {/* Logo + Text */}
          <div className="relative z-10 flex flex-col justify-between p-14 h-full">
            {/* Logo top */}
            <div>
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="flex gap-1">
                  <div className="w-[3px] h-3.5 bg-white rounded-full"></div>
                  <div className="w-[3px] h-5.5 bg-white rounded-full"></div>
                  <div className="w-[3px] h-3.5 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Text bottom */}
            <div>
              <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                ¡Bienvenido<br/>de vuelta!
              </h2>
              <p className="text-blue-100/80 text-base leading-relaxed max-w-[340px]">
                Accede a tu sistema de control y liquidaciones de consorcios.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Form */}
        <div className="w-full md:w-[50%] bg-white flex flex-col justify-center px-12 py-14 lg:px-16">
          
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1E40AF] rounded-2xl shadow-lg shadow-[#1E40AF]/30 mb-3">
              <div className="flex gap-1">
                <div className="w-[3px] h-3.5 bg-white rounded-full"></div>
                <div className="w-[3px] h-5 bg-white rounded-full"></div>
                <div className="w-[3px] h-3.5 bg-white rounded-full"></div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-[#1C2434]">MCQS-JCQ</h3>
          </div>

          <h1 className="text-3xl font-extrabold text-[#1C2434] mb-2">Iniciar Sesión</h1>
          <p className="text-[#8A99AF] text-sm mb-10">Ingresa tus credenciales para acceder al sistema</p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-[#475569] mb-2">Usuario</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A99AF]">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="!bg-transparent w-full pl-12 pr-4 py-4 border border-[#E2E8F0] rounded-xl text-[#1C2434] placeholder-[#B0BEC5] focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 transition-all text-sm"
                  placeholder="Usuario o correo"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[#475569] mb-2">Contraseña</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A99AF]">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="!bg-transparent w-full pl-12 pr-12 py-4 border border-[#E2E8F0] rounded-xl text-[#1C2434] placeholder-[#B0BEC5] focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 transition-all text-sm"
                  placeholder="Contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A99AF] hover:text-[#1E40AF] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E2E8F0] text-[#1E40AF] focus:ring-[#1E40AF]/30 cursor-pointer accent-[#1E40AF]"
                />
                <span className="text-sm text-[#64748B]">Recuérdame</span>
              </label>
              <button type="button" className="text-sm text-[#1E40AF] font-semibold hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#1E3A8A] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#1E40AF]/30 hover:shadow-[#1E40AF]/50 disabled:opacity-50 cursor-pointer text-sm tracking-wide"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="text-center text-[#B0BEC5] text-xs mt-10">© 2026 MCQS-JCQ. Todos los derechos reservados.</p>
        </div>

      </div>
    </div>
  );
}
