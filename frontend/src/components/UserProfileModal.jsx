import { useEffect, useState } from "react";
import { X, GraduationCap, Home, CalendarDays } from "lucide-react";
import { getPublicProfileRequest } from "../api/profile.js";
import { ApiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import makiMascot from "../assets/images/maki-mascota.webp";

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
      <span className="text-[10px] font-black text-guindo font-mono shrink-0">S/. {listing.price_pen}</span>
    </button>
  );
}

// Perfil publico que un estudiante ve de un arrendador (y viceversa): solo
// identidad basica + publicaciones ya aprobadas del arrendador. A diferencia
// de AdminUserDetailModal, aca no hay email, telefono, estado de cuenta ni
// historial de auditoria - eso sigue siendo exclusivo del admin.
export default function UserProfileModal({ userId, onClose, onOpenListing }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getPublicProfileRequest(token, userId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "No se pudo cargar el perfil.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, userId]);

  const profile = data?.profile;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-thin">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 md:backdrop-blur-sm" />

      <div className="relative flex items-start md:items-center justify-center min-h-full md:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Perfil de usuario"
          className="bg-white w-full min-h-dvh md:min-h-0 md:h-auto md:max-h-[80vh] md:overflow-y-auto md:rounded-3xl md:max-w-md md:w-full shadow-2xl relative z-10 border border-guindo/10 p-6 sm:p-8"
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
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-guindo/10 text-guindo inline-block mt-1">
                    {ROLE_LABEL[profile.role] || profile.role}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {profile.faculty && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>
                      {profile.faculty}
                      {profile.career ? ` · ${profile.career}` : ""}
                    </span>
                  </div>
                )}
                {profile.created_at && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Miembro desde {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {profile.role === "landlord" && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5" /> Publicaciones ({data.listings?.length ?? 0})
                  </h4>
                  {data.listings?.length > 0 ? (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {data.listings.map((listing) => (
                        <ListingRow key={listing.id} listing={listing} onOpen={onOpenListing} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Sin publicaciones activas todavía.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
