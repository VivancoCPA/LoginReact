import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { medicalCenterService } from '../services/medicalCenterService';
import { centerTypeService } from '../services/centerTypeService';
import type { MedicalCenterItem } from '../types/medicalCenter';

interface MedicalCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'create' | 'edit';
  medicalCenter: MedicalCenterItem | null;
  onSaveSuccess: () => void;
}

const formatDateToYYYYMMDD = (dateStr?: string) => {
  if (!dateStr) return '—';
  return dateStr.split('T')[0];
};

export const MedicalCenterDrawer: React.FC<MedicalCenterDrawerProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  medicalCenter,
  onSaveSuccess,
}) => {
  const [drawerMode, setDrawerMode] = useState<'view' | 'create' | 'edit'>(initialMode);
  
  // Form States
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [typeId, setTypeId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  
  // Center Types Lookup Options
  const [centerTypes, setCenterTypes] = useState<{ id: number; name: string }[]>([]);
  
  // Search state inside drawer map
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  
  // Validations & Loader
  const [errors, setErrors] = useState<{ name?: string; address?: string; typeId?: string; phone?: string; latitude?: string; longitude?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Sync state on drawer open/updates
  useEffect(() => {
    if (isOpen) {
      setDrawerMode(initialMode);
      
      // Load types lookup dynamically
      const loadTypes = async () => {
        try {
          const list = await centerTypeService.getCenterTypesLookup();
          setCenterTypes(list);
        } catch (err) {
          console.error('Error loading center types lookup:', err);
        }
      };
      loadTypes();

      if ((initialMode === 'edit' || initialMode === 'view') && medicalCenter) {
        setName(medicalCenter.name || '');
        setAddress(medicalCenter.address || '');
        setPhone(medicalCenter.phone || '');
        setTypeId(medicalCenter.typeId ?? '');
        setIsActive(medicalCenter.isActive !== false);
        setLatitude(medicalCenter.latitude ?? '');
        setLongitude(medicalCenter.longitude ?? '');
      } else {
        setName('');
        setAddress('');
        setPhone('');
        setTypeId('');
        setIsActive(true);
        // Default coords centered on Lima, Peru (standard project context)
        setLatitude(-12.04637);
        setLongitude(-77.04279);
      }
      setErrors({});
      setMapSearchQuery('');
    }
  }, [isOpen, initialMode, medicalCenter]);

  // Handle Map Initialization & Marker Updates
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Use default coordinates if empty
    const currentLat = latitude !== '' ? latitude : -12.04637;
    const currentLng = longitude !== '' ? longitude : -77.04279;

    // Initialize Leaflet Map
    if (!leafletMapRef.current) {
      const mapInstance = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([currentLat, currentLng], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(mapInstance);

      // Create Custom SVG Map Marker
      const svgMarkerIcon = L.divIcon({
        html: `<div class="flex items-center justify-center w-8 h-8 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-red-500'} text-white shadow-lg border border-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </div>`,
        className: 'custom-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const markerInstance = L.marker([currentLat, currentLng], {
        icon: svgMarkerIcon,
        draggable: drawerMode !== 'view',
      }).addTo(mapInstance);

      // Map Click Handler to set coordinates
      if (drawerMode !== 'view') {
        mapInstance.on('click', (e) => {
          const { lat, lng } = e.latlng;
          const roundedLat = parseFloat(lat.toFixed(6));
          const roundedLng = parseFloat(lng.toFixed(6));
          setLatitude(roundedLat);
          setLongitude(roundedLng);
          markerInstance.setLatLng([roundedLat, roundedLng]);
        });

        markerInstance.on('dragend', (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          const roundedLat = parseFloat(position.lat.toFixed(6));
          const roundedLng = parseFloat(position.lng.toFixed(6));
          setLatitude(roundedLat);
          setLongitude(roundedLng);
        });
      }

      leafletMapRef.current = mapInstance;
      markerRef.current = markerInstance;
    } else {
      // Reposition existing map and marker
      leafletMapRef.current.setView([currentLat, currentLng]);
      markerRef.current?.setLatLng([currentLat, currentLng]);
      
      // Update draggable status based on current mode
      if (drawerMode === 'view') {
        markerRef.current?.dragging?.disable();
      } else {
        markerRef.current?.dragging?.enable();
      }
    }

    // Force map size invalidation to fix render shifts inside relative flex boxes
    setTimeout(() => {
      leafletMapRef.current?.invalidateSize();
    }, 200);

    return () => {
      // Clean up map instance on destroy
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen, drawerMode, latitude, longitude, isActive]);

  // Sync drawer mode changes
  useEffect(() => {
    setDrawerMode(initialMode);
  }, [initialMode]);

  if (!isOpen) return null;

  // Address Geocoding using Nominatim
  const handleMapSearch = async () => {
    if (!mapSearchQuery.trim()) return;

    setIsSearchingMap(true);
    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: mapSearchQuery.trim(),
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'LoginAppMedicalCenters/1.0',
        },
      });

      if (res.data && res.data.length > 0) {
        const item = res.data[0];
        const newLat = parseFloat(parseFloat(item.lat).toFixed(6));
        const newLng = parseFloat(parseFloat(item.lon).toFixed(6));

        setLatitude(newLat);
        setLongitude(newLng);
        setAddress(item.display_name); // Prefill address field with geocoded display name

        leafletMapRef.current?.setView([newLat, newLng], 14);
        markerRef.current?.setLatLng([newLat, newLng]);
        toast.success('Ubicación encontrada.');
      } else {
        toast.error('No se pudo encontrar la dirección especificada.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al realizar la búsqueda de ubicación.');
    } finally {
      setIsSearchingMap(false);
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre del centro médico es obligatorio.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres.';
    } else if (name.trim().length > 200) {
      newErrors.name = 'El nombre no puede exceder los 200 caracteres.';
    }

    if (!address.trim()) {
      newErrors.address = 'La dirección del centro médico es obligatoria.';
    } else if (address.trim().length < 2) {
      newErrors.address = 'La dirección debe tener al menos 2 caracteres.';
    } else if (address.trim().length > 500) {
      newErrors.address = 'La dirección no puede exceder los 500 caracteres.';
    }

    if (!typeId) {
      newErrors.typeId = 'Debe seleccionar un tipo de centro médico.';
    }

    if (phone.trim()) {
      const phoneRegex = /^[\d\s+\-()]*$/;
      if (!phoneRegex.test(phone)) {
        newErrors.phone = 'El teléfono de contacto contiene caracteres inválidos.';
      } else if (phone.length > 30) {
        newErrors.phone = 'El teléfono no puede exceder los 30 caracteres.';
      }
    }

    if (latitude === '') {
      newErrors.latitude = 'La latitud es obligatoria.';
    } else if (latitude < -90 || latitude > 90) {
      newErrors.latitude = 'La latitud debe ser un número decimal entre -90 y 90.';
    }

    if (longitude === '') {
      newErrors.longitude = 'La longitud es obligatoria.';
    } else if (longitude < -180 || longitude > 180) {
      newErrors.longitude = 'La longitud debe ser un número decimal entre -180 y 180.';
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
      const payload = {
        name: name.trim(),
        typeId: typeId ? Number(typeId) : undefined,
        address: address.trim(),
        phone: phone.trim() || undefined,
        isActive,
        latitude: latitude !== '' ? Number(latitude) : undefined,
        longitude: longitude !== '' ? Number(longitude) : undefined,
      };

      if (drawerMode === 'create') {
        await medicalCenterService.createMedicalCenter(payload);
        toast.success('Centro médico registrado exitosamente.');
      } else {
        if (!medicalCenter) return;
        await medicalCenterService.updateMedicalCenter(medicalCenter.id, payload);
        toast.success('Centro médico actualizado exitosamente.');
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      let msg = 'Ocurrió un error al procesar el centro médico.';
      if (err.response && err.response.data && err.response.data.detail) {
        msg = err.response.data.detail;
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-fadeIn">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Right Drawer container: wider to prevent map congestion */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 transition-transform duration-300 ease-out transform translate-x-0">
        
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20 text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              {drawerMode === 'create' 
                ? 'Nuevo Centro Médico' 
                : drawerMode === 'edit' 
                ? 'Editar Centro Médico' 
                : 'Detalle de Centro Médico'}
            </h3>
            {medicalCenter && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 block truncate max-w-sm">
                ID: {medicalCenter.id}
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
          
          {drawerMode === 'view' && medicalCenter ? (
            /* READ ONLY STATE DETAILS */
            <div className="space-y-6 select-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Nombre</span>
                  <span className="block mt-1 text-sm font-semibold text-slate-800 dark:text-slate-150">
                    {name}
                  </span>
                </div>

                <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tipo de Centro</span>
                  <span className="block mt-1 text-sm font-semibold text-slate-800 dark:text-slate-150">
                    {medicalCenter.typeName || '—'}
                  </span>
                </div>

                <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Teléfono</span>
                  <span className="block mt-1 text-sm font-mono text-slate-800 dark:text-slate-150">
                    {phone || '—'}
                  </span>
                </div>

                <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Estado</span>
                  <div className="mt-1">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-600/20">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-md bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-600/20">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3 md:col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Dirección</span>
                  <span className="block mt-1 text-sm text-slate-705 dark:text-slate-300">
                    {address}
                  </span>
                </div>

                <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Coordenadas (Lat / Long)</span>
                  <span className="block mt-1 text-sm font-mono text-slate-700 dark:text-slate-350">
                    {latitude !== '' ? latitude : '—'}, {longitude !== '' ? longitude : '—'}
                  </span>
                </div>

                <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Registrado el</span>
                  <span className="block mt-1 text-sm font-mono text-slate-700 dark:text-slate-300">
                    {formatDateToYYYYMMDD(medicalCenter.createdAt)}
                  </span>
                </div>
              </div>

              {/* READ ONLY MAP SECTION */}
              <div className="space-y-2 mt-4 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555">Geolocalización</span>
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-64 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner z-0"
                />
              </div>
            </div>
          ) : (
            /* CREATE AND EDIT FORM MODE */
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nombre del Centro Médico
                  </label>
                  <input
                    type="text"
                    disabled={isLoading}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Ej. Clínica Delgado"
                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border rounded-xl text-sm transition-all outline-none duration-250
                      ${errors.name 
                        ? 'border-rose-300 dark:border-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  />
                  {errors.name && (
                    <span className="text-xs text-rose-500 pl-0.5 font-medium">{errors.name}</span>
                  )}
                </div>

                {/* Center Type selection dropdown */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tipo de Centro
                  </label>
                  <select
                    disabled={isLoading}
                    value={typeId}
                    onChange={(e) => {
                      setTypeId(e.target.value ? Number(e.target.value) : '');
                      if (errors.typeId) setErrors((prev) => ({ ...prev, typeId: undefined }));
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border rounded-xl text-sm transition-all outline-none duration-250
                      ${errors.typeId 
                        ? 'border-rose-300 dark:border-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  >
                    <option value="">Seleccione tipo...</option>
                    {centerTypes.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  {errors.typeId && (
                    <span className="text-xs text-rose-500 pl-0.5 font-medium">{errors.typeId}</span>
                  )}
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    disabled={isLoading}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="Ej. +5113777000"
                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border rounded-xl text-sm transition-all outline-none duration-250
                      ${errors.phone 
                        ? 'border-rose-300 dark:border-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  />
                  {errors.phone && (
                    <span className="text-xs text-rose-500 pl-0.5 font-medium">{errors.phone}</span>
                  )}
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Dirección
                  </label>
                  <textarea
                    rows={2}
                    disabled={isLoading}
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                    }}
                    placeholder="Ej. Av. Angamos Oeste 401, Miraflores"
                    className={`w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border rounded-xl text-sm transition-all outline-none duration-250 resize-none
                      ${errors.address 
                        ? 'border-rose-300 dark:border-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  />
                  {errors.address && (
                    <span className="text-xs text-rose-500 pl-0.5 font-medium">{errors.address}</span>
                  )}
                </div>
              </div>

              {/* INTERACTIVE COORDINATE MAP AND GEOMETRY CAPTURE */}
              <div className="space-y-3 mt-4 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Geolocalización (Hacer click en mapa o buscar)
                  </label>
                </div>

                {/* Nominatim Search Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleMapSearch())}
                    placeholder="Buscar dirección, distrito o nombre del lugar..."
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 text-xs rounded-xl outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleMapSearch}
                    disabled={isSearchingMap}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSearchingMap ? (
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                      </svg>
                    )}
                    Buscar Lugar
                  </button>
                </div>

                <div 
                  ref={mapContainerRef} 
                  className="w-full h-52 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner z-0"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Latitud</span>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                        setLatitude(val);
                        if (val !== '' && !isNaN(val) && leafletMapRef.current) {
                          leafletMapRef.current.setView([val, Number(longitude || 0)]);
                          markerRef.current?.setLatLng([val, Number(longitude || 0)]);
                        }
                      }}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Longitud</span>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                        setLongitude(val);
                        if (val !== '' && !isNaN(val) && leafletMapRef.current) {
                          leafletMapRef.current.setView([Number(latitude || 0), val]);
                          markerRef.current?.setLatLng([Number(latitude || 0), val]);
                        }
                      }}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Status input - Only visible in edit mode */}
              {drawerMode === 'edit' && (
                <div className="flex flex-col gap-1.5 text-left mt-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Estado del Centro Médico
                  </label>
                  
                  <div
                    onClick={() => !isLoading && setIsActive(!isActive)}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none
                      ${isActive 
                        ? 'bg-indigo-50/50 dark:bg-indigo-600/5 border-indigo-200 dark:border-indigo-600/35' 
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
                        Centro Médico Activo
                      </span>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                        Desactive esta opción para deshabilitar temporalmente el centro en las cartillas o agendas.
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
                Editar Centro
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
                {drawerMode === 'create' ? 'Crear Centro' : 'Guardar Cambios'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default MedicalCenterDrawer;
