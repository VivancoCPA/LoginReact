import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

// Simple mapping to translate backend technical role names to user-friendly titles and descriptions
const ROLE_METADATA: Record<
  string,
  { title: string; desc: string; icon: string }
> = {
  SuperAdmin: {
    title: "Super Administrador",
    desc: "Acceso global ilimitado a todas las configuraciones, auditorías y gestión de usuarios.",
    icon: "👑",
  },
  Admin: {
    title: "Administrador de Grupos",
    desc: "Administre el personal, pacientes y configuraciones dentro de su ámbito de centro asignado.",
    icon: "💼",
  },
  Doctor: {
    title: "Personal Médico",
    desc: "Acceda a consultas, agendas de citas y expedientes médicos de pacientes.",
    icon: "🩺",
  },
  Patient: {
    title: "Paciente",
    desc: "Gestione su grupo familiar, agende consultas y visualice sus expedientes médicos.",
    icon: "❤️",
  },
  User: {
    title: "Usuario Estándar",
    desc: "Acceso general para consultas básicas y perfiles de usuario.",
    icon: "👤",
  },
};

export const ChooseRole: React.FC = () => {
  const navigate = useNavigate();
  const { user, switchActiveRole, logout } = useAuth();
  const roles = user?.roles || [];
  const [isSelecting, setIsSelecting] = React.useState(false);

  const handleSelectRole = async (role: string) => {
    if (isSelecting) return;
    setIsSelecting(true);
    try {
      await switchActiveRole(role);
      toast.success(
        `Rol "${ROLE_METADATA[role]?.title || role}" seleccionado correctamente.`,
      );
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "No se pudo cambiar al rol seleccionado.");
    } finally {
      setIsSelecting(false);
    }
  };

  const getRoleDisplayData = (role: string, apiDesc?: string) => {
    const local = ROLE_METADATA[role];
    return {
      title: local?.title || role,
      desc:
        apiDesc ||
        local?.desc ||
        "Acceso al módulo y sus respectivas funciones asignadas.",
      icon: local?.icon || "⚙️",
    };
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 dark:bg-brand-dark transition-colors duration-300 overflow-hidden">
      {/* LEFT SIDE: Brand & Corporate Branding (Desktop only) */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-slate-900 to-brand-dark border-r border-slate-800/60 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/35">
            <span className="font-extrabold text-white text-lg">E</span>
          </div>
          <span className="font-bold text-lg text-slate-100 tracking-wider">
            ENTERPRISE
          </span>
        </div>

        {/* Center branding copy */}
        <div className="my-auto space-y-6 max-w-md relative z-10 text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Seleccione su{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-brand-500">
              Rol de Acceso
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 font-light leading-relaxed">
            Su cuenta posee múltiples perfiles de acceso autorizados. Seleccione
            el rol con el que desea operar en esta sesión de la aplicación.
          </p>

          <div className="flex gap-4 pt-4">
            <div className="glass-panel py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300">
              🔒 Seguridad Multi-Rol
            </div>
            <div className="glass-panel py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300">
              ⚙️ Permisos Aislados
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="text-xs text-slate-500 relative z-10 text-left">
          © {new Date().getFullYear()} Enterprise Inc. Todos los derechos
          reservados.
        </div>
      </div>

      {/* RIGHT SIDE: Role Selector Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative bg-slate-50 dark:bg-brand-dark transition-colors duration-300">
        <div className="absolute inset-0 bg-radial-gradient from-indigo-950/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-2xl shadow-2xl relative z-10 animate-fadeIn duration-500">
          {/* Header Mobile Brand */}
          <div className="md:hidden flex items-center justify-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="font-extrabold text-white text-md">E</span>
            </div>
            <span className="font-bold text-md text-slate-800 dark:text-slate-100 tracking-wider">
              ENTERPRISE
            </span>
          </div>

          <div className="text-center md:text-left mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Selección de Perfil
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Elija un rol para iniciar su espacio de trabajo
            </p>
          </div>

          {roles.length === 0 ? (
            /* ZERO ROLES ERROR CARD */
            <div className="space-y-6 text-left">
              <div className="p-4 bg-red-500/10 border border-red-500/25 dark:border-red-500/35 rounded-xl flex items-start gap-3.5">
                <span
                  className="text-2xl mt-0.5"
                  role="img"
                  aria-label="warning"
                >
                  ⚠️
                </span>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-650 dark:text-red-400">
                    No tiene Rol asignado
                  </h4>
                  <p className="text-xs text-red-650 dark:text-red-400/80 leading-relaxed font-medium">
                    Su usuario no tiene ningún rol asignado en el sistema. Por
                    favor, comuníquese con el Administrador para solicitar
                    accesos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="w-full py-3 px-4 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
              >
                Volver al Login
              </button>
            </div>
          ) : (
            /* LIST ROLES */
            <div className="space-y-4 text-left">
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1.5 custom-scrollbar relative">
                {isSelecting && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-500"></div>
                  </div>
                )}
                {roles.map((roleObj) => {
                  const { title, desc, icon } = getRoleDisplayData(
                    roleObj.name,
                    roleObj.description,
                  );
                  return (
                    <button
                      key={roleObj.name}
                      type="button"
                      disabled={isSelecting}
                      onClick={() => handleSelectRole(roleObj.name)}
                      className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-md transition-all duration-200 text-left cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span className="text-2xl mt-0.5 select-none shrink-0">
                        {icon}
                      </span>
                      <div className="space-y-0.5">
                        <span className="block text-sm font-bold text-slate-850 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {title}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                          {desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-950/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
                    />
                  </svg>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChooseRole;
