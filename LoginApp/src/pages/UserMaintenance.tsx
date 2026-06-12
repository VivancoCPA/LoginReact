import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { userService } from "../services/userService";
import { UserDrawer } from "../components/UserDrawer";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { UserRolesDialog } from "../components/UserRolesDialog";
import { getPhotoFullUrl } from "../utils/photo";
import type { PagedUserItem } from "../types/user";
import { useAuth } from "../context/AuthContext";
import { UserScopeDrawer } from "../components/UserScopeDrawer";

const getLastAccessText = (lastAccess?: string) => {
  if (!lastAccess) return { dateStr: "—", relativeStr: "Nunca ingresó" };

  const accessDate = new Date(lastAccess);
  const currentDate = new Date();

  const dateStr =
    accessDate.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    accessDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const diffTime = Math.abs(currentDate.getTime() - accessDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let relativeStr = "";
  if (diffDays === 0) {
    relativeStr = "Hoy";
  } else if (diffDays === 1) {
    relativeStr = "Hace 1 día";
  } else {
    relativeStr = `Hace ${diffDays} días`;
  }

  return { dateStr, relativeStr };
};

export const UserMaintenance: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isStandardAdmin = currentUser?.roles?.includes("Admin") && !currentUser?.roles?.includes("SuperAdmin");

  // persitent view mode: table vs cards
  const [viewMode, setViewMode] = useState<"table" | "cards">(() => {
    const saved = sessionStorage.getItem("user_maintenance_view_mode");
    return saved === "cards" ? "cards" : "table";
  });

  // State for scope drawer visibility
  const [isScopeDrawerOpen, setIsScopeDrawerOpen] = useState(false);

  // State for loaded users and pagination details
  const [users, setUsers] = useState<PagedUserItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Sorting state
  const [sortBy, setSortBy] = useState<"name" | "lastname">("name");
  const [sortDesc, setSortDesc] = useState(false);

  // Search input state (with debouncing)
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");



  // Status Filter
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Confirmation Filter
  const [confirmFilter, setConfirmFilter] = useState<
    "all" | "confirmed" | "pending"
  >("all");

  // Roles dialog state
  const [isRolesOpen, setIsRolesOpen] = useState(false);
  const [rolesUserId, setRolesUserId] = useState("");
  const [rolesUserEmail, setRolesUserEmail] = useState("");

  // Card Actions Dropdown active menu user
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"view" | "create" | "edit">(
    "view",
  );
  const [selectedUser, setSelectedUser] = useState<PagedUserItem | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<PagedUserItem | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Scope disassociation state
  const [isDisassociateConfirmOpen, setIsDisassociateConfirmOpen] = useState(false);
  const [userToDisassociate, setUserToDisassociate] = useState<PagedUserItem | null>(null);
  const [isDisassociating, setIsDisassociating] = useState(false);

  // Persist view mode choices
  useEffect(() => {
    sessionStorage.setItem("user_maintenance_view_mode", viewMode);
  }, [viewMode]);

  // Debouncing search query for 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page to 1 on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Open scope drawer if openScopeDrawer=true is in the query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("openScopeDrawer") === "true") {
      setIsScopeDrawerOpen(true);
      // Clean up the query parameter from URL so it doesn't reopen on reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);



  // Fetch Paged users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeParam =
        statusFilter === "active"
          ? true
          : statusFilter === "inactive"
            ? false
            : null;

      const lockedOutParam =
        confirmFilter === "confirmed"
          ? false
          : confirmFilter === "pending"
            ? true
            : null;

      const data = await userService.getPagedUsers({
        page,
        pageSize,
        search: debouncedSearch,
        sortBy,
        sortDesc,
        isActive: activeParam,
        isLockedOut: lockedOutParam,
      });
      setUsers(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error loading paged users:", error);
      toast.error("No se pudo cargar el listado de usuarios.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, sortBy, sortDesc, statusFilter, confirmFilter]);

  // Re-fetch users when pagination or sort params change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Sort triggers
  const handleSort = (field: "name" | "lastname") => {
    if (sortBy === field) {
      setSortDesc((prev) => !prev);
    } else {
      setSortBy(field);
      setSortDesc(false);
    }
    setPage(1);
  };

  // Toggle User Status trigger
  const handleToggleStatusClick = (user: PagedUserItem) => {
    setUserToToggle(user);
    setIsConfirmOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!userToToggle) return;
    setIsTogglingStatus(true);
    try {
      const result = await userService.toggleUserStatus(userToToggle.id);
      toast.success(
        `Usuario ${result.status === "Bloqueado" ? "desactivado" : "reactivado"} correctamente.`,
      );
      setIsConfirmOpen(false);
      setUserToToggle(null);
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("No se pudo modificar el estado del usuario.");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Scope disassociation handlers
  const handleDisassociateClick = (user: PagedUserItem) => {
    setUserToDisassociate(user);
    setIsDisassociateConfirmOpen(true);
  };

  const handleConfirmDisassociate = async () => {
    if (!userToDisassociate || !currentUser?.id) return;
    setIsDisassociating(true);
    try {
      await userService.disassociateUserFromScope(currentUser.id, userToDisassociate.id);
      toast.success("Usuario desasociado de su scope correctamente.");
      setIsDisassociateConfirmOpen(false);
      setUserToDisassociate(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error disassociating user:", error);
      const msg = error.response?.data?.detail || error.response?.data?.message || "No se pudo desasociar el usuario.";
      toast.error(msg);
    } finally {
      setIsDisassociating(false);
    }
  };

  // Open drawer actions
  const handleOpenDrawer = (
    mode: "view" | "create" | "edit",
    user: PagedUserItem | null,
  ) => {
    setSelectedUser(user);
    setDrawerMode(mode);
    setIsDrawerOpen(true);
  };

  // Client-side cumulative filter application
  const filteredUsers = users;

  // Initials generator helper
  const getInitials = (name?: string, lastName?: string) => {
    const n = name?.trim().charAt(0) || "";
    const l = lastName?.trim().charAt(0) || "";
    return `${n}${l}`.toUpperCase() || "U";
  };

  // Dynamic colors for avatar initial fallbacks
  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-indigo-500 text-white",
      "bg-emerald-500 text-white",
      "bg-violet-500 text-white",
      "bg-rose-500 text-white",
      "bg-amber-500 text-white",
      "bg-sky-500 text-white",
    ];
    // Simple hash to assign consistent colors
    const charCodeSum = id
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  return (
    <div className="flex flex-col h-full w-full text-left overflow-hidden gap-4">
      {/* Visual Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Gestión de Usuarios
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
            Administre las cuentas de usuario, asigne grupos y supervise los
            estados de acceso del sistema.
          </p>
        </div>

        {/* Actions Container */}
        <div className="flex items-center gap-3">
          {isStandardAdmin && (
            <button
              type="button"
              onClick={() => setIsScopeDrawerOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/35 border border-indigo-150 dark:border-indigo-900/30 shadow-sm rounded-xl transition-all duration-200 cursor-pointer focus:outline-none"
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
                  d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                />
              </svg>
              Asociar Scope
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenDrawer("create", null)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/15 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none"
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
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* FILTER AND ACTION BAR */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm select-none shrink-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
          {/* Search Input bar */}
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
              placeholder="Buscar por nombre, apellido, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status filters toggler */}
          <div className="flex bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
            {(["all", "active", "inactive"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setStatusFilter(filter);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer focus:outline-none
                  ${
                    statusFilter === filter
                      ? "bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-100"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
              >
                {filter === "all"
                  ? "Todos"
                  : filter === "active"
                    ? "Activos"
                    : "Inactivos"}
              </button>
            ))}
          </div>

          {/* Confirmation filters toggler */}
          <div className="flex bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
            {(["all", "confirmed", "pending"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setConfirmFilter(filter);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer focus:outline-none
                  ${
                    confirmFilter === filter
                      ? "bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-100"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
              >
                {filter === "all"
                  ? "Verif: Todos"
                  : filter === "confirmed"
                    ? "Clave OK"
                    : "Clave Temp"}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Mode Switcher (persist viewMode) */}
        <div className="flex border border-slate-200 dark:border-slate-800 p-1 rounded-xl bg-slate-50 dark:bg-slate-950/40 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`p-1.5 rounded-lg transition-all cursor-pointer focus:outline-none
              ${
                viewMode === "cards"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            title="Vista de Tarjetas"
          >
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
                d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-lg transition-all cursor-pointer focus:outline-none
              ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            title="Vista de Tabla"
          >
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
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* RENDER USER LISTINGS */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 -mr-1">
        {isLoading ? (
        // Loading animation skeleton
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
          <div className="space-y-4">
            <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-1/3 animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        // Empty State feedback
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-16 shadow-sm text-center select-none">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
            No se encontraron usuarios
          </h3>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Pruebe modificando su criterio de búsqueda o relajando los filtros
            activos.
          </p>
        </div>
      ) : viewMode === "table" ? (
        // VIEW MODE: ULTRA-COMPACT TABLE LAYOUT
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold select-none">
                  <th className="px-5 py-3 text-left w-[60px]">Avatar</th>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Nombre</span>
                      {sortBy === "name" && (
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${sortDesc ? "transform rotate-180" : ""}`}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m19.5 8.25-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("lastname")}
                    className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Apellido</span>
                      {sortBy === "lastname" && (
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${sortDesc ? "transform rotate-180" : ""}`}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m19.5 8.25-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3 text-left">Correo</th>
                  <th className="px-5 py-3 text-left">Contraseña</th>
                  <th className="px-5 py-3 text-left">Último Acceso</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${user.isLockedOut ? "bg-slate-50/30 dark:bg-slate-950/10 opacity-60" : ""}`}
                  >
                    {/* Spacing constraint strictly respected using py-1.5 or py-2 */}
                    <td className="px-5 py-1.5 text-left">
                      <div
                        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center overflow-hidden font-bold text-[10px] shadow-sm
                        ${user.photoUrl ? "" : getAvatarColor(user.id)}`}
                      >
                        {user.photoUrl ? (
                          <img
                            src={getPhotoFullUrl(user.photoUrl)}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(user.name, user.lastName)
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-1.5 text-left text-xs">
                      <span className={`font-semibold text-slate-800 dark:text-slate-100 ${user.isLockedOut ? "text-slate-400 dark:text-slate-550 line-through decoration-slate-450/40" : ""}`}>
                        {user.name}
                      </span>
                    </td>
                    <td className="px-5 py-1.5 text-left text-xs">
                      <span className={`font-semibold text-slate-800 dark:text-slate-100 ${user.isLockedOut ? "text-slate-400 dark:text-slate-550 line-through decoration-slate-450/40" : ""}`}>
                        {user.lastName}
                      </span>
                    </td>
                    <td className="px-5 py-1.5 text-left text-xs text-slate-600 dark:text-slate-300 font-mono select-all truncate max-w-xs">
                      {user.email}
                    </td>
                    <td className="px-5 py-1.5 text-left text-xs select-none">
                      {user.passwordConfirmed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-105/50 dark:border-emerald-600/20">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                            stroke="currentColor"
                            className="w-2.5 h-2.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m4.5 12.75 6 6 9-13.5"
                            />
                          </svg>
                          Establecida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-105/50 dark:border-amber-600/20">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                            stroke="currentColor"
                            className="w-2.5 h-2.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                            />
                          </svg>
                          Temporal
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-1.5 text-left text-xs">
                      {(() => {
                        const { dateStr, relativeStr } = getLastAccessText(
                          user.lastAccess,
                        );
                        return (
                          <div className="flex flex-col gap-0.5 leading-tight select-all">
                            <span className="text-slate-700 dark:text-slate-350 font-mono text-[11px]">
                              {dateStr}
                            </span>
                            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                              {relativeStr}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-1.5 text-left text-xs select-none">
                      {user.isLockedOut ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-600/20">
                          Bloqueado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-600/20">
                          Activado
                        </span>
                      )}
                    </td>

                    {/* Inline Actions */}
                    <td className="px-5 py-1.5 text-right select-none">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer("view", user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                          title="Ver Detalles"
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
                              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDrawer("edit", user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                          title="Editar"
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
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRolesUserId(user.id);
                            setRolesUserEmail(user.email);
                            setIsRolesOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                          title="Asociar Roles"
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
                              d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                            />
                          </svg>
                        </button>

                        {isStandardAdmin && user.id !== currentUser?.id && (
                          <button
                            type="button"
                            onClick={() => handleDisassociateClick(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                            title="Desasociar del Scope"
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
                                d="M22 10.5h-6M15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                              />
                            </svg>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleStatusClick(user)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors
                            ${
                              user.isLockedOut
                                ? "text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                : "text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            }`}
                          title={user.isLockedOut ? "Reactivar" : "Bloquear"}
                        >
                          {!user.isLockedOut ? (
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
                          ) : (
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
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg dark:hover:border-slate-700/80 transition-all duration-300 group flex flex-col justify-between ${user.isLockedOut ? "bg-slate-50/30 dark:bg-slate-950/10 opacity-60" : ""}`}
            >
              <div>
                {/* Header profile row */}
                <div className="flex items-start justify-between gap-3 select-none">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden font-extrabold text-xs shadow-sm
                      ${user.photoUrl ? "" : getAvatarColor(user.id)}`}
                    >
                      {user.photoUrl ? (
                        <img
                          src={getPhotoFullUrl(user.photoUrl)}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(user.name, user.lastName)
                      )}
                    </div>

                    <div>
                      <h3 className={`text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${user.isLockedOut ? "text-slate-400 dark:text-slate-500 line-through decoration-slate-450/40" : ""}`}>
                        {user.name} {user.lastName}
                      </h3>
                      <span
                        className={`inline-flex mt-1 px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border ${
                          user.passwordConfirmed
                            ? "bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-600/20"
                            : "bg-amber-50 dark:bg-amber-600/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-600/20"
                        }`}
                      >
                        {user.passwordConfirmed ? "Clave OK" : "Clave Temp"}
                      </span>
                    </div>
                  </div>

                  {/* Vertical Triple-dot (⋮) Dropdown menu */}
                  <div className="relative shrink-0 flex items-center gap-2">
                    {/* Status pill */}
                    {user.isLockedOut ? (
                      <span
                        className="h-2 w-2 rounded-full bg-red-500 animate-pulse"
                        title="Bloqueado"
                      />
                    ) : (
                      <span
                        className="h-2 w-2 rounded-full bg-emerald-500"
                        title="Activado"
                      />
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuUserId((prev) =>
                          prev === user.id ? null : user.id,
                        );
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
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
                          d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5"
                        />
                      </svg>
                    </button>

                    {activeMenuUserId === user.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveMenuUserId(null)}
                        />
                        <div className="absolute right-0 mt-30 w-40 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-20 animate-fadeIn select-none">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuUserId(null);
                              handleOpenDrawer("view", user);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-3.5 h-3.5 shrink-0"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                              />
                            </svg>
                            Ver Detalles
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuUserId(null);
                              handleOpenDrawer("edit", user);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-3.5 h-3.5 shrink-0"
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
                            onClick={() => {
                              setActiveMenuUserId(null);
                              setRolesUserId(user.id);
                              setRolesUserEmail(user.email);
                              setIsRolesOpen(true);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-3.5 h-3.5 shrink-0"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                              />
                            </svg>
                            Roles
                          </button>

                          {isStandardAdmin && user.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuUserId(null);
                                handleDisassociateClick(user);
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-3.5 h-3.5 shrink-0"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M22 10.5h-6M15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                />
                              </svg>
                              Desasociar del Scope
                            </button>
                          )}

                          <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuUserId(null);
                              handleToggleStatusClick(user);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer
                              ${
                                user.isLockedOut
                                  ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                  : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                              }`}
                          >
                            {user.isLockedOut ? (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                  className="w-3.5 h-3.5 shrink-0"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                  />
                                </svg>
                                Reactivar
                              </>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                  className="w-3.5 h-3.5 shrink-0"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                  />
                                </svg>
                                Bloquear
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Body Details block */}
                <div className="mt-4 space-y-2.5 text-xs text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 shrink-0">
                      Email:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono truncate select-all">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 shrink-0">
                      Teléfono:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {user.phoneNumber || "—"}
                    </span>
                  </div>
                  {user.createdAt && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 dark:text-slate-500 shrink-0">
                        Registro:
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  )}
                  {(() => {
                    const { dateStr, relativeStr } = getLastAccessText(
                      user.lastAccess,
                    );
                    return (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 dark:text-slate-500 shrink-0">
                            Último Acceso:
                          </span>
                          <span className="text-slate-650 dark:text-slate-400 font-mono text-[11px] select-all">
                            {dateStr}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 dark:text-slate-500 shrink-0">
                            Días sin entrar:
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded ${
                              user.lastAccess
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400"
                                : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100/30 dark:border-amber-600/20"
                            }`}
                          >
                            {relativeStr}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* CLIENT-SIDE / SERVER-SIDE PAGINATION FOOTER CONTROL PANEL */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 select-none shrink-0 border-t border-slate-100 dark:border-slate-800/60 pt-4">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Mostrando{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {filteredUsers.length}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {totalCount}
          </span>{" "}
          usuarios en total
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>

          <span className="text-xs text-slate-600 dark:text-slate-400 px-3">
            Página{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {page}
            </span>{" "}
            de{" "}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* DRAWER COMPONENT */}
      <UserDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={drawerMode}
        user={selectedUser}
        onSaveSuccess={fetchUsers}
      />

      {/* ROLES ASSIGNMENT MODAL */}
      <UserRolesDialog
        isOpen={isRolesOpen}
        onClose={() => {
          setIsRolesOpen(false);
          setRolesUserId("");
          setRolesUserEmail("");
        }}
        userId={rolesUserId}
        userEmail={rolesUserEmail}
        onSaveSuccess={fetchUsers}
      />

      {/* STATUS TOGGLE CONFIRM MODAL */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setUserToToggle(null);
        }}
        onConfirm={handleConfirmToggleStatus}
        title={
          userToToggle?.isLockedOut ? "Reactivar Usuario" : "Desactivar Usuario"
        }
        message={
          userToToggle?.isLockedOut
            ? `¿Estás seguro de que deseas reactivar el acceso para el usuario ${userToToggle?.name} ${userToToggle?.lastName}?`
            : `¿Estás seguro de que deseas desactivar temporalmente el acceso para el usuario ${userToToggle?.name} ${userToToggle?.lastName}?`
        }
        confirmText={userToToggle?.isLockedOut ? "Reactivar" : "Desactivar"}
        confirmColor={userToToggle?.isLockedOut ? "indigo" : "danger"}
        isLoading={isTogglingStatus}
      />

      {/* SCOPE ASSOCIATION DRAWER */}
      <UserScopeDrawer
        isOpen={isScopeDrawerOpen}
        onClose={() => setIsScopeDrawerOpen(false)}
        onSaveSuccess={fetchUsers}
      />

      {/* DISASSOCIATION CONFIRM MODAL */}
      <ConfirmDialog
        isOpen={isDisassociateConfirmOpen}
        onClose={() => {
          setIsDisassociateConfirmOpen(false);
          setUserToDisassociate(null);
        }}
        onConfirm={handleConfirmDisassociate}
        title="Desasociar del Scope"
        message={`¿Estás seguro de que deseas desasociar al usuario ${userToDisassociate?.name} ${userToDisassociate?.lastName} de su scope de administración?`}
        confirmText="Desasociar"
        confirmColor="danger"
        isLoading={isDisassociating}
      />
    </div>
  );
};

export default UserMaintenance;
