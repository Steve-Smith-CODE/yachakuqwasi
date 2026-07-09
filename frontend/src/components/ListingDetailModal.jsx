import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, MapPin, Clock, Wallet, ExternalLink, Map, Compass, MessageCircle, Users, Home, Sparkles, AlignLeft } from "lucide-react";
import { TYPE_LABEL, TYPE_ACCENT } from "../constants/content.js";
import { getAmenityVisual } from "../constants/amenityIcons.js";
import { useAuth } from "../context/AuthContext.jsx";
import { startChatRequest } from "../api/chat.js";
import { getPlaceholderImages } from "../constants/placeholderImages.js";
import ListingGallery from "./ListingGallery.jsx";
import PhoneContactPopover from "./PhoneContactPopover.jsx";
import makiMascot from "../assets/images/maki-mascota.webp";

const expoOut = [0.16, 1, 0.3, 1];

function useVariants(reduce) {
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: reduce ? 0 : 0.05 } }
  };
  const item = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.15 } } }
    : { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: expoOut } } };
  return { container, item };
}

export default function ListingDetailModal({ listing, onClose }) {
  const { isAuthenticated, user, token, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { container, item } = useVariants(reduce);
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!listing) return null;

  const accent = TYPE_ACCENT[listing.type] || TYPE_ACCENT.room;
  const images = listing.images?.length > 0 ? listing.images : getPlaceholderImages(listing.type, listing.id, 5);

  const rawAmenities = listing.amenities || [];
  const capacityTag = rawAmenities.find((a) => /^Para /.test(a));
  const amenities = rawAmenities.filter((a) => a !== capacityTag);

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

  const badges = (
    <>
      {listing.verified_by_maki && (
        <span className="bg-dorado-dark text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono shadow pointer-events-auto">
          Maki Verificado
        </span>
      )}
      <span className={`${accent.badge} text-white text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide pointer-events-auto shadow-sm`}>
        {TYPE_LABEL[listing.type] || listing.type}
      </span>
    </>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-thin">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 md:backdrop-blur-sm"
        />

        <div className="relative flex items-start md:items-center justify-center min-h-full md:p-4">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={listing.title}
          initial={reduce ? { opacity: 0 } : { scale: 0.97, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { scale: 0.97, opacity: 0, y: 12 }}
          transition={{ duration: reduce ? 0.15 : 0.4, ease: expoOut }}
          className="bg-white w-full min-h-dvh md:min-h-0 md:h-auto md:rounded-3xl md:max-w-5xl md:w-full shadow-2xl relative z-10 border border-guindo/10"
        >
          <div className="sticky top-0 z-30 h-0">
            <div className="flex justify-end px-3 pt-3 md:px-4 md:pt-4">
              <button
                onClick={onClose}
                aria-label="Cerrar detalle"
                className="bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-md text-slate-700 hover:text-slate-950 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <ListingGallery images={images} title={listing.title} badges={badges} />

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-12 gap-x-10 gap-y-8 px-5 py-6 md:px-10 md:py-10"
          >
            <div className="md:col-span-7 space-y-7">
              <motion.div variants={item} className="space-y-2 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-guindo">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{listing.neighborhood} • {listing.address}</span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {listing.title}
                </h3>
                {capacityTag && (
                  <span className={`inline-flex items-center gap-1.5 ${accent.chip} text-xs font-black px-3 py-1 rounded-full mt-1`}>
                    <Users className={`h-3.5 w-3.5 ${accent.icon}`} />
                    <span>{capacityTag}</span>
                  </span>
                )}
              </motion.div>

              <motion.div variants={item} className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100">
                  <span className="text-[10px] text-sky-700/70 block font-bold uppercase tracking-wider">Cercanía a la UNSCH</span>
                  <span className="text-sm font-extrabold text-sky-900 flex items-center gap-1.5 mt-1.5">
                    <Clock className="h-4 w-4 text-sky-600" />
                    <span>A {listing.distance_to_unsch_minutes} min caminando</span>
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-guindo to-guindo-dark border border-guindo-dark shadow-md">
                  <span className="text-[10px] text-dorado/90 block font-bold uppercase tracking-wider">Costo mensual</span>
                  <span className="text-lg font-black text-white font-mono flex items-center gap-1.5 mt-0.5">
                    <Wallet className="h-4 w-4 text-dorado shrink-0" />
                    <span>
                      S/. {listing.price_pen} <span className="text-[10px] font-bold text-white/70">PEN</span>
                    </span>
                  </span>
                </div>
              </motion.div>

              {listing.description && (
                <motion.div variants={item} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center shrink-0">
                      <AlignLeft className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Descripción</span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed max-w-prose">{listing.description}</p>
                </motion.div>
              )}

              {amenities.length > 0 && (
                <motion.div variants={item} className="space-y-3 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2 pt-5">
                    <span className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${accent.chip}`}>
                      <Sparkles className={`h-3.5 w-3.5 ${accent.icon}`} />
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Lo que ofrece este alojamiento
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {amenities.map((amenity, idx) => {
                      const { Icon, classes } = getAmenityVisual(amenity);
                      return (
                        <div key={idx} className="flex items-center gap-2.5 text-slate-700 text-xs font-medium">
                          <span className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${classes}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <motion.div variants={item} className="pt-1 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-2 pt-5">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <Map className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[10px] text-teal-700 font-black uppercase tracking-wider">Ubicación y recorrido</span>
                  </div>
                  <span className="bg-amber-100 text-amber-900 font-extrabold text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Compass className="h-3 w-3 text-amber-700 animate-spin-slow" />
                    <span>A {listing.distance_to_unsch_minutes} min caminando</span>
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner h-48 bg-slate-100">
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
                  className="bg-teal-50 border border-teal-100 text-teal-700 hover:text-teal-900 py-2.5 px-3 rounded-xl text-[11px] font-black tracking-tight flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:bg-teal-100"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-teal-600" />
                  <span>Abrir recorrido en Google Maps</span>
                </a>

                <div className="bg-gradient-to-br from-dorado/12 to-guindo/6 border border-dorado/25 p-3 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
                  <div className="shrink-0 h-7 w-7 rounded-full overflow-hidden border-2 border-dorado bg-white">
                    <img src={makiMascot} alt="Maki mini" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-extrabold text-guindo text-[10px] block">Maki Consejos de Ruta:</span>
                    <p className="leading-relaxed text-slate-500 italic">
                      {listing.distance_to_unsch_minutes <= 7
                        ? "¡Excelente wawa! Estás cerquísima de la UNSCH. Ideal para las clases de las 7:00 AM sin correr."
                        : `A ${listing.distance_to_unsch_minutes} minutos caminando, es una ruta perfecta para hacer ejercicio y ahorrar el mototaxi.`}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="md:col-span-5">
              <motion.div variants={item} className="md:sticky md:top-6 space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_24px_-8px_rgba(88,18,18,0.18)] flex flex-col gap-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-guindo via-dorado to-guindo" />
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-guindo to-guindo-dark flex items-center justify-center shrink-0 shadow-sm">
                      <Home className="h-5 w-5 text-dorado" />
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Anfitrión</span>
                      <span className="text-sm font-extrabold text-slate-800 block">{listing.profiles?.name || "Arrendador"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <PhoneContactPopover phone={listing.contact_phone} size="md" />

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
          </motion.div>
        </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
