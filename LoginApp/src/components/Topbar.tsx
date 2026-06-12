import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPhotoFullUrl } from '../utils/photo';

interface TopbarProps {
  onToggleSidebar: () => void;
  onOpenProfile: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  onOpenProfile,
  theme,
  onToggleTheme,
}) => {
  const { user, logout, activeRole } = useAuth();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect dynamic page title based on path
  const getPageTitle = (): string => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard General';
    if (path.includes('/patients/family-group')) return 'Grupo Familiar de Pacientes';
    if (path.includes('/medical/consultations')) return 'Consultas Médicas';
    if (path.includes('/medical/history')) return 'Historiales Clínicos';
    if (path.includes('/medical/exams')) return 'Exámenes Médicos';
    if (path.includes('/medical/tests')) return 'Pruebas Complementarias';
    if (path.includes('/medical/appointments')) return 'Agenda de Citas';
    if (path.includes('/admin/medical-centers')) return 'Centros Médicos';
    if (path.includes('/admin/center-types')) return 'Tipos de Centros';
    if (path.includes('/admin/insurances')) return 'Gestión de Aseguradoras';
    if (path.includes('/admin/doctors')) return 'Cuerpo Médico';
    if (path.includes('/admin/specialties')) return 'Especialidades Médicas';
    if (path.includes('/admin/users')) return 'Control de Usuarios';
    if (path.includes('/admin/roles')) return 'Gestión de Roles';
    return 'Plataforma Médica';
  };

  const getInitials = (): string => {
    if (!user?.name) return 'U';
    const first = user.name[0] || '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800/60 bg-white/75 dark:bg-slate-950/40 backdrop-blur-md px-6 select-none transition-colors duration-300">
      
      {/* LEFT: Hamburger & Dynamic Section Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 hidden sm:block leading-none">
          {getPageTitle()}
        </h1>
      </div>

      {/* RIGHT: Light/Dark Mode & User Dropdown */}
      <div className="flex items-center gap-4">
        
        {/* Dark/Light mode toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer focus:outline-none transition-colors duration-300"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-fadeIn">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-fadeIn">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
          )}
        </button>

        {/* User initials Avatar with dropdown menu */}
        <div className="flex items-center gap-3" ref={dropdownRef}>
          {user && (
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none">
                {user.name} {user.lastName}
              </span>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1.5 leading-none">
                {activeRole || 'Usuario'}
              </span>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm border-2 border-slate-200/20 shadow-md transition-colors cursor-pointer focus:outline-none overflow-hidden"
            >
              {user?.photoUrl ? (
                <img
                  src={getPhotoFullUrl(user.photoUrl)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials()
              )}
            </button>

            {/* User dropdown list menu */}
            <div className={`absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xl ring-1 ring-black/5 focus:outline-none transition-all duration-200 transform ${isDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
              
              {/* User name & email header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {user?.name} {user?.lastName}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-400 truncate">
                  {user?.email}
                </span>
                {activeRole && (
                  <div className="mt-2 flex">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                      {activeRole}
                    </span>
                  </div>
                )}
              </div>

            {/* Profile modification / account details buttons */}
            <div className="p-2 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  onOpenProfile();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span>Modificar Perfil</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer text-left focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            </div>

          </div>
        </div>

      </div>
      
    </div>

    </header>
  );
};
export default Topbar;
