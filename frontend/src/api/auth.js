import { apiFetch } from "./client.js";

export function registerRequest({ email, password, name, role, faculty, career, phone }) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: { email, password, name, role, faculty, career, phone }
  });
}

export function loginRequest({ email, password }) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: { email, password }
  });
}

export function refreshRequest(refreshToken) {
  return apiFetch("/auth/refresh", {
    method: "POST",
    body: { refreshToken }
  });
}

export function forgotPasswordRequest(email) {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: { email }
  });
}
