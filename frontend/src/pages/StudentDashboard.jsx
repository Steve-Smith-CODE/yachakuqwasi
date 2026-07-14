import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { MessageCircle, ShieldCheck, Clock, Lock, Heart, Calculator, Plus, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { listChatsRequest, getMessagesRequest, sendMessageRequest } from "../api/chat.js";
import { listFavoritesRequest } from "../api/favorites.js";
import { submitVerificationRequest } from "../api/verification.js";
import { getStudentStatsRequest } from "../api/stats.js";
import { getPlaceholderImage } from "../constants/placeholderImages.js";
import { fileToDataUrl } from "../utils/files.js";
import StatCard from "../components/StatCard.jsx";
import UserProfileModal from "../components/UserProfileModal.jsx";
import unschLogoIcon from "../assets/images/maqueta-unsch.webp";
import makiMascot from "../assets/images/maki-mascota.webp";

const staggerParent = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } };

export default function StudentDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [viewingLandlordId, setViewingLandlordId] = useState(null);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [chatsLoading, setChatsLoading] = useState(true);

  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState(null);

  const [verificationStatus, setVerificationStatus] = useState(user?.verification_status || "none");
  const [uploading, setUploading] = useState(false);
  const [dniFile, setDniFile] = useState(null);
  const [carnetFile, setCarnetFile] = useState(null);

  const [rentCost, setRentCost] = useState(250);
  const [foodCost, setFoodCost] = useState(180);
  const [transportCost, setTransportCost] = useState(30);
  const [studyCost, setStudyCost] = useState(40);
  const totalBudget = rentCost + foodCost + transportCost + studyCost;
  const percentageUsed = Math.min(100, Math.round((totalBudget / 600) * 100));
  const circumference = 2 * Math.PI * 30;
  const strokeDashoffset = circumference - (percentageUsed / 100) * circumference;

  useEffect(() => {
    listChatsRequest(token)
      .then((data) => {
        setChats(data);
        if (data.length > 0) setActiveChatId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setChatsLoading(false));

    listFavoritesRequest(token)
      .then(setFavorites)
      .catch(() => {});

    getStudentStatsRequest(token).then(setStats).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!activeChatId) return;
    getMessagesRequest(token, activeChatId)
      .then(setMessages)
      .catch(() => setMessages([]));
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

  const activeChat = chats.find((c) => c.id === activeChatId);
  const isApproved = user?.is_verified || verificationStatus === "approved";

  return (
    <div className="space-y-6">
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={reduceMotion ? undefined : "hidden"}
        animate="visible"
        variants={staggerParent}
      >
        <motion.div variants={fadeUp}>
          <StatCard icon={Heart} label="Favoritos Guardados" value={stats?.savedFavorites ?? favorites.length} tone="guindo" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard icon={MessageCircle} label="Chats Activos" value={stats?.activeChats ?? chats.length} tone="guindo" />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-gradient-to-br from-guindo via-guindo-dark to-[#300a0a] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border-2 border-amber-500/20">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black tracking-widest text-dorado-dark uppercase block font-mono">CREDENCIAL UNIVERSITARIA</span>
              <span className="text-[10px] text-slate-300 font-bold block mt-0.5">UNSCH • Ayacucho</span>
            </div>
            <div className="h-9 w-9 rounded-lg overflow-hidden bg-white/10 p-0.5 border border-white/10">
              <img src={unschLogoIcon} alt="UNSCH Logo" className="w-full h-full object-cover rounded-md" />
            </div>
          </div>

          <div className="flex gap-4 items-center mt-6 relative z-10">
            <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-dorado-dark bg-slate-50 shrink-0 shadow">
              <img src={makiMascot} alt="Estudiante UNSCH" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1 overflow-hidden">
              <h4 className="text-sm font-black tracking-tight truncate">{user?.name}</h4>
              <p className="text-[10px] text-slate-300 font-bold truncate capitalize">{user?.career || "Estudiante UNSCH"}</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs relative z-10">
            <div>
              <span className="text-[9px] text-slate-400 block font-bold font-mono">ESTADO DE IDENTIDAD</span>
              {isApproved ? (
                <span className="text-dorado-dark font-black text-[11px] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-4 w-4 text-dorado" /> <span>Estudiante Verificado</span>
                </span>
              ) : verificationStatus === "pending" ? (
                <span className="text-sky-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <Clock className="h-3.5 w-3.5 animate-spin text-sky-400" /> <span>Revisión en cola</span>
                </span>
              ) : (
                <span className="text-slate-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400" /> <span>Sin Verificar</span>
                </span>
              )}
            </div>
          </div>

          {!isApproved && verificationStatus !== "pending" && (
            <div className="mt-4 relative z-10 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-xl py-2.5 text-[9px] font-black cursor-pointer transition-all ${
                    dniFile ? "border-emerald-400 text-emerald-300" : "border-white/30 text-white/90 hover:bg-white/5"
                  }`}
                >
                  <Plus className="h-3 w-3" />
                  <span>{dniFile ? "DNI listo ✓" : "Foto de DNI"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setDniFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                </label>
                <label
                  className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-xl py-2.5 text-[9px] font-black cursor-pointer transition-all ${
                    carnetFile ? "border-emerald-400 text-emerald-300" : "border-white/30 text-white/90 hover:bg-white/5"
                  }`}
                >
                  <Plus className="h-3 w-3" />
                  <span>{carnetFile ? "Carnet listo ✓" : "Carnet / Constancia"}</span>
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
                className="w-full bg-dorado text-slate-900 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-dorado-dark transition-all"
              >
                {uploading ? "Enviando..." : "Enviar para revisión"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[340px]">
          <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4 text-guindo" />
              <span>Mensajes con Arrendadores</span>
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-slate-100">
            {chatsLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Cargando chats...</div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aún no tienes chats activos. Escríbele a un arrendador desde una publicación en Explorar.
              </div>
            ) : (
              <motion.div initial={reduceMotion ? undefined : "hidden"} animate="visible" variants={staggerParent}>
              {chats.map((chat) => (
                <motion.div
                  key={chat.id}
                  variants={fadeUp}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left p-3.5 flex gap-2.5 items-start transition-colors cursor-pointer ${
                    activeChatId === chat.id ? "bg-guindo/5 border-l-4 border-guindo" : "hover:bg-slate-50"
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (chat.landlord?.id) setViewingLandlordId(chat.landlord.id);
                    }}
                    className="shrink-0 cursor-pointer"
                  >
                    <img
                      src={chat.landlord?.avatar_url || makiMascot}
                      alt={chat.landlord?.name || "Arrendador"}
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-100"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-600 truncate block">{chat.landlord?.name || "Arrendador"}</span>
                    <h5 className="text-xs font-extrabold text-slate-800 truncate">{chat.housing_listings?.title || "Alojamiento"}</h5>
                    <p className="text-[10px] text-slate-500 truncate italic">"{chat.last_message || "Sin mensajes aún"}"</p>
                  </div>
                </motion.div>
              ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-md font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Calculator className="h-5 w-5 text-guindo" />
            <span>Calculadora de Presupuesto Mensual</span>
          </h3>

          <div className="flex flex-col sm:flex-row gap-5 items-center bg-[#FDFBF7] p-4 rounded-2xl border border-[#F0ECE3]">
            <div className="relative h-20 w-20 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="30" className="stroke-slate-100 fill-none" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="30"
                  className="stroke-guindo fill-none transition-all duration-300"
                  strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[15px] font-black text-slate-800 leading-none">{percentageUsed}%</span>
                <span className="text-[7px] text-slate-400 font-bold block uppercase mt-0.5">Utilizado</span>
              </div>
            </div>
            <div className="space-y-1 flex-1 text-center sm:text-left">
              <span className="text-[10px] text-slate-400 font-bold block">TOTAL MENSUAL ESTIMADO</span>
              <p className="text-xl font-black text-slate-900 font-mono">
                S/. {totalBudget} <span className="text-xs font-bold text-slate-500">/ S/. 600 máx</span>
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: "Alquiler de Cuarto", value: rentCost, set: setRentCost, min: 100, max: 500 },
              { label: "Alimentación", value: foodCost, set: setFoodCost, min: 100, max: 350 },
              { label: "Transporte", value: transportCost, set: setTransportCost, min: 10, max: 100 },
              { label: "Material de Estudio", value: studyCost, set: setStudyCost, min: 10, max: 100 }
            ].map((f) => (
              <div key={f.label} className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-600">{f.label}:</span>
                  <span className="font-black text-slate-800 font-mono">S/. {f.value} PEN</span>
                </div>
                <input
                  type="range" min={f.min} max={f.max} step="10"
                  value={f.value}
                  onChange={(e) => f.set(Number(e.target.value))}
                  className="w-full accent-guindo cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="h-4.5 w-4.5 text-rose-500 fill-rose-500" />
            <span>Mis Alojamientos Favoritos ({favorites.length})</span>
          </h4>

          {favorites.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
              Aún no has guardado ninguna habitación. Marca con ❤️ tus opciones preferidas en Explorar.
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-3.5"
              initial={reduceMotion ? undefined : "hidden"}
              animate="visible"
              variants={staggerParent}
            >
              {favorites.map((room) => (
                <motion.div key={room.id} variants={fadeUp} className="border border-slate-100 rounded-2xl p-3 flex gap-3 items-center bg-slate-50/50">
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={room.images?.[0] || getPlaceholderImage(room.type, room.id)}
                      alt={room.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden text-left space-y-0.5">
                    <h5 className="text-xs font-extrabold text-slate-800 truncate">{room.title}</h5>
                    <span className="text-[11px] font-black text-guindo font-mono">S/. {room.price_pen} PEN / mes</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="lg:col-span-3 space-y-6">
        {activeChat && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col h-[340px] overflow-hidden">
            <button
              onClick={() => activeChat.landlord?.id && setViewingLandlordId(activeChat.landlord.id)}
              className="bg-slate-900 text-white p-3.5 shrink-0 flex items-center gap-2 text-left cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <img
                src={activeChat.landlord?.avatar_url || makiMascot}
                alt={activeChat.landlord?.name || "Arrendador"}
                className="h-6 w-6 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-300 font-bold block truncate">{activeChat.landlord?.name || "Arrendador"}</span>
                <h5 className="text-[11px] font-black truncate">{activeChat.housing_listings?.title || "Chat"}</h5>
              </div>
            </button>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2.5 bg-[#FAF9F5]">
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[85%] space-y-0.5 ${m.sender === "student" ? "ml-auto" : "mr-auto"}`}>
                  <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed ${
                    m.sender === "student" ? "bg-guindo text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
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
                placeholder="Escribe tu respuesta..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-guindo font-medium"
              />
              <button type="submit" className="bg-guindo text-white p-2 rounded-lg cursor-pointer">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
      </div>
      {viewingLandlordId && (
        <UserProfileModal
          userId={viewingLandlordId}
          onClose={() => setViewingLandlordId(null)}
          onOpenListing={(l) => {
            setViewingLandlordId(null);
            navigate(`/habitacion/${l.id}`);
          }}
        />
      )}
    </div>
  );
}
