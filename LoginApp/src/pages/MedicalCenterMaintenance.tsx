import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { medicalCenterService } from '../services/medicalCenterService';
import { MedicalCenterDrawer } from '../components/MedicalCenterDrawer';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { MedicalCenterItem } from '../types/medicalCenter';

type LayoutMode = 'table' | 'cards';
type StatusFilter = 'all' | 'active' | 'inactive';

export const MedicalCenterMaintenance: React.FC = () => {
  // Persistent layout mode (table vs cards)
  const [viewMode, setViewMode] = useState<LayoutMode>(() => {
    const saved = sessionStorage.getItem('medicalCentersLayoutSelection');
    return saved === 'cards' ? 'cards' : 'table';
  });

  const [medicalCenters, setMedicalCenters] = useState<MedicalCenterItem[]>([]);
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
  const [selectedMedicalCenter, setSelectedMedicalCenter] = useState<MedicalCenterItem | null>(null);

  // Active Menu Dropdown ID for Card Actions (⋮)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Confirmation Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [medicalCenterToToggle, setMedicalCenterToToggle] = useState<MedicalCenterItem | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Leaflet Map Refs for Right Pane
  const mainMapContainerRef = useRef<HTMLDivElement>(null);
  const mainLeafletMapRef = useRef<L.Map | null>(null);
  const mapMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  // Persist layout selection
  useEffect(() => {
    sessionStorage.setItem('medicalCentersLayoutSelection', viewMode);
  }, [viewMode]);

  // Debouncing search query for 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch medical centers data from API
  const fetchMedicalCenters = useCallback(async () => {
    setIsLoading(true);
    try {
      // Map sort fields to backend supported sorting keys ('name', 'type', 'address', 'isActive', 'created_at', 'updated_at')
      let apiSortBy = 'created_at';
      if (sortBy === 'name') {
        apiSortBy = 'name';
      } else if (sortBy === 'type') {
        apiSortBy = 'type';
      } else if (sortBy === 'address') {
        apiSortBy = 'address';
      } else if (sortBy === 'isActive') {
        apiSortBy = 'isActive';
      }

      const data = await medicalCenterService.getPagedMedicalCenters({
        page,
        pageSize,
        search: debouncedSearch,
        sortBy: apiSortBy,
        sortDesc,
      });

      setMedicalCenters(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error loading medical centers:', error);
      toast.error('No se pudo cargar el listado de centros médicos.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, sortBy, sortDesc]);

  // Fetch on parameter change
  useEffect(() => {
    fetchMedicalCenters();
  }, [fetchMedicalCenters]);

  // Initialize main map on right panel
  useEffect(() => {
    if (!mainMapContainerRef.current) return;

    if (!mainLeafletMapRef.current) {
      const map = L.map(mainMapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([-12.04637, -77.04279], 12);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);

      mainLeafletMapRef.current = map;
      mapMarkersGroupRef.current = markersGroup;
    }

    return () => {
      if (mainLeafletMapRef.current) {
        mainLeafletMapRef.current.remove();
        mainLeafletMapRef.current = null;
        mapMarkersGroupRef.current = null;
      }
    };
  }, []);

  // Update map markers when medical centers change
  useEffect(() => {
    if (!mapMarkersGroupRef.current || !mainLeafletMapRef.current) return;

    // Clear existing markers
    mapMarkersGroupRef.current.clearLayers();

    const bounds: L.LatLngTuple[] = [];

    medicalCenters.forEach((center) => {
      if (center.isActive && center.latitude !== undefined && center.longitude !== undefined) {
        const lat = Number(center.latitude);
        const lng = Number(center.longitude);
        bounds.push([lat, lng]);

        // Custom Marker Indicator
        const svgIcon = L.divIcon({
          html: `<div class="flex items-center justify-center w-8 h-8 rounded-full ${center.isActive ? 'bg-emerald-600' : 'bg-red-500'} text-white shadow-lg border border-white transform transition-transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>`,
          className: 'custom-leaflet-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const marker = L.marker([lat, lng], { icon: svgIcon }).addTo(mapMarkersGroupRef.current!);
        
        marker.bindPopup(`
          <div class="text-xs p-1 text-slate-800 font-sans select-none text-left">
            <strong class="block text-slate-900 font-bold mb-0.5">${center.name}</strong>
            <span class="block text-slate-500 mb-1 leading-snug">${center.address || ''}</span>
            <span class="inline-block px-1.5 py-0.5 text-[9px] rounded font-bold ${center.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-50 text-red-650 border border-red-100 dark:bg-red-950/40 dark:text-red-400'}">${center.isActive ? 'Activo' : 'Inactivo'}</span>
          </div>
        `);

        // Clicking a marker opens the Leaflet popup details (configured via bindPopup)
      }
    });

    // Auto-fit map view bounds if multiple coordinates are found
    if (bounds.length > 0 && mainLeafletMapRef.current) {
      if (bounds.length === 1) {
        mainLeafletMapRef.current.setView(bounds[0], 14);
      } else {
        mainLeafletMapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [medicalCenters]);

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
  const handleOpenDrawer = (mode: 'view' | 'create' | 'edit', center: MedicalCenterItem | null) => {
    setSelectedMedicalCenter(center);
    setDrawerMode(mode);
    setIsDrawerOpen(true);
  };

  // Status Inactivation / Activation confirm triggers
  const handleToggleStatusClick = (center: MedicalCenterItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (center.isActive) {
      // Prompt confirm dialog on logical deactivation
      setMedicalCenterToToggle(center);
      setIsConfirmOpen(true);
    } else {
      // Activate immediately
      toggleStatus(center);
    }
  };

  const toggleStatus = async (center: MedicalCenterItem) => {
    setIsTogglingStatus(true);
    try {
      const result = await medicalCenterService.toggleMedicalCenterStatus(center.id);
      toast.success(
        `Centro médico "${center.name}" ${result.isActive ? 'activado' : 'inactivado'} correctamente.`
      );
      setIsConfirmOpen(false);
      setMedicalCenterToToggle(null);
      fetchMedicalCenters();
    } catch (error) {
      console.error('Error toggling medical center status:', error);
      toast.error('No se pudo modificar el estado del centro médico.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleConfirmToggleStatus = () => {
    if (!medicalCenterToToggle) return;
    toggleStatus(medicalCenterToToggle);
  };

  // Click list item centers map coordinates
  const handleCenterItemClick = (center: MedicalCenterItem) => {
    if (center.latitude !== undefined && center.longitude !== undefined && mainLeafletMapRef.current) {
      mainLeafletMapRef.current.setView([Number(center.latitude), Number(center.longitude)], 15);
    }
  };

  // Client-side filtering of status filter
  const getFilteredMedicalCenters = () => {
    let items = medicalCenters;

    if (statusFilter === 'active') {
      items = items.filter((i) => i.isActive);
    } else if (statusFilter === 'inactive') {
      items = items.filter((i) => !i.isActive);
    }

    return items;
  };

  const filteredMedicalCenters = getFilteredMedicalCenters();

  return (
    <div className="flex h-full w-full overflow-hidden">
      
      {/* LEFT SIDEBAR PANEL: high density scrollable console */}
      <div className="w-full md:w-[420px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shadow-sm text-left">
        
        {/* Title Header */}
        <div className="p-4 border-b border-slate-150 dark:border-slate-850">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                Centros Médicos
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 select-none">
                Mantenimiento y geolocalización de sedes médicas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenDrawer('create', null)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-505 rounded-xl transition-all cursor-pointer shadow-md focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nuevo Centro
            </button>
          </div>
        </div>

        {/* Toolbar Filters */}
        <div className="p-4 border-b border-slate-150 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/10 space-y-3 select-none">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, tipo o dirección..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Status tabs */}
            <div className="flex bg-slate-150/60 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-800/80 p-0.5 rounded-lg shrink-0">
              {(['all', 'active', 'inactive'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setStatusFilter(filter);
                    setPage(1);
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer focus:outline-none
                    ${statusFilter === filter
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {filter === 'all' ? 'Todos' : filter === 'active' ? 'Activos' : 'Inactivos'}
                </button>
              ))}
            </div>

            {/* Layout Toggle */}
            <div className="flex border border-slate-200/60 dark:border-slate-800/80 p-0.5 rounded-lg bg-slate-150/60 dark:bg-slate-950/30 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1 rounded transition-all cursor-pointer focus:outline-none
                  ${viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-450 dark:text-slate-500'}`}
                title="Vista Tarjetas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1 rounded transition-all cursor-pointer focus:outline-none
                  ${viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-450 dark:text-slate-500'}`}
                title="Vista Tabla"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Center Lists */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-4 space-y-3">
              <div className="h-10 bg-slate-100 dark:bg-slate-800/40 rounded-xl animate-pulse w-full" />
              <div className="h-10 bg-slate-100 dark:bg-slate-800/40 rounded-xl animate-pulse w-full" />
              <div className="h-10 bg-slate-100 dark:bg-slate-800/40 rounded-xl animate-pulse w-full" />
            </div>
          ) : filteredMedicalCenters.length === 0 ? (
            <div className="p-8 text-center select-none">
              <span className="text-slate-400 block text-xs">No se encontraron centros médicos.</span>
            </div>
          ) : viewMode === 'table' ? (
            /* DENSE TABLE VIEW (No Avatars, Tight cell padding) */
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 dark:bg-slate-950/20 border-b border-slate-150 dark:border-slate-800/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th onClick={() => handleSort('name')} className="px-4 py-2.5 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-0.5">
                        <span>Nombre</span>
                        {sortBy === 'name' && (
                          <svg className={`w-3 h-3 ${sortDesc ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th onClick={() => handleSort('type')} className="px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-0.5">
                        <span>Tipo</span>
                        {sortBy === 'type' && (
                          <svg className={`w-3 h-3 ${sortDesc ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-2.5 text-right w-[110px]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredMedicalCenters.map((center) => (
                    <tr 
                      key={center.id}
                      onClick={() => handleCenterItemClick(center)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/25 transition-colors cursor-pointer ${!center.isActive ? 'bg-slate-50/30 dark:bg-slate-950/10 opacity-60' : ''}`}
                    >
                      <td className="px-4 py-2 text-left text-xs font-semibold text-slate-850 dark:text-slate-150 align-middle">
                        <span className={`block truncate max-w-[170px] ${!center.isActive ? 'text-slate-400 dark:text-slate-500 font-medium line-through decoration-slate-450/40' : ''}`}>
                          {center.name}
                        </span>
                        <span className="block text-[9px] text-slate-400 font-normal truncate max-w-[170px]">{center.address}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 select-none">
                          {center.isActive ? (
                            <span className="px-1 py-0.2 text-[8px] font-bold rounded bg-emerald-50 text-emerald-600 border border-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                              Activo
                            </span>
                          ) : (
                            <span className="px-1 py-0.2 text-[8px] font-bold rounded bg-red-50 text-red-650 border border-red-100/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
                              Desactivado
                            </span>
                          )}
                          {(center.latitude !== undefined && center.longitude !== undefined) && (
                            <span className="text-[8px] font-mono text-slate-500 select-all">
                              ({center.latitude}, {center.longitude})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-left text-xs text-slate-650 dark:text-slate-450 align-middle">
                        <span className="truncate max-w-[90px] block">{center.typeName || '—'}</span>
                      </td>
                      <td className="px-3 py-2 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 select-none">
                          <button
                            onClick={() => handleOpenDrawer('view', center)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-150 dark:hover:bg-slate-850 cursor-pointer"
                            title="Ver"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleOpenDrawer('edit', center)}
                            className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-slate-150 dark:hover:bg-slate-850 cursor-pointer"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggleStatusClick(center)}
                            className={`p-1 rounded cursor-pointer ${center.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-slate-150 dark:hover:bg-slate-850' : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-150 dark:hover:bg-slate-850'}`}
                            title={center.isActive ? 'Desactivar' : 'Activar'}
                          >
                            {center.isActive ? (
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
          ) : (
            /* CARDS ROW LISTING (No Avatars) */
            <div className="p-4 space-y-3">
              {filteredMedicalCenters.map((center) => (
                <div
                  key={center.id}
                  onClick={() => handleCenterItemClick(center)}
                  className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl hover:shadow-md cursor-pointer transition-all flex flex-col justify-between select-none relative group ${!center.isActive ? 'bg-slate-50/30 dark:bg-slate-950/10 opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3 text-left">
                    <div className="space-y-1">
                      <h3 className={`text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors ${!center.isActive ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-450/40' : ''}`}>
                        {center.name}
                      </h3>
                      <span className="block text-[10px] text-slate-400 leading-normal truncate max-w-[280px]">
                        {center.address}
                      </span>
                      <div className="flex flex-wrap gap-1.5 items-center mt-1">
                        <span className="inline-block text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {center.typeName || 'Tipo no asignado'}
                        </span>
                        <span className={`inline-block px-1 py-0.2 text-[8px] font-bold rounded border
                          ${center.isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30'
                            : 'bg-red-50 text-red-650 border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30'}`}
                        >
                          {center.isActive ? 'Activo' : 'Desactivado'}
                        </span>
                        {(center.latitude !== undefined && center.longitude !== undefined) && (
                          <span className="inline-block text-[8px] font-mono text-slate-550 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/20 px-1 py-0.5 rounded border border-slate-200/40 dark:border-slate-800/40 select-all">
                            ({center.latitude}, {center.longitude})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative shrink-0 flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${center.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === center.id ? null : center.id);
                        }}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-450"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5" />
                        </svg>
                      </button>

                      {/* Dropdown Menu actions popup */}
                      {activeMenuId === center.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute right-0 top-6 w-32 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-1 shadow-lg z-20 animate-fadeIn">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenDrawer('view', center);
                              }}
                              className="w-full text-left px-2 py-1.5 text-[10px] font-bold rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                            >
                              Ver Detalles
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenDrawer('edit', center);
                              }}
                              className="w-full text-left px-2 py-1.5 text-[10px] font-bold rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleToggleStatusClick(center);
                              }}
                              className={`w-full text-left px-2 py-1.5 text-[10px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer
                                ${center.isActive ? 'text-red-650 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            >
                              {center.isActive ? 'Desactivar' : 'Activar'}
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-150 dark:border-slate-850 flex items-center justify-between gap-4 select-none bg-slate-50/30 dark:bg-slate-950/10">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Total: {totalCount} sedes
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

      </div>

      {/* RIGHT SIDE PANE MAP: Fullinteractive Leaflet Map */}
      <div className="flex-1 h-full bg-slate-50 dark:bg-slate-950/20 relative z-0">
        <div 
          ref={mainMapContainerRef} 
          className="w-full h-full"
        />
      </div>

      {/* Slide-over details / CRUD form Drawer Panel */}
      <MedicalCenterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={drawerMode}
        medicalCenter={selectedMedicalCenter}
        onSaveSuccess={fetchMedicalCenters}
      />

      {/* Confirm Deactivation safety dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setMedicalCenterToToggle(null);
        }}
        onConfirm={handleConfirmToggleStatus}
        title="Desactivar Centro Médico"
        message={`¿Estás seguro de que deseas desactivar a "${medicalCenterToToggle?.name || ''}"?`}
        confirmText="Desactivar"
        confirmColor="danger"
        isLoading={isTogglingStatus}
      />

    </div>
  );
};

export default MedicalCenterMaintenance;
