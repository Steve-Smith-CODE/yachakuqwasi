import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mail, Lock, User, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError } from "../api/client.js";
import makiMascot from "../assets/images/maki_hawk_guindo_plomo_1782934231251.jpg";

const UNSCH_ACADEMIC_MAP = {
  "Facultad de Ingeniería de Minas, Geología y Metalurgia": [
    "Ingeniería de Sistemas",
    "Ingeniería de Minas",
    "Ingeniería Civil"
  ],
  "Facultad de Ingeniería Química y Metalurgia": [
    "Ingeniería Química",
    "Ingeniería en Industrias Alimentarias",
    "Ingeniería Agroindustrial"
  ],
  "Facultad de Ciencias de la Salud": ["Medicina Humana", "Enfermería", "Obstetricia"],
  "Facultad de Ciencias Biológicas": ["Biología", "Farmacia y Bioquímica"],
  "Facultad de Ciencias Agrarias": ["Agronomía", "Ingeniería Agrícola", "Medicina Veterinaria"],
  "Facultad de Ciencias Sociales": [
    "Arqueología e Historia",
    "Trabajo Social",
    "Antropología Social",
    "Ciencias de la Comunicación"
  ],
  "Facultad de Ciencias de la Educación": [
    "Educación Inicial",
    "Educación Primaria",
    "Educación Secundaria",
    "Educación Física"
  ],
  "Facultad de Derecho y Ciencias Políticas": ["Derecho"],
  "Facultad de Ciencias Económicas, Administrativas y Contables": [
    "Administración de Empresas",
    "Contabilidad",
    "Economía"
  ]
};

const FACULTIES = Object.keys(UNSCH_ACADEMIC_MAP);

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
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative z-10 border border-slate-100 overflow-y-auto max-h-[92vh]"
          >
            <div className="text-center space-y-3 mb-6">
              <div className="relative h-16 w-16 mx-auto">
                <div className="h-16 w-16 rounded-full border-2 border-guindo/20 bg-[#FDFBF7] shadow-md overflow-hidden flex items-center justify-center p-0.5">
                  <img src={makiMascot} alt="Maki la mascota" className="w-full h-full object-cover rounded-full" />
                </div>
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
              </div>
              <h3 className="text-xl font-extrabold text-[#3b0d0d] tracking-tight">
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
                  <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez Quispe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="email"
                    placeholder="ejemplo@unsch.edu.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
                    required
                  />
                </div>
              </div>

              {localMode === "signup" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Tipo de Usuario</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="student">Estudiante</option>
                        <option value="landlord">Arrendador</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Teléfono Móvil</label>
                      <input
                        type="tel"
                        placeholder="Ej. 966123456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
                      />
                    </div>
                  </div>

                  {role === "student" && (
                    <div className="space-y-3">
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Facultad Académica (UNSCH)</label>
                        <select
                          value={faculty}
                          onChange={(e) => {
                            const selectedFac = e.target.value;
                            setFaculty(selectedFac);
                            const relatedCareers = UNSCH_ACADEMIC_MAP[selectedFac] || [];
                            if (relatedCareers.length > 0) setCareer(relatedCareers[0]);
                          }}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                        >
                          {FACULTIES.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Carrera Profesional</label>
                        <select
                          value={career}
                          onChange={(e) => setCareer(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-guindo text-white py-3 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer mt-2 disabled:opacity-50"
              >
                <span>{loading ? "Procesando..." : localMode === "login" ? "Ingresar" : "Registrar Datos"}</span>
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 mt-6">
              <span>{localMode === "login" ? "¿No tienes una cuenta aún?" : "¿Ya estás registrado en YachakuqWasi?"}</span>{" "}
              <button
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setLocalMode(localMode === "login" ? "signup" : "login");
                }}
                className="text-guindo font-black underline hover:text-guindo-dark cursor-pointer ml-1"
              >
                {localMode === "login" ? "Crear cuenta ahora" : "Inicia sesión aquí"}
              </button>
            </div>

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
