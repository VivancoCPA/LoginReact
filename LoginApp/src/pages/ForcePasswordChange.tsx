import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPasswordValidationMessage } from '../utils/validation';
import { toast } from 'react-hot-toast';

// Reusable SVG icons for Eye / EyeSlash
const EyeIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

export const ForcePasswordChange: React.FC = () => {
  const navigate = useNavigate();
  const { user, tempPassword, changeTempPassword, logout } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expose immediate redirect if unauthenticated or fully confirmed
  useEffect(() => {
    if (!user || user.passwordConfirmed !== false || !tempPassword) {
      navigate('/login');
    } else {
      toast("Debe cambiar su contraseña antes de continuar.", { id: 'force-change-warning' });
    }
  }, [user, tempPassword, navigate]);

  // Real-time password complexity validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    if (value) {
      const validationMsg = getPasswordValidationMessage(value);
      setPasswordError(validationMsg);
    } else {
      setPasswordError(null);
    }

    if (confirmPassword && value !== confirmPassword) {
      setConfirmError('Las contraseñas no coinciden.');
    } else {
      setConfirmError(null);
    }
  };

  // Real-time password confirmation matching
  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    if (value && value !== password) {
      setConfirmError('Las contraseñas no coinciden.');
    } else {
      setConfirmError(null);
    }
  };

  const isFormValid = 
    password && 
    confirmPassword && 
    !passwordError && 
    !confirmError && 
    password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error('Por favor, cumpla con todos los requisitos de contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changeTempPassword(password);
      // Success toast and logout redirection are handled inside context.changeTempPassword
    } catch (err: any) {
      toast.error(err.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    logout();
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 dark:bg-brand-dark transition-colors duration-300 overflow-hidden select-none">
      
      {/* LEFT SIDE: Corporate Branding */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-slate-900 to-brand-dark border-r border-slate-800/60 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/35">
            <span className="font-extrabold text-white text-lg">E</span>
          </div>
          <span className="font-bold text-lg text-slate-100 tracking-wider">ENTERPRISE</span>
        </div>

        <div className="my-auto space-y-6 max-w-md relative z-10 text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Actualice su <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-brand-500">Contraseña</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 font-light leading-relaxed">
            Su cuenta ha sido creada por un Administrador con una contraseña temporal. Por motivos de seguridad, debe definir un nuevo password antes de acceder a la plataforma.
          </p>
        </div>

        <div className="text-xs text-slate-500 relative z-10 text-left">
          © {new Date().getFullYear()} Enterprise Inc. Todos los derechos reservados.
        </div>
      </div>

      {/* RIGHT SIDE: Password Form Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative text-left bg-slate-50 dark:bg-brand-dark transition-colors duration-300">
        <div className="absolute inset-0 bg-radial-gradient from-indigo-950/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-2xl shadow-2xl relative z-10 animate-fadeIn duration-500">
          
          <div className="text-center md:text-left mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Nueva Contraseña</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Complete los campos para asegurar su cuenta</p>
          </div>

          {/* User detail fields (Read-Only) */}
          <div className="p-4 bg-slate-100/80 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800/40 mb-6 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Usuario:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Correo Electrónico:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user?.email}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Field 1: New Password */}
            <div className="w-full flex flex-col gap-1.5 mb-4 relative">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Nueva Contraseña
              </label>
              <div className="relative rounded-lg overflow-hidden group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 pr-10 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/50 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
                    focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 
                    transition-all duration-300 ease-out group-hover:border-slate-400 dark:group-hover:border-slate-600/70
                    ${passwordError ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer focus:outline-none"
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              {passwordError && (
                <span className="text-xs font-medium text-red-400 pl-0.5 animate-fadeIn duration-200">
                  {passwordError}
                </span>
              )}
            </div>

            {/* Field 2: Confirm Password */}
            <div className="w-full flex flex-col gap-1.5 mb-4 relative">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Confirmar Contraseña
              </label>
              <div className="relative rounded-lg overflow-hidden group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirme su contraseña"
                  value={confirmPassword}
                  onChange={handleConfirmChange}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 pr-10 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/50 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
                    focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 
                    transition-all duration-300 ease-out group-hover:border-slate-400 dark:group-hover:border-slate-600/70
                    ${confirmError ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer focus:outline-none"
                >
                  {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              {confirmError && (
                <span className="text-xs font-medium text-red-400 pl-0.5 animate-fadeIn duration-200">
                  {confirmError}
                </span>
              )}
            </div>

            {/* Complexity Indicator Panel */}
            <div className="p-3 bg-slate-100/80 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800/50 text-[10px] text-slate-500 dark:text-slate-400 space-y-1.5 select-none">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Políticas de Creación de Password:</span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                  <span>Mínimo 8 caracteres</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                  <span>1 Mayúscula</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                  <span>1 Minúscula</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                  <span>1 Número</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${/[@$!%*?&#.\-_+=[\]{}()|:;'"<>,?~`/\\]/.test(password) ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                  <span>1 Carácter Especial (@, $, !, %, *, etc.)</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 font-semibold rounded-lg text-sm border border-slate-200 dark:border-slate-700/50 flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-600/20
                  flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]
                  transition-all duration-200 cursor-pointer
                  ${(!isFormValid || isSubmitting) ? 'opacity-50 cursor-not-allowed scale-100 hover:scale-100 hover:bg-indigo-600' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Establecer</span>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
};

export default ForcePasswordChange;
