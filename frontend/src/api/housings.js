import { apiFetch } from "./client.js";

export function listHousingsRequest({ tipo, precio_max, barrio, page, limit } = {}) {
  return apiFetch("/housings", { params: { tipo, precio_max, barrio, page, limit } });
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
