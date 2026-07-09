import { useState } from "react";
import { X, Pencil, Info } from "lucide-react";
import { updateHousingRequest } from "../api/housings.js";
import { ApiError } from "../api/client.js";
import { NEIGHBORHOODS } from "../constants/content.js";
import { useAuth } from "../context/AuthContext.jsx";

const SENSITIVE_FIELDS = new Set(["pricePen", "address", "contactPhone", "neighborhood"]);

export default function EditListingModal({ listing, onClose, onUpdated }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    title: listing.title,
    type: listing.type,
    pricePen: listing.price_pen,
    distanceToUnschMinutes: listing.distance_to_unsch_minutes,
    neighborhood: listing.neighborhood,
    address: listing.address,
    description: listing.description || "",
    contactPhone: listing.contact_phone,
    amenities: listing.amenities || []
  });
  const [amenityInput, setAmenityInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addAmenity() {
    const value = amenityInput.trim();
    if (value && !form.amenities.includes(value)) {
      set("amenities", [...form.amenities, value]);
      setAmenityInput("");
    }
  }

  const willReturnToReview =
    listing.status === "approved" &&
    Object.entries(form).some(([key, value]) => {
      if (!SENSITIVE_FIELDS.has(key)) return false;
      const original = key === "pricePen" ? listing.price_pen : key === "contactPhone" ? listing.contact_phone : listing[key];
      return String(value).trim() !== String(original ?? "").trim();
    });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const updated = await updateHousingRequest(token, listing.id, form);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-thin">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 md:backdrop-blur-sm" />

      <div className="relative flex items-start md:items-center justify-center min-h-full md:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Editar ${listing.title}`}
          className="bg-white w-full min-h-dvh md:min-h-0 md:h-auto md:rounded-3xl md:max-w-lg md:w-full shadow-2xl relative z-10 border border-guindo/10 p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Pencil className="h-4.5 w-4.5 text-guindo" />
              <span>Editar Anuncio</span>
            </h3>
            <button
              onClick={onClose}
              aria-label="Cerrar edición"
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}

          {willReturnToReview && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 text-amber-800 text-[11px] rounded-xl px-3 py-2.5 mb-4">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Cambiaste precio, dirección, distrito o teléfono: al guardar, tu anuncio volverá a{" "}
                <b>en revisión</b> para que un administrador lo confirme.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Título del Anuncio</label>
              <input
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Tipo de Alquiler</label>
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  <option value="room">Habitación</option>
                  <option value="apartment">Minidepartamento</option>
                  <option value="shared">Espacio Compartido</option>
                  <option value="family">Familiar</option>
                </select>
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Mensualidad (S/. PEN)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.pricePen}
                  onChange={(e) => set("pricePen", Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Distrito (Huamanga)</label>
                <select
                  value={form.neighborhood}
                  onChange={(e) => set("neighborhood", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Minutos a la UNSCH</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.distanceToUnschMinutes}
                  onChange={(e) => set("distanceToUnschMinutes", Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Dirección Exacta</label>
              <input
                required
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Teléfono Móvil de Contacto</label>
              <input
                required
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Descripción del Lugar</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Servicios del cuarto</label>
              <div className="flex gap-2">
                <input
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAmenity();
                    }
                  }}
                  placeholder="Ej. Wi-Fi de fibra, Baño privado"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="bg-guindo text-white px-3 py-2 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all cursor-pointer"
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {form.amenities.map((item, i) => (
                  <span key={i} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-semibold">
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => set("amenities", form.amenities.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-700 font-bold font-mono cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-black hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-guindo text-white py-2.5 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
