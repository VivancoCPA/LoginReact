import React from 'react';
import { Link } from 'react-router-dom';

export const Register: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-brand-dark flex items-center justify-center p-6 sm:p-12 select-none text-left">
      <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-2xl shadow-2xl space-y-6">
        
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-2">Crear Cuenta</h2>
          <p className="text-sm text-slate-400">Esta funcionalidad se implementará en la siguiente especificación.</p>
        </div>

        <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-xs leading-relaxed text-indigo-300">
          <span className="font-semibold block mb-1">Nota del Sistema:</span>
          El flujo de registro de usuario completo incluirá la verificación de perfiles de usuario, confirmación de correo y sincronización de datos con ASP.NET Core API.
        </div>

        <Link
          to="/login"
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg text-sm border border-slate-700/50 flex items-center justify-center transition-all duration-200 cursor-pointer"
        >
          Volver al Login
        </Link>

      </div>
    </div>
  );
};

export default Register;
