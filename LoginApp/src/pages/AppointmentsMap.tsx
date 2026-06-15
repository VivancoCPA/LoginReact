import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface MapState {
  latitude?: number;
  longitude?: number;
  name?: string;
  address?: string;
}

export const AppointmentsMap: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const state = location.state as MapState | null;

  // Default coordinate fallback (Vivanco Central Health Hub coordinates)
  const latitude = state?.latitude ?? -12.084722;
  const longitude = state?.longitude ?? -77.049444;
  const centerName = state?.name ?? 'Sede Central San Isidro';
  const centerAddress = state?.address ?? 'Av. Salaverry 2802, San Isidro, Lima';

  const [zoomLevel, setZoomLevel] = useState<number>(3); // Zoom multiplier: 1x, 2x, 3x, 4x, 5x

  const handleBack = () => {
    navigate('/patients/appointments');
  };

  // Convert zoom multiplier to bounding box offset delta in degrees
  const getBBoxDelta = () => {
    switch (zoomLevel) {
      case 1: return 0.02;     // Zoom 100% (Very zoomed out)
      case 2: return 0.01;     // Zoom 200%
      case 3: return 0.005;    // Zoom 300% (Default)
      case 4: return 0.0025;   // Zoom 400%
      case 5: return 0.001;    // Zoom 500% (Very zoomed in)
      default: return 0.005;
    }
  };

  const delta = getBBoxDelta();
  const minLon = longitude - delta;
  const minLat = latitude - delta;
  const maxLon = longitude + delta;
  const maxLat = latitude + delta;

  // OpenStreetMap embed iframe source URL with coordinates marker
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <div className="flex flex-col h-full w-full text-left overflow-hidden gap-4">
      
      {/* Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 select-none">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-650 dark:text-slate-400 dark:hover:text-indigo-400 mb-1.5 transition-colors cursor-pointer focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            <span>Volver al Control de Citas</span>
          </button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            Geolocalización del Centro Médico
          </h2>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5 p-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm shrink-0">
          <button
            type="button"
            disabled={zoomLevel <= 1}
            onClick={() => setZoomLevel((z) => Math.max(z - 1, 1))}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-sm font-extrabold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
            title="Reducir Zoom"
          >
            –
          </button>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-350 w-12 text-center select-none">
            {zoomLevel * 100}%
          </span>
          <button
            type="button"
            disabled={zoomLevel >= 5}
            onClick={() => setZoomLevel((z) => Math.min(z + 1, 5))}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-sm font-extrabold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
            title="Aumentar Zoom"
          >
            +
          </button>
        </div>
      </div>

      {/* Main Map Viewer Panel */}
      <div className="flex-1 relative rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner bg-slate-150 dark:bg-slate-950">
        
        {/* OpenStreetMap Iframe Embed */}
        <iframe
          title={`Ubicación de ${centerName}`}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          className="absolute inset-0 w-full h-full border-none opacity-90 dark:opacity-80 dark:invert-[0.9] dark:hue-rotate-[180deg] transition-all duration-300"
        />

        {/* Floating Detail Panel (Glassmorphic details card) */}
        <div className="absolute bottom-5 left-5 right-5 sm:right-auto sm:w-[380px] glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/90 backdrop-blur-lg shadow-xl text-left select-text z-20">
          <div className="flex items-start gap-4">
            
            {/* Medical center pin badge */}
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>

            {/* Information listing */}
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/20">
                Punto de Cita
              </span>
              
              <h3 className="text-base font-bold text-slate-800 dark:text-white mt-2 truncate">
                {centerName}
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {centerAddress}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 grid grid-cols-2 gap-3 font-mono text-[10px] select-all">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                  <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Latitud</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{latitude.toFixed(6)}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                  <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Longitud</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{longitude.toFixed(6)}</span>
                </div>
              </div>

              {/* Action buttons inside card */}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-650 dark:hover:text-indigo-400 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  Regresar
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default AppointmentsMap;
