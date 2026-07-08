import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, ChevronLeft, ChevronRight, MapPin, Clock, Check, Phone, ExternalLink, Map, Compass, MessageCircle } from "lucide-react";
import { TYPE_LABEL } from "../constants/content.js";
import { useAuth } from "../context/AuthContext.jsx";
import { startChatRequest } from "../api/chat.js";
import { getPlaceholderImages } from "../constants/placeholderImages.js";
import makiMascot from "../assets/images/maki_hawk_guindo_plomo_1782934231251.jpg";

export default function ListingDetailModal({ listing, onClose }) {
  const { isAuthenticated, user, token, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState("");
  const images =
    listing?.images?.length > 0 ? listing.images : getPlaceholderImages(listing?.type, listing?.id);

  if (!listing) return null;

  async function handleStartChat() {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    setChatError("");
    setStartingChat(true);
    try {
      await startChatRequest(token, listing.landlord_id, listing.id);
      onClose();
      navigate("/portal");
    } catch (err) {
      setChatError(err?.message || "No se pudo iniciar el chat.");
    } finally {
      setStartingChat(false);
    }
  }

  const fullAddress = `${listing.address}, ${listing.neighborhood}, Ayacucho, Peru`;
  const waNumber = (listing.contact_phone || "").replace(/\D/g, "");
  const waText = encodeURIComponent(
    `Hola, vengo del portal YachakuqWasi y estoy muy interesado en su alojamiento en ${listing.neighborhood} (${listing.address}). ¿Sigue disponible?`
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative z-10 border border-guindo/10 overflow-y-auto max-h-[92vh]"
        >
          <div className="relative h-48 -mx-6 -mt-6 bg-slate-100 overflow-hidden mb-4">
            <img
              src={images[galleryIndex] ?? images[0]}
              alt={`${listing.title} - foto ${galleryIndex + 1}`}
              className="w-full h-full object-cover"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setGalleryIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm p-1 rounded-full shadow-md text-slate-700 transition-colors cursor-pointer z-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm p-1 rounded-full shadow-md text-slate-700 transition-colors cursor-pointer z-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGalleryIndex(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        i === galleryIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute top-4 left-4 flex gap-2 z-10">
              {listing.verified_by_maki && (
                <span className="bg-dorado-dark text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono shadow">
                  Maki Verificado
                </span>
              )}
              <span className="bg-guindo text-white text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide">
                {TYPE_LABEL[listing.type] || listing.type}
              </span>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl shadow-md text-slate-700 hover:text-slate-950 transition-colors cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-bold text-guindo">
              <MapPin className="h-3.5 w-3.5" />
              <span>{listing.neighborhood} • {listing.address}</span>
            </div>
            <h3 className="font-display text-lg font-black text-slate-900 tracking-tight leading-snug">{listing.title}</h3>
          </div>

          {listing.description && <p className="text-slate-600 text-xs leading-relaxed mt-3">{listing.description}</p>}

          <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-slate-50 rounded-2xl border border-guindo/10">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Cercanía a la UNSCH</span>
              <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1 mt-0.5">
                <Clock className="h-3.5 w-3.5 text-guindo" />
                <span>A {listing.distance_to_unsch_minutes} min caminando</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Costo Mensual</span>
              <span className="text-sm font-black text-guindo font-mono">
                S/. {listing.price_pen} <span className="text-xs font-bold text-slate-500">PEN</span>
              </span>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-[#FDFBF7] border border-[#F0ECE3] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Map className="h-4 w-4 text-guindo" />
                <span className="text-[10px] text-guindo font-black uppercase tracking-wider">Ubicación y Recorrido</span>
              </div>
              <span className="bg-amber-100 text-amber-900 font-extrabold text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1">
                <Compass className="h-3 w-3 text-amber-700 animate-spin-slow" />
                <span>A {listing.distance_to_unsch_minutes} min caminando</span>
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner h-40 bg-slate-100">
              <iframe
                title="Ubicación en Google Maps"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fullAddress)}&destination=UNSCH,+Ayacucho,+Peru&travelmode=walking`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-white border border-guindo/20 text-slate-700 hover:text-slate-900 py-2 px-3 rounded-xl text-[11px] font-black tracking-tight flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5 text-guindo" />
              <span>Abrir Recorrido en Google Maps</span>
            </a>

            <div className="bg-[#FFFDF9] border border-guindo/15 p-2.5 rounded-xl text-[10px] text-slate-600 flex items-start gap-2 mt-2">
              <div className="shrink-0 h-6 w-6 rounded-full overflow-hidden border border-guindo bg-white">
                <img src={makiMascot} alt="Maki mini" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-extrabold text-guindo text-[9px] block">Maki Consejos de Ruta:</span>
                <p className="leading-tight text-slate-500 italic">
                  {listing.distance_to_unsch_minutes <= 7
                    ? "¡Excelente wawa! Estás cerquísima de la UNSCH. Ideal para las clases de las 7:00 AM sin correr."
                    : `A ${listing.distance_to_unsch_minutes} minutos caminando, es una ruta perfecta para hacer ejercicio y ahorrar el mototaxi.`}
                </p>
              </div>
            </div>
          </div>

          {listing.amenities?.length > 0 && (
            <div className="mt-4 space-y-2">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Servicios y facilidades</span>
              <div className="flex flex-wrap gap-1.5">
                {listing.amenities.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="bg-white border border-guindo/12 text-slate-600 text-[10px] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"
                  >
                    <Check className="h-3 w-3 text-guindo" />
                    <span>{amenity}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-guindo/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Propietario / Arrendatario</span>
                <span className="text-sm font-extrabold text-slate-800 block mt-0.5">{listing.profiles?.name || "Arrendador"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <a
                href={`tel:${listing.contact_phone}`}
                className="bg-guindo text-white py-2.5 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all shadow-md flex items-center gap-1.5 cursor-pointer justify-center"
              >
                <Phone className="h-3.5 w-3.5 text-dorado" />
                <span>Llamar</span>
              </a>

              <a
                href={`https://wa.me/51${waNumber}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-md flex items-center gap-1.5 cursor-pointer justify-center"
              >
                <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>WhatsApp</span>
              </a>
            </div>

            {(!isAuthenticated || user?.role === "student") && (
              <button
                onClick={handleStartChat}
                disabled={startingChat}
                className="w-full bg-slate-800 text-white py-2.5 rounded-xl text-xs font-black hover:bg-slate-900 transition-all shadow-md flex items-center gap-1.5 cursor-pointer justify-center disabled:opacity-50"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>{startingChat ? "Iniciando chat..." : "Chatear dentro de YachakuqWasi"}</span>
              </button>
            )}
            {chatError && <p className="text-[10px] text-red-500 font-semibold text-center">{chatError}</p>}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
