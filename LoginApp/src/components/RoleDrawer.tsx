import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { roleService } from '../services/roleService';
import type { RoleItem } from '../types/role';

interface RoleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  role: RoleItem | null;
  onSaveSuccess: () => void;
}

export const RoleDrawer: React.FC<RoleDrawerProps> = ({
  isOpen,
  onClose,
  mode,
  role,
  onSaveSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Sync state when drawer opens or role changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && role) {
        setName(role.name || '');
        setDescription(role.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setErrors({});
    }
  }, [isOpen, mode, role]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { name?: string; description?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre del rol es obligatorio.';
    } else if (name.trim().length < 3) {
      newErrors.name = 'El nombre del rol debe tener al menos 3 caracteres.';
    }

    if (description.trim().length > 250) {
      newErrors.description = 'La descripción no puede exceder los 250 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Por favor, corrija los errores en el formulario.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'create') {
        await roleService.createRole({
          name: name.trim(),
          description: description.trim(),
        });
        toast.success('Rol creado exitosamente.');
      } else {
        if (!role) return;
        await roleService.updateRole(role.id, {
          name: name.trim(),
          description: description.trim(),
        });
        toast.success('Información del rol actualizada.');
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      let msg = 'Ocurrió un error al procesar la solicitud.';
      if (err.response && err.response.status === 409) {
        msg = 'Ya existe un rol registrado con este nombre.';
      } else if (err.response && err.response.data && err.response.data.detail) {
        msg = err.response.data.detail;
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isSystemRole = mode === 'edit' && role?.isSystemRole === true;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-fadeIn">
      {/* Backdrop blur overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Slide-over Right Drawer Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 transition-transform duration-300 ease-out transform translate-x-0">
        
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20 text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              {mode === 'create' ? 'Nuevo Rol' : 'Editar Rol'}
            </h3>
            {mode === 'edit' && role && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 block truncate max-w-xs">
                ID: {role.id}
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer focus:outline-none transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left">
          
          <div className="space-y-5">
            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                Nombre del Rol {isSystemRole && <span className="text-[10px] text-indigo-500 font-normal">(PROTEGIDO)</span>}
              </label>
              <input
                type="text"
                disabled={isLoading || isSystemRole}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Ej. Auditor"
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border rounded-xl text-sm transition-all outline-none duration-250
                  ${isSystemRole 
                    ? 'border-slate-200 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 cursor-not-allowed bg-slate-100/50 dark:bg-slate-900/30' 
                    : errors.name 
                      ? 'border-rose-300 dark:border-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
                      : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
              />
              {errors.name && (
                <span className="text-xs text-rose-500 pl-0.5 font-medium">{errors.name}</span>
              )}
              {isSystemRole && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 pl-0.5 leading-relaxed">
                  Este es un rol predeterminado del sistema y su nombre no puede ser modificado.
                </span>
              )}
            </div>

            {/* Description Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                Descripción
              </label>
              <textarea
                disabled={isLoading}
                value={description}
                rows={4}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
                }}
                placeholder="Describa el alcance de los privilegios de este rol..."
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border rounded-xl text-sm transition-all outline-none duration-250 resize-none
                  ${errors.description 
                    ? 'border-rose-300 dark:border-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
              />
              {errors.description && (
                <span className="text-xs text-rose-500 pl-0.5 font-medium">{errors.description}</span>
              )}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 pl-0.5 text-right font-medium">
                {250 - description.length} caracteres restantes
              </span>
            </div>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex justify-end gap-3 select-none">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-650 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/15 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-75"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {mode === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default RoleDrawer;
