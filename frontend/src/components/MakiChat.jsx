import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Send, X } from "lucide-react";
import { sendMakiMessage } from "../api/maki.js";
import { ApiError } from "../api/client.js";
import makiMascot from "../assets/images/maki_hawk_guindo_plomo_1782934231251.jpg";

const WELCOME_MESSAGE = {
  sender: "maki",
  text: "¡Allillanchu, estimado estudiante! 🦅 Soy Maki, tu halcón consejero de YachakuqWasi. ¿En qué barrio de Ayacucho estás buscando alojamiento, o cuál es tu presupuesto ideal?",
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
};

export default function MakiChat({ open, onClose }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || typing) return;

    const history = messages;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { sender: "user", text, time }]);
    setInput("");
    setTyping(true);

    try {
      const res = await sendMakiMessage(text, history.slice(-6));
      setMessages((prev) => [
        ...prev,
        { sender: "maki", text: res.text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
      ]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No pude responder en este momento, intenta de nuevo.";
      setMessages((prev) => [
        ...prev,
        { sender: "maki", text: `⚠️ ${message}`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl flex flex-col justify-between border-l border-slate-200"
          >
            <div className="bg-guindo text-white px-5 py-4 flex items-center justify-between border-b-4 border-plomo shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-white border-2 border-slate-200 shrink-0">
                  <img src={makiMascot} alt="Maki IA Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                    <span>Maki, el Halcón Consejero</span>
                    <span className="bg-emerald-500 h-2 w-2 rounded-full inline-block animate-pulse" />
                  </h4>
                  <span className="text-[10px] text-slate-300 block font-mono">IA con Vibras de Huamanga</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2.5 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                  {msg.sender === "maki" && (
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-white border border-guindo shrink-0 flex items-center justify-center text-[10px] font-black text-guindo font-mono">
                      M
                    </div>
                  )}
                  <div className="space-y-1">
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-guindo text-white rounded-tr-none"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 block font-mono text-right px-1">{msg.time}</span>
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex gap-2.5 max-w-[85%] mr-auto">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-white border border-guindo shrink-0 flex items-center justify-center text-[10px] font-black text-guindo font-mono">
                    M
                  </div>
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none text-xs text-slate-500 shadow-sm flex items-center gap-1.5">
                    <span className="font-bold text-guindo">Maki está pensando</span>
                    <span className="flex gap-0.5">
                      <span className="h-1.5 w-1.5 bg-guindo rounded-full animate-bounce" />
                      <span className="h-1.5 w-1.5 bg-guindo rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 bg-guindo rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center shrink-0"
            >
              <input
                type="text"
                placeholder="Escribe tu pregunta sobre alquileres..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-guindo font-medium text-slate-700"
              />
              <button
                type="submit"
                disabled={typing || !input.trim()}
                className="bg-guindo text-white p-2.5 rounded-xl hover:bg-guindo-dark transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
