import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormInput from '../components/FormInput';
import { validateEmail, getPasswordValidationMessage } from '../utils/validation';
import { toast } from 'react-hot-toast';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen to session expiration or other Context errors dispatched via custom events
  useEffect(() => {
    const handleContextErrorToast = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        toast.error(customEvent.detail, { id: 'auth-context-error' });
      }
    };

    const handleContextSuccessToast = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        toast.success(customEvent.detail, { id: 'auth-context-success' });
      }
    };

    window.addEventListener('auth:toast:error', handleContextErrorToast);
    window.addEventListener('auth:toast:success', handleContextSuccessToast);

    return () => {
      window.removeEventListener('auth:toast:error', handleContextErrorToast);
      window.removeEventListener('auth:toast:success', handleContextSuccessToast);
    };
  }, []);

  // Real-time email validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError('Formato de correo electrónico no válido.');
    } else {
      setEmailError(null);
    }
  };

  // Real-time password validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      const validationMsg = getPasswordValidationMessage(value);
      setPasswordError(validationMsg);
    } else {
      setPasswordError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger validation checks
    if (!email) {
      setEmailError('El correo electrónico es requerido.');
      toast.error('El correo electrónico es requerido.');
      return;
    }
    if (!password) {
      setPasswordError('La contraseña es requerida.');
      toast.error('La contraseña es requerida.');
      return;
    }

    if (emailError || passwordError) {
      toast.error('Por favor, corrija los errores de validación.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await login(email, password);
      toast.success(`¡Bienvenido de vuelta, ${data.name}!`);
      navigate('/dashboard');
      
    } catch (err: any) {
      console.log(err.message);
      toast.error(err.message || 'Credenciales de inicio de sesión erróneas o cuenta inexistente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-brand-dark overflow-hidden">
      
      {/* LEFT SIDE: Brand & Corporate Branding (Desktop only, responsive collapse) */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-slate-900 to-brand-dark border-r border-slate-800/60 relative">
        {/* Subtle grid background pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        
        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/35">
            <span className="font-extrabold text-white text-lg">E</span>
          </div>
          <span className="font-bold text-lg text-slate-100 tracking-wider">ENTERPRISE</span>
        </div>

        {/* Center branding copy */}
        <div className="my-auto space-y-6 max-w-md relative z-10 text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Acceso Seguro a su <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-brand-500">Plataforma</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 font-light leading-relaxed">
            Consuma servicios empresariales con la máxima seguridad. Integrado de forma directa con ASP.NET Core API mediante tokenización segura JWT (Bearer) con expiración automática de 60 minutos.
          </p>
          
          <div className="flex gap-4 pt-4">
            <div className="glass-panel py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300">
              ⚡ React Stable
            </div>
            <div className="glass-panel py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300">
              📘 TypeScript
            </div>
            <div className="glass-panel py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300">
              💅 Tailwind v4
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="text-xs text-slate-500 relative z-10 text-left">
          © {new Date().getFullYear()} Enterprise Inc. Todos los derechos reservados.
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 bg-radial-gradient from-indigo-950/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-2xl shadow-2xl relative z-10 animate-fadeIn duration-500">
          
          {/* Header Mobile Brand */}
          <div className="md:hidden flex items-center justify-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="font-extrabold text-white text-md">E</span>
            </div>
            <span className="font-bold text-md text-slate-100 tracking-wider">ENTERPRISE</span>
          </div>

          <div className="text-center md:text-left mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Iniciar Sesión</h2>
            <p className="text-sm text-slate-400">Ingrese sus credenciales corporativas para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Correo Electrónico"
              id="email-input"
              type="email"
              placeholder="correo@empresa.com"
              value={email}
              onChange={handleEmailChange}
              error={emailError}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />

            <FormInput
              label="Contraseña"
              id="password-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={handlePasswordChange}
              error={passwordError}
              disabled={isSubmitting}
              autoComplete="current-password"
              required
            />

            {/* Password guidelines info box */}
            <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/50 text-[10px] text-slate-400 space-y-1.5 select-none text-left">
              <span className="font-semibold text-slate-300 block mb-0.5">Requisitos del Password:</span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                  <span>Mínimo 8 caracteres</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                  <span>1 Mayúscula</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                  <span>1 Minúscula</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                  <span>1 Número</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${/[@$!%*?&#.\-_+=[\]{}()|:;'"<>,?~`/\\]/.test(password) ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                  <span>1 Carácter Especial (@, $, !, %, *, etc.)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1 select-none">
              <Link
                to="/forgot-password"
                state={{ email }}
                className="text-slate-400 hover:text-indigo-400 hover:underline transition-colors duration-200"
              >
                ¿Olvidó su contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-600/20
                flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]
                transition-all duration-200 cursor-pointer
                ${isSubmitting ? 'opacity-70 cursor-not-allowed scale-100 hover:scale-100 hover:bg-indigo-600' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Ingresar</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-400 select-none">
            ¿No tiene una cuenta?{' '}
            <Link
              to="/register"
              className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors duration-200"
            >
              Registrar nuevo usuario
            </Link>
          </div>

        </div>
      </div>
      
    </div>
  );
};

export default Login;
