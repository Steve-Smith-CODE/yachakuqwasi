import { useEffect, useState } from "react";
import { ShieldCheck, Home, Users, Compass, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getStatsRequest,
  getPendingHousingsRequest,
  reviewHousingRequest,
  getPendingDocumentsRequest,
  reviewDocumentRequest,
  blockUserRequest,
  getAllHousingsRequest,
  getAllUsersRequest,
  setUserRoleRequest,
  getAuditLogsRequest
} from "../api/admin.js";
import { ApiError } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";

const TABS = [
  { id: "verifications", label: "Revisión de Identidad", icon: ShieldCheck },
  { id: "listings", label: "Monitoreo de Anuncios", icon: Home },
  { id: "users", label: "Control de Usuarios", icon: Users },
  { id: "logs", label: "Registro de Auditoría", icon: Compass }
];

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
  const [activeTab, setActiveTab] = useState("verifications");

  const [stats, setStats] = useState(null);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [allHousings, setAllHousings] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [s, docs, housings, users, auditLogs] = await Promise.all([
        getStatsRequest(token),
        getPendingDocumentsRequest(token),
        getAllHousingsRequest(token),
        getAllUsersRequest(token),
        getAuditLogsRequest(token)
      ]);
      setStats(s);
      setPendingDocs(docs);
      setAllHousings(housings);
      setAllUsers(users);
      setLogs(auditLogs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el panel de administración.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDocReview(id, estado) {
    await reviewDocumentRequest(token, id, estado, estado === "approved" ? "Documento válido" : "Documento rechazado");
    setPendingDocs((prev) => prev.filter((d) => d.id !== id));
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

  async function handleBlock(userId) {
    const motivo = window.prompt("Motivo del bloqueo:");
    if (!motivo) return;
    await blockUserRequest(token, userId, motivo);
    loadAll();
  }

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-slate-400">Cargando panel...</div>;

  const pendingHousingsCount = allHousings.filter((h) => h.status === "pending").length;

  const housingByStatus = allHousings.reduce((acc, h) => {
    acc[h.status] = (acc[h.status] || 0) + 1;
    return acc;
  }, {});
  const usersByRole = allUsers.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Panel de Administración</h1>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Credenciales Pendientes" className="bg-slate-900 border-slate-800">
            <span className="text-3xl font-black mt-1 block font-mono text-amber-400">{pendingDocs.length}</span>
          </StatCard>

          <StatCard
            label="Total Ofertas de Vivienda"
            value={allHousings.length}
            hint={`✓ ${allHousings.filter((l) => l.status === "approved").length} activos públicamente`}
          />

          <StatCard
            label="Cuentas Registradas"
            value={allUsers.length}
            hint={`Estudiantes: ${allUsers.filter((u) => u.role === "student").length} | Dueños: ${allUsers.filter((u) => u.role === "landlord").length}`}
          />

          <StatCard label="Eventos Recientes" className="bg-[#FFFDF9] border-[#F0ECE3]">
            <span className="text-3xl font-black mt-1 block font-mono text-guindo">{logs.length}</span>
          </StatCard>
        </div>
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
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
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
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-left divide-y divide-slate-200">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-5 py-3">Nombre / Email</th>
                        <th className="px-5 py-3">Rol</th>
                        <th className="px-5 py-3">Documento</th>
                        <th className="px-5 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {pendingDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4">
                            <span className="font-extrabold text-slate-800 block">{doc.profiles?.name}</span>
                            <span className="text-slate-400 font-mono text-[10px] block">{doc.user_id}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-guindo font-black uppercase text-[10px] bg-guindo/5 px-1.5 py-0.5 rounded">
                              {doc.profiles?.role === "student" ? "Estudiante" : "Arrendador"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <a href={doc.doc_url} target="_blank" rel="noreferrer" className="text-guindo underline font-mono text-[10px]">
                              Ver documento
                            </a>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => handleDocReview(doc.id, "approved")}
                                className="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                ✔ Aprobar
                              </button>
                              <button
                                onClick={() => handleDocReview(doc.id, "rejected")}
                                className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                ❌ Rechazar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                      <th className="px-5 py-3">Inmueble</th>
                      <th className="px-5 py-3">Ubicación</th>
                      <th className="px-5 py-3">Arrendador</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {allHousings.map((item) => {
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
                            <span className="font-bold text-slate-700 block">{item.profiles?.name || "—"}</span>
                            <span className="text-slate-400 font-mono text-[10px] block">{item.profiles?.phone || "—"}</span>
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
                      <th className="px-5 py-3">Nombre</th>
                      <th className="px-5 py-3">Rol</th>
                      <th className="px-5 py-3">Verificación</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {allUsers.map((u) => (
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
                        <td className="px-5 py-4 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            <select
                              value={u.role}
                              onChange={(e) => handleSetRole(u.id, e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded-lg text-[10px] font-bold bg-white cursor-pointer"
                            >
                              <option value="student">Estudiante</option>
                              <option value="landlord">Arrendador</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleBlock(u.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Bloquear
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

          {activeTab === "logs" && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Registro de Auditoría</h4>
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400">Sin eventos registrados todavía.</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="border border-slate-200 rounded-xl p-3 bg-white flex items-start gap-3">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                          log.type === "listing" ? "bg-guindo/10 text-guindo" : log.type === "system" ? "bg-slate-100 text-slate-600" : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {log.type}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {log.actor_name} · {log.action}
                        </p>
                        <p className="text-[11px] text-slate-500">{log.details}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
