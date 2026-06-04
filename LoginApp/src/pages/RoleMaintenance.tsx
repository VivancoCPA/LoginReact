import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { roleService } from "../services/roleService";
import { RoleDrawer } from "../components/RoleDrawer";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { RoleItem } from "../types/role";

type LayoutMode = "table" | "cards";

export const RoleMaintenance: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Persistent layout mode selector
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = sessionStorage.getItem("rolesLayoutSelection");
    return saved === "table" || saved === "cards" ? saved : "table";
  });

  // Sorting State
  const [sortField, setSortField] = useState<"name" | "assignedUsersCount">(
    "name",
  );
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Drawer Control State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);

  // Active Menu Dropdown ID for Card Actions (⋮)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Confirmation Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [roleToToggle, setRoleToToggle] = useState<RoleItem | null>(null);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const data = await roleService.getRoles();
      // Ensure role item properties have solid fallbacks
      const cleanedData = data.map((r) => ({
        ...r,
        description: r.description || "",
        isSystemRole:
          r.name === "Admin" ||
          r.name === "User" ||
          r.name === "Auditor" ||
          r.name === "Asegurador",
      }));
      setRoles(cleanedData);
    } catch (error) {
      console.error("Error loading roles:", error);
      toast.error("Error al cargar la lista de roles del sistema.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleToggleStatus = (role: RoleItem) => {
    if (role.isSystemRole) {
      toast.error("No se puede modificar el estado de un rol del sistema.");
      return;
    }
    if (role.isActive && role.assignedUsersCount > 0) {
      toast.error(
        `No se puede inactivar el rol "${role.name}" porque tiene usuarios asignados.`,
      );
      return;
    }

    setRoleToToggle(role);
    setIsConfirmOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!roleToToggle) return;

    setIsTogglingId(roleToToggle.id);
    try {
      const result = await roleService.toggleRoleStatus(roleToToggle.id);
      toast.success(
        `Rol "${roleToToggle.name}" ${result.isActive ? "activado" : "inactivado"} exitosamente.`,
      );
      fetchRoles();
    } catch (err: any) {
      console.error(err);
      const msg =
        err.response?.data?.detail || "Error al cambiar el estado del rol.";
      toast.error(msg);
    } finally {
      setIsTogglingId(null);
      setIsConfirmOpen(false);
      setRoleToToggle(null);
    }
  };

  // Save layout selection to session storage
  const handleToggleLayout = (mode: LayoutMode) => {
    setLayoutMode(mode);
    sessionStorage.setItem("rolesLayoutSelection", mode);
  };

  // Close card action menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Filter and Sort Roles on client-side
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sortedRoles = [...filteredRoles].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  // Pagination calculation
  const totalItems = sortedRoles.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRoles = sortedRoles.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: "name" | "assignedUsersCount") => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
    setCurrentPage(1);
  };

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setSelectedRole(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (role: RoleItem) => {
    setDrawerMode("edit");
    setSelectedRole(role);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Upper Tools Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-all duration-200">
        {/* Search Input Bar */}
        <div className="relative flex-1 max-w-md select-none">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.636Z"
              />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar roles por nombre..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 transition-all placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {/* Action CTAs */}
        <div className="flex items-center justify-end gap-3.5 select-none">
          {/* Layout Toggle View Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/60 rounded-xl">
            {/* Table icon */}
            <button
              onClick={() => handleToggleLayout("cards")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${layoutMode === "cards" ? "bg-white dark:bg-slate-850 shadow-xs text-indigo-650 dark:text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350"}`}
              title="Vista Tarjetas"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                />
              </svg>
            </button>

            {/* Cards icon */}
            <button
              onClick={() => handleToggleLayout("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${layoutMode === "table" ? "bg-white dark:bg-slate-850 shadow-xs text-indigo-650 dark:text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350"}`}
              title="Vista de Tabla"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
                />
              </svg>
            </button>
          </div>

          {/* "+ Nuevo Rol" primary CTA */}
          <button
            onClick={openCreateDrawer}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/10 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Nuevo Rol
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        // Loading Skeleton
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="h-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg w-full" />
          <div className="space-y-2.5">
            <div className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg w-full" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg w-full" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg w-full" />
          </div>
        </div>
      ) : paginatedRoles.length === 0 ? (
        // Empty state View
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-16 text-center shadow-xs select-none">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 mb-4 border border-slate-100 dark:border-slate-800/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-1">
            No se encontraron roles
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
            No encontramos ningún rol del sistema registrado que coincida con el
            criterio de búsqueda "{searchQuery}".
          </p>
        </div>
      ) : layoutMode === "table" ? (
        // TABLE MODE VIEW
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs shadow-slate-100/50">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-650 dark:text-slate-350">
              <thead className="bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {/* Name Header Column */}
                  <th
                    onClick={() => handleSort("name")}
                    className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Nombre
                      {sortField === "name" ? (
                        sortAsc ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="w-3.5 h-3.5 text-indigo-500"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m4.5 15.75 7.5-7.5 7.5 7.5"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="w-3.5 h-3.5 text-indigo-500"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m19.5 8.25-7.5 7.5-7.5-7.5"
                            />
                          </svg>
                        )
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-3.5 h-3.5 opacity-20"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                          />
                        </svg>
                      )}
                    </div>
                  </th>

                  {/* Assigned Count Header Column */}
                  <th
                    onClick={() => handleSort("assignedUsersCount")}
                    className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Asignados
                      {sortField === "assignedUsersCount" ? (
                        sortAsc ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="w-3.5 h-3.5 text-indigo-500"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m4.5 15.75 7.5-7.5 7.5 7.5"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="w-3.5 h-3.5 text-indigo-500"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m19.5 8.25-7.5 7.5-7.5-7.5"
                            />
                          </svg>
                        )
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-3.5 h-3.5 opacity-20"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                          />
                        </svg>
                      )}
                    </div>
                  </th>

                  {/* Actions Column */}
                  <th className="px-6 py-4.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-350">
                {paginatedRoles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors"
                  >
                    {/* Role name & system tag */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2 max-w-sm flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-150 truncate">
                          {role.name}
                        </span>
                        {role.isSystemRole && (
                          <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg bg-indigo-55 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-650/15">
                            Sistema
                          </span>
                        )}
                        <span
                          className={`shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${
                            role.isActive
                              ? "bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-600/20"
                              : "bg-rose-50 dark:bg-rose-600/10 text-rose-600 dark:text-rose-400 border-rose-100/50 dark:border-rose-600/20"
                          }`}
                        >
                          {role.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      {role.description && (
                        <span className="block text-xs text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5 max-w-sm">
                          {role.description}
                        </span>
                      )}
                    </td>

                    {/* User assignment pill */}
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-600/20">
                        {role.assignedUsersCount}{" "}
                        {role.assignedUsersCount === 1 ? "Usuario" : "Usuarios"}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-3.5 text-right select-none">
                      <div className="flex items-center justify-end gap-3.5">
                        {/* Toggle switch */}
                        <button
                          onClick={() => handleToggleStatus(role)}
                          disabled={
                            isTogglingId === role.id ||
                            role.isSystemRole ||
                            (!role.isActive && role.assignedUsersCount > 0)
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed
                            ${
                              role.isActive
                                ? "bg-indigo-650 dark:bg-indigo-700"
                                : "bg-slate-200 dark:bg-slate-800"
                            }`}
                          title={
                            role.isActive ? "Desactivar Rol" : "Activar Rol"
                          }
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
                              ${role.isActive ? "translate-x-4" : "translate-x-0"}`}
                          />
                        </button>

                        <button
                          onClick={() => openEditDrawer(role)}
                          className="inline-flex p-2 rounded-xl text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                          title="Editar Rol"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table view footer pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/5 flex items-center justify-between select-none">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Mostrando del {startIndex + 1} al{" "}
                {Math.min(startIndex + pageSize, totalItems)} de {totalItems}{" "}
                roles
              </span>

              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg cursor-pointer transition-colors text-slate-500 dark:text-slate-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5 8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg cursor-pointer transition-colors text-slate-500 dark:text-slate-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // CARDS GRID MODE VIEW
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedRoles.map((role) => (
              <div
                key={role.id}
                className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700/60 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Card Header & Dynamic Triple-Dots Dropdown actions */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 text-left max-w-[80%]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-base text-slate-850 dark:text-slate-100 truncate">
                        {role.name}
                      </h4>
                      {role.isSystemRole && (
                        <span className="shrink-0 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-lg bg-indigo-55 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-650/15">
                          Sistema
                        </span>
                      )}
                      <span
                        className={`shrink-0 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-lg border ${
                          role.isActive
                            ? "bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-600/20"
                            : "bg-rose-50 dark:bg-rose-600/10 text-rose-600 dark:text-rose-400 border-rose-100/50 dark:border-rose-600/20"
                        }`}
                      >
                        {role.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    {role.description && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {role.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Dropdown Button */}
                  <div className="relative select-none">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(
                          activeMenuId === role.id ? null : role.id,
                        );
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors focus:outline-none"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                        />
                      </svg>
                    </button>

                    {/* Overlay dropdown context menu */}
                    {activeMenuId === role.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl shadow-xl z-20 py-1.5 text-left transition-all duration-200">
                        <button
                          type="button"
                          onClick={() => openEditDrawer(role)}
                          className="w-full px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-3.5 h-3.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                            />
                          </svg>
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(role)}
                          disabled={
                            isTogglingId === role.id ||
                            role.isSystemRole ||
                            (!role.isActive && role.assignedUsersCount > 0)
                          }
                          className="w-full px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {role.isActive ? (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-3.5 h-3.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                />
                              </svg>
                              Desactivar
                            </>
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-3.5 h-3.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                />
                              </svg>
                              Activar
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer count */}
                <div className="mt-5 border-t border-slate-100 dark:border-slate-800/60 pt-4 flex items-center justify-between text-xs select-none">
                  <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    Asignación
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-600/20">
                    {role.assignedUsersCount}{" "}
                    {role.assignedUsersCount === 1 ? "Usuario" : "Usuarios"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Cards view footer pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl px-6 py-4.5 shadow-xs select-none">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Mostrando del {startIndex + 1} al{" "}
                {Math.min(startIndex + pageSize, totalItems)} de {totalItems}{" "}
                roles
              </span>

              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg cursor-pointer transition-colors text-slate-500 dark:text-slate-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5 8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg cursor-pointer transition-colors text-slate-500 dark:text-slate-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Form Drawer */}
      <RoleDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={drawerMode}
        role={selectedRole}
        onSaveSuccess={fetchRoles}
      />

      {/* STATUS TOGGLE CONFIRM MODAL */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setRoleToToggle(null);
        }}
        onConfirm={handleConfirmToggleStatus}
        title={roleToToggle?.isActive ? "Desactivar Rol" : "Activar Rol"}
        message={
          roleToToggle?.isActive
            ? `¿Estás seguro de que deseas desactivar el rol "${roleToToggle?.name}"?`
            : `¿Estás seguro de que deseas activar el rol "${roleToToggle?.name}"?`
        }
        confirmText={roleToToggle?.isActive ? "Desactivar" : "Activar"}
        confirmColor={roleToToggle?.isActive ? "danger" : "success"}
        isLoading={isTogglingId === roleToToggle?.id}
      />
    </div>
  );
};

export default RoleMaintenance;
