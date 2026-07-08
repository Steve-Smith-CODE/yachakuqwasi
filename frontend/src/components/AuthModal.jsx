import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mail, Lock, User, X, LogIn, UserPlus, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError } from "../api/client.js";
import { UNSCH_ACADEMIC_MAP, FACULTIES } from "../constants/content.js";
import makiMascot from "../assets/images/maki_hawk_guindo_plomo_1782934231251.jpg";

export default function AuthModal() {
  const { authModal, closeAuthModal, login, register } = useAuth();
  const { open, mode } = authModal;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [faculty, setFaculty] = useState(FACULTIES[0]);
  const [career, setCareer] = useState(UNSCH_ACADEMIC_MAP[FACULTIES[0]][0]);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [localMode, setLocalMode] = useState(mode);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) setLocalMode(mode);
    wasOpen.current = open;
  }, [open, mode]);

  function resetForm() {
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setError("");
    setSuccess("");
  }

  function handleClose() {
    resetForm();
    closeAuthModal();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (localMode === "login") {
        await login(email, password);
        handleClose();
      } else {
        await register({
          email,
          password,
          name,
          role,
          faculty: role === "student" ? faculty : undefined,
          career: role === "student" ? career : undefined,
          phone
        });
        setSuccess("¡Cuenta creada! Ahora inicia sesión con tu email y contraseña.");
        setLocalMode("login");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative z-10 border border-guindo/10 overflow-y-auto max-h-[92vh]"
          >
            <div
              className="relative h-24 rounded-t-3xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #7a1c1c 0%, #581212 60%, #2a0808 100%)",
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,215,0,.09) 0 2px, transparent 2px 14px), repeating-linear-gradient(-45deg, rgba(255,215,0,.09) 0 2px, transparent 2px 14px), linear-gradient(135deg, #7a1c1c 0%, #581212 60%, #2a0808 100%)"
              }}
            >
              <div className="absolute inset-x-0 bottom-0 h-1 bg-dorado" />
            </div>

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="px-6 sm:px-8 pb-6 sm:pb-8">
              <div className="text-center space-y-3 mb-6">
                <div className="relative h-20 w-20 mx-auto -mt-10">
                  <div className="h-20 w-20 rounded-full border-4 border-white bg-[#FDFBF7] shadow-xl overflow-hidden flex items-center justify-center">
                    <img src={makiMascot} alt="Maki la mascota" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                </div>
                <h3 className="font-display text-xl font-extrabold text-[#3b0d0d] tracking-tight">
                  {localMode === "login" ? "Iniciar Sesión con Maki" : "Crear Cuenta con Maki"}
                </h3>
                <p className="text-slate-400 text-xs">
                  {localMode === "login"
                    ? "Ingresa para gestionar tus favoritos y hablar con Maki"
                    : "Regístrate en YachakuqWasi de forma totalmente gratuita"}
                </p>
              </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs font-semibold rounded-r">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-700 text-xs font-semibold rounded-r">
                  ✓ {success}
                </div>
              )}

              {localMode === "signup" && (
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black tracking-widest text-plomo-dark/80 uppercase block mb-1">Nombre Completo</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-guindo transition-colors" />
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez Quispe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo/25 focus:border-guindo text-xs bg-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] font-medium transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black tracking-widest text-plomo-dark/80 uppercase block mb-1">Correo Electrónico</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-guindo transition-colors" />
                  <input
                    type="email"
                    placeholder="ejemplo@unsch.edu.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo/25 focus:border-guindo text-xs bg-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] font-medium transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black tracking-widest text-plomo-dark/80 uppercase block mb-1">Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-guindo transition-colors" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo/25 focus:border-guindo text-xs bg-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] font-medium transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              {localMode === "signup" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black tracking-widest text-plomo-dark/80 uppercase block mb-1">Tipo de Usuario</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo/25 focus:border-guindo text-xs bg-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] font-bold text-slate-700 cursor-pointer transition-all"
                      >
                        <option value="student">Estudiante</option>
                        <option value="landlord">Arrendador</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black tracking-widest text-plomo-dark/80 uppercase block mb-1">Teléfono Móvil</label>
                      <input
                        type="tel"
                        placeholder="Ej. 966123456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo/25 focus:border-guindo text-xs bg-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] font-medium transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {role === "student" && (
                    <div className="space-y-3">
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black tracking-widest text-plomo-dark/80 uppercase block mb-1">Facultad Académica (UNSCH)</label>
                        <select
                          value={faculty}
                          onChange={(e) => {
                            const selectedFac = e.target.value;
                            setFaculty(selectedFac);
                            const relatedCareers = UNSCH_ACADEMIC_MAP[selectedFac] || [];
                            if (relatedCareers.length > 0) setCareer(relatedCareers[0]);
                          }}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo/25 focus:border-guindo text-xs bg-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] font-bold text-slate-700 cursor-pointer transition-all"
                        >
                          {FACULTIES.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black tracking-widest text-plomo-dark/80 uppercase block mb-1">Carrera Profesional</label>
                        <select
                          value={career}
                          onChange={(e) => setCareer(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo/25 focus:border-guindo text-xs bg-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] font-bold text-slate-700 cursor-pointer transition-all"
                        >
                          {(UNSCH_ACADEMIC_MAP[faculty] || []).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.015 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-shine relative w-full text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_8px_20px_-6px_rgba(122,28,28,0.55)]"
                style={{ background: "linear-gradient(135deg, #9b2d2d 0%, #7a1c1c 55%, #4a0e0e 100%)" }}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10 pointer-events-none" />
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : localMode === "login" ? (
                  <LogIn className="h-4 w-4 text-dorado" />
                ) : (
                  <UserPlus className="h-4 w-4 text-dorado" />
                )}
                <span>{loading ? "Procesando..." : localMode === "login" ? "Ingresar" : "Registrar Datos"}</span>
              </motion.button>
            </form>

            <div className="pt-5 border-t border-slate-100 text-center mt-6 space-y-2.5">
              <p className="text-xs text-slate-500">
                {localMode === "login" ? "¿No tienes una cuenta aún?" : "¿Ya estás registrado en YachakuqWasi?"}
              </p>
              <button
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setLocalMode(localMode === "login" ? "signup" : "login");
                }}
                className="w-full flex items-center justify-center gap-1.5 border-2 border-guindo/25 text-guindo text-xs font-black py-2.5 rounded-xl hover:bg-guindo/5 hover:border-guindo/40 transition-all cursor-pointer group"
              >
                <span>{localMode === "login" ? "Crear cuenta ahora" : "Inicia sesión aquí"}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
