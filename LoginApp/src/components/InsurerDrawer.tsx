import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import FormInput from './FormInput';
import { insurerService } from '../services/insurerService';
import { getPhotoFullUrl } from '../utils/photo';
import type { InsurerItem } from '../types/insurer';

interface InsurerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'create' | 'edit';
  insurer: InsurerItem | null;
  onSaveSuccess: () => void;
}

const formatDateToYYYYMMDD = (dateStr?: string) => {
  if (!dateStr) return '—';
  // Standard format: yyyy-mm-dd
  return dateStr.split('T')[0];
};

export const InsurerDrawer: React.FC<InsurerDrawerProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  insurer,
  onSaveSuccess,
}) => {
  const [mode, setMode] = useState<'view' | 'create' | 'edit'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [personInCharge, setPersonInCharge] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Form Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // File picker reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync mode and reset errors when drawer toggles
  useEffect(() => {
    setMode(initialMode);
    setErrors({});
  }, [initialMode, isOpen]);

  // Sync insurer data into form state
  useEffect(() => {
    if (isOpen && insurer) {
      setName(insurer.name || '');
      setAddress(insurer.address || '');
      setPhone(insurer.phone || '');
      setEmail(insurer.email || '');
      setPersonInCharge(insurer.personInCharge || '');
      setLogoUrl(insurer.logoUrl || '');
      setPhotoFile(null);
    } else if (isOpen && mode === 'create') {
      setName('');
      setAddress('');
      setPhone('');
      setEmail('');
      setPersonInCharge('');
      setLogoUrl('');
      setPhotoFile(null);
    }
  }, [isOpen, insurer, mode]);

  if (!isOpen) return null;

  // Generate fallback initials for Avatar
  const getInitials = () => {
    if (!name.trim()) return 'A';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) || '';
    const second = parts[1]?.charAt(0) || '';
    return `${first}${second}`.toUpperCase();
  };

  // Photo change handler (validates size <= 2MB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('El tamaño del logo no debe exceder los 2MB.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setPhotoFile(file);

    // Convert file to base64 for real-time preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres.';
    }

    if (!address.trim()) {
      newErrors.address = 'La dirección es obligatoria.';
    } else if (address.trim().length < 2) {
      newErrors.address = 'La dirección debe tener al menos 2 caracteres.';
    }

    if (!phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio.';
    } else {
      // Validate: digits and optional leading '+'
      const phoneRegex = /^\+?[0-9]+$/;
      if (!phoneRegex.test(phone.trim())) {
        newErrors.phone = 'El teléfono debe ser numérico y puede empezar con "+".';
      }
    }

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'El formato de correo no es válido.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    if (!validate()) {
      toast.error('Por favor, corrija los errores en el formulario.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'create') {
        await insurerService.createInsurer({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          personInCharge: personInCharge.trim() || undefined,
          photo: photoFile,
        });
        toast.success('Aseguradora creada exitosamente.');
      } else {
        // Edit mode
        if (!insurer) return;
        await insurerService.updateInsurer(insurer.id, {
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          personInCharge: personInCharge.trim() || undefined,
          logoUrl: logoUrl || undefined,
          photo: photoFile,
          isActive: insurer.isActive,
        });
        toast.success('Aseguradora actualizada exitosamente.');
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      let msg = 'Ocurrió un error al procesar la aseguradora.';
      if (err.response && err.response.status === 409) {
        msg = 'El correo electrónico ya está registrado por otra aseguradora.';
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
              {mode === 'create' ? 'Nueva Aseguradora' : mode === 'edit' ? 'Editar Aseguradora' : 'Detalle de Aseguradora'}
            </h3>
            {insurer && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 block truncate max-w-xs">
                ID: {insurer.id}
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
          
          {/* Avatar / Photo section at the top */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={mode === 'view' || isLoading}
              />
              
              <div 
                onClick={() => mode !== 'view' && !isLoading && fileInputRef.current?.click()}
                className={`w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden flex items-center justify-center select-none transition-all duration-300 relative
                  ${mode !== 'view' ? 'cursor-pointer hover:brightness-95 hover:scale-105 active:scale-95 group' : ''}
                  ${logoUrl ? '' : 'bg-gradient-to-tr from-rose-500 to-amber-600 text-white'}`}
              >
                {logoUrl ? (
                  <img src={getPhotoFullUrl(logoUrl)} alt="Logo Aseguradora" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-extrabold tracking-wider">{getInitials()}</span>
                )}
                
                {/* Image upload hover mask */}
                {mode !== 'view' && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mb-1 animate-pulse">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Subir Logo</span>
                  </div>
                )}
              </div>
            </div>
            
            {mode !== 'view' && (
              <span className="mt-2.5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold select-none">
                Máximo 2MB (JPG/PNG)
              </span>
            )}
          </div>

          {/* Form Fields block */}
          <div className="space-y-4">
            
            {mode === 'view' ? (
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl">
                <div className="col-span-2">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nombre</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">{name}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Correo Electrónico</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block break-all">{email}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Teléfono</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">{phone}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contacto / Encargado</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">{personInCharge || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dirección</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">{address}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Usuarios Asegurados</span>
                  <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-600/20">
                    {insurer?.insuredUsersCount ?? 0}
                  </span>
                </div>
                {insurer?.createdAt && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fecha Registro</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">
                      {formatDateToYYYYMMDD(insurer.createdAt)}
                    </span>
                  </div>
                )}
                {insurer?.updatedAt && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Última Modificación</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">
                      {formatDateToYYYYMMDD(insurer.updatedAt)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <FormInput
                  label="Nombre de la Aseguradora"
                  id="insurer-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  error={errors.name}
                  disabled={isLoading}
                  required
                />

                <FormInput
                  label="Correo Electrónico"
                  id="insurer-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  error={errors.email}
                  disabled={isLoading}
                  required
                />

                <FormInput
                  label="Teléfono"
                  id="insurer-phone"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  error={errors.phone}
                  placeholder="Ej. +51987654321"
                  disabled={isLoading}
                  required
                />

                <FormInput
                  label="Contacto / Encargado"
                  id="insurer-person"
                  value={personInCharge}
                  onChange={(e) => setPersonInCharge(e.target.value)}
                  disabled={isLoading}
                />

                <FormInput
                  label="Dirección"
                  id="insurer-address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                  }}
                  error={errors.address}
                  disabled={isLoading}
                  required
                />
              </>
            )}

          </div>

        </form>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex justify-end gap-3 select-none">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          
          {mode === 'view' ? (
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/15 rounded-xl transition-all duration-200 cursor-pointer"
            >
              Editar
            </button>
          ) : (
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
              {mode === 'create' ? 'Crear Aseguradora' : 'Guardar Cambios'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default InsurerDrawer;
