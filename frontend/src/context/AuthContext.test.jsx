import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import { loginRequest, registerRequest, refreshRequest } from "../api/auth.js";

// Complementa AuthContext.real.test.jsx (E2E, backend+Supabase reales): aca
// se mockea la capa api/auth.js para probar rapido la logica de estado del
// contexto (login, logout, updateUser, persistencia) sin red.
vi.mock("../api/auth.js", () => ({
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
  refreshRequest: vi.fn()
}));

const STORAGE_KEY = "yachakuqwasi_auth";
const FAR_FUTURE_EXPIRY = Math.floor(Date.now() / 1000) + 3600;

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

beforeEach(() => {
  localStorage.clear();
  loginRequest.mockReset();
  registerRequest.mockReset();
  refreshRequest.mockReset();
});

describe("useAuth", () => {
  it("lanza un error si se usa fuera de AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });
});

describe("AuthContext", () => {
  it("arranca sin sesion cuando no hay nada guardado", () => {
    const { result } = renderAuth();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it("recupera la sesion guardada en localStorage al montar", () => {
    const stored = { token: "t1", refreshToken: "r1", expiresAt: FAR_FUTURE_EXPIRY, user: { id: "u1", name: "Ana" } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderAuth();

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: "u1", name: "Ana" });
    expect(result.current.token).toBe("t1");
  });

  it("ignora un localStorage corrupto en vez de romper", () => {
    localStorage.setItem(STORAGE_KEY, "{esto no es json");

    const { result } = renderAuth();

    expect(result.current.isAuthenticated).toBe(false);
  });

  it("login() guarda la sesion en estado y localStorage", async () => {
    loginRequest.mockResolvedValueOnce({
      token: "tok",
      refreshToken: "ref",
      expiresAt: FAR_FUTURE_EXPIRY,
      user: { id: "u1", name: "Ana", role: "student" }
    });
    const { result } = renderAuth();

    await act(async () => {
      await result.current.login("ana@test.com", "secreta");
    });

    expect(loginRequest).toHaveBeenCalledWith({ email: "ana@test.com", password: "secreta" });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.name).toBe("Ana");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).token).toBe("tok");
  });

  it("login() propaga el error y no deja al usuario autenticado", async () => {
    loginRequest.mockRejectedValueOnce(new Error("Credenciales invalidas"));
    const { result } = renderAuth();

    await expect(
      act(async () => {
        await result.current.login("ana@test.com", "mala");
      })
    ).rejects.toThrow("Credenciales invalidas");

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("register() delega en registerRequest sin tocar la sesion actual", async () => {
    registerRequest.mockResolvedValueOnce({ id: "nuevo" });
    const { result } = renderAuth();

    let response;
    await act(async () => {
      response = await result.current.register({ email: "nuevo@test.com", password: "x" });
    });

    expect(registerRequest).toHaveBeenCalledWith({ email: "nuevo@test.com", password: "x" });
    expect(response).toEqual({ id: "nuevo" });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("logout() limpia el estado y localStorage", async () => {
    loginRequest.mockResolvedValueOnce({
      token: "tok",
      refreshToken: "ref",
      expiresAt: FAR_FUTURE_EXPIRY,
      user: { id: "u1", name: "Ana" }
    });
    const { result } = renderAuth();
    await act(async () => {
      await result.current.login("ana@test.com", "secreta");
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("updateUser() mezcla el patch con el usuario actual y persiste", async () => {
    loginRequest.mockResolvedValueOnce({
      token: "tok",
      refreshToken: "ref",
      expiresAt: FAR_FUTURE_EXPIRY,
      user: { id: "u1", name: "Ana", career: "Sistemas" }
    });
    const { result } = renderAuth();
    await act(async () => {
      await result.current.login("ana@test.com", "secreta");
    });

    act(() => {
      result.current.updateUser({ career: "Ingenieria de Sistemas" });
    });

    expect(result.current.user).toEqual({ id: "u1", name: "Ana", career: "Ingenieria de Sistemas" });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).user.career).toBe("Ingenieria de Sistemas");
  });

  it("updateUser() no hace nada si no hay sesion activa", () => {
    const { result } = renderAuth();

    act(() => {
      result.current.updateUser({ career: "Lo que sea" });
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("openAuthModal/closeAuthModal controlan el estado del modal", () => {
    const { result } = renderAuth();

    expect(result.current.authModal).toEqual({ open: false, mode: "login" });

    act(() => {
      result.current.openAuthModal("register");
    });
    expect(result.current.authModal).toEqual({ open: true, mode: "register" });

    act(() => {
      result.current.closeAuthModal();
    });
    expect(result.current.authModal).toEqual({ open: false, mode: "register" });
  });
});
