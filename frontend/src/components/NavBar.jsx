import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { LogOut, MessageCircle, Plus, Search, Award, Clock, Volume2, VolumeX, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import makiMascot from "../assets/images/maki-mascota.webp";
import unschLogoIcon from "../assets/images/maqueta-unsch.webp";

const ROLE_LABEL = { student: "Estudiante", landlord: "Arrendador", admin: "Administrador" };

export default function NavBar({ onOpenMaki, soundOn, onToggleSound }) {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  function handleLogout() {
    logout();
    navigate("/explorar");
  }

  const dashboardPath = user?.role === "admin" ? "/admin" : "/portal";
  const onDashboard = location.pathname === "/portal" || location.pathname === "/admin";

  return (
    <>
      <header className="border-b border-plomo-light bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/explorar" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl overflow-hidden border border-guindo/20 bg-white shadow-md flex items-center justify-center shrink-0">
              <img src={unschLogoIcon} alt="UNSCH Campus Icon" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black tracking-widest text-guindo uppercase">UNSCH Portal</span>
                <span className="bg-plomo-light text-plomo-dark text-[9px] px-2 py-0.5 rounded-full font-bold">1677</span>
              </div>
              <h1 className="font-display text-xl md:text-2xl font-black text-guindo tracking-tight flex items-center gap-1">
                Yachakuq<span className="text-plomo-dark font-extrabold">Wasi</span>
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <NotificationBell />
                <Link to="/cuenta" className="flex items-center gap-2.5 group" title="Configurar cuenta">
                  <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-guindo/30 bg-slate-50 shrink-0 shadow-sm group-hover:border-guindo transition-colors">
                    <img src={user.avatar_url || makiMascot} alt="Usuario" className="w-full h-full object-cover" />
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-guindo transition-colors">{user.name}</span>
                    <span className="text-[9px] text-slate-400 capitalize font-mono leading-tight">
                      {ROLE_LABEL[user.role] || user.role}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4 text-guindo" />
                  <span className="hidden md:inline">Salir</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal("login")}
                className="btn-shine flex items-center gap-2 text-white px-4 py-2 rounded-xl text-xs font-black tracking-wide hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_6px_16px_-4px_rgba(166,38,57,0.5)]"
                style={{ background: "linear-gradient(135deg, #c23652 0%, #a62639 55%, #6e1626 100%)" }}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10 pointer-events-none" />
                <LogIn className="h-3.5 w-3.5 text-dorado" />
                <span>Ingresar / Registrarse</span>
              </button>
            )}

            <button
              onClick={onOpenMaki}
              className="flex items-center gap-2 bg-guindo text-white px-4 py-2 rounded-xl font-bold hover:bg-guindo-dark transition-all shadow-md cursor-pointer text-xs sm:text-sm"
            >
              <MessageCircle className="h-4 w-4 text-dorado" />
              <span className="hidden sm:inline">Mascota IA: Maki</span>
              <span className="inline sm:hidden">Maki</span>
            </button>

            {isAuthenticated && (user.role === "landlord" || user.role === "admin") && (
              <Link
                to="/publicar"
                className="btn-shine hidden sm:flex items-center gap-1.5 text-white px-3.5 py-2 rounded-xl font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_6px_16px_-4px_rgba(166,38,57,0.5)]"
                style={{ background: "linear-gradient(135deg, #c23652 0%, #a62639 55%, #6e1626 100%)" }}
              >
                <Plus className="h-4 w-4 text-dorado" />
                <span>Publicar Habitación</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 sticky top-[68px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-12">
          <div className="flex gap-1">
            <Link
              to="/explorar"
              className={`relative px-4 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                location.pathname === "/explorar" ? "text-guindo" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Explorar Habitaciones</span>
              {location.pathname === "/explorar" && (
                <motion.span
                  layoutId={reduceMotion ? undefined : "navTabIndicator"}
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-guindo"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
            </Link>
            {isAuthenticated && (
              <Link
                to={dashboardPath}
                className={`relative px-4 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                  onDashboard ? "text-guindo" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Mi Portal UNSCH</span>
                {onDashboard && (
                  <motion.span
                    layoutId={reduceMotion ? undefined : "navTabIndicator"}
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-guindo"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSound}
              title={soundOn ? "Silenciar música" : "Activar música"}
              className={`flex items-center gap-1.5 border text-[11px] font-black uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                soundOn
                  ? "bg-dorado/15 border-dorado/40 text-guindo-dark"
                  : "bg-guindo/5 hover:bg-guindo/10 border-guindo/20 text-guindo"
              }`}
            >
              {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{soundOn ? "Música activada" : "Activar música"}</span>
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Ayacucho, Perú • Portal Universitario</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
