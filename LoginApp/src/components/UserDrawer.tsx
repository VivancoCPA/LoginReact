import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import FormInput from './FormInput';
import { userService } from '../services/userService';
import { getPhotoFullUrl } from '../utils/photo';
import type { PagedUserItem, FamilyGroup } from '../types/user';

const formatDateToLocal = (dateStr?: string) => {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};



interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'create' | 'edit';
  user: PagedUserItem | null;
  onSaveSuccess: () => void;
}

export const UserDrawer: React.FC<UserDrawerProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  user,
  onSaveSuccess,
}) => {
  const [mode, setMode] = useState<'view' | 'create' | 'edit'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFamilyGroups, setActiveFamilyGroups] = useState<FamilyGroup[]>([]);
  
  // Roles and Claims (fetched only in view mode)
  const [roles, setRoles] = useState<string[]>([]);
  const [claims, setClaims] = useState<Array<{ type: string; value: string }>>([]);
  const [isLoadingRolesClaims, setIsLoadingRolesClaims] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [familyGroupId, setFamilyGroupId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Form Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // File picker ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with props
  useEffect(() => {
    setMode(initialMode);
    setErrors({});
    setPhotoFile(null);
  }, [initialMode, isOpen]);

  // Load family groups on mount if drawer is open
  useEffect(() => {
    if (isOpen) {
      const fetchGroups = async () => {
        try {
          const data = await userService.getFamilyGroups();
          // Solo traer los grupos activos
          const activeGroups = data.filter((g) => g.isActive === true);
          setActiveFamilyGroups(activeGroups);
        } catch (error) {
          console.error('Error fetching family groups:', error);
        }
      };
      fetchGroups();
    }
  }, [isOpen]);

  // Sync user data
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phoneNumber || '');
      setDob(user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '');
      setAddress(user.address || '');
      setFamilyGroupId(user.familyGroupId || '');
      setPhotoUrl(user.photoUrl || '');

      // If view mode, also fetch roles and claims
      if (mode === 'view') {
        const fetchRolesAndClaims = async () => {
          setIsLoadingRolesClaims(true);
          try {
            const [rolesData, claimsData] = await Promise.all([
              userService.getUserRoles(user.id).catch(() => ({ roles: [] })),
              userService.getUserClaims(user.id).catch(() => ({ claims: [] })),
            ]);
            setRoles(rolesData.roles || []);
            setClaims(claimsData.claims || []);
          } catch (err) {
            console.error('Error fetching roles/claims:', err);
          } finally {
            setIsLoadingRolesClaims(false);
          }
        };
        fetchRolesAndClaims();
      }
    } else if (isOpen && mode === 'create') {
      // Clear form
      setName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setDob('');
      setAddress('');
      setFamilyGroupId('');
      setPhotoUrl('');
      setPhotoFile(null);
      setRoles([]);
      setClaims([]);
    }
  }, [isOpen, user, mode]);

  if (!isOpen) return null;

  // Initials generator fallback
  const getInitials = () => {
    const n = name?.trim().charAt(0) || '';
    const l = lastName?.trim().charAt(0) || '';
    return `${n}${l}`.toUpperCase() || 'U';
  };

  // 2MB Photo select validator
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size <= 2MB
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('El tamaño de la foto no debe exceder los 2MB.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Store file binary for upload
    setPhotoFile(file);

    // Convert file to base64 preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
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

    if (!lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio.';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 caracteres.';
    }

    if (mode === 'create') {
      if (!email.trim()) {
        newErrors.email = 'El correo electrónico es obligatorio.';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          newErrors.email = 'El formato de correo no es válido.';
        }
      }
    }

    if (dob) {
      const dateObj = new Date(dob);
      if (dateObj > new Date()) {
        newErrors.dob = 'La fecha no puede ser en el futuro.';
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
        await userService.createUser({
          email,
          name,
          lastName,
          phone: phone || undefined,
          dateOfBirth: dob || undefined, // Standardized yyyy-MM-dd
          photo: photoFile || undefined,
        });
        toast.success('Usuario creado exitosamente.');
      } else {
        // Edit mode
        if (!user) return;
        await userService.updateUser(user.id, {
          name,
          lastName,
          dateOfBirth: dob || undefined, // Standardized yyyy-MM-dd
          phoneNumber: phone || undefined,
          photo: photoFile,
          address: address || undefined,
        });
        toast.success('Información de usuario actualizada.');
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      let msg = 'Ocurrió un error al procesar el usuario.';
      if (err.response && err.response.status === 409) {
        msg = 'El correo electrónico ingresado ya se encuentra registrado.';
      } else if (err.response && err.response.data && err.response.data.detail) {
        msg = err.response.data.detail;
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getFamilyGroupName = () => {
    if (user?.familyGroupName) return user.familyGroupName;
    const group = activeFamilyGroups.find((g) => g.id === familyGroupId);
    return group ? group.name : 'Sin grupo familiar';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Slide-over Right Drawer Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 transition-transform duration-300 ease-out transform translate-x-0">
        
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              {mode === 'view' ? 'Detalles de Usuario' : mode === 'edit' ? 'Editar Usuario' : 'Nuevo Usuario'}
            </span>
          </div>
          
          <div className="flex items-center gap-2.5">
            {mode === 'view' && (
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-600/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-600/20 transition-all cursor-pointer"
              >
                Editar
              </button>
            )}
            
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
        </div>

        {/* Drawer Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left">
          
          {/* Avatar Section at the top */}
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
                className={`w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden flex items-center justify-center select-none transition-all duration-300
                  ${mode !== 'view' ? 'cursor-pointer hover:brightness-90 hover:scale-105 active:scale-95 group' : ''}
                  ${photoUrl ? '' : 'bg-gradient-to-tr from-indigo-500 to-violet-600 text-white'}`}
              >
                {photoUrl ? (
                  <img src={getPhotoFullUrl(photoUrl)} alt="Avatar" className="w-full h-full object-cover" />
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
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Subir Foto</span>
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
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nombre</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">{name}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Apellido</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">{lastName}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Correo Electrónico</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block break-all">{email}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Teléfono</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">{phone || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">F. Nacimiento</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">
                    {dob ? formatDateToLocal(dob) : '—'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dirección</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">{address || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Grupo Familiar</span>
                  <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-600/20">
                    {getFamilyGroupName()}
                  </span>
                </div>
                {user?.createdAt && (
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fecha Registro</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 block">
                      {new Date(user.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {/* Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Nombre"
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    error={errors.name}
                    placeholder="Ej. Juan"
                    disabled={isLoading}
                    required
                  />
                  <FormInput
                    label="Apellido"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
                    }}
                    error={errors.lastName}
                    placeholder="Ej. Pérez"
                    disabled={isLoading}
                    required
                  />
                </div>

                <FormInput
                  label="Correo Electrónico"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  error={errors.email}
                  placeholder="ejemplo@correo.com"
                  disabled={mode === 'edit' || isLoading} // Locked in Edit mode
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Teléfono"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={errors.phone}
                    placeholder="+54 11 1234 5678"
                    disabled={isLoading}
                  />
                  <FormInput
                    label="F. Nacimiento"
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    error={errors.dob}
                    disabled={isLoading}
                  />
                </div>

                <FormInput
                  label="Dirección"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle Falsa 123"
                  disabled={isLoading}
                />

                {/* Family Group Dropdown: Always disabled / locked in admin drawer as requested */}
                <div className="w-full flex flex-col gap-1.5 mb-4 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                    Grupo Familiar (LOCKED)
                  </label>
                  <select
                    disabled={true}
                    value={familyGroupId}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  >
                    <option value="">
                      {familyGroupId ? getFamilyGroupName() : 'Asignación Externa / Bloqueado'}
                    </option>
                  </select>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 pl-0.5 leading-relaxed">
                    El grupo familiar está administrado externamente y no es modificable desde este panel.
                  </span>
                </div>
              </div>
            )}

            {/* View Mode Roles & Claims Lists */}
            {mode === 'view' && (
              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-5 space-y-5">
                {/* Roles list */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
                    Roles Asignados
                  </h4>
                  {isLoadingRolesClaims ? (
                    <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                  ) : roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {roles.map((r) => (
                        <span 
                          key={r}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-600/20"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">Ningún rol asignado</span>
                  )}
                </div>

                {/* Claims list */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
                    Permisos / Claims
                  </h4>
                  {isLoadingRolesClaims ? (
                    <div className="space-y-1.5">
                      <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                      <div className="h-6 w-2/3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                    </div>
                  ) : claims.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {claims.map((c, i) => (
                        <span 
                          key={i}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                        >
                          {c.type}: {c.value}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">Ningún claim asignado</span>
                  )}
                </div>
              </div>
            )}

          </div>

        </form>

        {/* Footer Actions (Only for create/edit) */}
        {mode !== 'view' && (
          <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex justify-end gap-3 select-none">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
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
              {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserDrawer;
