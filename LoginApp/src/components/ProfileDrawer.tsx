import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import FormInput from './FormInput';
import { toast } from 'react-hot-toast';
import { getPhotoFullUrl } from '../utils/photo';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, updateUserSession } = useAuth();
  
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch full user profile details from database on mount or when drawer opens
  useEffect(() => {
    if (isOpen && user?.email) {
      const fetchProfile = async () => {
        setIsLoadingProfile(true);
        try {
          const profile = await authService.getUserByEmail(user.email);
          setUserId(profile.id || '');
          setName(profile.name || user.name || '');
          setLastName(profile.lastName || user.lastName || '');
          setPhone(profile.phoneNumber || '');
          setPhotoUrl(profile.photoUrl || user.photoUrl || '');
          
          // Format date for HTML input (YYYY-MM-DD)
          if (profile.dateOfBirth) {
            const dateObj = new Date(profile.dateOfBirth);
            if (!isNaN(dateObj.getTime())) {
              setDob(dateObj.toISOString().split('T')[0]);
            }
          } else {
            setDob('');
          }
          
          setAddress(profile.address || '');
        } catch (err: any) {
          console.error('Error fetching full profile:', err);
          // Fallback to in-session data
          setName(user.name || '');
          setLastName(user.lastName || '');
          toast.error('No se pudo cargar la información completa del perfil. Se muestran datos locales.');
        } finally {
          setIsLoadingProfile(false);
        }
      };
      
      fetchProfile();
    }
  }, [isOpen, user]);

  const getInitials = () => {
    const n = name?.trim().charAt(0) || "";
    const l = lastName?.trim().charAt(0) || "";
    return `${n}${l}`.toUpperCase() || "U";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (<= 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("El tamaño de la foto no debe exceder los 2MB.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate image format (JPG/PNG)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formatos permitidos: JPG, PNG.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!val.trim()) {
      setNameError('El nombre es requerido.');
    } else {
      setNameError(null);
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLastName(val);
    if (!val.trim()) {
      setLastNameError('El apellido es requerido.');
    } else {
      setLastNameError(null);
    }
  };

  const isFormValid = name.trim() && lastName.trim() && !nameError && !lastNameError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSaving || !userId) return;

    setIsSaving(true);
    try {
      const response = await authService.updateUser(
        userId,
        name.trim(),
        lastName.trim(),
        dob || undefined, // yyyy-MM-dd format expected by API
        phone.trim(),
        photoFile, // photo binary file for upload
        address.trim()
      );

      // Synchronize changes to React Auth state & LocalStorage
      updateUserSession({
        name: name.trim(),
        lastName: lastName.trim(),
        photoUrl: response.photoUrl || '',
      });

      toast.success('¡Perfil actualizado con éxito!');
      onClose();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.response?.data?.message || err.message || 'No se pudo guardar la información del perfil.';
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden select-none transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Backdrop blur overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Slide-over Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800/80 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/20 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Modificar Perfil</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer Body (Form) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoadingProfile ? (
              <div className="h-full flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-indigo-500"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Avatar section */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative group">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      disabled={isSaving}
                    />

                    <div
                      onClick={() => !isSaving && fileInputRef.current?.click()}
                      className={`relative w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden flex items-center justify-center select-none transition-all duration-300 cursor-pointer hover:brightness-90 hover:scale-105 active:scale-95 group
                        ${photoUrl ? "" : "bg-gradient-to-tr from-indigo-500 to-violet-600 text-white"}`}
                    >
                      {photoUrl ? (
                        <img
                          src={getPhotoFullUrl(photoUrl)}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-extrabold tracking-wider">
                          {getInitials()}
                        </span>
                      )}

                      {/* Image upload hover mask */}
                      <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5 mb-1 animate-pulse"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                          />
                        </svg>
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Subir Foto
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                    JPG o PNG, máx. 2MB
                  </span>
                </div>
                
                <FormInput
                  label="Correo Electrónico (Solo Lectura)"
                  id="profile-email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-100/80 border-slate-200 dark:bg-slate-950/50 dark:border-slate-800/60 cursor-not-allowed opacity-80"
                  readOnly
                />

                <FormInput
                  label="Nombre"
                  id="profile-name"
                  type="text"
                  placeholder="Ingrese su nombre"
                  value={name}
                  onChange={handleNameChange}
                  error={nameError}
                  disabled={isSaving}
                  required
                />

                <FormInput
                  label="Apellido"
                  id="profile-lastname"
                  type="text"
                  placeholder="Ingrese su apellido"
                  value={lastName}
                  onChange={handleLastNameChange}
                  error={lastNameError}
                  disabled={isSaving}
                  required
                />

                <FormInput
                  label="Teléfono"
                  id="profile-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSaving}
                />

                <div className="w-full flex flex-col gap-1.5 mb-4 text-left">
                  <label htmlFor="profile-dob" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                    Fecha de Nacimiento
                  </label>
                  <input
                    id="profile-dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/50 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all duration-300"
                  />
                </div>

                <div className="w-full flex flex-col gap-1.5 mb-4 text-left">
                  <label htmlFor="profile-address" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                    Dirección Residencial
                  </label>
                  <textarea
                    id="profile-address"
                    rows={3}
                    placeholder="Calle, Número, Ciudad..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/50 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all duration-300 resize-none"
                  />
                </div>

              </form>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/20 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 font-semibold rounded-lg text-sm border border-slate-200 dark:border-slate-700/50 flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid || isSaving || isLoadingProfile}
              className={`flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-600/20
                flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]
                transition-all duration-200 cursor-pointer
                ${(!isFormValid || isSaving || isLoadingProfile) ? 'opacity-50 cursor-not-allowed scale-100 hover:scale-100 hover:bg-indigo-600' : ''}`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
export default ProfileDrawer;
