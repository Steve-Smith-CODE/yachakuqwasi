import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { createHousingRequest } from "../api/housings.js";
import { ApiError } from "../api/client.js";

const initialForm = {
  title: "",
  type: "room",
  pricePen: 250,
  distanceToUnschMinutes: 8,
  neighborhood: "San Blas",
  address: "",
  description: "",
  contactPhone: "",
  amenities: [],
  images: []
};

export default function PublishPage() {
  const { token } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [amenityInput, setAmenityInput] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

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

  function addImage() {
    const value = imageUrlInput.trim();
    if (value) {
      set("images", [...form.images, value]);
      setImageUrlInput("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);
    try {
      const listing = await createHousingRequest(token, form);
      setSuccess(listing);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo publicar la habitación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div>
          <h1 className="text-lg font-black text-slate-900">Publicar Habitación</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tu publicación queda en estado <b>pendiente</b> hasta que un administrador la apruebe.
          </p>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        {success && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            Publicado con id <code>{success.id}</code>, estado <b>{success.status}</b>. Un administrador debe
            aprobarla para que aparezca en Explorar.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">Título</label>
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 font-semibold"
              >
                <option value="room">Habitación</option>
                <option value="apartment">Departamento</option>
                <option value="shared">Compartido</option>
                <option value="family">Familiar</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Mensualidad (S/.)</label>
              <input
                type="number"
                min="1"
                required
                value={form.pricePen}
                onChange={(e) => set("pricePen", Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Barrio</label>
              <input
                required
                value={form.neighborhood}
                onChange={(e) => set("neighborhood", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Minutos a la UNSCH</label>
              <input
                type="number"
                min="1"
                required
                value={form.distanceToUnschMinutes}
                onChange={(e) => set("distanceToUnschMinutes", Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">Dirección exacta</label>
            <input
              required
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">Teléfono de contacto</label>
            <input
              required
              value={form.contactPhone}
              onChange={(e) => set("contactPhone", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">Descripción</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">Servicios</label>
            <div className="flex gap-2">
              <input
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                placeholder="Ej. Wi-Fi de fibra"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
              />
              <button type="button" onClick={addAmenity} className="px-3 py-2 bg-guindo text-white rounded-xl text-xs font-bold cursor-pointer">
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {form.amenities.map((item, i) => (
                <span key={i} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-semibold">
                  {item}
                  <button
                    type="button"
                    onClick={() => set("amenities", form.amenities.filter((_, idx) => idx !== i))}
                    className="text-red-500 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">
              Fotos (URLs de imagen) — {form.images.length}
            </label>
            <div className="flex gap-2">
              <input
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
              />
              <button type="button" onClick={addImage} className="px-3 py-2 bg-guindo text-white rounded-xl text-xs font-bold cursor-pointer">
                Agregar
              </button>
            </div>
            {form.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {form.images.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => set("images", form.images.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 bg-slate-900/70 text-white rounded-full h-4 w-4 text-[10px] font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-guindo text-white py-2.5 rounded-xl text-sm font-black hover:bg-guindo-dark disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Publicando..." : "Publicar"}
          </button>
        </form>
      </div>
    </div>
  );
}
