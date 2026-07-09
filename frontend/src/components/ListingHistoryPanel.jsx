import { useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { getHousingActivityRequest } from "../api/housings.js";

// Historial propio del arrendador sobre este anuncio (pausar/publicar/editar/
// eliminar/restaurar) - carga perezosa al expandir, para no pedir el
// historial de cada tarjeta si el arrendador nunca lo abre.
export default function ListingHistoryPanel({ listingId, token }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && logs === null) {
      setLoading(true);
      try {
        const data = await getHousingActivityRequest(token, listingId);
        setLogs(data);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="pt-1.5 border-t border-slate-100">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
      >
        <History className="h-3 w-3" />
        <span>Historial de este anuncio</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-1.5 space-y-1.5">
          {loading ? (
            <p className="text-[10px] text-slate-400">Cargando...</p>
          ) : logs?.length === 0 ? (
            <p className="text-[10px] text-slate-400">Aún no hay actividad registrada.</p>
          ) : (
            logs?.map((log) => (
              <div key={log.id} className="text-[10px] leading-snug">
                <span className="font-bold text-slate-700">{log.action}</span>
                <span className="text-slate-400"> · {new Date(log.created_at).toLocaleDateString()}</span>
                {log.details && <p className="text-slate-400 truncate">{log.details}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
