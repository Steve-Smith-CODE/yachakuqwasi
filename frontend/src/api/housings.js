import { apiFetch } from "./client.js";

export function listHousingsRequest({ tipo, precio_max, barrio, q, page, limit } = {}) {
  return apiFetch("/housings", { params: { tipo, precio_max, barrio, q, page, limit } });
}

export function getHousingRequest(id) {
  return apiFetch(`/housings/${id}`);
}

export function createHousingRequest(token, data) {
  return apiFetch("/housings", { method: "POST", token, body: data });
}

export function uploadHousingImagesRequest(token, housingId, images) {
  return apiFetch(`/housings/${housingId}/imagenes`, { method: "POST", token, body: { images } });
}

export function listMyHousingsRequest(token) {
  return apiFetch("/housings/mine", { token });
}

export function updateHousingRequest(token, housingId, data) {
  return apiFetch(`/housings/${housingId}`, { method: "PATCH", token, body: data });
}

export function setHousingVisibilityRequest(token, housingId, paused) {
  return apiFetch(`/housings/${housingId}/visibilidad`, { method: "PATCH", token, body: { paused } });
}

export function deleteHousingRequest(token, housingId, reason) {
  return apiFetch(`/housings/${housingId}`, { method: "DELETE", token, body: { reason } });
}

export function restoreHousingRequest(token, housingId) {
  return apiFetch(`/housings/${housingId}/restaurar`, { method: "POST", token });
}

export function getHousingActivityRequest(token, housingId) {
  return apiFetch(`/housings/${housingId}/historial`, { token });
}
