import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';

interface UserRolesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onSaveSuccess: () => void;
}

export const UserRolesDialog: React.FC<UserRolesDialogProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  onSaveSuccess,
}) => {
  const [initialRoles, setInitialRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchRolesData = async () => {
        setIsLoading(true);
        try {
          const [userRolesData, systemRolesData] = await Promise.all([
            userService.getUserRoles(userId),
            roleService.getRoles().catch((err) => {
              console.error('Failed to fetch system roles, falling back to defaults', err);
              return [
                { id: '1', name: 'Admin', description: 'Acceso total de administración al sistema' },
                { id: '2', name: 'User', description: 'Acceso estándar para interactuar con la plataforma' },
                { id: '3', name: 'Auditor', description: 'Lectura y auditoría pasiva de registros e informes' },
                { id: '4', name: 'Asegurador', description: 'Visualización y gestión de aseguradoras y convenios' },
              ];
            })
          ]);
          
          const roles = userRolesData.roles || [];
          setInitialRoles(roles);
          setSelectedRoles(roles);
          setAvailableRoles(systemRolesData || []);
        } catch (error) {
          console.error('Error fetching user roles:', error);
          toast.error('Error al cargar los roles asignados del usuario.');
          onClose();
        } finally {
          setIsLoading(false);
        }
      };
      fetchRolesData();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleToggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Determine what roles to add and remove
      const rolesToAdd = selectedRoles.filter((r) => !initialRoles.includes(r));
      const rolesToRemove = initialRoles.filter((r) => !selectedRoles.includes(r));

      // Process assignments
      await Promise.all([
        ...rolesToAdd.map((r) => userService.assignUserRole(userId, r)),
        ...rolesToRemove.map((r) => userService.removeUserRole(userId, r)),
      ]);

      toast.success('Roles de usuario actualizados correctamente.');
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving user roles:', error);
      toast.error('Ocurrió un error al actualizar los roles.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={isSaving ? undefined : onClose}
      />

      {/* Slide-over Right Drawer Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 transition-transform duration-300 ease-out transform translate-x-0">
        
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20 text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Asociar Roles
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 block truncate max-w-xs">
              Usuario: {userEmail}
            </span>
          </div>
          
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer focus:outline-none transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Role Checklist */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left">
          {isLoading ? (
            <div className="space-y-3 py-6">
              <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
              <div className="h-6 w-5/6 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
              <div className="h-6 w-2/3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            </div>
          ) : (
            <div className="space-y-3">
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 select-none">
                Roles del Sistema Disponibles
              </span>
              
              {availableRoles.map((role) => {
                const isChecked = selectedRoles.includes(role.name);
                return (
                  <div
                    key={role.name}
                    onClick={() => !isSaving && handleToggleRole(role.name)}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none
                      ${isChecked 
                        ? 'bg-indigo-50/50 dark:bg-indigo-600/5 border-indigo-200 dark:border-indigo-600/35 hover:bg-indigo-50/70 dark:hover:bg-indigo-600/10' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 hover:bg-slate-50/30 dark:hover:bg-slate-800/10'}`}
                  >
                    {/* Visual Checkbox element */}
                    <div className={`mt-0.5 w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 border transition-all duration-200
                      ${isChecked
                        ? 'bg-indigo-600 dark:bg-indigo-700 border-indigo-600 dark:border-indigo-750 text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}
                    >
                      {isChecked && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <span className={`block text-sm font-bold tracking-wide transition-colors
                        ${isChecked ? 'text-indigo-650 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        {role.name}
                      </span>
                      <span className="block text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                        {role.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex justify-end gap-3 select-none">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            disabled={isLoading || isSaving}
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/15 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-75"
          >
            {isSaving && (
              <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            Guardar Cambios
          </button>
        </div>

      </div>
    </div>
  );
};
export default UserRolesDialog;
