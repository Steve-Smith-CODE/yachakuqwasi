import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, PauseCircle, PlayCircle, Trash2, ChevronLeft } from "lucide-react";

const DELETE_REASONS = [
  { value: "rented", label: "Ya alquilé" },
  { value: "data_changed", label: "Cambié mis datos" },
  { value: "other", label: "Otro motivo" }
];

// Menu de gestion (kebab) por anuncio del arrendador: editar, pausar/publicar
// y eliminar. Pausar/eliminar disparan la accion al toque (revertible via
// toast "Deshacer" en el componente padre) en vez de un modal de confirmacion,
// asi que la unica confirmacion en dos pasos que vive aqui es el motivo de
// eliminacion, para no perder esa metrica.
export default function ListingActionsMenu({ listing, onEdit, onTogglePause, onDelete }) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const ref = useRef(null);
  const isPaused = Boolean(listing.paused_at);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) close();
    }
    function handleKey(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setConfirmingDelete(false);
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Gestionar anuncio"
        aria-expanded={open}
        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-[190px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
          {!confirmingDelete ? (
            <>
              <button
                type="button"
                onClick={() => {
                  close();
                  onEdit();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 text-slate-400" />
                <span>Editar anuncio</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  close();
                  onTogglePause(!isPaused);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isPaused ? (
                  <PlayCircle className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <PauseCircle className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span>{isPaused ? "Publicar anuncio" : "Pausar anuncio"}</span>
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar anuncio</span>
              </button>
            </>
          ) : (
            <div className="px-3 py-2 space-y-1.5">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer mb-1"
              >
                <ChevronLeft className="h-3 w-3" />
                <span>Volver</span>
              </button>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">¿Por qué lo eliminas?</p>
              <div className="flex flex-col gap-1">
                {DELETE_REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      close();
                      onDelete(r.value);
                    }}
                    className="text-left text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-red-50 hover:text-red-700 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
