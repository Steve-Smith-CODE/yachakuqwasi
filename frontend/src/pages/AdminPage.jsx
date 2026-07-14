import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ShieldCheck,
  Home,
  Users,
  Compass,
  CheckCircle2,
  ClipboardList,
  Heart,
  ArrowUpDown,
  AlertTriangle,
  RotateCw,
  Inbox,
  GraduationCap,
  Plus,
  Trash2
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { buildRegistrationTrend, periodTrend } from "../utils/adminStats.js";
import AdminInsightsCharts from "../components/AdminInsightsCharts.jsx";
import {
  getStatsRequest,
  getPendingHousingsRequest,
  reviewHousingRequest,
  getPendingDocumentsRequest,
  reviewUserDocumentsRequest,
  blockUserRequest,
  reactivateUserRequest,
  deleteUserRequest,
  getAllHousingsRequest,
  getAllUsersRequest,
  setUserRoleRequest,
  getAuditLogsRequest,
  getVerifiedDomainsRequest,
  addVerifiedDomainRequest,
  removeVerifiedDomainRequest
} from "../api/admin.js";
import { deleteHousingRequest } from "../api/housings.js";
import { ApiError } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import ListingDetailModal from "../components/ListingDetailModal.jsx";
import AdminUserDetailModal from "../components/AdminUserDetailModal.jsx";
import makiMascot from "../assets/images/maki-mascota.webp";

const TABS = [
  { id: "verifications", label: "Revisión de Identidad", icon: ShieldCheck },
  { id: "listings", label: "Monitoreo de Anuncios", icon: Home },
  { id: "users", label: "Control de Usuarios", icon: Users },
  { id: "logs-admin", label: "Registro de Admin", icon: Compass },
  { id: "logs-arrendadores", label: "Actividad de Arrendadores", icon: ClipboardList },
  { id: "dominios", label: "Dominios Verificados", icon: GraduationCap }
];

const LOG_TYPE_META = {
  system: { label: "sistema", className: "bg-slate-100 text-slate-600" },
  user: { label: "usuario", className: "bg-sky-50 text-sky-700" },
  listing: { label: "anuncio", className: "bg-guindo/10 text-guindo" },
  landlord_activity: { label: "arrendador", className: "bg-amber-50 text-amber-700" },
  favorite: { label: "favorito", className: "bg-rose-50 text-rose-600" }
};

const HOUSING_STATUS_META = {
  approved: { label: "Aprobadas", dot: "bg-emerald-500" },
  pending: { label: "Pendientes", dot: "bg-amber-500" },
  suspended: { label: "Suspendidas", dot: "bg-red-500" },
  flagged: { label: "Observadas", dot: "bg-red-500" }
};

const ROLE_META = {
  student: { label: "Estudiantes", dot: "bg-amber-500" },
  landlord: { label: "Arrendadores", dot: "bg-sky-500" },
  admin: { label: "Administradores", dot: "bg-rose-500" }
};

function AuditLogList({ logs, onOpenListing, emptyLabel }) {
  if (logs.length === 0) {
    return (
      <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-1.5">
        <Inbox className="h-8 w-8 text-slate-300 mx-auto" />
        <p className="text-xs font-bold text-slate-500">{emptyLabel}</p>
        <p className="text-[11px] text-slate-400">Los eventos aparecerán aquí automáticamente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const clickable = Boolean(log.listing_id);
        return (
          <div
            key={log.id}
            onClick={() => clickable && onOpenListing(log.listing_id)}
            className={`border border-slate-200 rounded-xl p-3 bg-white flex items-start gap-3 ${
              clickable ? "cursor-pointer hover:border-guindo/40 hover:bg-guindo/5 transition-colors" : ""
            }`}
          >
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                LOG_TYPE_META[log.type]?.className || "bg-slate-100 text-slate-600"
              }`}
            >
              {LOG_TYPE_META[log.type]?.label || log.type}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800">
                {log.actor_name} · {log.action}
              </p>
              <p className="text-[11px] text-slate-500">{log.details}</p>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// blocked_until null puede ser "nunca bloqueado" o "bloqueo permanente";
// blocked_reason es el que de verdad indica que hay un bloqueo activo (y un
// blocked_until en el pasado significa que la suspension temporal ya vencio).
function isUserBlocked(u) {
  return Boolean(u.blocked_reason) && (!u.blocked_until || new Date(u.blocked_until) > new Date());
}

function SortableHeader({ label, field, sort, onSort, align = "left" }) {
  const active = sort.field === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`px-5 py-3 cursor-pointer select-none hover:text-slate-800 transition-colors ${align === "right" ? "text-right" : "text-left"}`}
    >
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
        <span>{label}</span>
        <ArrowUpDown className={`h-3 w-3 shrink-0 ${active ? "text-guindo" : "text-slate-300"}`} />
      </span>
    </th>
  );
}

function makeSortToggle(setSort) {
  return (field) => setSort((prev) => (prev.field === field ? { field, asc: !prev.asc } : { field, asc: true }));
}

function sortRows(rows, sort, getValue) {
  if (!sort.field) return rows;
  return [...rows].sort((a, b) => {
    const va = getValue(a, sort.field);
    const vb = getValue(b, sort.field);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sort.asc ? cmp : -cmp;
  });
}

function FechaHoraCelda({ iso }) {
  if (!iso) return <span className="text-slate-300 text-[10px]">—</span>;
  const fecha = new Date(iso);
  return (
    <div className="leading-tight">
      <span className="text-[11px] text-slate-700 font-bold block">
        {fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
      </span>
      <span className="text-[9px] text-slate-400 block">
        {fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true })}
      </span>
    </div>
  );
}

const DOC_TYPE_LABEL = { dni: "DNI", carnet: "Carnet / Título" };

// El admin ya no revisa documento por documento - agrupa DNI + carnet del
// mismo usuario para aprobar/rechazar ambos de una sola vez (ver
// admin.service.js:reviewUserDocuments).
function groupDocsByUser(docs) {
  const map = new Map();
  for (const doc of docs) {
    if (!map.has(doc.user_id)) {
      map.set(doc.user_id, { userId: doc.user_id, profile: doc.profiles, docs: [] });
    }
    map.get(doc.user_id).docs.push(doc);
  }
  return Array.from(map.values());
}

function BreakdownRow({ meta, counts }) {
  return (
    <div className="space-y-2">
      {Object.entries(meta).map(([key, { label, dot }]) => (
        <div key={key} className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            {label}
          </span>
          <span className="font-black text-slate-900 font-mono">{counts[key] || 0}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const { token } = useAuth();
  const location = useLocation();
  const consumedNavState = useRef(false);
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState("verifications");

  const [stats, setStats] = useState(null);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [allHousings, setAllHousings] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [landlordLogs, setLandlordLogs] = useState([]);
  const [verifiedDomains, setVerifiedDomains] = useState([]);
  const [newDomain, setNewDomain] = useState("");
  const [newInstitutionName, setNewInstitutionName] = useState("");
  const [domainError, setDomainError] = useState("");
  const [viewingListing, setViewingListing] = useState(null);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [listingSort, setListingSort] = useState({ field: "created_at", asc: false });
  const [userSort, setUserSort] = useState({ field: "created_at", asc: false });
  const sortListingsBy = makeSortToggle(setListingSort);
  const sortUsersBy = makeSortToggle(setUserSort);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [s, docs, housings, users, adminAuditLogs, landlordAuditLogs, domains] = await Promise.all([
        getStatsRequest(token),
        getPendingDocumentsRequest(token),
        getAllHousingsRequest(token),
        getAllUsersRequest(token),
        getAuditLogsRequest(token, "admin"),
        getAuditLogsRequest(token, "arrendadores"),
        getVerifiedDomainsRequest(token)
      ]);
      setStats(s);
      setPendingDocs(docs);
      setAllHousings(housings);
      setAllUsers(users);
      setAdminLogs(adminAuditLogs);
      setLandlordLogs(landlordAuditLogs);
      setVerifiedDomains(domains);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el panel de administración.");
    } finally {
      setLoading(false);
    }
  }

  function openListingFromLog(listingId) {
    if (!listingId) return;
    const listing = allHousings.find((h) => h.id === listingId);
    if (listing) setViewingListing(listing);
  }

  function openListingFromUserDetail(listing) {
    setViewingUserId(null);
    setViewingListing(listing);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Llegar desde una notificacion (nuevo usuario / anuncio pendiente) debe
  // abrir directo el modal correspondiente - una sola vez, para que acciones
  // posteriores que recargan la data (loadAll) no lo vuelvan a abrir solas.
  useEffect(() => {
    if (loading || consumedNavState.current || !location.state) return;
    consumedNavState.current = true;

    if (location.state.openListingId) {
      setActiveTab("listings");
      const listing = allHousings.find((h) => h.id === location.state.openListingId);
      if (listing) setViewingListing(listing);
    }
    if (location.state.openUserId) {
      setActiveTab("users");
      setViewingUserId(location.state.openUserId);
    }
  }, [loading, allHousings, location.state]);

  async function handleDocsReview(userId, estado) {
    await reviewUserDocumentsRequest(token, userId, estado, estado === "approved" ? "Documentos válidos" : "Documentos rechazados");
    setPendingDocs((prev) => prev.filter((d) => d.user_id !== userId));
    loadAll();
  }

  async function handleHousingStatus(id, estado) {
    await reviewHousingRequest(token, id, estado);
    loadAll();
  }

  async function handleSetRole(userId, rol) {
    await setUserRoleRequest(token, userId, rol);
    loadAll();
  }

  async function handleSuspend(userId) {
    const motivo = window.prompt("Motivo de la suspensión temporal:");
    if (!motivo) return;
    const diasInput = window.prompt("¿Por cuántos días queda suspendido?", "7");
    const dias = Number(diasInput);
    if (!dias || dias <= 0) return;
    await blockUserRequest(token, userId, motivo, dias);
    loadAll();
  }

  async function handleBlock(userId) {
    const motivo = window.prompt("Motivo del bloqueo permanente:");
    if (!motivo) return;
    await blockUserRequest(token, userId, motivo);
    loadAll();
  }

  async function handleReactivate(userId) {
    await reactivateUserRequest(token, userId);
    loadAll();
  }

  async function handleDeleteAccount(u) {
    const cascadeWarning =
      u.role === "landlord" ? " Esto también elimina TODAS sus publicaciones, chats y favoritos asociados." : "";
    const motivo = window.prompt(
      `Vas a ELIMINAR PERMANENTEMENTE la cuenta de "${u.name}".${cascadeWarning}\n\nEscribe el motivo para confirmar:`
    );
    if (!motivo) return;
    if (!window.confirm(`Última confirmación: ¿eliminar la cuenta de "${u.name}"? No se puede deshacer.`)) return;
    await deleteUserRequest(token, u.id, motivo);
    loadAll();
  }

  async function handleDeleteListing(item) {
    if (!window.confirm(`¿Eliminar permanentemente el anuncio "${item.title}"? No se puede deshacer.`)) return;
    await deleteHousingRequest(token, item.id);
    loadAll();
  }

  async function handleAddDomain(e) {
    e.preventDefault();
    setDomainError("");
    try {
      await addVerifiedDomainRequest(token, newDomain.trim(), newInstitutionName.trim());
      setNewDomain("");
      setNewInstitutionName("");
      loadAll();
    } catch (err) {
      setDomainError(err instanceof ApiError ? err.message : "No se pudo agregar el dominio.");
    }
  }

  async function handleRemoveDomain(domain) {
    if (!window.confirm(`¿Eliminar el dominio verificado "${domain}"? Los estudiantes ya no podrán declarar correos de ese dominio.`)) return;
    await removeVerifiedDomainRequest(token, domain);
    loadAll();
  }

  const registrationTrend = useMemo(
    () => buildRegistrationTrend(allUsers, allHousings),
    [allUsers, allHousings]
  );
  const housingTrend = useMemo(() => periodTrend(allHousings, 7), [allHousings]);
  const usersTrend = useMemo(() => periodTrend(allUsers, 7), [allUsers]);

  if (loading) {
    return (
      <div
        className="max-w-7xl mx-auto px-4 py-8 space-y-8"
        role="status"
        aria-label="Cargando panel de administración"
      >
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-3xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="h-56 bg-slate-100 rounded-3xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  const pendingHousingsCount = allHousings.filter((h) => h.status === "pending").length;

  const housingByStatus = allHousings.reduce((acc, h) => {
    acc[h.status] = (acc[h.status] || 0) + 1;
    return acc;
  }, {});
  const usersByRole = allUsers.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const sortedHousings = sortRows(allHousings, listingSort, (item, field) => {
    if (field === "arrendador") return item.profiles?.name?.toLowerCase() ?? "";
    if (field === "title") return item.title?.toLowerCase() ?? "";
    return item[field];
  });
  const sortedUsers = sortRows(allUsers, userSort, (item, field) => {
    if (field === "name") return item.name?.toLowerCase() ?? "";
    return item[field];
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Panel de Administración</h1>
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={loadAll}
            className="inline-flex items-center gap-1.5 text-xs font-black text-red-700 bg-white hover:bg-red-100 border border-red-200 px-3 py-2 rounded-xl cursor-pointer shrink-0"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Reintentar
          </button>
        </div>
      )}

      {stats && (
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } } }}
        >
          {[
            <StatCard key="docs" label="Credenciales Pendientes" className="bg-slate-900 border-slate-800">
              <span className="text-3xl font-black mt-1 block font-mono text-amber-400">{pendingDocs.length}</span>
            </StatCard>,
            <StatCard
              key="housings"
              label="Total Ofertas de Vivienda"
              value={allHousings.length}
              trend={housingTrend}
              hint={`✓ ${allHousings.filter((l) => l.status === "approved").length} activos públicamente`}
            />,
            <StatCard
              key="users"
              label="Cuentas Registradas"
              value={allUsers.length}
              trend={usersTrend}
              hint={`Estudiantes: ${allUsers.filter((u) => u.role === "student").length} | Dueños: ${allUsers.filter((u) => u.role === "landlord").length}`}
            />,
            <StatCard key="events" label="Eventos Recientes" className="bg-[#FFFDF9] border-[#F0ECE3]">
              <span className="text-3xl font-black mt-1 block font-mono text-guindo">{adminLogs.length + landlordLogs.length}</span>
            </StatCard>
          ].map((card) => (
            <motion.div
              key={card.key}
              variants={{
                hidden: reduceMotion ? {} : { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
              }}
            >
              {card}
            </motion.div>
          ))}
        </motion.div>
      )}

      {stats && (
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: reduceMotion ? 0 : 0.15 }}
        >
          <AdminInsightsCharts registrationTrend={registrationTrend} housingByStatus={housingByStatus} />
        </motion.div>
      )}

      {stats && (
        <div className="grid md:grid-cols-2 gap-4">
          <StatCard label="Publicaciones por Estado">
            <div className="mt-2">
              <BreakdownRow meta={HOUSING_STATUS_META} counts={housingByStatus} />
            </div>
          </StatCard>

          <StatCard label="Usuarios por Rol">
            <div className="mt-2">
              <BreakdownRow meta={ROLE_META} counts={usersByRole} />
            </div>
          </StatCard>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-11 px-3.5 py-2.5 rounded-xl text-xs font-black transition-colors duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id ? "bg-guindo text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === "verifications" && pendingDocs.length > 0 && (
                  <span className="bg-dorado text-slate-900 text-[9px] px-1.5 rounded-full font-black ml-1">{pendingDocs.length}</span>
                )}
                {tab.id === "listings" && pendingHousingsCount > 0 && (
                  <span className="bg-dorado text-slate-900 text-[9px] px-1.5 rounded-full font-black ml-1">{pendingHousingsCount}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === "verifications" && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Cola de Solicitudes de Verificación</h4>
              {pendingDocs.length === 0 ? (
                <div className="border border-dashed border-slate-200 p-12 text-center rounded-2xl space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                  <h5 className="font-extrabold text-slate-700">¡Excelente! Cola de identidades limpia</h5>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupDocsByUser(pendingDocs).map((group) => (
                    <div
                      key={group.userId}
                      className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-slate-800 block">{group.profile?.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-guindo font-black uppercase text-[10px] bg-guindo/5 px-1.5 py-0.5 rounded">
                            {group.profile?.role === "student" ? "Estudiante" : "Arrendador"}
                          </span>
                          <span className="text-slate-400 font-mono text-[9px]">{group.userId}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {group.docs.map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.doc_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-guindo underline font-mono text-[10px] bg-guindo/5 px-2 py-1 rounded-lg"
                            >
                              Ver {DOC_TYPE_LABEL[doc.doc_type] || doc.doc_type}
                            </a>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDocsReview(group.userId, "approved")}
                          className="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          ✔ Aprobar ambos
                        </button>
                        <button
                          onClick={() => handleDocsReview(group.userId, "rejected")}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "listings" && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Monitoreo de Alojamientos y Anuncios</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <SortableHeader label="Inmueble" field="title" sort={listingSort} onSort={sortListingsBy} />
                      <SortableHeader label="Ubicación" field="neighborhood" sort={listingSort} onSort={sortListingsBy} />
                      <SortableHeader label="Arrendador" field="arrendador" sort={listingSort} onSort={sortListingsBy} />
                      <SortableHeader label="Estado" field="status" sort={listingSort} onSort={sortListingsBy} />
                      <SortableHeader label="Creado" field="created_at" sort={listingSort} onSort={sortListingsBy} />
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {sortedHousings.map((item) => {
                      const isSuspended = item.status === "suspended" || item.status === "flagged";
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4">
                            <span className="font-extrabold text-slate-800 block truncate max-w-[200px]">{item.title}</span>
                            <span className="text-guindo font-black font-mono text-[10px]">S/. {item.price_pen} PEN</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-700 block">{item.neighborhood}</span>
                            <span className="text-slate-400 text-[10px] block">{item.address}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <img
                                src={item.profiles?.avatar_url || makiMascot}
                                alt={item.profiles?.name || "Arrendador"}
                                className="h-6 w-6 rounded-full object-cover ring-1 ring-slate-100 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-slate-700 block">{item.profiles?.name || "—"}</span>
                                <span className="text-slate-400 font-mono text-[10px] block">{item.profiles?.phone || "—"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {item.status === "pending" ? (
                              <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">Pendiente</span>
                            ) : isSuspended ? (
                              <span className="bg-red-100 text-red-800 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">Suspendido</span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">Activo</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <FechaHoraCelda iso={item.created_at} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex gap-1.5 justify-end">
                              {item.status !== "approved" && (
                                <button
                                  onClick={() => handleHousingStatus(item.id, "approved")}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Aprobar
                                </button>
                              )}
                              {item.status !== "suspended" && (
                                <button
                                  onClick={() => handleHousingStatus(item.id, "suspended")}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Suspender
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteListing(item)}
                                className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Control de Usuarios Registrados</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <SortableHeader label="Nombre" field="name" sort={userSort} onSort={sortUsersBy} />
                      <SortableHeader label="Rol" field="role" sort={userSort} onSort={sortUsersBy} />
                      <th className="px-5 py-3">Verificación</th>
                      <th className="px-5 py-3">Cuenta</th>
                      <SortableHeader label="Registrado" field="created_at" sort={userSort} onSort={sortUsersBy} />
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {sortedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4 font-extrabold text-slate-800">
                          <span className="block">{u.name}</span>
                          <span className="text-slate-400 font-mono text-[10px] block font-normal">{u.id}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              u.role === "admin" ? "bg-rose-100 text-rose-800" : u.role === "landlord" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {u.is_verified ? (
                            <span className="text-emerald-600 font-black text-[10px]">🟢 Aprobado</span>
                          ) : u.verification_status === "pending" ? (
                            <span className="text-amber-600 font-black text-[10px]">🟡 Pendiente</span>
                          ) : (
                            <span className="text-slate-400 font-medium text-[10px]">⚪ Sin verificación</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {isUserBlocked(u) ? (
                            <span
                              className="bg-red-100 text-red-800 text-[9px] px-2 py-0.5 rounded-full font-black uppercase cursor-help"
                              title={u.blocked_reason}
                            >
                              {u.blocked_until ? "Suspendido" : "Bloqueado"}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-black text-[10px]">🟢 Activo</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <FechaHoraCelda iso={u.created_at} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex gap-2 justify-end items-center flex-wrap">
                            <button
                              onClick={() => setViewingUserId(u.id)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Ver
                            </button>
                            <select
                              value={u.role}
                              onChange={(e) => handleSetRole(u.id, e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded-lg text-[10px] font-bold bg-white cursor-pointer"
                            >
                              <option value="student">Estudiante</option>
                              <option value="landlord">Arrendador</option>
                              <option value="admin">Admin</option>
                            </select>
                            {isUserBlocked(u) ? (
                              <button
                                onClick={() => handleReactivate(u.id)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Reactivar
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleSuspend(u.id)}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Suspender
                                </button>
                                <button
                                  onClick={() => handleBlock(u.id)}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Bloquear
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteAccount(u)}
                              className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Eliminar cuenta
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "logs-admin" && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Registro de Admin</h4>
              <p className="text-[11px] text-slate-400 -mt-2">Moderación de anuncios, credenciales y usuarios. Haz clic en un evento para ver el anuncio.</p>
              <AuditLogList logs={adminLogs} onOpenListing={openListingFromLog} emptyLabel="Sin eventos registrados todavía." />
            </div>
          )}

          {activeTab === "logs-arrendadores" && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Actividad de Arrendadores</span>
                <span title="Incluye los favoritos marcados por estudiantes">
                  <Heart className="h-3.5 w-3.5 text-rose-500" />
                </span>
              </h4>
              <p className="text-[11px] text-slate-400 -mt-2">
                Lo que cada arrendador hace sobre sus propios anuncios (pausar, publicar, editar, eliminar) y los favoritos que marcan los estudiantes.
              </p>
              <AuditLogList logs={landlordLogs} onOpenListing={openListingFromLog} emptyLabel="Sin actividad de arrendadores todavía." />
            </div>
          )}

          {activeTab === "dominios" && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Instituciones con Correo Verificado</h4>
              <p className="text-[11px] text-slate-400 -mt-2">
                Solo estudiantes con un correo de estos dominios pueden declarar "correo institucional" en su cuenta. Es una señal de confianza adicional, no reemplaza la revisión de documentos.
              </p>

              <form onSubmit={handleAddDomain} className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="dominio.edu.pe"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                />
                <input
                  type="text"
                  placeholder="Nombre de la institución"
                  value={newInstitutionName}
                  onChange={(e) => setNewInstitutionName(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                />
                <button
                  type="submit"
                  className="bg-guindo text-white hover:bg-guindo-dark px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar
                </button>
              </form>

              {domainError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{domainError}</p>
              )}

              {verifiedDomains.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-1.5">
                  <GraduationCap className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Sin dominios verificados todavía.</p>
                  <p className="text-[11px] text-slate-400">Agrega el primero con el formulario de arriba.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {verifiedDomains.map((d) => (
                    <div key={d.domain} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 bg-white">
                      <div className="min-w-0">
                        <span className="font-mono font-black text-guindo text-xs block">@{d.domain}</span>
                        <span className="text-[11px] text-slate-500">{d.institution_name}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveDomain(d.domain)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg cursor-pointer shrink-0"
                        aria-label={`Eliminar dominio ${d.domain}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {viewingListing && <ListingDetailModal listing={viewingListing} onClose={() => setViewingListing(null)} />}
      {viewingUserId && (
        <AdminUserDetailModal
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
          onOpenListing={openListingFromUserDetail}
        />
      )}
    </div>
  );
}
