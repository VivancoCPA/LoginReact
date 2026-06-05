import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { doctorService } from '../services/doctorService';
import { DoctorDrawer } from '../components/DoctorDrawer';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getPhotoFullUrl } from '../utils/photo';
import type { DoctorItem } from '../types/doctor';

type ViewMode = 'table' | 'cards';
type StatusFilter = 'all' | 'active' | 'inactive';

export const DoctorMaintenance: React.FC = () => {
  // Persistent layout mode (table vs cards)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = sessionStorage.getItem('doctorsLayoutSelection');
    return saved === 'cards' ? 'cards' : 'table';
  });

  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDesc, setSortDesc] = useState(false);

  // Search input state (with debouncing)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Drawer Control State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'create' | 'edit'>('view');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem | null>(null);
  const [drawerDefaultTab, setDrawerDefaultTab] = useState<'general' | 'centers'>('general');

  // Active Menu Dropdown ID for Card Actions (⋮)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Confirmation Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [doctorToToggle, setDoctorToToggle] = useState<DoctorItem | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Persist layout selection
  useEffect(() => {
    sessionStorage.setItem('doctorsLayoutSelection', viewMode);
  }, [viewMode]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch doctors data from API
  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      // Map sort fields to backend supported sorting keys ('name', 'lastname', 'specialtyname', 'email', 'isactive', 'created_at', 'updated_at')
      let apiSortBy = 'created_at';
      if (sortBy === 'name') {
        apiSortBy = 'name';
      } else if (sortBy === 'lastname') {
        apiSortBy = 'lastname';
      } else if (sortBy === 'specialty') {
        apiSortBy = 'specialtyname';
      } else if (sortBy === 'register') {
        apiSortBy = 'register';
      } else if (sortBy === 'isActive') {
        apiSortBy = 'isactive';
      }

      const data = await doctorService.getPagedDoctors({
        page,
        pageSize,
        search: debouncedSearch,
        sortBy: apiSortBy,
        sortDesc,
      });

      setDoctors(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('No se pudo cargar el listado de médicos.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, sortBy, sortDesc]);

  // Fetch on parameter change
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Handle Sort column changes
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDesc((prev) => !prev);
    } else {
      setSortBy(field);
      setSortDesc(false);
    }
    setPage(1);
  };

  // Open Drawer triggers
  const handleOpenDrawer = (mode: 'view' | 'create' | 'edit', doctor: DoctorItem | null, tab: 'general' | 'centers' = 'general') => {
    setSelectedDoctor(doctor);
    setDrawerMode(mode);
    setDrawerDefaultTab(tab);
    setIsDrawerOpen(true);
  };

  // Status Inactivation / Activation confirm triggers
  const handleToggleStatusClick = (doctor: DoctorItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (doctor.isActive) {
      // Prompt confirm dialog on logical deactivation
      setDoctorToToggle(doctor);
      setIsConfirmOpen(true);
    } else {
      // Activate immediately
      toggleStatus(doctor);
    }
  };

  const toggleStatus = async (doctor: DoctorItem) => {
    setIsTogglingStatus(true);
    try {
      const result = await doctorService.toggleDoctorStatus(doctor.id);
      toast.success(
        `Médico "${doctor.name} ${doctor.lastName}" ${result.isActive ? 'activado' : 'inactivado'} correctamente.`
      );
      setIsConfirmOpen(false);
      setDoctorToToggle(null);
      fetchDoctors();
    } catch (error) {
      console.error('Error toggling doctor status:', error);
      toast.error('No se pudo modificar el estado del médico.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleConfirmToggleStatus = () => {
    if (!doctorToToggle) return;
    toggleStatus(doctorToToggle);
  };

  // Client-side filtering of status filter
  const getFilteredDoctors = () => {
    let items = doctors;

    if (statusFilter === 'active') {
      items = items.filter((i) => i.isActive);
    } else if (statusFilter === 'inactive') {
      items = items.filter((i) => !i.isActive);
    }

    return items;
  };

  const filteredDoctors = getFilteredDoctors();

  const getInitials = (name: string, lastName: string): string => {
    const first = name.trim().charAt(0) || '';
    const last = lastName.trim().charAt(0) || '';
    return (first + last).toUpperCase() || 'M';
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-indigo-500 text-white',
      'bg-emerald-500 text-white',
      'bg-violet-500 text-white',
      'bg-rose-500 text-white',
      'bg-amber-500 text-white',
      'bg-sky-500 text-white',
    ];
    let sum = 0;
    for (let i = 0; i < id.length; i++) {
      sum += id.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  return (
    <div className="flex flex-col h-full w-full text-left overflow-hidden gap-4">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Cuerpo Médico
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
            Mantenimiento y gestión de médicos autorizados y sus afiliaciones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenDrawer('create', null)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/15 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo Médico
        </button>
      </div>

      {/* FILTER AND ACTION BAR */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm select-none shrink-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, apellido, especialidad o registro..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status Tabs Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 p-0.5 rounded-xl self-start md:self-auto shrink-0">
            {(['all', 'active', 'inactive'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setStatusFilter(filter);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer focus:outline-none
                  ${statusFilter === filter
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                {filter === 'all' ? 'Todos' : filter === 'active' ? 'Activos' : 'Inactivos'}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Toggle */}
        <div className="flex border border-slate-200/60 dark:border-slate-800 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950/40 shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer focus:outline-none
              ${viewMode === 'cards'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-400 dark:text-slate-550'}`}
            title="Vista Tarjetas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer focus:outline-none
              ${viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-400 dark:text-slate-550'}`}
            title="Vista Tabla"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* RENDER LISTINGS (SCROLLABLE VIEWPORT) */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 -mr-1">
        {isLoading ? (
          /* Loading animation skeleton */
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
            <div className="space-y-4">
              <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-1/3 animate-pulse" />
              <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
              <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
              <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
            </div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          /* Empty state feedback */
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-16 shadow-sm text-center select-none">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
              No se encontraron médicos
            </h3>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Pruebe modificando su criterio de búsqueda o relajando los filtros de estado.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* VIEW MODE: HIGH-DENSITY COMPACT TABLE */
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold select-none">
                    <th className="px-5 py-3 text-left w-[60px]">Avatar</th>
                    <th onClick={() => handleSort('name')} className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-1">
                        <span>Nombre</span>
                        {sortBy === 'name' && (
                          <svg className={`w-3.5 h-3.5 transition-transform ${sortDesc ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th onClick={() => handleSort('lastname')} className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-1">
                        <span>Apellido</span>
                        {sortBy === 'lastname' && (
                          <svg className={`w-3.5 h-3.5 transition-transform ${sortDesc ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th onClick={() => handleSort('specialty')} className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-1">
                        <span>Especialidad</span>
                        {sortBy === 'specialty' && (
                          <svg className={`w-3.5 h-3.5 transition-transform ${sortDesc ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th onClick={() => handleSort('register')} className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-1">
                        <span>Registro (CMP)</span>
                        {sortBy === 'register' && (
                          <svg className={`w-3.5 h-3.5 transition-transform ${sortDesc ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-5 py-3 text-left">Estado</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                  {filteredDoctors.map((doctor) => (
                    <tr
                      key={doctor.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${!doctor.isActive ? 'bg-slate-50/30 dark:bg-slate-950/10 opacity-60' : ''}`}
                    >
                      <td className="px-5 py-1.5 text-left select-none">
                        <div
                          className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center overflow-hidden font-bold text-[10px] shadow-sm
                          ${doctor.photoUrl ? "" : getAvatarColor(doctor.id)}`}
                        >
                          {doctor.photoUrl ? (
                            <img
                              src={getPhotoFullUrl(doctor.photoUrl)}
                              alt={`${doctor.name} ${doctor.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getInitials(doctor.name, doctor.lastName)
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-1.5 text-left text-xs font-semibold text-slate-800 dark:text-slate-100">
                        <span className={`${!doctor.isActive ? 'text-slate-400 dark:text-slate-550 font-medium line-through decoration-slate-450/40' : ''}`}>
                          {doctor.name}
                        </span>
                      </td>
                      <td className="px-5 py-1.5 text-left text-xs font-semibold text-slate-800 dark:text-slate-100">
                        <span className={`${!doctor.isActive ? 'text-slate-400 dark:text-slate-550 font-medium line-through decoration-slate-450/40' : ''}`}>
                          {doctor.lastName}
                        </span>
                      </td>
                      <td className="px-5 py-1.5 text-left text-xs text-slate-600 dark:text-slate-350 font-medium">
                        {doctor.specialtyName || '—'}
                      </td>
                      <td className="px-5 py-1.5 text-left text-xs font-mono text-slate-600 dark:text-slate-300 select-all">
                        {doctor.register || '—'}
                      </td>
                      <td className="px-5 py-1.5 text-left text-xs select-none">
                        {doctor.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-600/20">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-600/20">
                            Desactivado
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-1.5 text-right select-none">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer('view', doctor, 'general')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-650 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                            title="Ver Detalle"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer('edit', doctor, 'general')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer('view', doctor, 'centers')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-650 dark:text-slate-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                            title="Centros Médicos"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatusClick(doctor, e)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${doctor.isActive ? 'text-slate-400 hover:text-red-650 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800/60' : 'text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                            title={doctor.isActive ? 'Desactivar' : 'Activar'}
                          >
                            {doctor.isActive ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* VIEW MODE: CARDS GRID LAYOUT */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between select-none relative group ${!doctor.isActive ? 'bg-slate-50/30 dark:bg-slate-950/10 opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3 text-left">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 select-none mt-1">
                      {doctor.photoUrl ? (
                        <img
                          src={getPhotoFullUrl(doctor.photoUrl)}
                          alt={`${doctor.name} ${doctor.lastName}`}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(doctor.id)}`}>
                          {getInitials(doctor.name, doctor.lastName)}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className={`text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors ${!doctor.isActive ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-450/40' : ''}`}>
                        {doctor.name} {doctor.lastName}
                      </h3>
                      <span className="block text-xs font-bold text-indigo-650 dark:text-indigo-400">
                        {doctor.specialtyName || 'Especialidad no asignada'}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono">
                        Registro: {doctor.register || '—'}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doctor.isVet && (
                          <span className="inline-block text-[9px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-950/20 dark:text-violet-400 px-1.5 py-0.5 rounded-lg border border-violet-100 dark:border-violet-900/30">
                            Atiende Veterinaria
                          </span>
                        )}
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded-lg border
                          ${doctor.isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                            : 'bg-red-50 text-red-650 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'}`}
                        >
                          {doctor.isActive ? 'Activo' : 'Desactivado'}
                        </span>
                      </div>
                      <div className="pt-2 text-[10px] text-slate-500 space-y-0.5">
                        <span className="block truncate max-w-[200px]">✉ {doctor.email || '—'}</span>
                        <span className="block">☎ {doctor.phone || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown Button */}
                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === doctor.id ? null : doctor.id)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5" />
                      </svg>
                    </button>

                    {activeMenuId === doctor.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-0 top-7 w-36 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-1 shadow-lg z-20 animate-fadeIn text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleOpenDrawer('view', doctor, 'general');
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            Ver Detalles
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleOpenDrawer('edit', doctor, 'general');
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleOpenDrawer('view', doctor, 'centers');
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            Centros Médicos
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleToggleStatusClick(doctor);
                            }}
                            className={`w-full text-left px-2 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer
                              ${doctor.isActive ? 'text-red-650 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          >
                            {doctor.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAGINATION FOOTER */}
      <div className="p-4 border-t border-slate-150 dark:border-slate-850 flex items-center justify-between gap-4 select-none bg-slate-50/30 dark:bg-slate-950/10 shrink-0">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Total: {totalCount} Médicos
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page === 1 || isLoading}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <span className="text-[10px] text-slate-500 font-bold px-2">
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page === totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER COMPONENT */}
      <DoctorDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={drawerMode}
        doctor={selectedDoctor}
        defaultTab={drawerDefaultTab}
        onSaveSuccess={fetchDoctors}
      />

      {/* CONFIRM STATUS TOGGLE DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setDoctorToToggle(null);
        }}
        onConfirm={handleConfirmToggleStatus}
        title="Desactivar Médico"
        message={`¿Estás seguro de que deseas desactivar al médico "${doctorToToggle?.name || ''} ${doctorToToggle?.lastName || ''}"?`}
        confirmText="Desactivar"
        confirmColor="danger"
        isLoading={isTogglingStatus}
      />

    </div>
  );
};

export default DoctorMaintenance;
