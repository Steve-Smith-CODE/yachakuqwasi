import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError } from "../api/client.js";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        navigate("/explorar");
      } else {
        await register({ email, password, name, role });
        setSuccess("Cuenta creada. Ahora inicia sesión con tu email y contraseña.");
        setMode("login");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h1 className="text-lg font-black text-slate-900">
          {mode === "login" ? "Ingresar" : "Crear cuenta"}
        </h1>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Nombre completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">Email (UNSCH)</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-guindo"
            />
          </div>

          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Tipo de cuenta</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 font-semibold"
              >
                <option value="student">Estudiante</option>
                <option value="landlord">Arrendador</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-guindo text-white py-2.5 rounded-xl text-sm font-black hover:bg-guindo-dark disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Procesando..." : mode === "login" ? "Ingresar" : "Registrarme"}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
          className="text-xs text-guindo font-bold underline cursor-pointer"
        >
          {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Ingresa"}
        </button>
      </div>
    </div>
  );
}
