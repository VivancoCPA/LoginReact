import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { specialtyService } from '../services/specialtyService';
import { SpecialtyDrawer } from '../components/SpecialtyDrawer';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { SpecialtyItem } from '../types/specialty';

type LayoutMode = 'table' | 'cards';
type StatusFilter = 'all' | 'active' | 'inactive';

const formatDateToYYYYMMDD = (dateStr?: string) => {
  if (!dateStr) return '—';
  return dateStr.split('T')[0];
};

export const SpecialtyMaintenance: React.FC = () => {
  // Persistent layout mode (table vs cards)
  const [viewMode, setViewMode] = useState<LayoutMode>(() => {
    const saved = sessionStorage.getItem('specialtiesLayoutSelection');
    return saved === 'cards' ? 'cards' : 'table';
  });

  const [specialties, setSpecialties] = useState<SpecialtyItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Sorting state (default sortBy = name, sortDesc = false)
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDesc, setSortDesc] = useState(false);

  // Search query (debounced)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Drawer Control State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'create' | 'edit'>('view');
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyItem | null>(null);

  // Active Menu Dropdown ID for Card Actions (⋮)
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Confirmation Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [specialtyToToggle, setSpecialtyToToggle] = useState<SpecialtyItem | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Persist layout selection
  useEffect(() => {
    sessionStorage.setItem('specialtiesLayoutSelection', viewMode);
  }, [viewMode]);

  // Debouncing search query for 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch specialties data from API
  const fetchSpecialties = useCallback(async () => {
    setIsLoading(true);
    try {
      // Map sort fields to backend supported sorting keys ('name', 'isActive', 'created_at')
      let apiSortBy = 'created_at';
      if (sortBy === 'name') {
        apiSortBy = 'name';
      } else if (sortBy === 'isActive') {
        apiSortBy = 'isActive';
      }

      const data = await specialtyService.getPagedSpecialties({
        page,
        pageSize,
        search: debouncedSearch,
        sortBy: apiSortBy,
        sortDesc,
      });

      setSpecialties(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error loading specialties:', error);
      toast.error('No se pudo cargar el listado de especialidades.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, sortBy, sortDesc]);

  // Fetch on parameter change
  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

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
  const handleOpenDrawer = (mode: 'view' | 'create' | 'edit', specialty: SpecialtyItem | null) => {
    setSelectedSpecialty(specialty);
    setDrawerMode(mode);
    setIsDrawerOpen(true);
  };

  // Status Inactivation / Activation confirm triggers
  const handleToggleStatusClick = (specialty: SpecialtyItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (specialty.isActive) {
      // Prompt confirm dialog on logical deactivation
      setSpecialtyToToggle(specialty);
      setIsConfirmOpen(true);
    } else {
      // Activate immediately or via toggle service call
      toggleStatus(specialty);
    }
  };

  const toggleStatus = async (specialty: SpecialtyItem) => {
    setIsTogglingStatus(true);
    try {
      const result = await specialtyService.toggleSpecialtyStatus(specialty.id);
      toast.success(
        `Especialidad "${specialty.name}" ${result.isActive ? 'activada' : 'inactivada'} correctamente.`
      );
      setIsConfirmOpen(false);
      setSpecialtyToToggle(null);
      fetchSpecialties();
    } catch (error) {
      console.error('Error toggling specialty status:', error);
      toast.error('No se pudo modificar el estado de la especialidad.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleConfirmToggleStatus = () => {
    if (!specialtyToToggle) return;
    toggleStatus(specialtyToToggle);
  };

  // Dynamic colors for avatar fallback initials
  const getAvatarColor = (id: number) => {
    const colors = [
      'bg-indigo-500 text-white',
      'bg-emerald-500 text-white',
      'bg-violet-500 text-white',
      'bg-rose-500 text-white',
      'bg-amber-500 text-white',
      'bg-sky-500 text-white',
    ];
    return colors[id % colors.length];
  };

  const getInitials = (name: string) => {
    if (!name.trim()) return 'ES';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) || '';
    const second = parts[1]?.charAt(0) || '';
    return `${first}${second}`.toUpperCase();
  };

  // Client-side filtering of status filter
  const getFilteredSpecialties = () => {
    let items = specialties;

    if (statusFilter === 'active') {
      items = items.filter((i) => i.isActive);
    } else if (statusFilter === 'inactive') {
      items = items.filter((i) => !i.isActive);
    }

    return items;
  };

  const filteredSpecialties = getFilteredSpecialties();

  return (
    <div className="flex flex-col h-full w-full text-left overflow-hidden gap-4">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Mantenimiento de Especialidades
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
            Configure las especialidades médicas para ser asignadas a los médicos registrados en la plataforma.
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
          Nueva Especialidad
        </button>
      </div>

      {/* FILTER AND ACTION BAR */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm select-none shrink-0">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
            {(['all', 'active', 'inactive'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setStatusFilter(filter);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer focus:outline-none
                  ${statusFilter === filter
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                {filter === 'all' ? 'Todos' : filter === 'active' ? 'Activas' : 'Inactivas'}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Mode Switcher (persist viewMode) */}
        <div className="flex border border-slate-200 dark:border-slate-800 p-1 rounded-xl bg-slate-50 dark:bg-slate-950/40 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer focus:outline-none
              ${viewMode === 'cards'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'}`}
            title="Vista de Tarjetas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer focus:outline-none
              ${viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'}`}
            title="Vista de Tabla"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Render Listings */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 -mr-1">
        {isLoading ? (
        // Loading animation skeleton (matches UserMaintenance)
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
          <div className="space-y-4">
            <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-1/3 animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
          </div>
        </div>
      ) : filteredSpecialties.length === 0 ? (
        // Empty state feedback
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-16 shadow-sm text-center select-none">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.732 2.076 1.708m-8.314 0A2.25 2.25 0 0 0 6.75 6.108V18.75A2.25 2.25 0 0 0 9 21h5.25a2.25 2.25 0 0 0 2.25-2.25V15" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
            No se encontraron especialidades
          </h3>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Pruebe modificando su criterio de búsqueda o relajando los filtros de estado.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        // VIEW MODE: HIGH-DENSITY COMPACT TABLE
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold select-none">

                  <th
                    onClick={() => handleSort('name')}
                    className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Nombre</span>
                      {sortBy === 'name' && (
                        <svg className={`w-3.5 h-3.5 transition-transform ${sortDesc ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('isActive')}
                    className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Estado</span>
                      {sortBy === 'isActive' && (
                        <svg className={`w-3.5 h-3.5 transition-transform ${sortDesc ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3 text-left">Registrado</th>
                  <th className="px-5 py-3 text-right w-[150px]">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                {filteredSpecialties.map((specialty) => (
                  <tr
                    key={specialty.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >


                    <td className="px-5 py-1.5 text-left text-xs align-middle">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 max-w-[300px] truncate">
                        {specialty.name}
                      </div>
                      {specialty.description && (
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5 max-w-[300px]">
                          {specialty.description}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-1.5 text-left text-xs select-none align-middle">
                      {specialty.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-600/20">
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-600/20">
                          Inactiva
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-1.5 text-left text-xs font-mono text-slate-600 dark:text-slate-350 select-all align-middle">
                      {formatDateToYYYYMMDD(specialty.createdAt)}
                    </td>

                    <td className="px-5 py-1.5 text-right align-middle select-none">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer('view', specialty)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                          title="Ver Detalles"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer('edit', specialty)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleToggleStatusClick(specialty, e)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors
                            ${specialty.isActive 
                              ? 'text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800/60' 
                              : 'text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                          title={specialty.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {specialty.isActive ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
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
        // VIEW MODE: HIGH-FIDELITY RESPONSIVE CARDS GRID VIEW
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSpecialties.map((specialty) => (
            <div
              key={specialty.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg dark:hover:border-slate-700/80 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                {/* Header card: initials visual badge and actions dropdown dots */}
                <div className="flex items-start justify-between gap-3 select-none">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-sm border border-slate-100 dark:border-slate-800 uppercase ${getAvatarColor(specialty.id)}`}
                    >
                      {getInitials(specialty.name)}
                    </div>
                    <div className="space-y-1.5 text-left max-w-[80%]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {specialty.name}
                        </h3>
                        <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border
                          ${specialty.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-600/20'
                            : 'bg-red-50 dark:bg-red-650/10 text-red-650 dark:text-red-400 border-red-100 dark:border-red-600/20'}`}
                        >
                          {specialty.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      {specialty.description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium line-clamp-2 leading-relaxed">
                          {specialty.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vertical Triple-dot (⋮) Dropdown menu */}
                  <div className="relative shrink-0 flex items-center gap-2">
                    {specialty.isActive ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" title="Activa" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Inactiva" />
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === specialty.id ? null : specialty.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5" />
                      </svg>
                    </button>

                    {activeMenuId === specialty.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveMenuId(null)}
                        />
                        <div className="absolute right-0 mt-30 w-40 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-20 animate-fadeIn select-none">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleOpenDrawer('view', specialty);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer focus:outline-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                            Ver Detalles
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleOpenDrawer('edit', specialty);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer focus:outline-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                            </svg>
                            Editar
                          </button>

                          <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                          <button
                            type="button"
                            onClick={(e) => {
                              setActiveMenuId(null);
                              handleToggleStatusClick(specialty, e);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer focus:outline-none
                              ${specialty.isActive 
                                ? 'text-red-650 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20' 
                                : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20'}`}
                          >
                            {specialty.isActive ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                Desactivar
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                Activar
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 shrink-0">ID:</span>
                    <span className="text-slate-700 dark:text-slate-350 font-mono font-medium">{specialty.id}</span>
                  </div>
                </div>

              </div>

              {/* Card Footer registered time */}
              <div className="mt-6 border-t border-slate-100 dark:border-slate-800/40 pt-3 text-[10px] text-slate-400 dark:text-slate-550 select-none flex justify-between">
                <span>Registrado: {formatDateToYYYYMMDD(specialty.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* PAGINATION FOOTER CONTROL PANEL */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 select-none shrink-0 border-t border-slate-100 dark:border-slate-800/60 pt-4">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Mostrando{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {filteredSpecialties.length}
          </span>{' '}
          de{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {totalCount}
          </span>{' '}
          especialidades en total
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page === 1 || isLoading}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <span className="text-xs text-slate-650 dark:text-slate-400 px-3">
            Página{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {page}
            </span>{' '}
            de{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {totalPages}
            </span>
          </span>

          <button
            type="button"
            disabled={page === totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Slide-over Specialty details / CRUD form Drawer Panel */}
      <SpecialtyDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={drawerMode}
        specialty={selectedSpecialty}
        onSaveSuccess={fetchSpecialties}
      />

      {/* Logical Status inactivation/activation Confirm Warning dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setSpecialtyToToggle(null);
        }}
        onConfirm={handleConfirmToggleStatus}
        title="Desactivar Especialidad"
        message="Esta especialidad ya no estará disponible para nuevos médicos. ¿Desea continuar?"
        confirmText="Desactivar"
        confirmColor="danger"
        isLoading={isTogglingStatus}
      />

    </div>
  );
};

export default SpecialtyMaintenance;
