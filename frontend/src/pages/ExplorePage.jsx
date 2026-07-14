import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import {
  Search,
  Home,
  MessageCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Compass,
  Map,
  Sparkles,
  Plus
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useHousingSearch } from "../hooks/useHousingSearch.js";
import { useFavorites } from "../hooks/useFavorites.js";
import HousingCard from "../components/HousingCard.jsx";
import { MACOT_TIPS, TIP_CATEGORY_LABEL, STUDENT_TESTIMONIALS, NEIGHBORHOODS } from "../constants/content.js";
import unschLogoIcon from "../assets/images/maqueta-unsch.webp";
import makiMascot from "../assets/images/maki-mascota.webp";
import heroVideo from "../assets/videos/intro-embers-bg.mp4";

const ListingsMap = lazy(() => import("../components/ListingsMap.jsx"));

const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function MapStepIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8">
      <path d="M24 5C16.3 5 10 11.3 10 19c0 10.5 14 24 14 24s14-13.5 14-24c0-7.7-6.3-14-14-14z" fill="#a62639" />
      <circle cx="24" cy="19" r="6.5" fill="#f5b929" />
      <circle cx="24" cy="19" r="2.4" fill="#a62639" />
    </svg>
  );
}

function BudgetStepIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8">
      <ellipse cx="24" cy="35" rx="14" ry="4.5" fill="#33414d" />
      <ellipse cx="24" cy="29" rx="14" ry="4.5" fill="#55697e" />
      <ellipse cx="24" cy="23" rx="14" ry="4.5" fill="#c23652" />
      <ellipse cx="24" cy="17" rx="14" ry="4.5" fill="#a62639" />
      <text x="24" y="20" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#fff" fontFamily="'Inter', sans-serif">
        S/.
      </text>
    </svg>
  );
}

function ChatStepIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8">
      <rect x="6" y="9" width="36" height="23" rx="8" fill="#a62639" />
      <path d="M15 32v7l9-7z" fill="#a62639" />
      <circle cx="24" cy="20.5" r="8.5" fill="#f5b929" />
      <path d="M19.5 20.5l3 3 6-6.2" stroke="#6e1626" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const HOW_IT_WORKS_STEPS = [
  {
    eyebrow: "Ubicación",
    title: "Busca en el mapa real de Ayacucho",
    body: "Filtra por distrito y mira a cuántos minutos caminando queda cada cuarto de tu facultad. Los precios aparecen directo sobre el mapa.",
    Icon: MapStepIcon
  },
  {
    eyebrow: "Presupuesto",
    title: "Cuadra tus soles del mes",
    body: "La calculadora reparte alquiler, comida, pasaje y materiales para que sepas si un cuarto realmente te alcanza antes de comprometerte.",
    Icon: BudgetStepIcon
  },
  {
    eyebrow: "Contacto seguro",
    title: "Habla directo con el dueño, sin intermediarios",
    body: "Chatea o llama por WhatsApp desde la publicación. Los perfiles verificados por Maki llevan una insignia dorada.",
    Icon: ChatStepIcon
  }
];

const fadeUp = prefersReducedMotion
  ? { hidden: {}, visible: {} }
  : { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } } };

const staggerParent = prefersReducedMotion
  ? { hidden: {}, visible: {} }
  : { hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };

export default function ExplorePage() {
  const { isAuthenticated, user, token, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    loading,
    loadingMore,
    error,
    hasMore,
    barrio,
    setBarrio,
    tipo,
    setTipo,
    searchQuery,
    setSearchQuery,
    roomSearch,
    setRoomSearch,
    visibleListings,
    load,
    loadMore,
    resetFilters
  } = useHousingSearch();
  const { favoriteIds, toggleFavorite } = useFavorites(isAuthenticated, token);

  const [selectedListing, setSelectedListing] = useState(null);
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  const scrollContainerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const heroSectionRef = useRef(null);
  const heroVideoRef = useRef(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroSectionRef,
    offset: ["start start", "end start"]
  });
  const heroOpacity = useTransform(heroScrollProgress, [0, 1], prefersReducedMotion ? [1, 1] : [1, 0]);
  const heroScale = useTransform(heroScrollProgress, [0, 1], prefersReducedMotion ? [1, 1] : [1, 0.92]);

  useMotionValueEvent(heroScrollProgress, "change", (v) => {
    const video = heroVideoRef.current;
    if (!video) return;
    if (v > 0.85 && !video.paused) video.pause();
    else if (v <= 0.85 && video.paused) video.play().catch(() => {});
  });

  useEffect(() => {
    if (window.location.hash === "#como-funciona") {
      setTimeout(() => {
        document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, []);

  async function handleTypeClick(value) {
    setTipo(value);
    await load(value);
    document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleFilterSubmit(e) {
    e.preventDefault();
    const data = await load();

    document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth", block: "start" });

    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    const match = data.find(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.neighborhood.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
    );
    if (match) setTimeout(() => handleOpenListing(match), 550);
  }

  // Navega a /habitacion/:id (URL propia, compartible) en vez de solo abrir
  // un modal por estado. App.jsx la muestra como overlay sobre esta misma
  // pantalla via el patron de "background location" de react-router.
  function handleOpenListing(listing) {
    setSelectedListing(listing);
    navigate(`/habitacion/${listing.id}`, { state: { backgroundLocation: location, listing } });
  }

  function handleScroll() {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const totalScroll = scrollWidth - clientWidth;
      setScrollProgress(totalScroll > 0 ? (scrollLeft / totalScroll) * 100 : 0);
    }
  }

  function scrollSlider(direction) {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  }

  function handlePublishCta() {
    if (isAuthenticated && (user?.role === "landlord" || user?.role === "admin")) {
      navigate("/publicar");
    } else {
      openAuthModal("signup");
    }
  }

  async function handleToggleFavorite(listing) {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    await toggleFavorite(listing);
  }

  return (
    <>
      <section ref={heroSectionRef} className="relative h-[165vh]">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="sticky top-0 h-screen flex items-center justify-center py-12 px-4 text-white overflow-hidden"
        >
          <video
            ref={heroVideoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#3a0d0d]/70 via-[#280909]/45 to-[#140404]/90" />
          <div className="absolute inset-0 bg-guindo/20 mix-blend-multiply" />

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8 w-full">
            <h2
              className="font-display text-3xl md:text-5xl font-black tracking-tight leading-tight md:leading-none [text-shadow:0_2px_18px_rgba(0,0,0,0.35)]"
              style={{ textWrap: "balance" }}
            >
              Encuentra alojamiento para estudiantes en{" "}
              <span className="bg-gradient-to-r from-dorado-dark to-dorado bg-clip-text text-transparent">Ayacucho</span>
            </h2>

          <form
            onSubmit={handleFilterSubmit}
            className="bg-white text-slate-800 p-4 md:p-6 rounded-3xl shadow-2xl border border-guindo/10 max-w-3xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-6 text-left">
                <label className="text-[10px] font-black tracking-wider text-plomo uppercase block mb-1">Buscar Zona / Calle</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Ej. San Blas, Carmen Alto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50"
                  />
                </div>
              </div>

              <div className="md:col-span-4 text-left">
                <label className="text-[10px] font-black tracking-wider text-plomo uppercase block mb-1">Distrito (Huamanga)</label>
                <select
                  value={barrio}
                  onChange={(e) => setBarrio(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  <option value="">Todos los distritos</option>
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 pt-4 md:pt-0">
                <button
                  type="submit"
                  className="btn-shine w-full text-white py-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_8px_20px_-6px_rgba(166,38,57,0.55)]"
                  style={{ background: "linear-gradient(135deg, #c23652 0%, #a62639 55%, #6e1626 100%)" }}
                >
                  <Search className="h-4 w-4 text-dorado" />
                  <span>Buscar</span>
                </button>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4 text-xs font-semibold text-slate-200">
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-dorado" /> <span>Cero comisiones ocultas</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-dorado" /> <span>Verificación con Maki IA</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-dorado" /> <span>Ahorra en mototaxis</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-dorado" /> <span>Trato directo con dueño</span>
            </div>
          </div>
          </div>

          <motion.div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/70 z-10"
            animate={prefersReducedMotion ? {} : { y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-[9px] font-black uppercase tracking-widest">Sigue bajando</span>
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </section>

      <main className="relative z-10 -mt-10 bg-[#FDFBF7] rounded-t-[40px] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] max-w-7xl mx-auto px-4 py-12 space-y-12">
        <motion.section
          id="como-funciona"
          className="scroll-mt-28 space-y-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={fadeUp}
        >
          <div className="text-center space-y-1">
            <span className="text-xs font-black tracking-widest text-guindo uppercase block">Cómo Funciona</span>
            <h3 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Encuentra tu cuarto en 3 pasos</h3>
          </div>
          <motion.div
            className="relative grid md:grid-cols-3 gap-10 md:gap-6"
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            <div className="hidden md:block absolute top-8 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-guindo/0 via-guindo/25 to-guindo/0" />
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <motion.div key={step.eyebrow} variants={fadeUp} className="relative text-center space-y-3">
                <div className="relative mx-auto h-16 w-16 rounded-2xl bg-white border border-guindo/15 shadow-[0_4px_18px_-6px_rgba(88,18,18,0.15)] flex items-center justify-center">
                  <step.Icon />
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-guindo text-white text-[9px] font-black flex items-center justify-center font-mono border-2 border-[#FDFBF7]">
                    {i + 1}
                  </span>
                </div>
                <span className="text-[9px] font-black tracking-widest text-guindo uppercase font-mono block">{step.eyebrow}</span>
                <h4 className="text-sm font-black text-slate-900 leading-snug">{step.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[240px] mx-auto">{step.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          className="bg-white p-6 rounded-3xl border border-guindo/10 shadow-[0_4px_18px_-6px_rgba(88,18,18,0.12)] grid md:grid-cols-12 gap-8 items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={fadeUp}
        >
          <div className="md:col-span-3 flex justify-center">
            <div className="relative group">
              <div className="bg-[#F4F3EF] p-3 rounded-2xl border-2 border-guindo shadow-md w-44 aspect-square overflow-hidden shrink-0 relative">
                <img
                  src={makiMascot}
                  alt="Maki Mascot"
                  className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 bg-guindo text-white text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider font-mono shadow border border-white">
                Maki Consejero
              </span>
            </div>
          </div>

          <div className="md:col-span-9 space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-guindo/5 border border-guindo/20 px-3 py-1 rounded-full text-xs font-black text-guindo">
              <Sparkles className="h-3.5 w-3.5 text-dorado" />
              <span>CONSEJOS DE CONVIVENCIA UNIVERSITARIA EN AYACUCHO</span>
            </div>

            <h3 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">¿Buscas cuarto por primera vez en Huamanga?</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {MACOT_TIPS.map((tip, idx) => (
                <button
                  key={tip.id}
                  onClick={() => setActiveTipIndex(idx)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer flex flex-col justify-between h-20 ${
                    activeTipIndex === idx ? "bg-guindo text-white border-guindo shadow-md" : "bg-[#FDFBF7] text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="block text-[10px] uppercase font-black tracking-wider opacity-85">{TIP_CATEGORY_LABEL[tip.category]}</span>
                  <span className="block text-xs font-extrabold mt-1 line-clamp-1">{tip.title}</span>
                </button>
              ))}
            </div>

            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#F0ECE3] text-xs text-slate-600 mt-2">
              <p className="font-extrabold text-guindo text-sm mb-1">📌 {MACOT_TIPS[activeTipIndex].title}</p>
              <p className="leading-relaxed text-slate-600 italic">"{MACOT_TIPS[activeTipIndex].message}"</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="listings-section"
          className="space-y-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={fadeUp}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-guindo animate-pulse" />
                <span className="text-xs font-black tracking-widest text-guindo uppercase">ALQUILERES RECOMENDADOS</span>
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 mt-1">
                <Home className="h-7 w-7 md:h-8 md:w-8 text-guindo" />
                <span>Habitaciones Disponibles</span>
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {error ? (
                  <span className="text-red-500">{error}</span>
                ) : loading ? (
                  "Cargando publicaciones reales..."
                ) : (
                  <>Mostrando <span className="font-bold text-guindo">{visibleListings.length} habitaciones</span> reales aprobadas.</>
                )}
              </p>
            </div>

            {visibleListings.length > 0 && (
              <div className="flex items-center gap-3 self-end md:self-center">
                <div className="hidden sm:flex items-center gap-2 mr-2">
                  <span className="text-[10px] font-mono text-slate-400">Progreso</span>
                  <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="bg-guindo h-full transition-all duration-150" style={{ width: `${Math.max(8, scrollProgress)}%` }} />
                  </div>
                </div>
                <button onClick={() => scrollSlider("left")} className="bg-white border border-guindo/15 p-2.5 rounded-xl hover:border-guindo hover:text-guindo active:scale-95 transition-all shadow-sm cursor-pointer">
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <button onClick={() => scrollSlider("right")} className="bg-white border border-guindo/15 p-2.5 rounded-xl hover:border-guindo hover:text-guindo active:scale-95 transition-all shadow-sm cursor-pointer">
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Filtrar por título, barrio, precio o amenidad..."
              value={roomSearch}
              onChange={(e) => setRoomSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-guindo/40 focus:border-guindo text-xs bg-white shadow-sm transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: "", label: "Todos" },
              { value: "room", label: "Individual" },
              { value: "shared", label: "Compartido" }
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTypeClick(opt.value)}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide transition-all cursor-pointer border-2 ${
                  tipo === opt.value
                    ? "bg-guindo border-guindo text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-600 hover:border-guindo/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#FDFBF7] to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FDFBF7] to-transparent pointer-events-none z-10" />

            <motion.div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex gap-6 overflow-x-auto pb-6 pt-2 px-1 snap-x snap-mandatory scroll-smooth scrollbar-none"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={staggerParent}
            >
              {!loading && visibleListings.length === 0 ? (
                <div className="w-full bg-white rounded-3xl border border-dashed border-guindo/20 p-12 text-center space-y-4">
                  <Compass className="h-12 w-12 text-slate-300 mx-auto stroke-1" />
                  <h4 className="font-extrabold text-slate-700">No encontramos habitaciones con esos filtros</h4>
                  <button
                    onClick={() => resetFilters()}
                    className="bg-guindo text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-guindo-dark transition-all cursor-pointer"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                visibleListings.map((room) => (
                  <motion.div key={room.id} variants={fadeUp} className="shrink-0">
                    <HousingCard
                      listing={room}
                      onOpen={handleOpenListing}
                      isFavorite={favoriteIds.has(room.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>

          <p className="text-center text-[11px] text-slate-400 font-medium">
            💡 <span className="font-bold text-guindo">Tip:</span> Desliza con libertad hacia la derecha e izquierda para explorar todos los cuartos.
          </p>

          {hasMore && !searchQuery.trim() && (
            <div className="flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-white border border-guindo/15 text-guindo text-xs font-black px-5 py-2.5 rounded-xl hover:border-guindo transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loadingMore ? "Cargando..." : "Cargar más habitaciones"}
              </button>
            </div>
          )}
        </motion.section>

        <motion.section
          className="grid lg:grid-cols-12 gap-8 pt-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
        >
          <div className="lg:col-span-12 bg-white p-6 rounded-3xl border border-guindo/10 shadow-[0_4px_18px_-6px_rgba(88,18,18,0.12)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Map className="h-5 w-5 text-guindo" />
                  <span>Geolocalización de Alojamientos</span>
                </h3>
                <p className="text-slate-400 text-[11px]">Encuentra los cuartos en el mapa de Ayacucho con relación a la UNSCH</p>
              </div>
              <span className="bg-guindo/10 text-guindo text-[10px] font-black px-2.5 py-1 rounded-lg">Ayacucho</span>
            </div>

            <Suspense
              fallback={
                <div className="rounded-2xl border border-slate-200 h-96 bg-[#FDFBF7] animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">
                  Cargando mapa...
                </div>
              }
            >
              <ListingsMap
                listings={visibleListings}
                onSelectListing={handleOpenListing}
                selectedListingId={selectedListing?.id}
              />
            </Suspense>
          </div>
        </motion.section>

        <section className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-black tracking-widest text-guindo uppercase block">TESTIMONIOS ESTUDIANTILES</span>
            <h3 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight">¿Qué opinan otros estudiantes de la UNSCH?</h3>
          </div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerParent}
          >
            {STUDENT_TESTIMONIALS.map((t) => (
              <motion.div
                key={t.id}
                variants={fadeUp}
                className="bg-white p-5 rounded-2xl border border-guindo/10 shadow-[0_4px_18px_-6px_rgba(88,18,18,0.1)] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex gap-0.5">
                    {[...Array(t.rating)].map((_, i) => (
                      <span key={i} className="text-dorado-dark text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed italic">"{t.content}"</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <div className="bg-guindo/10 h-8 w-8 rounded-full flex items-center justify-center font-bold text-guindo text-xs shrink-0 font-mono">
                    {t.studentName.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">{t.studentName}</h5>
                    <span className="text-[10px] text-slate-400 font-medium block">Facultad de {t.faculty}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <footer
        className="relative text-white py-12 px-4 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #a62639 0%, #6e1626 60%, #3d0d14 100%)",
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(245,185,41,.11) 0 2px, transparent 2px 14px), repeating-linear-gradient(-45deg, rgba(245,185,41,.11) 0 2px, transparent 2px 14px), linear-gradient(135deg, #a62639 0%, #6e1626 60%, #3d0d14 100%)"
        }}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-dorado" />
        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 border border-dorado/25 rounded-2xl px-6 py-5">
            <div className="text-center sm:text-left">
              <p className="font-display text-base font-black text-white">¿Tienes un cuarto o departamento para alquilar?</p>
              <p className="text-xs text-slate-300 mt-0.5">Publícalo gratis y llega a cientos de estudiantes de la UNSCH.</p>
            </div>
            <button
              onClick={handlePublishCta}
              className="btn-shine shrink-0 flex items-center gap-2 text-guindo-dark bg-dorado hover:brightness-105 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all active:scale-[0.98] cursor-pointer shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Publicar Gratis</span>
            </button>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-center pb-8 border-b border-white/10">
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-white/10 p-0.5 shadow-sm border border-white/10 flex items-center justify-center shrink-0">
                  <img src={unschLogoIcon} alt="UNSCH Logo Footer" className="w-full h-full object-cover rounded-lg" />
                </div>
                <h4 className="font-display text-lg font-black tracking-tight text-white">YachakuqWasi (La Casa del Estudiante)</h4>
              </div>
              <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
                Portal universitario independiente diseñado exclusivamente para conectar a los estudiantes de la UNSCH con los mejores propietarios de habitaciones y minidepartamentos de Ayacucho.
              </p>
            </div>
            <div className="md:col-span-5 md:text-right space-y-2">
              <span className="text-[9px] font-mono bg-white/10 text-dorado px-3 py-1.5 rounded-lg inline-block uppercase font-black tracking-widest">
                Sumaq Yachay • Ayacucho, Perú
              </span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 font-medium">
            <p>© 2026 YachakuqWasi. Proyecto de apoyo al estudiante de la UNSCH. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <span>Mascota Oficial: Maki</span>
              <span>•</span>
              <span>Colores Guindo y Plomo</span>
            </div>
          </div>
        </div>
      </footer>

    </>
  );
}
