import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext.jsx";

// Sin mocks: pega por HTTP real al backend real levantado por
// `npm run local:test:frontend-real` (ver scripts/serve-test.js), que a su
// vez habla con el proyecto Supabase de prueba real. Requiere ese comando
// (no `vitest run` suelto) porque necesita el backend real escuchando.
const STORAGE_KEY = "yachakuqwasi_auth";
const API_URL = import.meta.env.VITE_API_URL;

function uniqueEmail() {
  return `frontend-realtest.${Date.now()}.${Math.floor(Math.random() * 1e6)}@test.yachakuqwasi.local`;
}

async function registerAndLoginRealUser() {
  const email = uniqueEmail();
  const password = "TestPass123!";

  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name: "Usuario Real de Test", role: "student" })
  });
  if (!registerRes.ok) {
    throw new Error(`No se pudo registrar el usuario real de prueba (status ${registerRes.status}). ¿Esta corriendo el backend real de test?`);
  }

  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!loginRes.ok) {
    throw new Error(`No se pudo iniciar sesion con el usuario real de prueba (status ${loginRes.status}).`);
  }

  return loginRes.json();
}

beforeEach(() => {
  localStorage.clear();
});

describe("AuthContext - refresco automatico de sesion (backend + Supabase de test reales, sin mocks)", () => {
  it("cuando el access token esta por expirar, lo refresca solo llamando de verdad a /api/auth/refresh", async () => {
    const session = await registerAndLoginRealUser();

    // expiresAt manipulado para que el efecto dispare el refresh casi de
    // inmediato en vez de esperar la hora real que dura un access token de
    // Supabase; el refreshToken usado para canjearlo es el real de login.
    const seeded = {
      token: session.token,
      refreshToken: session.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + 1,
      user: session.user
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.token).toBe(seeded.token);

    await waitFor(
      () => {
        expect(result.current.token).not.toBe(seeded.token);
      },
      { timeout: 10000 }
    );

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toEqual(expect.any(String));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.token).toBe(result.current.token);
    expect(stored.refreshToken).not.toBe(seeded.refreshToken);
  });

  it("si el refresh token real ya no es valido, cierra la sesion (logout) en vez de quedarse con un token vencido", async () => {
    const seeded = {
      token: "token-viejo-a-punto-de-expirar",
      refreshToken: "token-basura-invalido",
      expiresAt: Math.floor(Date.now() / 1000) + 1,
      user: { id: "id-de-prueba", email: "no-importa@test.yachakuqwasi.local" }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(
      () => {
        expect(result.current.isAuthenticated).toBe(false);
      },
      { timeout: 10000 }
    );

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
