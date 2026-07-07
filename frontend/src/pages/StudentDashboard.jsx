import { useEffect, useState } from "react";
import { MessageCircle, ShieldCheck, Clock, Lock, Heart, Calculator, Users, Plus, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { listChatsRequest, getMessagesRequest, sendMessageRequest } from "../api/chat.js";
import { listFavoritesRequest } from "../api/favorites.js";
import { submitVerificationRequest } from "../api/verification.js";
import { getCompatibilityRequest } from "../api/roommates.js";
import { ApiError } from "../api/client.js";
import unschLogoIcon from "../assets/images/unsch_logo_icon_new_1782937711905.jpg";
import makiMascot from "../assets/images/maki_hawk_guindo_plomo_1782934231251.jpg";

const initialLifestyle = { fumador: false, mascotas: false, horario: "diurno", presupuestoMax: 300 };

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StudentDashboard() {
  const { token, user } = useAuth();

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [chatsLoading, setChatsLoading] = useState(true);

  const [favorites, setFavorites] = useState([]);

  const [verificationStatus, setVerificationStatus] = useState(user?.verification_status || "none");
  const [uploading, setUploading] = useState(false);

  const [rentCost, setRentCost] = useState(250);
  const [foodCost, setFoodCost] = useState(180);
  const [transportCost, setTransportCost] = useState(30);
  const [studyCost, setStudyCost] = useState(40);
  const totalBudget = rentCost + foodCost + transportCost + studyCost;
  const percentageUsed = Math.min(100, Math.round((totalBudget / 600) * 100));
  const circumference = 2 * Math.PI * 30;
  const strokeDashoffset = circumference - (percentageUsed / 100) * circumference;

  const [myProfile, setMyProfile] = useState(initialLifestyle);
  const [candidateProfile, setCandidateProfile] = useState(initialLifestyle);
  const [compatResult, setCompatResult] = useState(null);
  const [compatLoading, setCompatLoading] = useState(false);

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

  async function handleCompatibility(e) {
    e.preventDefault();
    setCompatLoading(true);
    setCompatResult(null);
    try {
      const res = await getCompatibilityRequest(token, myProfile, candidateProfile);
      setCompatResult(res.score);
    } catch (err) {
      setCompatResult(err instanceof ApiError ? { error: err.message } : { error: "No se pudo calcular." });
    } finally {
      setCompatLoading(false);
    }
  }

  const activeChat = chats.find((c) => c.id === activeChatId);
  const isApproved = user?.is_verified || verificationStatus === "approved";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-gradient-to-br from-guindo via-guindo-dark to-[#300a0a] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border-2 border-amber-500/20">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black tracking-widest text-[#FFC000] uppercase block font-mono">CREDENCIAL UNIVERSITARIA</span>
              <span className="text-[10px] text-slate-300 font-bold block mt-0.5">UNSCH • Ayacucho</span>
            </div>
            <div className="h-9 w-9 rounded-lg overflow-hidden bg-white/10 p-0.5 border border-white/10">
              <img src={unschLogoIcon} alt="UNSCH Logo" className="w-full h-full object-cover rounded-md" />
            </div>
          </div>

          <div className="flex gap-4 items-center mt-6 relative z-10">
            <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-[#FFC000] bg-slate-50 shrink-0 shadow">
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
                <span className="text-[#FFC000] font-black text-[11px] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-4 w-4 text-[#FFD700]" /> <span>Estudiante Verificado</span>
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
            <label className="mt-4 relative z-10 flex items-center justify-center gap-1.5 border-2 border-dashed border-white/30 text-white/90 py-2.5 rounded-xl text-[10px] font-black cursor-pointer hover:bg-white/5 transition-all">
              <Plus className="h-3.5 w-3.5" />
              <span>{uploading ? "Subiendo..." : "Subir Carnet / DNI"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadDoc} disabled={uploading} />
            </label>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[340px]">
          <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4 text-guindo" />
              <span>Mensajes con Arrendadores</span>
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {chatsLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Cargando chats...</div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aún no tienes chats activos. Escríbele a un arrendador desde una publicación en Explorar.
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left p-3.5 transition-colors cursor-pointer ${
                    activeChatId === chat.id ? "bg-guindo/5 border-l-4 border-guindo" : "hover:bg-slate-50"
                  }`}
                >
                  <h5 className="text-xs font-extrabold text-slate-800 truncate">{chat.housing_listings?.title || "Alojamiento"}</h5>
                  <p className="text-[10px] text-slate-500 truncate italic">"{chat.last_message || "Sin mensajes aún"}"</p>
                </button>
              ))
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
            <div className="grid grid-cols-1 gap-3.5">
              {favorites.map((room) => (
                <div key={room.id} className="border border-slate-100 rounded-2xl p-3 flex gap-3 items-center bg-slate-50/50">
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    {room.images?.[0] && <img src={room.images[0]} alt={room.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 overflow-hidden text-left space-y-0.5">
                    <h5 className="text-xs font-extrabold text-slate-800 truncate">{room.title}</h5>
                    <span className="text-[11px] font-black text-guindo font-mono">S/. {room.price_pen} PEN / mes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-3 space-y-6">
        {activeChat && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col h-[340px] overflow-hidden">
            <div className="bg-slate-900 text-white p-3.5 shrink-0">
              <h5 className="text-[11px] font-black truncate">{activeChat.housing_listings?.title || "Chat"}</h5>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#FAF9F5]">
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

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3.5">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-4.5 w-4.5 text-guindo" />
            <span>Compatibilidad de Roommate</span>
          </h4>

          <form onSubmit={handleCompatibility} className="space-y-3 text-left bg-amber-50/20 border border-amber-200/50 p-3.5 rounded-2xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Tu perfil</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <label className="flex items-center gap-1.5 font-semibold text-slate-600">
                <input type="checkbox" checked={myProfile.fumador} onChange={(e) => setMyProfile((p) => ({ ...p, fumador: e.target.checked }))} />
                Fumador
              </label>
              <label className="flex items-center gap-1.5 font-semibold text-slate-600">
                <input type="checkbox" checked={myProfile.mascotas} onChange={(e) => setMyProfile((p) => ({ ...p, mascotas: e.target.checked }))} />
                Mascotas
              </label>
            </div>
            <select
              value={myProfile.horario}
              onChange={(e) => setMyProfile((p) => ({ ...p, horario: e.target.value }))}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold bg-white"
            >
              <option value="diurno">Horario diurno</option>
              <option value="nocturno">Horario nocturno</option>
            </select>
            <input
              type="number"
              value={myProfile.presupuestoMax}
              onChange={(e) => setMyProfile((p) => ({ ...p, presupuestoMax: Number(e.target.value) }))}
              placeholder="Presupuesto máximo"
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px]"
            />

            <p className="text-[10px] text-slate-500 font-bold uppercase pt-1">Perfil candidato</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <label className="flex items-center gap-1.5 font-semibold text-slate-600">
                <input type="checkbox" checked={candidateProfile.fumador} onChange={(e) => setCandidateProfile((p) => ({ ...p, fumador: e.target.checked }))} />
                Fumador
              </label>
              <label className="flex items-center gap-1.5 font-semibold text-slate-600">
                <input type="checkbox" checked={candidateProfile.mascotas} onChange={(e) => setCandidateProfile((p) => ({ ...p, mascotas: e.target.checked }))} />
                Mascotas
              </label>
            </div>
            <select
              value={candidateProfile.horario}
              onChange={(e) => setCandidateProfile((p) => ({ ...p, horario: e.target.value }))}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold bg-white"
            >
              <option value="diurno">Horario diurno</option>
              <option value="nocturno">Horario nocturno</option>
            </select>
            <input
              type="number"
              value={candidateProfile.presupuestoMax}
              onChange={(e) => setCandidateProfile((p) => ({ ...p, presupuestoMax: Number(e.target.value) }))}
              placeholder="Presupuesto máximo"
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px]"
            />

            <button type="submit" disabled={compatLoading} className="w-full bg-guindo text-white text-[10px] font-black py-2 rounded-xl cursor-pointer disabled:opacity-50">
              {compatLoading ? "Calculando..." : "Calcular Compatibilidad"}
            </button>

            {compatResult != null && (
              <div className="bg-white p-2.5 rounded-xl text-center border border-slate-100">
                {typeof compatResult === "object" ? (
                  <span className="text-red-500 text-[10px] font-bold">{compatResult.error}</span>
                ) : (
                  <span className="text-guindo font-black text-lg font-mono">{Math.round(compatResult * 100)}% compatible</span>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
