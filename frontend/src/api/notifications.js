import { apiFetch } from "./client.js";

export function listNotificationsRequest(token) {
  return apiFetch("/notificaciones", { token });
}

export function markNotificationReadRequest(token, id) {
  return apiFetch(`/notificaciones/${id}/leer`, { method: "PUT", token });
}

export function markAllNotificationsReadRequest(token) {
  return apiFetch("/notificaciones/leer-todas", { method: "PUT", token });
}
