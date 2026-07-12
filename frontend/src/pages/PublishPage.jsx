import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ImagePlus, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { createHousingRequest, uploadHousingImagesRequest } from "../api/housings.js";
import { ApiError } from "../api/client.js";
import { NEIGHBORHOODS } from "../constants/content.js";
import { fileToDataUrl } from "../utils/files.js";

const MAX_PHOTOS = 8;

const initialForm = {
  title: "",
  type: "room",
  pricePen: 250,
  distanceToUnschMinutes: 8,
  neighborhood: NEIGHBORHOODS[0],
  address: "",
  description: "",
  contactPhone: "",
  amenities: []
};

export default function PublishPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [amenityInput, setAmenityInput] = useState("");
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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

  function handlePhotoSelect(fileList) {
    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) return;

    const newPhotos = Array.from(fileList)
      .slice(0, remainingSlots)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));

    setPhotos((prev) => [...prev, ...newPhotos]);
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function startAnother() {
    setSuccess(null);
    setForm(initialForm);
    setPhotos([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);
    try {
      let listing = await createHousingRequest(token, form);

      if (photos.length > 0) {
        setUploadingPhotos(true);
        const dataUrls = await Promise.all(photos.map((p) => fileToDataUrl(p.file)));
        listing = await uploadHousingImagesRequest(token, listing.id, dataUrls);
      }

      setSuccess(listing);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo publicar la habitación.");
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="text-center space-y-1 mb-5">
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
            <Plus className="h-5 w-5 text-guindo" />
            <span>Publicar Habitación en YachakuqWasi</span>
          </h3>
          <p className="text-slate-400 text-xs">
            Tu publicación queda en estado <b>pendiente</b> hasta que un administrador la apruebe.
          </p>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="font-extrabold text-slate-800">¡Tu habitación ha sido registrada con éxito!</h4>
            <p className="text-slate-500 text-xs max-w-xs mx-auto">
              Publicado con id <code className="font-mono">{success.id}</code>, estado <b>{success.status}</b>. Un
              administrador debe aprobarla para que aparezca en Explorar.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => navigate("/portal")}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-200 transition-all cursor-pointer"
              >
                Ir a mi panel
              </button>
              <button
                onClick={startAnother}
                className="bg-guindo text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all cursor-pointer"
              >
                Publicar otra habitación
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Título del Anuncio</label>
              <input
                required
                placeholder="Ej. Cuarto Amoblado a espaldas de la UNSCH"
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
                placeholder="Ej. Jr. Tres Máscaras 142"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Teléfono Móvil de Contacto</label>
              <input
                required
                placeholder="Ej. +51 987 654 321"
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Descripción del Lugar</label>
              <textarea
                rows={2}
                placeholder="Comenta sobre la iluminación, seguridad, servicios incluidos..."
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

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">
                Fotos de la Habitación ({photos.length}/{MAX_PHOTOS})
              </label>
              <p className="text-[10px] text-slate-400 -mt-0.5">
                Se suben de verdad a Supabase Storage al publicar (recomendamos más de 3).
              </p>

              <label
                htmlFor="publish-photo-input"
                className={`flex items-center justify-center gap-1.5 border-2 border-dashed rounded-xl py-3 text-xs font-bold transition-all ${
                  photos.length >= MAX_PHOTOS
                    ? "border-slate-100 text-slate-300 cursor-not-allowed"
                    : "border-guindo/30 text-guindo hover:bg-guindo/5 cursor-pointer"
                }`}
              >
                <ImagePlus className="h-4 w-4" />
                <span>Subir fotos</span>
              </label>
              <input
                id="publish-photo-input"
                type="file"
                accept="image/*"
                multiple
                disabled={photos.length >= MAX_PHOTOS}
                onChange={(e) => {
                  handlePhotoSelect(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />

              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                      <img src={p.previewUrl} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-0.5 right-0.5 bg-slate-900/70 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] leading-none font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
              className="w-full bg-guindo text-white py-3 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer mt-2 disabled:opacity-50"
            >
              <span>{loading ? (uploadingPhotos ? "Subiendo fotos..." : "Publicando...") : "Publicar Ahora"}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/portal")}
              disabled={loading}
              className="w-full bg-transparent text-slate-500 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
