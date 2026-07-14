import { createContext, useContext, useState, useEffect } from "react";
import { loginRequest, registerRequest, refreshRequest } from "../api/auth.js";

const STORAGE_KEY = "yachakuqwasi_auth";
const REFRESH_MARGIN_MS = 60_000; // refrescar 1 min antes de que expire el access token
const AuthContext = createContext(null);

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStoredAuth);
  const [authModal, setAuthModal] = useState({ open: false, mode: "login" });

  function openAuthModal(mode = "login") {
    setAuthModal({ open: true, mode });
  }

  function closeAuthModal() {
    setAuthModal((prev) => ({ ...prev, open: false }));
  }

  async function login(email, password) {
    const result = await loginRequest({ email, password });
    const nextAuth = {
      token: result.token,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      user: result.user
    };
    setAuth(nextAuth);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
    return nextAuth;
  }

  // Los access tokens de Supabase expiran a la hora; sin este refresco
  // automático cualquier sesión abierta por más tiempo empieza a fallar
  // con 401 "Token invalido o expirado" en todas las peticiones.
  useEffect(() => {
    if (!auth?.expiresAt || !auth?.refreshToken) return undefined;

    const delay = Math.max(auth.expiresAt * 1000 - Date.now() - REFRESH_MARGIN_MS, 0);
    const timer = setTimeout(async () => {
      try {
        const result = await refreshRequest(auth.refreshToken);
        const nextAuth = {
          ...auth,
          token: result.token,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt
        };
        setAuth(nextAuth);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
      } catch {
        setAuth(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [auth]);

  async function register(data) {
    return registerRequest(data);
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  function updateUser(patch) {
    setAuth((prev) => {
      if (!prev) return prev;
      const next = { ...prev, user: { ...prev.user, ...patch } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const value = {
    user: auth?.user ?? null,
    token: auth?.token ?? null,
    isAuthenticated: Boolean(auth?.token),
    login,
    register,
    logout,
    updateUser,
    authModal,
    openAuthModal,
    closeAuthModal
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
