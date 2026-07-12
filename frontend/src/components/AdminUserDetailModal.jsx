import { useEffect, useState } from "react";
import { X, Mail, Phone, GraduationCap, ShieldCheck, ShieldAlert, Ban, Home, Heart } from "lucide-react";
import { getUserDetailRequest } from "../api/admin.js";
import { ApiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatCard from "./StatCard.jsx";
import makiMascot from "../assets/images/maki-mascota.webp";

const LOG_TYPE_LABEL = {
  system: "sistema",
  user: "usuario",
  listing: "anuncio",
  landlord_activity: "arrendador",
  favorite: "favorito"
};

const ROLE_LABEL = { student: "Estudiante", landlord: "Arrendador", admin: "Admin" };

function ListingRow({ listing, onOpen }) {
  return (
    <button
      onClick={() => onOpen(listing)}
      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-guindo/30 hover:bg-guindo/5 transition-colors text-left cursor-pointer"
    >
      <div className="min-w-0">
        <span className="text-xs font-bold text-slate-800 block truncate">{listing.title}</span>
        <span className="text-[10px] text-slate-400 block">{listing.neighborhood}</span>
      </div>
      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">{listing.status}</span>
    </button>
  );
}

// Vista de solo lectura: el admin "visita" el perfil de un estudiante o
// arrendador (datos + stats + sus publicaciones/favoritos + su rastro de
// auditoria), pero nunca actua en su nombre - no hay ningun boton que
// ejecute una accion como si fuera ese usuario.
export default function AdminUserDetailModal({ userId, onClose, onOpenListing }) {
  const { token } = useAuth();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getUserDetailRequest(token, userId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "No se pudo cargar el perfil del usuario.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, userId]);

  const profile = detail?.profile;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-thin">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 md:backdrop-blur-sm" />

      <div className="relative flex items-start md:items-center justify-center min-h-full md:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Perfil de usuario"
          className="bg-white w-full min-h-dvh md:min-h-0 md:h-auto md:max-h-[85vh] md:overflow-y-auto md:rounded-3xl md:max-w-2xl md:w-full shadow-2xl relative z-10 border border-guindo/10 p-6 sm:p-8"
        >
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer z-10"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          {loading && <p className="text-sm text-slate-400 py-12 text-center">Cargando perfil...</p>}
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          {profile && (
            <div className="space-y-6">
              <div className="flex items-center gap-3.5">
                <img
                  src={profile.avatar_url || makiMascot}
                  alt={profile.name}
                  className="h-16 w-16 rounded-full object-cover ring-1 ring-slate-100 shadow-sm shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">{profile.name}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-guindo/10 text-guindo">
                      {ROLE_LABEL[profile.role] || profile.role}
                    </span>
                    {profile.is_verified ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Verificado
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> Sin verificar
                      </span>
                    )}
                    {profile.blocked_until && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1">
                        <Ban className="h-3 w-3" /> Bloqueado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
                {profile.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.faculty && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>
                      {profile.faculty}
                      {profile.career ? ` · ${profile.career}` : ""}
                    </span>
                  </div>
                )}
                {profile.institutional_email && (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <GraduationCap className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate" title="Correo institucional autodeclarado">
                      {profile.institutional_email}
                    </span>
                  </div>
                )}
              </div>

              {detail.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {profile.role === "landlord" ? (
                    <>
                      <StatCard label="Publicaciones" value={detail.stats.totalListings} />
                      <StatCard label="Favoritos Recibidos" value={detail.stats.favoritesReceived} tone="guindo" />
                      <StatCard label="Contactos Recibidos" value={detail.stats.contactsReceived} tone="emerald" />
                    </>
                  ) : (
                    <>
                      <StatCard label="Favoritos Guardados" value={detail.stats.savedFavorites} tone="guindo" />
                      <StatCard label="Chats Activos" value={detail.stats.activeChats} tone="emerald" />
                    </>
                  )}
                </div>
              )}

              {profile.role === "landlord" && detail.listings?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5" /> Sus Publicaciones
                  </h4>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {detail.listings.map((listing) => (
                      <ListingRow key={listing.id} listing={listing} onOpen={onOpenListing} />
                    ))}
                  </div>
                </div>
              )}

              {profile.role === "student" && detail.favorites?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" /> Favoritos
                  </h4>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {detail.favorites.map((listing) => (
                      <ListingRow key={listing.id} listing={listing} onOpen={onOpenListing} />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Actividad Reciente</h4>
                {detail.activity?.length > 0 ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {detail.activity.map((log) => (
                      <div key={log.id} className="border border-slate-100 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                            {LOG_TYPE_LABEL[log.type] || log.type}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate">{log.action}</span>
                        </div>
                        {log.details && <p className="text-[11px] text-slate-500 mt-0.5">{log.details}</p>}
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Sin actividad registrada todavía.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
