import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../api/supabaseClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import makiMascot from "../assets/images/maki-mascota.webp";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { openAuthModal } = useAuth();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // El enlace del correo trae una sesion de recuperacion que el cliente de
  // Supabase intercambia solo al cargar la pagina (detectSessionInUrl).
  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      await supabase.auth.signOut();
    } catch (err) {
      setError(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    navigate("/explorar", { replace: true });
    openAuthModal("login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-guindo/10">
        <div
          className="relative h-24 rounded-t-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #a62639 0%, #6e1626 60%, #3d0d14 100%)",
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(245,185,41,.11) 0 2px, transparent 2px 14px), repeating-linear-gradient(-45deg, rgba(245,185,41,.11) 0 2px, transparent 2px 14px), linear-gradient(135deg, #a62639 0%, #6e1626 60%, #3d0d14 100%)"
          }}
        >
          <div className="absolute inset-x-0 bottom-0 h-1 bg-dorado" />
        </div>

        <div className="px-6 sm:px-8 pb-8">
          <div className="text-center space-y-3 mb-6">
            <div className="relative h-20 w-20 mx-auto -mt-10">
              <div className="h-20 w-20 rounded-full border-4 border-white bg-[#FDFBF7] shadow-xl overflow-hidden flex items-center justify-center">
                <img src={makiMascot} alt="Maki la mascota" className="w-full h-full object-cover rounded-full" />
              </div>
            </div>
            <h1 className="font-display text-xl font-extrabold text-[#3d0d14] tracking-tight">
              Nueva Contraseña
            </h1>
          </div>

          {checking ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-guindo animate-spin" />
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <p className="text-sm text-slate-600">
                Tu contraseña se actualizó correctamente. Ya puedes ingresar con ella.
              </p>
              <button
                onClick={goToLogin}
                className="w-full text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                style={{ background: "linear-gradient(135deg, #c23652 0%, #a62639 55%, #6e1626 100%)" }}
              >
                Iniciar sesión
              </button>
            </div>
          ) : !ready ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-600">
                Este enlace ya no es válido o expiró. Pide uno nuevo desde "¿Olvidaste tu contraseña?" en el
                inicio de sesión.
              </p>
              <button
                onClick={() => navigate("/explorar", { replace: true })}
                className="w-full border-2 border-guindo/25 text-guindo text-xs font-black py-3 rounded-xl cursor-pointer"
              >
                Volver a YachakuqWasi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs font-semibold rounded-r">
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black tracking-widest text-plomo-dark/80 uppercase block mb-1">
                  Nueva contraseña
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-guindo transition-colors" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo/25 focus:border-guindo text-xs bg-white font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black tracking-widest text-plomo-dark/80 uppercase block mb-1">
                  Confirmar contraseña
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-guindo transition-colors" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo/25 focus:border-guindo text-xs bg-white font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #c23652 0%, #a62639 55%, #6e1626 100%)" }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4 text-dorado" />}
                <span>{loading ? "Guardando..." : "Guardar Contraseña"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
