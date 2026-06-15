import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { appointmentService } from "../services/appointmentService";
import type { AppointmentStatus, AppointmentItem } from "../types/appointment";
import { getPhotoFullUrl } from "../utils/photo";

export const AppointmentsMaintenance: React.FC = () => {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<AppointmentStatus[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  // Sorting: specialtyName can be 'asc' | 'desc' | null
  const [sortBySpecialty, setSortBySpecialty] = useState<"asc" | "desc" | null>(
    null,
  );

  const [nextAppointment, setNextAppointment] =
    useState<AppointmentItem | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  // Load next confirmed appointment
  useEffect(() => {
    const fetchNextAppointment = async () => {
      setIsLoadingNext(true);
      try {
        const list = await appointmentService.getAllAppointments({
          statusId: "CONFIRMADA",
        });
        const now = new Date();
        const futureAppointments = list.filter((app) => {
          const appDate = new Date(app.appointmentDate);
          return appDate >= now;
        });

        if (futureAppointments.length > 0) {
          futureAppointments.sort((a, b) => {
            return (
              new Date(a.appointmentDate).getTime() -
              new Date(b.appointmentDate).getTime()
            );
          });
          setNextAppointment(futureAppointments[0]);
        } else {
          setNextAppointment(null);
        }
      } catch (err) {
        console.error("Error fetching next appointment:", err);
      } finally {
        setIsLoadingNext(false);
      }
    };
    fetchNextAppointment();
  }, []);

  // Load statuses on mount
  useEffect(() => {
    const fetchStatuses = async () => {
      setIsLoadingStatuses(true);
      try {
        const data = await appointmentService.getStatuses();
        setStatuses(data);
      } catch (err: any) {
        console.error("Error fetching statuses:", err);
        toast.error("Error al cargar los estados de cita.");
      } finally {
        setIsLoadingStatuses(false);
      }
    };
    fetchStatuses();
  }, []);

  // Fetch appointments when filters or pagination changes
  const fetchAppointments = useCallback(async () => {
    setIsLoadingAppointments(true);
    try {
      const data = await appointmentService.getPagedAppointments({
        page,
        pageSize,
        statusId: selectedStatus === "ALL" ? undefined : selectedStatus,
        date: selectedDate || undefined,
      });
      setAppointments(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      toast.error("Error al cargar el listado de citas.");
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [page, pageSize, selectedStatus, selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedStatus, selectedDate]);

  // Toggle sorting by specialty name
  const handleSortSpecialty = () => {
    setSortBySpecialty((prev) => {
      if (prev === null) return "asc";
      if (prev === "asc") return "desc";
      return null;
    });
  };

  // Helper: Format ISO date string into date (dd/mm/yyyy) and time (hh:mm)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { dateStr: "—", timeStr: "" };

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    return { dateStr, timeStr };
  };

  // Helper: Generate doctor avatar initials fallback
  const getDoctorInitials = (name?: string) => {
    if (!name || !name.trim()) return "DR";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0]?.charAt(0) || "";
    const last = parts[parts.length - 1]?.charAt(0) || "";
    return `${first}${last}`.toUpperCase();
  };

  // Helper: Get avatar color dynamically from doctor name
  const getAvatarColor = (name?: string) => {
    const colors = [
      "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
      "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      "bg-violet-500/15 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
      "bg-rose-500/15 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
      "bg-amber-500/15 text-amber-600 dark:bg-amber-950/40 dark:text-amber-450",
      "bg-sky-500/15 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Helper: Map statusId to appropriate status badge styles
  const getStatusBadgeStyles = (statusId: string) => {
    const normalized = statusId.toUpperCase();
    switch (normalized) {
      case "PENDIENTE":
        return "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border border-amber-200/50 dark:border-amber-900/30";
      case "CONFIRMADA":
        return "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30";
      case "INASISTENCIA":
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-700";
      case "CANCELADA":
        return "bg-red-50 dark:bg-red-950/40 text-red-655 dark:text-red-400 border border-red-100 dark:border-red-900/30";
      case "REPROGRAMADA":
        return "bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30";
      case "ENCONSULTA":
      case "EN_CONSULTA":
        return "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30";
      case "FINALIZADA":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30";
      default:
        return "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800";
    }
  };

  const getStatusLabel = (
    statusId: string,
    statusList: AppointmentStatus[],
  ) => {
    const match = statusList.find(
      (s) => s.id.toUpperCase() === statusId.toUpperCase(),
    );
    if (match) return match.label;
    const capitalized =
      statusId.charAt(0).toUpperCase() + statusId.slice(1).toLowerCase();
    if (capitalized === "Enconsulta") return "En Consulta";
    return capitalized;
  };

  // Perform client-side sorting by specialty name
  const getSortedAppointments = () => {
    if (!sortBySpecialty) return appointments;
    return [...appointments].sort((a, b) => {
      const nameA = a.specialtyName || "";
      const nameB = b.specialtyName || "";
      if (sortBySpecialty === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  };

  const sortedAppointments = getSortedAppointments();

  // Render next appointment card details
  const renderNextAppointmentCard = () => {
    if (isLoadingNext) {
      return (
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
          </div>
        </div>
      );
    }

    if (!nextAppointment) {
      return (
        <div className="flex items-center gap-3 select-none">
          <div className="p-2.5 rounded-xl bg-slate-105 dark:bg-slate-800/60 text-slate-400 dark:text-slate-555 border border-slate-200/40 dark:border-slate-800/40 shrink-0">
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
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Próxima Cita
            </h4>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Sin citas próximas
            </p>
          </div>
        </div>
      );
    }

    const { dateStr, timeStr } = formatDate(nextAppointment.appointmentDate);

    return (
      <div className="flex items-start gap-3 select-none text-left">
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 shrink-0 mt-0.5">
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
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Próxima Cita
          </h4>
          <p className="text-xs font-extrabold text-slate-850 dark:text-white mt-0.5 truncate">
            {nextAppointment.specialtyName || "Medicina General"}
          </p>
          <div className="text-[10px] text-slate-450 dark:text-slate-400 font-medium space-y-0.5 mt-1">
            <p className="truncate">
              Dr. {nextAppointment.doctorName || "Sin especificar"}
            </p>
            <p className="truncate">
              {nextAppointment.centerName || "Centro Médico"}
            </p>
            <p className="font-semibold text-indigo-650 dark:text-indigo-350">
              {dateStr} a las {timeStr}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full text-left overflow-hidden gap-2">
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            Control de Citas
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestione y supervise sus citas médicas programadas.
          </p>
        </div>

        {/* Primary button */}
        <button
          type="button"
          onClick={() =>
            toast.success(
              "La funcionalidad para crear nuevas citas no está disponible en esta etapa.",
            )
          }
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-650 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/15 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none"
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
          <span> Nueva Cita</span>
        </button>
      </div>

      {/* Action Bar (Filters + Highlight card) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-1">
        {/* Filters Panel */}
        <div className="lg:col-span-3 glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-6 border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md">
          {/* Status filter */}
          <div className="w-full sm:w-1/2 flex flex-row items-center gap-3">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider shrink-0">
              Estado:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={isLoadingStatuses}
              className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="ALL">
                {isLoadingStatuses ? "Cargando..." : "Todos"}
              </option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date calendar filter */}
          <div className="w-full sm:w-1/2 flex flex-row items-center gap-3">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider shrink-0">
              Fecha:
            </label>
            <div className="relative flex-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 pl-4 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 cursor-pointer"
                  title="Limpiar fecha"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Next Confirmed Appointment Slot */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md flex flex-col justify-center">
          {renderNextAppointmentCard()}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        {isLoadingAppointments ? (
          /* Loading animation skeleton */
          <div className="flex-1 p-6 space-y-4">
            <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-1/3 animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
            <div className="h-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl w-full animate-pulse" />
          </div>
        ) : sortedAppointments.length === 0 ? (
          /* Empty state feedback */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
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
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
              No se encontraron citas
            </h3>
            <p className="mt-1 text-xs text-slate-450 dark:text-slate-505">
              No hay citas que coincidan con la búsqueda o filtros aplicados.
            </p>
          </div>
        ) : (
          /* Table Grid */
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold select-none sticky top-0 bg-white dark:bg-slate-900 z-10">
                  <th className="px-5 py-3 text-left w-[180px]">
                    Fecha / Hora
                  </th>
                  <th
                    onClick={handleSortSpecialty}
                    className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors w-[180px]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Especialidad</span>
                      {sortBySpecialty && (
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${sortBySpecialty === "desc" ? "transform rotate-180" : ""}`}
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
                  <th className="px-5 py-3 text-left w-[280px]">Doctor</th>
                  <th className="px-5 py-3 text-left">Centro Médico</th>
                  <th className="px-5 py-3 text-left w-[140px]">Estado</th>
                  <th className="px-5 py-3 text-right w-[150px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                {sortedAppointments.map((app) => {
                  const { dateStr, timeStr } = formatDate(app.appointmentDate);
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-left text-xs align-middle">
                        <div className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                            />
                          </svg>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {dateStr}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              {timeStr}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-left text-xs align-middle">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {app.specialtyName || "General"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-left text-xs align-middle">
                        <div className="flex items-center gap-3">
                          {app.doctorPhotoUrl ? (
                            <img
                              src={getPhotoFullUrl(app.doctorPhotoUrl)}
                              alt={app.doctorName || "Doctor"}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-800"
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold ring-1 ring-slate-200 dark:ring-slate-800 ${getAvatarColor(app.doctorName)}`}
                            >
                              {getDoctorInitials(app.doctorName)}
                            </div>
                          )}
                          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
                            {app.doctorName || "Sin especificar"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-left text-xs align-middle">
                        {app.centerName ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (app.centerLatitude && app.centerLongitude) {
                                navigate("/patients/appointments/map", {
                                  state: {
                                    latitude: app.centerLatitude,
                                    longitude: app.centerLongitude,
                                    name: app.centerName,
                                    address: app.centerAddress || "",
                                  },
                                });
                              } else {
                                toast.error(
                                  "Las coordenadas de este centro médico no están configuradas.",
                                );
                              }
                            }}
                            className="text-indigo-650 dark:text-indigo-400 font-semibold hover:underline cursor-pointer text-left focus:outline-none transition-colors"
                          >
                            {app.centerName}
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-left text-xs align-middle select-none">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase border ${getStatusBadgeStyles(app.statusId)}`}
                        >
                          {getStatusLabel(app.statusId, statuses)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right align-middle select-none">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toast.success(
                                "La funcionalidad para ver detalles de la cita no está disponible en esta etapa.",
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-650 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-all"
                            title="Ver Detalles (No disponible)"
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
                            onClick={() =>
                              toast.success(
                                "La funcionalidad para editar citas no está disponible en esta etapa.",
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-all"
                            title="Editar Cita (No disponible)"
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
                            onClick={() =>
                              toast.success(
                                "La funcionalidad para cambiar el estado no está disponible en esta etapa.",
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-all"
                            title="Cambiar Estado (No disponible)"
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
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION FOOTER PANEL */}
      {!isLoadingAppointments && sortedAppointments.length > 0 && (
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 select-none shrink-0 border-t border-slate-100 dark:border-slate-800/60 pt-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-350">
              {sortedAppointments.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-350">
              {totalCount}
            </span>{" "}
            citas en total
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 1 || isLoadingAppointments}
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

            <span className="text-xs text-slate-650 dark:text-slate-400 px-3">
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
              disabled={page === totalPages || isLoadingAppointments}
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
      )}
    </div>
  );
};

export default AppointmentsMaintenance;
