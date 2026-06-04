import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { insurerService } from '../services/insurerService';
import { InsurerDrawer } from '../components/InsurerDrawer';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getPhotoFullUrl } from '../utils/photo';
import type { InsurerItem } from '../types/insurer';

type LayoutMode = 'table' | 'cards';
type StatusFilter = 'all' | 'active' | 'inactive';

const formatDateToYYYYMMDD = (dateStr?: string) => {
  if (!dateStr) return '—';
  return dateStr.split('T')[0];
};

export const InsurerMaintenance: React.FC = () => {
  // Persistent layout mode (table vs cards)
  const [viewMode, setViewMode] = useState<LayoutMode>(() => {
    const saved = sessionStorage.getItem('insurersLayoutSelection');
    return saved === 'cards' ? 'cards' : 'table';
  });

  const [insurers, setInsurers] = useState<InsurerItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Sorting state
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
  const [selectedInsurer, setSelectedInsurer] = useState<InsurerItem | null>(null);

  // Active Menu Dropdown ID for Card Actions (⋮)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Confirmation Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [insurerToToggle, setInsurerToToggle] = useState<InsurerItem | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Persist layout selection
  useEffect(() => {
    sessionStorage.setItem('insurersLayoutSelection', viewMode);
  }, [viewMode]);

  // Debouncing search query for 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch insurers data from API
  const fetchInsurers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Map sort fields to backend supported sorting keys
      let apiSortBy = 'created_at';
      if (sortBy === 'name') {
        apiSortBy = 'name';
      } else if (sortBy === 'email') {
        apiSortBy = 'email';
      } else if (sortBy === 'isActive') {
        apiSortBy = 'isActive';
      }

      const data = await insurerService.getPagedInsurers({
        page,
        pageSize,
        search: debouncedSearch,
        sortBy: apiSortBy,
        sortDesc,
      });

      setInsurers(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error loading insurers:', error);
      toast.error('No se pudo cargar el listado de aseguradoras.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, sortBy, sortDesc]);

  // Fetch on change
  useEffect(() => {
    fetchInsurers();
  }, [fetchInsurers]);

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
  const handleOpenDrawer = (mode: 'view' | 'create' | 'edit', insurer: InsurerItem | null) => {
    setSelectedInsurer(insurer);
    setDrawerMode(mode);
    setIsDrawerOpen(true);
  };

  // Status Inactivation / Activation confirm triggers
  const handleToggleStatusClick = (insurer: InsurerItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setInsurerToToggle(insurer);
    setIsConfirmOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!insurerToToggle) return;
    setIsTogglingStatus(true);
    try {
      const result = await insurerService.toggleInsurerStatus(insurerToToggle.id);
      toast.success(
        `Aseguradora "${insurerToToggle.name}" ${result.isActive ? 'activada' : 'inactivada'} correctamente.`
      );
      setIsConfirmOpen(false);
      setInsurerToToggle(null);
      fetchInsurers();
    } catch (error) {
      console.error('Error toggling insurer status:', error);
      toast.error('No se pudo modificar el estado de la aseguradora.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Dynamic colors for avatar fallback initials
  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-indigo-500 text-white',
      'bg-emerald-500 text-white',
      'bg-violet-500 text-white',
      'bg-rose-500 text-white',
      'bg-amber-500 text-white',
      'bg-sky-500 text-white',
    ];
    const charCodeSum = id
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  const getInitials = (name: string) => {
    if (!name.trim()) return 'A';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) || '';
    const second = parts[1]?.charAt(0) || '';
    return `${first}${second}`.toUpperCase();
  };

  // Filter client-side status filter on fetched items
  const getFilteredInsurers = () => {
    let items = insurers;

    // Client-side status filtering
    if (statusFilter === 'active') {
      items = items.filter((i) => i.isActive);
    } else if (statusFilter === 'inactive') {
      items = items.filter((i) => !i.isActive);
    }

    // Since address/personInCharge aren't sortable in the API, we sort client-side on page items
    if (sortBy === 'address' || sortBy === 'personInCharge') {
      items = [...items].sort((a, b) => {
        const field = sortBy as keyof InsurerItem;
        let aVal = (a[field] as string) || '';
        let bVal = (b[field] as string) || '';
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return sortDesc ? 1 : -1;
        if (aVal > bVal) return sortDesc ? -1 : 1;
        return 0;
      });
    }

    return items;
  };

  const filteredInsurers = getFilteredInsurers();

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Mantenimiento de Aseguradoras
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
            Configure las aseguradoras médicas de salud que operan con los pacientes afiliados a la plataforma.
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
          Nueva Aseguradora
        </button>
      </div>

      {/* FILTER AND ACTION BAR */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm select-none">
        
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
              placeholder="Buscar por nombre, dirección, email..."
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
                {filter === 'all' ? 'Todos' : filter === 'active' ? 'Activos' : 'Inactivos'}
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
      {isLoading ? (
        // Loading animation skeleton (matches UserMaintenance)
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
          <div className="space-y-4">
            <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-1/3 animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
          </div>
        </div>
      ) : filteredInsurers.length === 0 ? (
        // Empty state feedback
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-16 shadow-sm text-center select-none">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21h10.5V3.75a.75.75 0 0 0-.75-.75H7.5a.75.75 0 0 0-.75.75V21Z" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
            No se encontraron aseguradoras
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
                  <th className="px-5 py-3 text-left w-[60px]">Avatar</th>
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
                    onClick={() => handleSort('address')}
                    className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Dirección</span>
                      {sortBy === 'address' && (
                        <svg className={`w-3.5 h-3.5 transition-transform ${sortDesc ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3 text-left">Teléfono</th>
                  <th
                    onClick={() => handleSort('personInCharge')}
                    className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Contacto</span>
                      {sortBy === 'personInCharge' && (
                        <svg className={`w-3.5 h-3.5 transition-transform ${sortDesc ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-right w-[150px]">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                {filteredInsurers.map((insurer) => (
                  <tr
                    key={insurer.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-5 py-1.5 text-left align-middle">
                      <div
                        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center overflow-hidden font-bold text-[10px] shadow-sm
                          ${insurer.logoUrl ? '' : getAvatarColor(insurer.id)}`}
                      >
                        {insurer.logoUrl ? (
                          <img
                            src={getPhotoFullUrl(insurer.logoUrl)}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(insurer.name)
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-1.5 text-left text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] truncate align-middle">
                      {insurer.name}
                    </td>

                    <td className="px-5 py-1.5 text-left text-xs text-slate-600 dark:text-slate-300 max-w-[220px] truncate align-middle">
                      {insurer.address}
                    </td>

                    <td className="px-5 py-1.5 text-left text-xs font-mono text-slate-600 dark:text-slate-300 select-all align-middle">
                      {insurer.phone}
                    </td>

                    <td className="px-5 py-1.5 text-left text-xs text-slate-600 dark:text-slate-300 max-w-[140px] truncate align-middle">
                      {insurer.personInCharge || '—'}
                    </td>

                    <td className="px-5 py-1.5 text-left text-xs select-none align-middle">
                      {insurer.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-600/20">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-600/20">
                          Inactivo
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-1.5 text-right align-middle select-none">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer('view', insurer)}
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
                          onClick={() => handleOpenDrawer('edit', insurer)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleToggleStatusClick(insurer, e)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors
                            ${insurer.isActive 
                              ? 'text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800/60' 
                              : 'text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                          title={insurer.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {insurer.isActive ? (
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
          {filteredInsurers.map((insurer) => (
            <div
              key={insurer.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg dark:hover:border-slate-700/80 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                {/* Header card: avatar circle and actions dots menu */}
                <div className="flex items-start justify-between gap-3 select-none">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden font-extrabold text-xs shadow-sm border border-slate-100 dark:border-slate-800
                        ${insurer.logoUrl ? '' : getAvatarColor(insurer.id)}`}
                    >
                      {insurer.logoUrl ? (
                        <img
                          src={getPhotoFullUrl(insurer.logoUrl)}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(insurer.name)
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {insurer.name}
                      </h3>
                      <span className={`inline-flex mt-1 px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border
                        ${insurer.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-600/20'
                          : 'bg-red-50 dark:bg-red-650/10 text-red-650 dark:text-red-400 border-red-100 dark:border-red-600/20'}`}
                      >
                        {insurer.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Vertical Triple-dot (⋮) Dropdown menu */}
                  <div className="relative shrink-0 flex items-center gap-2">
                    {insurer.isActive ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" title="Activo" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Inactivo" />
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === insurer.id ? null : insurer.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5" />
                      </svg>
                    </button>

                    {activeMenuId === insurer.id && (
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
                              handleOpenDrawer('view', insurer);
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
                              handleOpenDrawer('edit', insurer);
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
                              handleToggleStatusClick(insurer, e);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer focus:outline-none
                              ${insurer.isActive 
                                ? 'text-red-650 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20' 
                                : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20'}`}
                          >
                            {insurer.isActive ? (
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

                {/* Metadata Details block */}
                <div className="mt-4 space-y-2.5 text-xs text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 shrink-0">Dirección:</span>
                    <span className="text-slate-700 dark:text-slate-350 truncate">{insurer.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 shrink-0">Teléfono:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono select-all">{insurer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 shrink-0">Contacto:</span>
                    <span className="text-slate-700 dark:text-slate-350 truncate">{insurer.personInCharge || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 shrink-0">Asegurados:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{insurer.insuredUsersCount ?? 0}</span>
                  </div>
                </div>

              </div>

              {/* Card Footer relative times */}
              <div className="mt-4 border-t border-slate-100 dark:border-slate-800/40 pt-3 text-[10px] text-slate-400 dark:text-slate-500 select-none flex justify-between">
                <span>Registrado: {formatDateToYYYYMMDD(insurer.createdAt)}</span>
                <span>Modificado: {formatDateToYYYYMMDD(insurer.updatedAt)}</span>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* CLIENT-SIDE / SERVER-SIDE PAGINATION FOOTER CONTROL PANEL */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Mostrando{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {filteredInsurers.length}
          </span>{' '}
          de{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {totalCount}
          </span>{' '}
          aseguradoras en total
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

      {/* Slide-over Insurer details / CRUD form Drawer Panel */}
      <InsurerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={drawerMode}
        insurer={selectedInsurer}
        onSaveSuccess={fetchInsurers}
      />

      {/* Logical Status activation/inactivation Confirm Warning dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setInsurerToToggle(null);
        }}
        onConfirm={handleConfirmToggleStatus}
        title={insurerToToggle?.isActive ? 'Desactivar Aseguradora' : 'Activar Aseguradora'}
        message={
          insurerToToggle?.isActive
            ? `¿Estás seguro de que deseas desactivar a la aseguradora "${insurerToToggle.name}"?` +
              ((insurerToToggle.insuredUsersCount ?? 0) > 0
                ? ` ADVERTENCIA: Esta aseguradora tiene ${insurerToToggle.insuredUsersCount} usuario(s) asociado(s) que quedarán huérfanos.`
                : '')
            : `¿Estás seguro de que deseas reactivar a la aseguradora "${insurerToToggle?.name}"?`
        }
        confirmText={insurerToToggle?.isActive ? 'Desactivar' : 'Activar'}
        confirmColor={insurerToToggle?.isActive ? 'danger' : 'success'}
        isLoading={isTogglingStatus}
      />

    </div>
  );
};

export default InsurerMaintenance;
