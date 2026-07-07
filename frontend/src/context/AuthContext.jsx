import { createContext, useContext, useState } from "react";
import { loginRequest, registerRequest } from "../api/auth.js";

const STORAGE_KEY = "yachakuqwasi_auth";
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
    const nextAuth = { token: result.token, user: result.user };
    setAuth(nextAuth);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
    return nextAuth;
  }

  async function register(data) {
    return registerRequest(data);
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value = {
    user: auth?.user ?? null,
    token: auth?.token ?? null,
    isAuthenticated: Boolean(auth?.token),
    login,
    register,
    logout,
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
