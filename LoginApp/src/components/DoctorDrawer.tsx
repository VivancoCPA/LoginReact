import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import FormInput from './FormInput';
import { doctorService } from '../services/doctorService';
import { specialtyService } from '../services/specialtyService';
import { medicalCenterService } from '../services/medicalCenterService';
import { getPhotoFullUrl } from '../utils/photo';
import type { DoctorItem } from '../types/doctor';

interface DoctorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'create' | 'edit';
  doctor: DoctorItem | null;
  defaultTab?: 'general' | 'centers';
  onSaveSuccess: () => void;
}

interface CenterFormItem {
  affiliationId?: number;
  id: string;
  name?: string;
  officeNumber?: string;
  workSchedule?: string;
}

export const DoctorDrawer: React.FC<DoctorDrawerProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  doctor,
  defaultTab = 'general',
  onSaveSuccess,
}) => {
  const [mode, setMode] = useState<'view' | 'create' | 'edit'>(initialMode);
  const [activeTab, setActiveTab] = useState<'general' | 'centers'>(defaultTab);
  const [isLoading, setIsLoading] = useState(false);

  // Lookups data
  const [specialties, setSpecialties] = useState<{ id: number; name: string }[]>([]);
  const [medicalCenters, setMedicalCenters] = useState<{ id: string; name: string }[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialtyId, setSpecialtyId] = useState<number | ''>('');
  const [register, setRegister] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isVet, setIsVet] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Photo states
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Associated Centers list
  const [centers, setCenters] = useState<CenterFormItem[]>([]);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state on drawer open/updates
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrors({});
      setPhotoFile(null);
      setActiveTab(defaultTab);

      // Load specialties and medical centers lookups
      const fetchLookups = async () => {
        try {
          const [specsData, centersData] = await Promise.all([
            specialtyService.getSpecialtiesLookup().catch(() => []),
            medicalCenterService.getMedicalCentersLookup().catch(() => []),
          ]);
          setSpecialties(specsData);
          setMedicalCenters(centersData);
        } catch (error) {
          console.error('Error fetching lookups in DoctorDrawer:', error);
        }
      };
      fetchLookups();

      if ((initialMode === 'edit' || initialMode === 'view') && doctor) {
        setName(doctor.name || '');
        setLastName(doctor.lastName || '');
        setSpecialtyId(doctor.specialtyId ?? '');
        setRegister(doctor.register || '');
        setPhone(doctor.phone || '');
        setEmail(doctor.email || '');
        setIsVet(doctor.isVet === true);
        setIsActive(doctor.isActive !== false);
        setPhotoUrl(doctor.photoUrl || '');

        // Load doctor affiliations from separate GET endpoint
        const fetchAffiliations = async () => {
          try {
            const affs = await doctorService.getDoctorAffiliations(doctor.id);
            setCenters(
              affs.map((a) => ({
                affiliationId: a.id,
                id: a.centerId,
                name: a.centerName,
                officeNumber: a.officeNumber || '',
                workSchedule: a.workSchedule || '',
              }))
            );
          } catch (error) {
            console.error('Error fetching doctor affiliations:', error);
            // Fallback to doctor.centers if endpoint fails
            if (doctor.centers) {
              setCenters(
                doctor.centers.map((c) => ({
                  id: c.id,
                  name: c.name,
                  officeNumber: c.officeNumber || '',
                  workSchedule: c.workSchedule || '',
                }))
              );
            } else {
              setCenters([]);
            }
          }
        };
        fetchAffiliations();
      } else {
        setName('');
        setLastName('');
        setSpecialtyId('');
        setRegister('');
        setEmail('');
        setPhone('');
        setIsVet(false);
        setIsActive(true);
        setPhotoUrl('');
        setCenters([]);
      }
    }
  }, [isOpen, initialMode, doctor, defaultTab]);

  if (!isOpen) return null;

  // Initials generator fallback
  const getInitials = (): string => {
    const n = name?.trim().charAt(0) || '';
    const l = lastName?.trim().charAt(0) || '';
    return `${n}${l}`.toUpperCase() || 'M';
  };

  // 2MB Photo select validator
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check mime-type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de archivo no válido. Solo JPG, PNG o WEBP.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

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

  // Dynamic center management
  const handleAddCenter = () => {
    setCenters((prev) => [...prev, { id: '', officeNumber: '', workSchedule: '' }]);
  };

  const handleRemoveCenter = (index: number) => {
    setCenters((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCenterChange = (index: number, field: keyof CenterFormItem, value: string) => {
    setCenters((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
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

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'El formato de correo no es válido.';
      }
    }

    if (phone && phone.trim()) {
      const phoneRegex = /^[0-9+\s]+$/;
      if (!phoneRegex.test(phone)) {
        newErrors.phone = 'El teléfono debe contener solo números, espacios o "+".';
      }
    }

    // Validate center associations
    const selectedCenterIds = centers.map((c) => c.id).filter(Boolean);
    const hasEmptyCenter = centers.some((c) => !c.id);
    if (hasEmptyCenter) {
      newErrors.centers = 'Todas las sedes asociadas deben tener una sede seleccionada.';
    }

    const uniqueCenterIds = new Set(selectedCenterIds);
    if (uniqueCenterIds.size !== selectedCenterIds.length) {
      newErrors.centers = 'No se permiten sedes asociadas duplicadas.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.name || newErrors.lastName || newErrors.email || newErrors.phone) {
        toast.error('Hay errores en la pestaña "Información General".');
        setActiveTab('general');
      } else if (newErrors.centers) {
        toast.error(newErrors.centers);
        setActiveTab('centers');
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    if (!validate()) return;

    setIsLoading(true);
    try {
      const centersPayload = centers
        .filter((c) => c.id)
        .map((c) => ({
          id: c.id,
          officeNumber: c.officeNumber || undefined,
          workSchedule: c.workSchedule || undefined,
        }));

      const payload = {
        name: name.trim(),
        lastName: lastName.trim(),
        specialtyId: specialtyId !== '' ? Number(specialtyId) : null,
        register: register.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim(),
        photo: photoFile,
        isVet,
        centers: centersPayload,
      };

      if (mode === 'create') {
        await doctorService.createDoctor(payload);
      } else {
        if (!doctor) return;
        await doctorService.updateDoctor(doctor.id, {
          ...payload,
          isActive,
        });
      }

      toast.success(
        mode === 'create'
          ? 'Médico y afiliaciones registrados correctamente.'
          : 'Médico y afiliaciones actualizados correctamente.'
      );
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      let msg = 'Ocurrió un error al guardar el médico o sus afiliaciones.';
      if (err.response?.status === 409) {
        msg = 'El correo electrónico ingresado ya se encuentra registrado.';
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Slide-over Right Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 transition-transform duration-300 ease-out transform translate-x-0">
        
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              {mode === 'view' ? 'Detalles de Médico' : mode === 'edit' ? 'Editar Médico' : 'Nuevo Médico'}
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

        {/* Tab Navigation Menu */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 select-none shrink-0 bg-slate-50 dark:bg-slate-950/20">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer focus:outline-none
              ${activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Información General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('centers')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer focus:outline-none
              ${activeTab === 'centers'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Sedes Asociadas ({centers.length})
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left flex flex-col justify-between">
          
          <div className="space-y-6">
            {activeTab === 'general' ? (
              /* TAB 1: GENERAL INFORMATION */
              <>
                {/* Avatar Section at the top */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="relative group">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
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
                      Máximo 2MB (JPG/PNG/WEBP)
                    </span>
                  )}
                </div>

                {mode === 'view' ? (
                  /* VIEW DETAILS GENERAL */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nombre</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">{name}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Apellido</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">{lastName}</span>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Correo Electrónico</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block break-all">{email}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Especialidad</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">
                        {doctor?.specialtyName || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Registro (CMP)</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-105 mt-0.5 block font-mono">
                        {register || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Teléfono</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">{phone || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Veterinaria</span>
                      <span className="inline-flex mt-1.5">
                        {isVet ? (
                          <span className="px-2 py-0.5 text-[9px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-950/20 dark:text-violet-400 rounded-lg border border-violet-100 dark:border-violet-900/30">
                            Atiende Veterinaria
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-bold text-slate-550 bg-slate-50 dark:bg-slate-800/40 dark:text-slate-400 rounded-lg border border-slate-100 dark:border-slate-850">
                            Solo Humanos
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                      <span>Creado: {doctor?.createdAt ? new Date(doctor.createdAt).toLocaleDateString('es-ES') : '—'}</span>
                      <span>Actualizado: {doctor?.updatedAt ? new Date(doctor.updatedAt).toLocaleDateString('es-ES') : '—'}</span>
                      <span className="font-bold flex items-center gap-1">
                        Estado: 
                        {isActive ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Activo</span>
                        ) : (
                          <span className="text-red-500 dark:text-red-400">Inactivo</span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* EDIT/CREATE GENERAL INFO FORM */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Nombre"
                        id="name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        error={errors.name}
                        placeholder="Ej. Pedro"
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
                        placeholder="Ej. Vivanco"
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
                      placeholder="correo@ejemplo.com"
                      disabled={isLoading}
                      required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Specialty dropdown */}
                      <div className="flex flex-col gap-1.5 text-left mb-4">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                          Especialidad
                        </label>
                        <select
                          disabled={isLoading}
                          value={specialtyId}
                          onChange={(e) => setSpecialtyId(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded-lg text-sm transition-all outline-none border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 dark:text-slate-100"
                        >
                          <option value="">Seleccione especialidad...</option>
                          {specialties.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <FormInput
                        label="Registro (CMP)"
                        id="register"
                        value={register}
                        onChange={(e) => setRegister(e.target.value)}
                        placeholder="Ej. CMP 455521"
                        disabled={isLoading}
                      />
                    </div>

                    <FormInput
                      label="Teléfono"
                      id="phone"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      error={errors.phone}
                      placeholder="Ej. +51 987654321"
                      disabled={isLoading}
                    />

                    {/* Vet Option Toggles */}
                    <div className="flex flex-col gap-3.5 mt-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none text-left">
                        Opciones de Atención
                      </label>

                      <div
                        onClick={() => !isLoading && setIsVet(!isVet)}
                        className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none
                          ${isVet
                            ? 'bg-violet-50/50 dark:bg-violet-650/5 border-violet-200 dark:border-violet-600/35'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50/30'}`}
                      >
                        <div className={`mt-0.5 w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 border transition-all duration-200
                          ${isVet
                            ? 'bg-violet-600 dark:bg-violet-700 border-violet-600 dark:border-violet-750 text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}
                        >
                          {isVet && (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className={`block text-xs font-bold tracking-wide
                            ${isVet ? 'text-violet-650 dark:text-violet-400' : 'text-slate-700 dark:text-slate-300'}`}
                          >
                            Atención Veterinaria
                          </span>
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                            Marque esta casilla si el médico atiende en áreas o especialidades veterinarias.
                          </span>
                        </div>
                      </div>

                      {/* Logical Active Toggle (Only in Edit mode) */}
                      {mode === 'edit' && (
                        <div
                          onClick={() => !isLoading && setIsActive(!isActive)}
                          className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none
                            ${isActive
                              ? 'bg-indigo-50/50 dark:bg-indigo-650/5 border-indigo-200 dark:border-indigo-600/35'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50/30'}`}
                        >
                          <div className={`mt-0.5 w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 border transition-all duration-200
                            ${isActive
                              ? 'bg-indigo-600 dark:bg-indigo-700 border-indigo-600 dark:border-indigo-750 text-white'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}
                          >
                            {isActive && (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <span className={`block text-xs font-bold tracking-wide
                              ${isActive ? 'text-indigo-650 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}
                            >
                              Médico Activo
                            </span>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                              Al desactivarlo, el médico ya no aparecerá en las búsquedas ni estará disponible para asignaciones de turnos.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* TAB 2: ASSOCIATED MEDICAL CENTERS */
              <div className="space-y-4">
                <div className="flex items-center justify-between select-none">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Sedes Médicas Afiliadas
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Configure los consultorios y horarios de atención por sede.
                    </p>
                  </div>

                  {mode !== 'view' && (
                    <button
                      type="button"
                      onClick={handleAddCenter}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-600/20 cursor-pointer transition-colors"
                    >
                      + Sede
                    </button>
                  )}
                </div>

                {centers.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl select-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block">
                      No hay sedes médicas afiliadas.
                    </span>
                    {mode !== 'view' && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Haga clic en "+ Sede" para agregar una afiliación.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                    {centers.map((assoc, idx) => (
                      <div
                        key={idx}
                        className={`relative p-4 rounded-2xl border transition-all duration-200
                          ${mode === 'view'
                            ? 'bg-slate-50 dark:bg-slate-900/35 border-slate-100 dark:border-slate-800/80 shadow-sm'
                            : 'bg-white dark:bg-slate-900/10 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'}`}
                      >
                        {mode !== 'view' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCenter(idx)}
                            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Sede"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          {/* Center Select */}
                          <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                              Sede Médica
                            </label>
                            {mode === 'view' ? (
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                {assoc.name || 'Sede no definida'}
                              </span>
                            ) : (
                              <select
                                value={assoc.id}
                                disabled={isLoading || !!assoc.affiliationId}
                                onChange={(e) => handleCenterChange(idx, 'id', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all outline-none focus:border-indigo-500 dark:text-slate-100
                                  ${assoc.affiliationId
                                    ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-850'}`}
                              >
                                <option value="">Seleccione sede...</option>
                                {medicalCenters.map((mc) => (
                                  <option key={mc.id} value={mc.id}>
                                    {mc.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* Office Number */}
                          <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                              Consultorio / Oficina
                            </label>
                            {mode === 'view' ? (
                              <span className="font-semibold text-slate-700 dark:text-slate-350 text-xs">
                                {assoc.officeNumber || '—'}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={assoc.officeNumber || ''}
                                placeholder="Ej. 102 o Sótano B"
                                disabled={isLoading}
                                onChange={(e) => handleCenterChange(idx, 'officeNumber', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-850 rounded-xl text-xs outline-none focus:border-indigo-500 dark:text-slate-100"
                              />
                            )}
                          </div>

                          {/* Work Schedule */}
                          <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                              Horario
                            </label>
                            {mode === 'view' ? (
                              <span className="font-semibold text-slate-700 dark:text-slate-350 text-xs">
                                {assoc.workSchedule || '—'}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={assoc.workSchedule || ''}
                                placeholder="Ej. Lun-Vie 8:00 - 13:00"
                                disabled={isLoading}
                                onChange={(e) => handleCenterChange(idx, 'workSchedule', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-850 rounded-xl text-xs outline-none focus:border-indigo-500 dark:text-slate-100"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="px-0 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 select-none shrink-0 mt-6 bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer focus:outline-none"
            >
              Cancelar
            </button>

            {mode !== 'view' && (
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 rounded-xl shadow-md shadow-indigo-500/15 transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : mode === 'create' ? (
                  'Crear Médico'
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
