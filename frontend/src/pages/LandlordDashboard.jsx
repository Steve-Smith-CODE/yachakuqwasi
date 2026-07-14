import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Home, ShieldCheck, Send, Plus, Clock, Layers, Heart, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  listMyHousingsRequest,
  setHousingVisibilityRequest,
  deleteHousingRequest,
  restoreHousingRequest
} from "../api/housings.js";
import { listChatsRequest, getMessagesRequest, sendMessageRequest } from "../api/chat.js";
import { submitVerificationRequest } from "../api/verification.js";
import { getLandlordStatsRequest } from "../api/stats.js";
import { getPlaceholderImage } from "../constants/placeholderImages.js";
import { fileToDataUrl } from "../utils/files.js";
import StatCard from "../components/StatCard.jsx";
import ListingActionsMenu from "../components/ListingActionsMenu.jsx";
import EditListingModal from "../components/EditListingModal.jsx";
import ListingHistoryPanel from "../components/ListingHistoryPanel.jsx";
import UserProfileModal from "../components/UserProfileModal.jsx";
import makiMascot from "../assets/images/maki-mascota.webp";

const STATUS_LABEL = {
  approved: { label: "Activo", className: "bg-emerald-100 text-emerald-800" },
  pending: { label: "En revisión", className: "bg-amber-100 text-amber-800" },
  suspended: { label: "Suspendido", className: "bg-red-100 text-red-800" },
  flagged: { label: "Observado", className: "bg-red-100 text-red-800" }
};

const DELETE_REASON_LABEL = {
  rented: "Ya alquilé",
  data_changed: "Cambié mis datos",
  other: "Otro motivo"
};

const staggerParent = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } };

export default function LandlordDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingStudentId, setViewingStudentId] = useState(null);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  const [verificationStatus, setVerificationStatus] = useState(user?.verification_status || "none");
  const [uploading, setUploading] = useState(false);
  const [dniFile, setDniFile] = useState(null);
  const [carnetFile, setCarnetFile] = useState(null);
  const [stats, setStats] = useState(null);

  const [editingListing, setEditingListing] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    listMyHousingsRequest(token)
      .then(setListings)
      .catch(() => {})
      .finally(() => setLoading(false));

    listChatsRequest(token)
      .then((data) => {
        setChats(data);
        if (data.length > 0) setActiveChatId(data[0].id);
      })
      .catch(() => {});

    getLandlordStatsRequest(token).then(setStats).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!activeChatId) return;
    getMessagesRequest(token, activeChatId).then(setMessages).catch(() => setMessages([]));
  }, [activeChatId, token]);

  async function handleSendChatMessage() {
    if (!messageInput.trim() || !activeChatId) return;
    try {
      const msg = await sendMessageRequest(token, activeChatId, messageInput.trim());
      setMessages((prev) => [...prev, msg]);
      setMessageInput("");
    } catch {
      // no-op
    }
  }

  async function handleSubmitVerification() {
    if (!dniFile || !carnetFile) return;
    setUploading(true);
    try {
      const [dniUrl, carnetUrl] = await Promise.all([fileToDataUrl(dniFile), fileToDataUrl(carnetFile)]);
      await submitVerificationRequest(token, dniUrl, carnetUrl);
      setVerificationStatus("pending");
      setDniFile(null);
      setCarnetFile(null);
    } catch {
      // no-op
    } finally {
      setUploading(false);
    }
  }

  function showToast(message, onUndo) {
    clearTimeout(toastTimerRef.current);
    setToast({ message, onUndo });
    toastTimerRef.current = setTimeout(() => setToast(null), 6000);
  }

  async function handleTogglePause(room, paused) {
    const snapshot = listings;
    setListings((prev) =>
      prev.map((l) => (l.id === room.id ? { ...l, paused_at: paused ? new Date().toISOString() : null } : l))
    );
    try {
      const updated = await setHousingVisibilityRequest(token, room.id, paused);
      setListings((prev) => prev.map((l) => (l.id === room.id ? updated : l)));
      showToast(paused ? "Anuncio pausado" : "Anuncio publicado de nuevo", async () => {
        try {
          const reverted = await setHousingVisibilityRequest(token, room.id, !paused);
          setListings((prev) => prev.map((l) => (l.id === room.id ? reverted : l)));
        } catch {
          // no-op
        }
      });
    } catch {
      setListings(snapshot);
    }
  }

  async function handleDeleteListing(room, reason) {
    setListings((prev) => prev.filter((l) => l.id !== room.id));
    try {
      await deleteHousingRequest(token, room.id, reason);
      const reasonLabel = DELETE_REASON_LABEL[reason];
      showToast(`Anuncio eliminado${reasonLabel ? ` · ${reasonLabel}` : ""}`, async () => {
        try {
          await restoreHousingRequest(token, room.id);
          const refreshed = await listMyHousingsRequest(token);
          setListings(refreshed);
        } catch {
          // no-op
        }
      });
    } catch {
      listMyHousingsRequest(token).then(setListings).catch(() => {});
    }
  }

  const approvedListings = listings.filter((l) => l.status === "approved");
  const totalEarnings = approvedListings.reduce((sum, item) => sum + Number(item.price_pen || 0), 0);
  const isApproved = user?.is_verified || verificationStatus === "approved";
  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="space-y-6">
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        initial={reduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={staggerParent}
      >
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Home}
            label="Mis Anuncios Activos"
            value={stats ? stats.listingsByStatus.approved || 0 : approvedListings.length}
            hint={`${stats ? stats.listingsByStatus.pending || 0 : listings.filter((l) => l.status === "pending").length} en cola de aprobación`}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard icon={Layers} label="Total de Anuncios" value={stats ? stats.totalListings : listings.length} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Recaudación Estimada"
            value={`S/. ${totalEarnings}`}
            hint="Suma mensual de anuncios activos"
            tone="guindo"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard icon={Heart} label="Favoritos Recibidos" value={stats?.favoritesReceived ?? "—"} tone="guindo" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard icon={Users} label="Contactos Recibidos" value={stats?.contactsReceived ?? "—"} tone="guindo" />
        </motion.div>

        <motion.div variants={fadeUp}>
          <StatCard label="Verificación">
            {isApproved ? (
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" /> <span>Verificado</span>
              </span>
            ) : verificationStatus === "pending" ? (
              <span className="text-xs font-black text-sky-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                <Clock className="h-4 w-4 animate-spin" /> <span>En revisión</span>
              </span>
            ) : (
              <div className="mt-1 space-y-1">
                <div className="flex gap-1">
                  <label
                    className={`flex-1 text-center text-[9px] font-black px-1.5 py-1 rounded-lg cursor-pointer border transition-colors ${
                      dniFile ? "border-emerald-400 text-emerald-600 bg-emerald-50" : "border-guindo/30 text-guindo hover:bg-guindo/5"
                    }`}
                  >
                    {dniFile ? "DNI ✓" : "DNI"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setDniFile(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                  </label>
                  <label
                    className={`flex-1 text-center text-[9px] font-black px-1.5 py-1 rounded-lg cursor-pointer border transition-colors ${
                      carnetFile ? "border-emerald-400 text-emerald-600 bg-emerald-50" : "border-guindo/30 text-guindo hover:bg-guindo/5"
                    }`}
                  >
                    {carnetFile ? "Título ✓" : "Título"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setCarnetFile(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleSubmitVerification}
                  disabled={!dniFile || !carnetFile || uploading}
                  className="w-full text-[9px] font-black text-white bg-guindo py-1 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-guindo-dark transition-all"
                >
                  {uploading ? "Enviando..." : "Enviar"}
                </button>
              </div>
            )}
          </StatCard>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Home className="h-4.5 w-4.5 text-guindo" />
              <span>Mis Habitaciones y Departamentos</span>
            </h4>
            <Link
              to="/publicar"
              className="bg-guindo text-white text-[11px] font-black px-4 py-2 rounded-xl hover:bg-guindo-dark transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Publicar Nueva</span>
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-8 text-center">Cargando tus publicaciones...</p>
          ) : listings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-3">
              <p>Aún no tienes habitaciones publicadas.</p>
              <Link to="/publicar" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-bold inline-block cursor-pointer">
                Publicar mi primera habitación
              </Link>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial={reduceMotion ? undefined : "hidden"}
              animate="visible"
              variants={staggerParent}
            >
              <AnimatePresence>
              {listings.map((room) => {
                const status = STATUS_LABEL[room.status] || STATUS_LABEL.pending;
                const isPaused = Boolean(room.paused_at);
                return (
                  <motion.div
                    key={room.id}
                    layout={!reduceMotion}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
                    className="border border-slate-200 rounded-2xl p-4 space-y-3 text-left bg-slate-50/20"
                  >
                    <div className="h-28 rounded-xl overflow-hidden bg-slate-100 relative">
                      <img
                        src={room.images?.[0] || getPlaceholderImage(room.type, room.id)}
                        alt={room.title}
                        className={`w-full h-full object-cover ${isPaused ? "grayscale opacity-60" : ""}`}
                      />
                      <span className={`absolute top-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow ${status.className}`}>
                        {status.label}
                      </span>
                      {isPaused && (
                        <span className="absolute top-2.5 right-2.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow bg-slate-900/80 text-white">
                          Pausado
                        </span>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-extrabold text-slate-800 truncate">{room.title}</h5>
                      <ListingActionsMenu
                        listing={room}
                        onEdit={() => setEditingListing(room)}
                        onTogglePause={(paused) => handleTogglePause(room, paused)}
                        onDelete={(reason) => handleDeleteListing(room, reason)}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">{room.neighborhood}</span>
                      <span className="font-black text-guindo font-mono">S/. {room.price_pen}</span>
                    </div>
                    <ListingHistoryPanel listingId={room.id} token={token} />
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-4">
          {activeChat ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col h-[420px] overflow-hidden">
              <button
                onClick={() => activeChat.student?.id && setViewingStudentId(activeChat.student.id)}
                className="bg-slate-900 text-white p-3.5 shrink-0 flex items-center gap-2 text-left cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <img
                  src={activeChat.student?.avatar_url || makiMascot}
                  alt={activeChat.student?.name || "Estudiante"}
                  className="h-6 w-6 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-300 font-bold block truncate">{activeChat.student?.name || "Estudiante"}</span>
                  <h5 className="text-[11px] font-black truncate">{activeChat.housing_listings?.title || "Chat"}</h5>
                </div>
              </button>
              {chats.length > 1 && (
                <div className="flex gap-1 p-2 border-b border-slate-100 overflow-x-auto shrink-0">
                  {chats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChatId(c.id)}
                      className={`text-[9px] font-bold px-2 py-1 rounded-lg shrink-0 cursor-pointer ${
                        c.id === activeChatId ? "bg-guindo text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.student?.name?.split(" ")[0] || "Estudiante"}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2.5 bg-[#FAF9F5]">
                {messages.map((m) => (
                  <div key={m.id} className={`max-w-[85%] space-y-0.5 ${m.sender === "landlord" ? "ml-auto" : "mr-auto"}`}>
                    <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed ${
                      m.sender === "landlord" ? "bg-guindo text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                className="p-2 border-t border-slate-200 bg-white flex gap-1.5 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Responde al estudiante..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-guindo font-medium"
                />
                <button type="submit" className="bg-guindo text-white p-2 rounded-lg cursor-pointer">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs h-[420px] flex items-center justify-center">
              Aún no tienes conversaciones con estudiantes interesados.
            </div>
          )}
        </div>
      </div>

      {editingListing && (
        <EditListingModal
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onUpdated={(updated) => setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-[11px] font-bold pl-4 pr-2 py-2.5 rounded-xl shadow-2xl flex items-center gap-3">
          <span>{toast.message}</span>
          <button
            onClick={() => {
              toast.onUndo?.();
              setToast(null);
            }}
            className="text-dorado font-black uppercase tracking-wide text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            Deshacer
          </button>
        </div>
      )}

      {viewingStudentId && (
        <UserProfileModal
          userId={viewingStudentId}
          onClose={() => setViewingStudentId(null)}
          onOpenListing={(l) => {
            setViewingStudentId(null);
            navigate(`/habitacion/${l.id}`);
          }}
        />
      )}
    </div>
  );
}
