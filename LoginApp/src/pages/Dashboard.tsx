import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { authService } from '../services/authService';

export const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const expiryMinutes = Number(import.meta.env.VITE_TOKEN_EXPIRY_MINUTES || 60);
  const [minutesRemaining, setMinutesRemaining] = useState<number>(expiryMinutes);

  // Expiration Countdown calculation
  useEffect(() => {
    const calculateTimeRemaining = async () => {
      const timestampStr = localStorage.getItem('auth_timestamp');
      if (!timestampStr) return;

      const timestamp = Number(timestampStr);
      const diff = Date.now() - timestamp;
      const expiryLimit = expiryMinutes * 60 * 1000;
      const remainingMs = Math.max(0, expiryLimit - diff);
      const remainingMins = Math.ceil(remainingMs / (1000 * 60));
      
      setMinutesRemaining(remainingMins);

      // Trigger automatic silent refresh if it reaches 0 minutes
      if (remainingMs <= 0) {
        try {
          await authService.refreshToken();
        } catch {
          // Failure is handled globally via Axios response interceptor triggering auth:unauthorized
        }
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 10000); // Update every 10 seconds for precision

    return () => clearInterval(interval);
  }, [logout, expiryMinutes]);

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada correctamente.");
  };

  return (
    <div className="min-h-screen w-full bg-brand-dark flex flex-col">
      
      {/* MENU HEADER */}
      <header className="w-full glass-panel border-b border-slate-800/60 px-6 py-4 flex justify-between items-center relative z-25">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <span className="font-extrabold text-white text-md">E</span>
          </div>
          <span className="font-bold text-md text-slate-100 tracking-wider">ENTERPRISE</span>
        </div>

        {/* Menu Navigation */}
        <nav className="flex items-center gap-6">
          <span className="hidden sm:inline text-xs text-slate-400 font-medium select-none">
            Hola, <span className="text-slate-200">{user?.name} {user?.lastName || ''}</span>
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-900/80 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/30 border border-slate-700/50 rounded-lg text-xs font-semibold text-slate-300 transition-all duration-200 cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </nav>
      </header>

      {/* DASHBOARD BODY */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 flex flex-col gap-6 select-none text-left">
        
        {/* Welcome Banner */}
        <section className="glass-panel p-8 sm:p-10 rounded-2xl relative overflow-hidden flex flex-col gap-2">
          {/* Decorative glow backdrop */}
          <div className="absolute right-0 top-0 h-48 w-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">Panel de Control</span>
          <h2 className="text-3xl font-extrabold text-white">
            Bienvenido, {user?.name} {user?.lastName || ''}
          </h2>
          <p className="text-sm text-slate-400 font-light leading-relaxed max-w-xl">
            Su sesión ha sido iniciada y validada exitosamente a través de la API externa de ASP.NET Core. A continuación, puede visualizar los metadatos de su token JWT actual.
          </p>
        </section>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Expiration Timer Card */}
          <div className="glass-panel p-6 rounded-xl flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Sesión JWT Activa</h3>
              <p className="text-2xl font-black text-white">
                {minutesRemaining} <span className="text-xs font-medium text-slate-400">minutos restantes</span>
              </p>
            </div>
            
            {/* Progress bar visual aid */}
            <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(minutesRemaining / expiryMinutes) * 100}%` }}
              ></div>
            </div>

            <span className="text-[10px] text-slate-400 font-light leading-relaxed">
              La sesión tiene una expiración estricta de {expiryMinutes} minutos configurada en el cliente y validada en cada cambio de ruta.
            </span>
          </div>

          {/* User Details Card */}
          <div className="glass-panel p-6 rounded-xl flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detalles de Perfil</h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">Nombre:</span>
                <span className="font-semibold text-slate-200">{user?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">Apellido:</span>
                <span className="font-semibold text-slate-200">{user?.lastName || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Correo:</span>
                <span className="font-semibold text-slate-200">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Secure Interceptors Card */}
          <div className="glass-panel p-6 rounded-xl flex flex-col justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">CORS & Interceptores</h3>
              <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Cliente Axios Activo
              </p>
            </div>
            
            <span className="text-[10px] text-slate-400 font-light leading-relaxed">
              Las peticiones HTTP salientes inyectan automáticamente el token de portador `Bearer {token?.substring(0, 15)}...` en la cabecera de `Authorization`.
            </span>
          </div>

        </div>

        {/* Token Details display */}
        <section className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Token JWT Portador</h3>
            <button 
              onClick={() => {
                if (token) {
                  navigator.clipboard.writeText(token);
                  toast.success("¡Token copiado al portapapeles!");
                }
              }}
              className="text-[10px] bg-slate-900/60 hover:bg-slate-900 px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 border border-slate-800 transition-all cursor-pointer"
            >
              Copiar Token Completo
            </button>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-900 font-mono text-xs overflow-x-auto select-text text-indigo-300 whitespace-pre-wrap break-all max-h-32 scrollbar-thin">
            Bearer {token}
          </div>
        </section>

      </main>

    </div>
  );
};

export default Dashboard;
