import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { familyGroupService } from "../services/familyGroupService";
import { FamilyGroupDrawer } from "../components/FamilyGroupDrawer";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { getPhotoFullUrl } from "../utils/photo";
import type {
  FamilyGroupItem,
  FamilyMembershipItem,
} from "../types/familyGroup";

type StatusFilter = "all" | "active" | "inactive";

interface IncidentItem {
  id: string;
  groupName: string;
  date: string;
  userName: string;
  medicalCenter: string;
  status: "programado" | "atendido" | "cancelado" | "vencido";
}

export const FamilyGroupMaintenance: React.FC = () => {
  const { user } = useAuth();

  // Current user ID (GUID) fetched from the backend profile
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Layout toggle (Ver Incidentes / No Ver Incidentes) persisted in session
  const [showIncidents, setShowIncidents] = useState<boolean>(() => {
    const saved = sessionStorage.getItem("familyGroupsShowIncidents");
    return saved !== "false";
  });

  const [groups, setGroups] = useState<FamilyGroupItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6); // 6 items per page for cards grid
  const [isLoading, setIsLoading] = useState(false);

  // Search query state with debouncing
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Drawer Control State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"view" | "create" | "edit">(
    "view",
  );
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroupItem | null>(
    null,
  );

  // Card Dropdown Active Menu ID (⋮)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Confirm Status Toggle Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [groupToToggle, setGroupToToggle] = useState<FamilyGroupItem | null>(
    null,
  );
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Mock Incidents Data (5 incidents as requested)
  const [mockIncidents] = useState<IncidentItem[]>([
    {
      id: "1",
      groupName: "Familia Pérez",
      date: "2026-06-06 10:00 AM",
      userName: "María Pérez",
      medicalCenter: "Clínica San Borja",
      status: "programado",
    },
    {
      id: "2",
      groupName: "Familia Gómez",
      date: "2026-06-05 03:30 PM",
      userName: "Juan Gómez",
      medicalCenter: "Hospital Rebagliati",
      status: "atendido",
    },
    {
      id: "3",
      groupName: "Familia Pérez",
      date: "2026-06-04 11:15 AM",
      userName: "Abuelo Pedro",
      medicalCenter: "Clínica Delgado",
      status: "vencido",
    },
    {
      id: "4",
      groupName: "Familia Torres",
      date: "2026-06-03 08:00 AM",
      userName: "Sofía Torres",
      medicalCenter: "Clínica Internacional",
      status: "cancelado",
    },
    {
      id: "5",
      groupName: "Familia Gómez",
      date: "2026-06-02 02:00 PM",
      userName: "Lucas Gómez",
      medicalCenter: "Clínica San Felipe",
      status: "atendido",
    },
  ]);

  // Persist showIncidents toggle
  useEffect(() => {
    sessionStorage.setItem("familyGroupsShowIncidents", String(showIncidents));
  }, [showIncidents]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page to 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Resolve current logged-in user profile Guid on mount
  useEffect(() => {
    if (user?.email) {
      const fetchUserProfile = async () => {
        try {
          const profile = await authService.getUserByEmail(user.email);
          if (profile?.id) {
            setCurrentUserId(profile.id);
          }
        } catch (error) {
          console.error("Error fetching user profile guid:", error);
        }
      };
      fetchUserProfile();
    }
  }, [user]);

  // Fetch Family Groups data from backend
  const fetchFamilyGroups = useCallback(async () => {
    if (!user?.email) return;
    setIsLoading(true);
    try {
      // 1. Fetch user profile to get their specific ID and familyGroupId
      const profile = await authService.getUserByEmail(user.email);
      const userGuid = profile?.id || "";
      const userGroupGuid = profile?.familyGroupId || "";

      const mergedGroupsMap = new Map<string, FamilyGroupItem>();

      // 2. Fetch created groups: We get all family groups in the system and filter by current user's ID
      try {
        const allGroups = await familyGroupService.getFamilyGroups();
        allGroups.forEach((g) => {
          if (g.userId === userGuid) {
            mergedGroupsMap.set(g.id, g);
          }
        });
      } catch (err) {
        console.warn("Error fetching all family groups, falling back:", err);
      }

      // 3. Fetch member-only groups (where user is registered member but not creator)
      try {
        const myMemberGroups = await familyGroupService.getMyFamilyGroups();
        myMemberGroups.forEach((g) => {
          mergedGroupsMap.set(g.id, g);
        });
      } catch (err) {
        console.warn("Error fetching member-only family groups:", err);
      }

      // 4. Fetch details of current group by ID if available and not already loaded
      if (userGroupGuid && !mergedGroupsMap.has(userGroupGuid)) {
        try {
          const mainGroup =
            await familyGroupService.getFamilyGroupById(userGroupGuid);
          if (mainGroup) {
            mergedGroupsMap.set(mainGroup.id, mainGroup);
          }
        } catch (err) {
          console.warn("Error fetching main family group by ID:", err);
        }
      }

      // Convert map to array and sort alphabetically by group name
      const mergedList = Array.from(mergedGroupsMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      setGroups(mergedList);
    } catch (error) {
      console.error("Error loading family groups:", error);
      toast.error("No se pudo cargar el listado de grupos familiares.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchFamilyGroups();
  }, [fetchFamilyGroups]);

  // Drawer Control Triggers
  const handleOpenDrawer = (
    mode: "view" | "create" | "edit",
    group: FamilyGroupItem | null,
  ) => {
    setSelectedGroup(group);
    setDrawerMode(mode);
    setIsDrawerOpen(true);
  };

  // logical Active/Inactive toggle triggers
  const handleToggleStatusClick = (
    group: FamilyGroupItem,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();

    if (group.isActive) {
      // logical deactivation asks confirmation
      setGroupToToggle(group);
      setIsConfirmOpen(true);
    } else {
      // immediate activation
      toggleStatus(group);
    }
  };

  const toggleStatus = async (group: FamilyGroupItem) => {
    setIsTogglingStatus(true);
    try {
      const result = await familyGroupService.toggleFamilyGroupStatus(group.id);
      toast.success(
        `Grupo "${group.name}" ${result.isActive ? "activado" : "inactivado"} correctamente.`,
      );
      setIsConfirmOpen(false);
      setGroupToToggle(null);
      fetchFamilyGroups();
    } catch (error) {
      console.error("Error toggling group status:", error);
      toast.error("No se pudo cambiar el estado del grupo familiar.");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleConfirmToggleStatus = () => {
    if (!groupToToggle) return;
    toggleStatus(groupToToggle);
  };

  // Client-side filtering (Search + Status Filter)
  const getFilteredGroups = () => {
    let items = groups;

    // Filter by Active/Inactive
    if (statusFilter === "active") {
      items = items.filter((i) => i.isActive);
    } else if (statusFilter === "inactive") {
      items = items.filter((i) => !i.isActive);
    }

    // Filter by search query (insensitive search on group name or owner name)
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.ownerName.toLowerCase().includes(query),
      );
    }

    return items;
  };

  const filteredGroups = getFilteredGroups();

  // Client-side Pagination calculations
  const totalCount = filteredGroups.length;
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
  const paginatedGroups = filteredGroups.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Avatar initials helper
  const getInitials = (name: string, lastName: string): string => {
    const first = name.trim().charAt(0) || "";
    const last = lastName.trim().charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  // Avatar color generator
  const getAvatarColor = (id?: string | null) => {
    const colors = [
      "bg-indigo-500 text-white",
      "bg-emerald-500 text-white",
      "bg-violet-500 text-white",
      "bg-rose-500 text-white",
      "bg-amber-500 text-white",
      "bg-sky-500 text-white",
    ];
    if (!id) return colors[0];
    let sum = 0;
    for (let i = 0; i < id.length; i++) {
      sum += id.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  // Render members initials avatars (max 4, then +N)
  const renderAvatars = (members: FamilyMembershipItem[] = []) => {
    const limit = 4;
    const displayMembers = members.slice(0, limit);
    const remaining = members.length - limit;

    return (
      <div className="flex -space-x-1.5 overflow-hidden py-1 shrink-0 select-none">
        {displayMembers.map((m) => {
          const id = m.id || (m as any).Id || Math.random();
          const userId = m.userId || (m as any).UserId || "";
          const name = (
            m.name ||
            m.userName ||
            (m as any).Name ||
            (m as any).UserName ||
            ""
          ).trim();
          const lastName = (
            m.lastName ||
            m.userLastName ||
            (m as any).LastName ||
            (m as any).UserLastName ||
            ""
          ).trim();
          const photoUrl = (
            m.photoUrl ||
            m.userPhotoUrl ||
            (m as any).PhotoUrl ||
            (m as any).UserPhotoUrl ||
            ""
          ).trim();
          const relationship = m.relationship || (m as any).Relationship || "";
          const hasPhoto = !!photoUrl;

          return (
            <div
              key={id}
              className={`flex h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden shrink-0 items-center justify-center font-bold text-[9px]
                ${hasPhoto ? "" : getAvatarColor(userId)}`}
              title={`${name} ${lastName} (${relationship})`}
            >
              {hasPhoto ? (
                <img
                  src={getPhotoFullUrl(photoUrl)}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(name, lastName)
              )}
            </div>
          );
        })}
        {remaining > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 dark:text-slate-400 ring-2 ring-white dark:ring-slate-900 shrink-0 select-none">
            +{remaining}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-row h-full w-full text-left overflow-hidden gap-4">
      {/* LEFT 3/4 DASHBOARD */}
      <div
        className={`flex flex-col h-full overflow-hidden gap-4 transition-all duration-300 ${showIncidents ? "w-3/4" : "w-full"}`}
      >
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Grupos Familiares
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
              Mantenimiento y administración de grupos familiares y membresías.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Show/Hide Incidents toggle button */}
            <button
              type="button"
              onClick={() => setShowIncidents((prev) => !prev)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer focus:outline-none shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 7.5h1.5m-1.5 3h1.5m-1.5 3h1.5m-1.5 3h1.5m-7.5-3h.008v.008H4.5v-.008Zm0-3h.008v.008H4.5v-.008Zm0-3h.008v.008H4.5v-.008Zm0 9h.008v.008H4.5v-.008Zm15 0h.008v.008H19.5v-.008Zm0-3h.008v.008H19.5v-.008Zm0-3h.008v.008H19.5v-.008Zm0-9h.008v.008H19.5V3.75m-6.75 3h.008v.008h-.008V6.75Zm.008 3h-.008v.008h.008V9.75Zm-.008 3h.008v.008h-.008v-.008Zm0-6H12v.008h-.008V3.75m-6 0h.008v.008H6V3.75m0 3H6.008v.008H6V6.75Zm12-3h.008v.008H18V3.75Zm-6-3h.008v.008h-.008V.75Zm-6 0h.008v.008H6V.75Zm12 0h.008v.008H18V.75Zm-6 12h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                />
              </svg>
              {showIncidents ? "Ocultar Incidentes" : "Ver Incidentes"}
            </button>

            {/* Nuevo Grupo Button */}
            <button
              type="button"
              onClick={() => handleOpenDrawer("create", null)}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/15 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none"
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
              Nuevo Grupo
            </button>
          </div>
        </div>

        {/* Toolbar filter area */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm select-none shrink-0">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
            {/* Search query */}
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
                placeholder="Buscar por nombre de grupo o propietario..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Status filters */}
            <div className="flex bg-slate-150 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 p-0.5 rounded-xl self-start md:self-auto shrink-0">
              {(["all", "active", "inactive"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setStatusFilter(filter);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer focus:outline-none
                    ${
                      statusFilter === filter
                        ? "bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
          </div>
        </div>

        {/* Scrollable list viewport */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 -mr-1">
          {isLoading ? (
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
              <div className="space-y-4">
                <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-1/3 animate-pulse" />
                <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
                <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
                <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
              </div>
            </div>
          ) : paginatedGroups.length === 0 ? (
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
                    d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                No se encontraron grupos familiares
              </h3>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Pruebe modificando su criterio de búsqueda o relajando los
                filtros de estado.
              </p>
            </div>
          ) : (
            /* CARDS GRID LAYOUT */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedGroups.map((group) => {
                const isCreator = group.userId === currentUserId;
                const isMemberOnly = !isCreator;

                return (
                  <div
                    key={group.id}
                    className={`p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between select-none relative group border
                      ${!group.isActive ? "bg-slate-50/40 dark:bg-slate-950/10 opacity-60" : ""}
                      ${
                        group.isActive && isMemberOnly
                          ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100/40 dark:hover:bg-emerald-900/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700/80"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3 text-left">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Group Photo / Avatar */}
                        <div className="shrink-0 select-none mt-1">
                          {group.photoUrl ? (
                            <img
                              src={getPhotoFullUrl(group.photoUrl)}
                              alt={group.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-250 dark:border-slate-700"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(group.id)}`}
                            >
                              {getInitials(group.name, "")}
                            </div>
                          )}
                        </div>

                        {/* Card Info */}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3
                              className={`text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate
                              ${!group.isActive ? "text-slate-400 dark:text-slate-500 line-through decoration-slate-450/40" : ""}`}
                            >
                              {group.name}
                            </h3>
                            {isMemberOnly && (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-650 dark:text-emerald-350 shrink-0">
                                Miembro
                              </span>
                            )}
                          </div>

                          <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Creador:{" "}
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {group.ownerName}
                            </span>
                          </span>

                          <div className="flex flex-wrap gap-1 mt-2.5">
                            <span
                              className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded-lg border
                              ${
                                group.isActive
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                                  : "bg-red-50 text-red-650 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                              }`}
                            >
                              {group.isActive ? "Activo" : "Desactivado"}
                            </span>
                          </div>

                          {/* Member avatars */}
                          <div className="pt-2 text-left">
                            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1">
                              Miembros Registrados
                            </span>
                            {group.members && group.members.length > 0 ? (
                              renderAvatars(group.members)
                            ) : (
                              <span className="text-[10px] italic text-slate-400 dark:text-slate-500 select-none">
                                Sin miembros registrados
                              </span>
                            )}
                          </div>

                          {/* Extra Members list */}
                          {group.extraMembers &&
                            group.extraMembers.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-left">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                  Miembros Extra
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {group.extraMembers.map((em) => (
                                    <span
                                      key={em.id}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border
                                      ${
                                        em.isActive
                                          ? "bg-slate-50 text-slate-650 border-slate-200 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-800"
                                          : "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 opacity-60 line-through"
                                      }`}
                                      title={`${em.idType}`}
                                    >
                                      {em.fullName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Card Actions Menu (⋮) */}
                      <div
                        className="relative shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === group.id ? null : group.id,
                            )
                          }
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer focus:outline-none"
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

                        {activeMenuId === group.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-0 top-7 w-36 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-1 shadow-lg z-20 animate-fadeIn text-left select-none">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleOpenDrawer("view", group);
                                }}
                                className="w-full text-left px-2 py-1.5 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-1.5 cursor-pointer"
                              >
                                Ver Detalles
                              </button>

                              {isCreator && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleOpenDrawer("edit", group);
                                    }}
                                    className="w-full text-left px-2 py-1.5 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    Editar
                                  </button>

                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleToggleStatusClick(group);
                                    }}
                                    className={`w-full text-left px-2 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer
                                      ${group.isActive ? "text-red-650 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20" : "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"}`}
                                  >
                                    {group.isActive ? "Desactivar" : "Activar"}
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Pagination control */}
        <div className="p-4 border-t border-slate-150 dark:border-slate-850 flex items-center justify-between gap-4 select-none bg-slate-50/30 dark:bg-slate-950/10 shrink-0">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            Total: {totalCount} Grupos Familiares
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 1 || isLoading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </button>

            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold px-2">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page === totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
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
      </div>

      {/* RIGHT 1/4 INCIDENTS SIDEBAR */}
      {showIncidents && (
        <aside className="w-1/4 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col overflow-hidden shrink-0 select-none">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 border-b pb-2.5 border-slate-200 dark:border-slate-800">
            Últimos Incidentes
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1">
            {mockIncidents.map((incident) => {
              const statusColors = {
                programado:
                  "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30",
                atendido:
                  "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
                cancelado:
                  "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
                vencido:
                  "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
              };

              return (
                <div
                  key={incident.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/15 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 truncate">
                      {incident.groupName}
                    </span>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${statusColors[incident.status]}`}
                    >
                      {incident.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 text-left">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      👤 {incident.userName}
                    </p>
                    <p>🏥 {incident.medicalCenter}</p>
                    <p className="font-mono text-[9px] pt-0.5">
                      📅 {incident.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* DRAWER CONTAINER COMPONENT */}
      <FamilyGroupDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={drawerMode}
        group={selectedGroup}
        onSaveSuccess={fetchFamilyGroups}
        currentUserId={currentUserId}
      />

      {/* CONFIRM LICAL TOGGLE DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setGroupToToggle(null);
        }}
        onConfirm={handleConfirmToggleStatus}
        title="Desactivar Grupo Familiar"
        message={`¿Estás seguro de que deseas desactivar el grupo familiar "${groupToToggle?.name || ""}"? Esta acción de desactivación afectará el acceso de todos sus miembros.`}
        confirmText="Desactivar"
        confirmColor="danger"
        isLoading={isTogglingStatus}
      />
    </div>
  );
};

export default FamilyGroupMaintenance;
