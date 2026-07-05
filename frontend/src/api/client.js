const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch(path, { method = "GET", body, token, params } = {}) {
  const url = new URL(API_URL + path);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } catch (err) {
    throw new ApiError("No se pudo conectar con el servidor. ¿Está corriendo el backend?", 0);
  } finally {
    clearTimeout(timeoutId);
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(payload?.error || `Error ${res.status}`, res.status, payload?.details);
  }

  return payload;
}
