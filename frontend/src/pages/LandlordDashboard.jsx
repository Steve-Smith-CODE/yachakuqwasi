import { useEffect, useState } from "react";
import { Home, ShieldCheck, MessageCircle, Send, Plus, Clock, Layers, Heart, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { listMyHousingsRequest } from "../api/housings.js";
import { listChatsRequest, getMessagesRequest, sendMessageRequest } from "../api/chat.js";
import { submitVerificationRequest } from "../api/verification.js";
import { getLandlordStatsRequest } from "../api/stats.js";
import { getPlaceholderImage } from "../constants/placeholderImages.js";
import { fileToDataUrl } from "../utils/files.js";
import StatCard from "../components/StatCard.jsx";

const STATUS_LABEL = {
  approved: { label: "Activo", className: "bg-emerald-100 text-emerald-800" },
  pending: { label: "En revisión", className: "bg-amber-100 text-amber-800" },
  suspended: { label: "Suspendido", className: "bg-red-100 text-red-800" },
  flagged: { label: "Observado", className: "bg-red-100 text-red-800" }
};

export default function LandlordDashboard() {
  const { token, user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  const [verificationStatus, setVerificationStatus] = useState(user?.verification_status || "none");
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState(null);

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

  async function handleUploadDoc(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      await submitVerificationRequest(token, dataUrl);
      setVerificationStatus("pending");
    } catch {
      // no-op
    } finally {
      setUploading(false);
    }
  }

  const approvedListings = listings.filter((l) => l.status === "approved");
  const totalEarnings = approvedListings.reduce((sum, item) => sum + Number(item.price_pen || 0), 0);
  const isApproved = user?.is_verified || verificationStatus === "approved";
  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Home}
          label="Mis Anuncios Activos"
          value={stats ? stats.listingsByStatus.approved || 0 : approvedListings.length}
          hint={`${stats ? stats.listingsByStatus.pending || 0 : listings.filter((l) => l.status === "pending").length} en cola de aprobación`}
        />
        <StatCard icon={Layers} label="Total de Anuncios" value={stats ? stats.totalListings : listings.length} />
        <StatCard
          label="Recaudación Estimada"
          value={`S/. ${totalEarnings}`}
          hint="Suma mensual de anuncios activos"
          tone="guindo"
        />
        <StatCard icon={Heart} label="Favoritos Recibidos" value={stats?.favoritesReceived ?? "—"} tone="guindo" />
        <StatCard icon={Users} label="Contactos Recibidos" value={stats?.contactsReceived ?? "—"} tone="guindo" />

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
            <label className="mt-1 flex items-center gap-1.5 text-[10px] font-black text-guindo cursor-pointer underline">
              <span>{uploading ? "Subiendo..." : "Subir DNI/Título"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadDoc} disabled={uploading} />
            </label>
          )}
        </StatCard>
      </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((room) => {
                const status = STATUS_LABEL[room.status] || STATUS_LABEL.pending;
                return (
                  <div key={room.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 text-left bg-slate-50/20">
                    <div className="h-28 rounded-xl overflow-hidden bg-slate-100 relative">
                      <img
                        src={room.images?.[0] || getPlaceholderImage(room.type, room.id)}
                        alt={room.title}
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute top-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <h5 className="text-xs font-extrabold text-slate-800 truncate">{room.title}</h5>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">{room.neighborhood}</span>
                      <span className="font-black text-guindo font-mono">S/. {room.price_pen}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          {activeChat ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col h-[420px] overflow-hidden">
              <div className="bg-slate-900 text-white p-3.5 shrink-0 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <h5 className="text-[11px] font-black truncate">{activeChat.housing_listings?.title || "Chat"}</h5>
              </div>
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
                      {c.housing_listings?.title?.slice(0, 18) || "Chat"}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#FAF9F5]">
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
    </div>
  );
}
