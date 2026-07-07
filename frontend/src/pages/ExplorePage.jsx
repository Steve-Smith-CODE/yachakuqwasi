import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Home, MessageCircle, Check, ChevronLeft, ChevronRight, Compass, Map, MapPin, Sparkles } from "lucide-react";
import { listHousingsRequest } from "../api/housings.js";
import { listFavoritesRequest, addFavoriteRequest, removeFavoriteRequest } from "../api/favorites.js";
import { ApiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import HousingCard from "../components/HousingCard.jsx";
import ListingDetailModal from "../components/ListingDetailModal.jsx";
import { MACOT_TIPS, TIP_CATEGORY_LABEL, STUDENT_TESTIMONIALS, NEIGHBORHOODS, TYPE_OPTIONS } from "../constants/content.js";
import unschEntranceImg from "../assets/images/unsch_entrance_1782935837751.webp";
import unschLogoIcon from "../assets/images/unsch_logo_icon_new_1782937711905.jpg";
import makiMascot from "../assets/images/maki_hawk_guindo_plomo_1782934231251.jpg";

// Distribuye los pines del mapa evitando solapamientos, usando una posicion
// relativa aleatoria (pero estable por listing.id) cuando no hay coordenadas.
function useDeoverlappedPins(listings) {
  return useMemo(() => {
    const unschX = 50;
    const unschY = 33.33;
    const minDistance = 7.5;

    const seeded = (id, salt) => {
      let hash = 0;
      const str = id + salt;
      for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
      return (hash % 1000) / 1000;
    };

    const adjusted = listings.map((item) => {
      const hasCoords = item.coordinate_x != null && item.coordinate_y != null;
      const x = hasCoords ? item.coordinate_x : 25 + seeded(item.id, "x") * 50;
      const y = hasCoords ? item.coordinate_y : 20 + seeded(item.id, "y") * 60;
      return { ...item, adjX: x, adjY: y };
    });

    for (let iter = 0; iter < 10; iter++) {
      let changed = false;
      for (let i = 0; i < adjusted.length; i++) {
        const itemA = adjusted[i];
        const dxU = itemA.adjX - unschX;
        const dyU = itemA.adjY - unschY;
        const distU = Math.sqrt(dxU * dxU + dyU * dyU);
        if (distU < minDistance + 4) {
          const angle = distU > 0 ? Math.atan2(dyU, dxU) : i * 1.2;
          itemA.adjX = unschX + Math.cos(angle) * (minDistance + 5);
          itemA.adjY = unschY + Math.sin(angle) * (minDistance + 5);
          changed = true;
        }

        for (let j = 0; j < adjusted.length; j++) {
          if (i === j) continue;
          const itemB = adjusted[j];
          const dx = itemA.adjX - itemB.adjX;
          const dy = itemA.adjY - itemB.adjY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            const angle = dist > 0 ? Math.atan2(dy, dx) : (i - j) * 0.5;
            const push = (minDistance - dist) / 2;
            itemA.adjX += Math.cos(angle) * push;
            itemA.adjY += Math.sin(angle) * push;
            itemB.adjX -= Math.cos(angle) * push;
            itemB.adjY -= Math.sin(angle) * push;
            changed = true;
          }
        }

        itemA.adjX = Math.max(8, Math.min(92, itemA.adjX));
        itemA.adjY = Math.max(8, Math.min(92, itemA.adjY));
      }
      if (!changed) break;
    }

    return adjusted;
  }, [listings]);
}

const PAGE_SIZE = 24;

export default function ExplorePage() {
  const { isAuthenticated, token, openAuthModal } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [barrio, setBarrio] = useState("");
  const [tipo, setTipo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [selectedListing, setSelectedListing] = useState(null);
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  const scrollContainerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listHousingsRequest({ barrio: barrio || undefined, tipo: tipo || undefined, page: 1, limit: PAGE_SIZE });
      setListings(data);
      setPage(1);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las habitaciones.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await listHousingsRequest({ barrio: barrio || undefined, tipo: tipo || undefined, page: nextPage, limit: PAGE_SIZE });
      setListings((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      // silencioso: el usuario puede volver a tocar "Cargar más"
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      return;
    }
    listFavoritesRequest(token)
      .then((data) => setFavoriteIds(new Set(data.map((l) => l.id))))
      .catch(() => {});
  }, [isAuthenticated, token]);

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase();
    return listings.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.neighborhood.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
    );
  }, [listings, searchQuery]);

  const deoverlappedListings = useDeoverlappedPins(filteredListings);

  function handleFilterSubmit(e) {
    e.preventDefault();
    load();
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

  async function handleToggleFavorite(listing) {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    const isFav = favoriteIds.has(listing.id);
    try {
      if (isFav) {
        await removeFavoriteRequest(token, listing.id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(listing.id);
          return next;
        });
      } else {
        await addFavoriteRequest(token, listing.id);
        setFavoriteIds((prev) => new Set(prev).add(listing.id));
      }
    } catch {
      // silencioso: el corazon simplemente no cambia si falla
    }
  }

  const selectedDeoverlapped = selectedListing
    ? deoverlappedListings.find((l) => l.id === selectedListing.id)
    : null;

  return (
    <>
      <section className="relative min-h-[420px] flex items-center justify-center py-12 px-4 bg-gradient-to-r from-guindo-dark to-[#300a0a] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={unschEntranceImg}
            alt="Pórtico de ingreso principal de la UNSCH"
            className="w-full h-full object-cover object-center opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#250808]/80 via-transparent to-[#100303]/90" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8 w-full">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight md:leading-none">
            Encuentra alojamiento para estudiantes en <span className="text-[#FFC000]">Ayacucho</span>
          </h2>

          <form
            onSubmit={handleFilterSubmit}
            className="bg-white text-slate-800 p-4 md:p-6 rounded-3xl shadow-2xl border border-slate-100 max-w-3xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4 text-left">
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

              <div className="md:col-span-3 text-left">
                <label className="text-[10px] font-black tracking-wider text-plomo uppercase block mb-1">Barrio (Ayacucho)</label>
                <select
                  value={barrio}
                  onChange={(e) => setBarrio(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  <option value="">Todos los barrios</option>
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 text-left">
                <label className="text-[10px] font-black tracking-wider text-plomo uppercase block mb-1">Tipo de Cuarto</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 pt-4 md:pt-0">
                <button
                  type="submit"
                  className="w-full bg-guindo text-white py-4 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  <span>Buscar</span>
                </button>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4 text-xs font-semibold text-slate-200">
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-[#FFD700]" /> <span>Cero comisiones ocultas</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-[#FFD700]" /> <span>Verificación con Maki IA</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-[#FFD700]" /> <span>Ahorra en mototaxis</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-[#FFD700]" /> <span>Trato directo con dueño</span>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        <section className="bg-white p-6 rounded-3xl border border-plomo-light shadow-sm grid md:grid-cols-12 gap-8 items-center">
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
              <Sparkles className="h-3.5 w-3.5 text-[#FFD700]" />
              <span>CONSEJOS DE CONVIVENCIA UNIVERSITARIA EN AYACUCHO</span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">¿Buscas cuarto por primera vez en Huamanga?</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {MACOT_TIPS.map((tip, idx) => (
                <button
                  key={tip.id}
                  onClick={() => setActiveTipIndex(idx)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer flex flex-col justify-between h-20 ${
                    activeTipIndex === idx ? "bg-guindo text-white border-guindo shadow-md" : "bg-[#F8F9FA] text-slate-600 border-slate-200 hover:bg-slate-100"
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
        </section>

        <section id="listings-section" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-guindo animate-pulse" />
                <span className="text-xs font-black tracking-widest text-guindo uppercase">ALQUILERES RECOMENDADOS</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
                <Home className="h-6 w-6 text-guindo" />
                <span>Habitaciones Disponibles</span>
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {error ? (
                  <span className="text-red-500">{error}</span>
                ) : loading ? (
                  "Cargando publicaciones reales..."
                ) : (
                  <>Mostrando <span className="font-bold text-guindo">{filteredListings.length} habitaciones</span> reales aprobadas.</>
                )}
              </p>
            </div>

            {filteredListings.length > 0 && (
              <div className="flex items-center gap-3 self-end md:self-center">
                <div className="hidden sm:flex items-center gap-2 mr-2">
                  <span className="text-[10px] font-mono text-slate-400">Progreso</span>
                  <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="bg-guindo h-full transition-all duration-150" style={{ width: `${Math.max(8, scrollProgress)}%` }} />
                  </div>
                </div>
                <button onClick={() => scrollSlider("left")} className="bg-white border border-slate-200 p-2.5 rounded-xl hover:border-guindo hover:text-guindo active:scale-95 transition-all shadow-sm cursor-pointer">
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <button onClick={() => scrollSlider("right")} className="bg-white border border-slate-200 p-2.5 rounded-xl hover:border-guindo hover:text-guindo active:scale-95 transition-all shadow-sm cursor-pointer">
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#F8F9FA] to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F8F9FA] to-transparent pointer-events-none z-10" />

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex gap-6 overflow-x-auto pb-6 pt-2 px-1 snap-x snap-mandatory scroll-smooth scrollbar-none"
            >
              {!loading && filteredListings.length === 0 ? (
                <div className="w-full bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-4">
                  <Compass className="h-12 w-12 text-slate-300 mx-auto stroke-1" />
                  <h4 className="font-extrabold text-slate-700">No encontramos habitaciones con esos filtros</h4>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setBarrio("");
                      setTipo("");
                      load();
                    }}
                    className="bg-guindo text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-guindo-dark transition-all cursor-pointer"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                filteredListings.map((room) => (
                  <HousingCard
                    key={room.id}
                    listing={room}
                    onOpen={setSelectedListing}
                    isFavorite={favoriteIds.has(room.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))
              )}
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 font-medium">
            💡 <span className="font-bold text-guindo">Tip:</span> Desliza con libertad hacia la derecha e izquierda para explorar todos los cuartos.
          </p>

          {hasMore && !searchQuery.trim() && (
            <div className="flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-white border border-slate-200 text-guindo text-xs font-black px-5 py-2.5 rounded-xl hover:border-guindo transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loadingMore ? "Cargando..." : "Cargar más habitaciones"}
              </button>
            </div>
          )}
        </section>

        <section className="grid lg:grid-cols-12 gap-8 pt-4">
          <div className="lg:col-span-12 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
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

            <div className="bg-[#EFECE5] rounded-2xl h-80 border border-slate-200 relative overflow-hidden">
              <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div className="absolute left-[20%] top-0 bottom-0 w-2 bg-slate-300" />
                <div className="absolute left-[50%] top-0 bottom-0 w-2 bg-slate-300" />
                <div className="absolute left-[80%] top-0 bottom-0 w-2 bg-slate-300" />
                <div className="absolute top-[35%] left-0 right-0 h-2 bg-slate-300" />
                <div className="absolute top-[70%] left-0 right-0 h-2 bg-slate-300" />
              </div>

              <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-center z-10">
                <div className="bg-guindo border-2 border-white text-white p-2 rounded-2xl shadow-xl flex flex-col items-center gap-1">
                  <div className="h-8 w-8 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                    <img src={unschLogoIcon} alt="UNSCH Logo Map" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <span className="text-[9px] font-black tracking-widest font-mono px-1 uppercase text-[#FFD700]">CAMPUS UNSCH</span>
                </div>
              </div>

              {selectedListing && selectedDeoverlapped && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <line
                    x1={`${selectedDeoverlapped.adjX}%`}
                    y1={`${selectedDeoverlapped.adjY}%`}
                    x2="50%"
                    y2="33.3%"
                    stroke="#800020"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                </svg>
              )}

              {deoverlappedListings.map((room) => {
                const isSelected = selectedListing?.id === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedListing(room)}
                    className={`absolute p-1 -translate-x-1/2 -translate-y-1/2 hover:z-20 transition-all cursor-pointer group ${isSelected ? "z-30" : ""}`}
                    style={{ left: `${room.adjX}%`, top: `${room.adjY}%` }}
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow border border-white transition-all scale-100 group-hover:scale-105 font-mono ${
                          isSelected ? "bg-[#FFC000] text-slate-900 border-[#FFD700]" : "bg-guindo text-white group-hover:bg-plomo-dark"
                        }`}
                      >
                        S/.{room.price_pen}
                      </span>
                      <MapPin
                        className={`h-4.5 w-4.5 transition-all scale-100 group-hover:scale-110 ${
                          isSelected ? "text-[#FFC000] drop-shadow-[0_0_8px_rgba(255,192,0,0.8)]" : "text-guindo group-hover:text-plomo-dark"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}

              <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm px-3.5 py-2 rounded-xl text-[10px] text-slate-500 font-bold border border-slate-100 flex items-center justify-between">
                <span>📍 Toca los pines para ver el cuarto en el mapa</span>
                <span className="text-guindo">YachakuqWasi</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-black tracking-widest text-guindo uppercase block">TESTIMONIOS ESTUDIANTILES</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">¿Qué opinan otros estudiantes de la UNSCH?</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STUDENT_TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-[#F8F9FA] p-5 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-0.5">
                    {[...Array(t.rating)].map((_, i) => (
                      <span key={i} className="text-[#FFC000] text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed italic">"{t.content}"</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <div className="bg-guindo/10 h-8 w-8 rounded-full flex items-center justify-center font-bold text-guindo text-xs shrink-0 font-mono">
                    {t.studentName.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">{t.studentName}</h5>
                    <span className="text-[10px] text-slate-400 font-medium block">Facultad de {t.faculty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-guindo text-white py-12 px-4 border-t-8 border-plomo">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid md:grid-cols-12 gap-8 items-center pb-8 border-b border-white/10">
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-white/10 p-0.5 shadow-sm border border-white/10 flex items-center justify-center shrink-0">
                  <img src={unschLogoIcon} alt="UNSCH Logo Footer" className="w-full h-full object-cover rounded-lg" />
                </div>
                <h4 className="text-lg font-black tracking-tight text-white">YachakuqWasi (La Casa del Estudiante)</h4>
              </div>
              <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
                Portal universitario independiente diseñado exclusivamente para conectar a los estudiantes de la UNSCH con los mejores propietarios de habitaciones y minidepartamentos de Ayacucho.
              </p>
            </div>
            <div className="md:col-span-5 md:text-right space-y-2">
              <span className="text-[9px] font-mono bg-white/10 text-[#FFD700] px-3 py-1.5 rounded-lg inline-block uppercase font-black tracking-widest">
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

      {selectedListing && <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} />}
    </>
  );
}
