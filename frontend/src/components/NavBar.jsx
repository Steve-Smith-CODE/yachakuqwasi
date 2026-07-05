import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_LABEL = { student: "Estudiante", landlord: "Arrendador", admin: "Administrador" };

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/explorar");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/explorar" className="font-black text-guindo tracking-tight text-lg">
          YachakuqWasi
        </Link>

        <nav className="flex items-center gap-1 text-sm font-semibold">
          <Link to="/explorar" className="px-3 py-2 rounded-lg text-slate-600 hover:text-guindo hover:bg-slate-50">
            Explorar
          </Link>
          {isAuthenticated && (user.role === "landlord" || user.role === "admin") && (
            <Link to="/publicar" className="px-3 py-2 rounded-lg text-slate-600 hover:text-guindo hover:bg-slate-50">
              Publicar
            </Link>
          )}
          {isAuthenticated && user.role === "admin" && (
            <Link to="/admin" className="px-3 py-2 rounded-lg text-slate-600 hover:text-guindo hover:bg-slate-50">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-xs text-slate-500 hidden sm:block">
                {user.name} · <span className="text-guindo font-bold">{ROLE_LABEL[user.role] || user.role}</span>
              </span>
              <button
                onClick={handleLogout}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-guindo hover:text-guindo cursor-pointer"
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-guindo text-white hover:bg-guindo-dark cursor-pointer"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
