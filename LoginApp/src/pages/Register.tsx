import React from 'react';
import { Link } from 'react-router-dom';

export const Register: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-brand-dark transition-colors duration-300 flex items-center justify-center p-6 sm:p-12 select-none text-left">
      <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-2xl shadow-2xl space-y-6">
        
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Crear Cuenta</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Esta funcionalidad se implementará en la siguiente especificación.</p>
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-xs leading-relaxed text-indigo-800 dark:text-indigo-300">
          <span className="font-semibold block mb-1">Nota del Sistema:</span>
          El flujo de registro de usuario completo incluirá la verificación de perfiles de usuario, confirmación de correo y sincronización de datos con ASP.NET Core API.
        </div>

        <Link
          to="/login"
          className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 font-semibold rounded-lg text-sm border border-slate-200 dark:border-slate-700/50 flex items-center justify-center transition-all duration-200 cursor-pointer"
        >
          Volver al Login
        </Link>

      </div>
    </div>
  );
};

export default Register;
