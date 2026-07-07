import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, MessageCircle, Plus, Search, Award, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import makiMascot from "../assets/images/maki_hawk_guindo_plomo_1782934231251.jpg";
import unschLogoIcon from "../assets/images/unsch_logo_icon_new_1782937711905.jpg";

const ROLE_LABEL = { student: "Estudiante", landlord: "Arrendador", admin: "Administrador" };

export default function NavBar({ onOpenMaki }) {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
              <h1 className="text-xl md:text-2xl font-black text-guindo tracking-tight flex items-center gap-1">
                Yachakuq<span className="text-plomo-dark font-extrabold">Wasi</span>
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-guindo/30 bg-slate-50 shrink-0 shadow-sm">
                  <img src={makiMascot} alt="Usuario" className="w-full h-full object-cover" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight">{user.name}</span>
                  <span className="text-[9px] text-slate-400 capitalize font-mono leading-tight">
                    {ROLE_LABEL[user.role] || user.role}
                  </span>
                </div>
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
                className="flex items-center gap-2 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-black hover:border-guindo hover:text-guindo transition-all cursor-pointer bg-white shadow-sm"
              >
                <div className="h-6 w-6 rounded-full overflow-hidden border border-guindo/20 bg-slate-50 shrink-0">
                  <img src={makiMascot} alt="Maki Login Icon" className="w-full h-full object-cover" />
                </div>
                <span>Ingresar / Registrarse</span>
              </button>
            )}

            <button
              onClick={onOpenMaki}
              className="flex items-center gap-2 bg-guindo text-white px-4 py-2 rounded-xl font-bold hover:bg-guindo-dark transition-all shadow-md cursor-pointer text-xs sm:text-sm"
            >
              <MessageCircle className="h-4 w-4 text-[#FFD700]" />
              <span className="hidden sm:inline">Mascota IA: Maki</span>
              <span className="inline sm:hidden">Maki</span>
            </button>

            {isAuthenticated && (user.role === "landlord" || user.role === "admin") && (
              <Link
                to="/publicar"
                className="hidden sm:flex items-center gap-1.5 border-2 border-dashed px-3.5 py-2 rounded-xl font-bold transition-all text-sm cursor-pointer border-guindo text-guindo hover:bg-guindo/5 bg-white shadow-sm"
              >
                <Plus className="h-4 w-4 text-guindo" />
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
              className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                location.pathname === "/explorar"
                  ? "border-guindo text-guindo"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Explorar Habitaciones</span>
            </Link>
            {isAuthenticated && (
              <Link
                to={dashboardPath}
                className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  onDashboard ? "border-guindo text-guindo" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Mi Portal UNSCH</span>
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Ayacucho, Perú • Portal Universitario</span>
          </div>
        </div>
      </div>
    </>
  );
}
