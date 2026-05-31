import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import FormInput from '../components/FormInput';
import { validateEmail } from '../utils/validation';
import { toast } from 'react-hot-toast';

export const RecoverPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract initial email from React Router state if passed from Login
  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(!!initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleClearReadOnly = () => {
    setIsReadOnly(false);
    setEmail('');
    setEmailError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setEmailError('El correo electrónico es requerido.');
      toast.error('El correo electrónico es requerido.');
      return;
    }

    if (emailError || !validateEmail(email)) {
      toast.error('Por favor, ingrese un correo electrónico válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Verify if the email is registered in the database before requesting recovery
      const exists = await authService.checkEmailExists(email);
      if (!exists) {
        toast.error('El correo electrónico no existe. Contacte al Administrador.', { duration: 6000 });
        setIsSubmitting(false);
        return;
      }

      // 2. Request temporary password recovery dispatch
      await authService.forgotPassword(email);
      toast.success(
        'Se ha enviado un nuevo password temporal a su correo. Inicie sesión con sus nuevas credenciales.',
        { duration: 6000 }
      );
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'Error al procesar la solicitud.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 dark:bg-brand-dark transition-colors duration-300 overflow-hidden select-none text-left">
      
      {/* LEFT SIDE: Corporate Branding (Consistent with Login and ForcePasswordChange) */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-slate-900 to-brand-dark border-r border-slate-800/60 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/35">
            <span className="font-extrabold text-white text-lg">E</span>
          </div>
          <span className="font-bold text-lg text-slate-100 tracking-wider">ENTERPRISE</span>
        </div>

        <div className="my-auto space-y-6 max-w-md relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Recupere su <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-brand-500">Contraseña</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 font-light leading-relaxed">
            Solicite una contraseña temporal que le será enviada a su dirección de correo electrónico registrada. 
            Al iniciar sesión por primera vez con las nuevas credenciales, el sistema le pedirá definir un nuevo password permanente.
          </p>
        </div>

        <div className="text-xs text-slate-500 relative z-10">
          © {new Date().getFullYear()} Enterprise Inc. Todos los derechos reservados.
        </div>
      </div>

      {/* RIGHT SIDE: Password Recovery Form Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative bg-slate-50 dark:bg-brand-dark transition-colors duration-300">
        <div className="absolute inset-0 bg-radial-gradient from-indigo-950/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-2xl shadow-2xl relative z-10 animate-fadeIn duration-500">
          
          {/* Header Mobile Brand */}
          <div className="md:hidden flex items-center justify-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="font-extrabold text-white text-md">E</span>
            </div>
            <span className="font-bold text-md text-slate-800 dark:text-slate-100 tracking-wider">ENTERPRISE</span>
          </div>

          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Recuperar Contraseña</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Confirme su correo electrónico registrado para solicitar un nuevo password temporal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="relative">
              {isReadOnly ? (
                <div className="space-y-2">
                  <FormInput
                    label="Correo Electrónico"
                    id="email-input"
                    type="email"
                    value={email}
                    disabled={true}
                    className="cursor-not-allowed opacity-80 bg-slate-100/80 border-slate-200 dark:bg-slate-950/50 dark:border-slate-800"
                    readOnly
                  />
                  <div className="flex justify-end text-xs">
                    <button
                      type="button"
                      onClick={handleClearReadOnly}
                      className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-colors duration-200 cursor-pointer font-medium"
                    >
                      Ingresar otro correo
                    </button>
                  </div>
                </div>
              ) : (
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
              )}
            </div>

            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-500/15 rounded-xl text-xs leading-relaxed text-indigo-800 dark:text-indigo-300">
              <span className="font-semibold block mb-1">Nota de Seguridad:</span>
              El sistema enviará una contraseña temporal de un solo uso a la dirección confirmada. Se deshabilitará su contraseña anterior y se forzará un cambio de credenciales en su primer inicio de sesión.
            </div>

            <div className="flex gap-4 pt-2">
              <Link
                to="/login"
                className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 font-semibold rounded-lg text-sm border border-slate-200 dark:border-slate-700/50 flex items-center justify-center transition-all duration-200 cursor-pointer text-center"
              >
                Cancelar
              </Link>
              
              <button
                type="submit"
                disabled={isSubmitting || !email || !!emailError}
                className={`flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-600/20
                  flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]
                  transition-all duration-200 cursor-pointer
                  ${(isSubmitting || !email || !!emailError) ? 'opacity-50 cursor-not-allowed scale-100 hover:scale-100 hover:bg-indigo-600' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar</span>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
      
    </div>
  );
};

export default RecoverPassword;
