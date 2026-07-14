import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, ApiError } from "./client.js";

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body)
  };
}

function emptyResponse({ ok = true, status = 204 } = {}) {
  return {
    ok,
    status,
    headers: { get: () => "text/plain" },
    json: () => Promise.reject(new Error("no body"))
  };
}

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hace GET por defecto y devuelve el payload JSON de la respuesta", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await apiFetch("/housings");

    expect(result).toEqual({ ok: true });
    const [, options] = fetch.mock.calls[0];
    expect(options.method).toBe("GET");
    expect(options.body).toBeUndefined();
  });

  it("agrega el path a la URL base configurada", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}));

    await apiFetch("/housings/123");

    const [url] = fetch.mock.calls[0];
    expect(url.pathname.endsWith("/housings/123")).toBe(true);
  });

  it("agrega los query params definidos y omite undefined, null y string vacio", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}));

    await apiFetch("/housings", { params: { ciudad: "Ayacucho", precio: undefined, tipo: null, q: "" } });

    const [url] = fetch.mock.calls[0];
    expect(url.searchParams.get("ciudad")).toBe("Ayacucho");
    expect(url.searchParams.has("precio")).toBe(false);
    expect(url.searchParams.has("tipo")).toBe(false);
    expect(url.searchParams.has("q")).toBe(false);
  });

  it("envia el body serializado como JSON cuando se provee", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ id: "1" }, { status: 201 }));

    await apiFetch("/housings", { method: "POST", body: { titulo: "Cuarto" } });

    const [, options] = fetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ titulo: "Cuarto" }));
  });

  it("agrega el header Authorization solo si se pasa token", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}));
    await apiFetch("/perfil", { token: "abc123" });
    let [, options] = fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer abc123");

    fetch.mockResolvedValueOnce(jsonResponse({}));
    await apiFetch("/perfil");
    [, options] = fetch.mock.calls[1];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("devuelve null cuando la respuesta no es JSON", async () => {
    fetch.mockResolvedValueOnce(emptyResponse());

    const result = await apiFetch("/algo");

    expect(result).toBeNull();
  });

  it("lanza ApiError con el mensaje del backend cuando la respuesta no es ok", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ error: "Credenciales invalidas", details: { campo: "email" } }, { ok: false, status: 401 }));

    const error = await apiFetch("/auth/login").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Credenciales invalidas");
    expect(error.status).toBe(401);
    expect(error.details).toEqual({ campo: "email" });
  });

  it("usa un mensaje generico si la respuesta de error no trae payload", async () => {
    fetch.mockResolvedValueOnce(emptyResponse({ ok: false, status: 500 }));

    const error = await apiFetch("/algo").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Error 500");
    expect(error.status).toBe(500);
  });

  it("envuelve un fallo de red en un ApiError con status 0", async () => {
    fetch.mockRejectedValueOnce(new TypeError("fetch failed"));

    const error = await apiFetch("/housings").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/no se pudo conectar/i);
  });
});
