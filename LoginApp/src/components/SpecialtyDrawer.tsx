import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { specialtyService } from '../services/specialtyService';
import type { SpecialtyItem } from '../types/specialty';

interface SpecialtyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'create' | 'edit';
  specialty: SpecialtyItem | null;
  onSaveSuccess: () => void;
}

const formatDateToYYYYMMDD = (dateStr?: string) => {
  if (!dateStr) return '—';
  return dateStr.split('T')[0];
};

const SPECIALTY_IMAGES = [
  '/perfusion-svgrepo-com.svg',
  '/thermometer-svgrepo-com.svg',
  '/stethoscope-svgrepo-com.svg',
];

export const SpecialtyDrawer: React.FC<SpecialtyDrawerProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  specialty,
  onSaveSuccess,
}) => {
  const [drawerMode, setDrawerMode] = useState<'view' | 'create' | 'edit'>(initialMode);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [randomImage, setRandomImage] = useState('');

  // Choose a random specialty image when entering view mode
  useEffect(() => {
    if (drawerMode === 'view' && isOpen) {
      const randomIndex = Math.floor(Math.random() * SPECIALTY_IMAGES.length);
      setRandomImage(SPECIALTY_IMAGES[randomIndex]);
    }
  }, [drawerMode, isOpen, specialty?.id]);

  // Sync state when drawer opens, specialty changes, or mode changes
  useEffect(() => {
    if (isOpen) {
      setDrawerMode(initialMode);
      if ((initialMode === 'edit' || initialMode === 'view') && specialty) {
        setName(specialty.name || '');
        setDescription(specialty.description || '');
        setIsActive(specialty.isActive !== false);
      } else {
        setName('');
        setDescription('');
        setIsActive(true);
      }
      setErrors({});
    }
  }, [isOpen, initialMode, specialty]);

  // Sync drawer mode with itself if initial mode changes internally (e.g. clicking Edit)
  useEffect(() => {
    setDrawerMode(initialMode);
  }, [initialMode]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { name?: string; description?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre de la especialidad es obligatorio.';
    } else if (name.trim().length < 3) {
      newErrors.name = 'El nombre de la especialidad debe tener al menos 3 caracteres.';
    } else if (name.trim().length > 100) {
      newErrors.name = 'El nombre de la especialidad no puede exceder los 100 caracteres.';
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
      if (drawerMode === 'create') {
        await specialtyService.createSpecialty({
          name: name.trim(),
          description: description.trim(),
        });
        toast.success('Especialidad médica creada exitosamente.');
      } else {
        if (!specialty) return;
        await specialtyService.updateSpecialty(specialty.id, {
          name: name.trim(),
          description: description.trim(),
          isActive: isActive,
        });
        toast.success('Especialidad médica actualizada exitosamente.');
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      let msg = 'Ocurrió un error al procesar la solicitud.';
      if (err.response && err.response.status === 409) {
        msg = 'Ya existe una especialidad registrada con este nombre.';
      } else if (err.response && err.response.data && err.response.data.detail) {
        msg = err.response.data.detail;
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

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
              {drawerMode === 'create' 
                ? 'Nueva Especialidad' 
                : drawerMode === 'edit' 
                ? 'Editar Especialidad' 
                : 'Detalle de Especialidad'}
            </h3>
            {specialty && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 block truncate max-w-xs">
                ID: {specialty.id}
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
          
          {drawerMode === 'view' && specialty ? (
            /* VIEW MODE DETAILS */
            <div className="space-y-6 select-none">
              
              {/* Random SVG Image at Top */}
              <div className="flex justify-center py-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-4 shadow-sm">
                  {randomImage && (
                    <img 
                      src={randomImage} 
                      alt="Specialty Icon" 
                      className="w-12 h-12 object-contain dark:invert transition-all duration-300"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Nombre</span>
                  <span className="block mt-1 text-sm font-semibold text-slate-800 dark:text-slate-150">
                    {specialty.name}
                  </span>
                </div>

                {specialty.description && (
                  <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Descripción</span>
                    <span className="block mt-1 text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
                      {specialty.description}
                    </span>
                  </div>
                )}

                <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Estado</span>
                  <div className="mt-1">
                    {specialty.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-600/20">
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-md bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-600/20">
                        Inactiva
                      </span>
                    )}
                  </div>
                </div>

                <div className="pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Registrado el</span>
                  <span className="block mt-1 text-sm font-mono font-medium text-slate-700 dark:text-slate-300">
                    {formatDateToYYYYMMDD(specialty.createdAt)}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            /* CREATE AND EDIT FORM MODE */
            <div className="space-y-5">
              
              {/* Name Input */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  Nombre de la Especialidad
                </label>
                <input
                  type="text"
                  disabled={isLoading}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Ej. Cardiología"
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border rounded-xl text-sm transition-all outline-none duration-250
                    ${errors.name 
                      ? 'border-rose-300 dark:border-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
                      : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                />
                {errors.name && (
                  <span className="text-xs text-rose-500 pl-0.5 font-medium">{errors.name}</span>
                )}
              </div>

              {/* Description Input */}
              <div className="flex flex-col gap-1.5 text-left">
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
                  placeholder="Describa la especialidad médica..."
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

              {/* Status input - Only visible/editable in edit mode */}
              {drawerMode === 'edit' && (
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                    Estado de la Especialidad
                  </label>
                  
                  <div
                    onClick={() => !isLoading && setIsActive(!isActive)}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none
                      ${isActive 
                        ? 'bg-indigo-50/50 dark:bg-indigo-600/5 border-indigo-200 dark:border-indigo-600/35 hover:bg-indigo-50/70 dark:hover:bg-indigo-600/10' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 hover:bg-slate-50/30 dark:hover:bg-slate-800/10'}`}
                  >
                    <div className={`mt-0.5 w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 border transition-all duration-200
                      ${isActive
                        ? 'bg-indigo-600 dark:bg-indigo-700 border-indigo-600 dark:border-indigo-750 text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}
                    >
                      {isActive && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className={`block text-xs font-bold tracking-wide transition-colors
                        ${isActive ? 'text-indigo-650 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        Especialidad Activa
                      </span>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                        Active esta opción para habilitar la especialidad médica en el catálogo del sistema.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </form>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex justify-end gap-3 select-none">
          {drawerMode === 'view' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-sm font-medium text-slate-650 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => setDrawerMode('edit')}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/15 rounded-xl transition-all duration-200 cursor-pointer"
              >
                Editar Especialidad
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={drawerMode === 'edit' && initialMode === 'view' ? () => setDrawerMode('view') : onClose}
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
                {drawerMode === 'create' ? 'Crear Especialidad' : 'Guardar Cambios'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default SpecialtyDrawer;
