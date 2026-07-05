import { apiFetch } from "./client.js";

export function listHousingsRequest({ tipo, precio_max, barrio } = {}) {
  return apiFetch("/housings", { params: { tipo, precio_max, barrio } });
}

export function createHousingRequest(token, data) {
  return apiFetch("/housings", { method: "POST", token, body: data });
}
