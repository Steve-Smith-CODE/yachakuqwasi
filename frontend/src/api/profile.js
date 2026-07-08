import { apiFetch } from "./client.js";

export function getMyProfileRequest(token) {
  return apiFetch("/perfil", { token });
}

export function updateProfileRequest(token, fields) {
  return apiFetch("/perfil", { method: "PATCH", token, body: fields });
}

export function updatePasswordRequest(token, password) {
  return apiFetch("/perfil/password", { method: "PATCH", token, body: { password } });
}

export function uploadAvatarRequest(token, imageDataUrl) {
  return apiFetch("/perfil/avatar", { method: "POST", token, body: { image: imageDataUrl } });
}
