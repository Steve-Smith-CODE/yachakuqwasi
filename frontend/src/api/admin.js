import { apiFetch } from "./client.js";

export function getStatsRequest(token) {
  return apiFetch("/admin/stats", { token });
}

export function getPendingHousingsRequest(token) {
  return apiFetch("/admin/habitaciones/pendientes", { token });
}

export function reviewHousingRequest(token, id, estado) {
  return apiFetch(`/admin/habitaciones/${id}/estado`, { method: "PUT", token, body: { estado } });
}

export function getPendingDocumentsRequest(token) {
  return apiFetch("/admin/documentos/pendientes", { token });
}

export function reviewUserDocumentsRequest(token, userId, estado, comentario) {
  return apiFetch(`/admin/documentos/usuario/${userId}`, { method: "PUT", token, body: { estado, comentario } });
}

export function blockUserRequest(token, userId, motivo, dias) {
  return apiFetch(`/admin/usuarios/${userId}/bloquear`, { method: "PUT", token, body: { motivo, dias } });
}

export function getAllHousingsRequest(token) {
  return apiFetch("/admin/habitaciones", { token });
}

export function getAllUsersRequest(token) {
  return apiFetch("/admin/usuarios", { token });
}

export function setUserRoleRequest(token, userId, rol) {
  return apiFetch(`/admin/usuarios/${userId}/rol`, { method: "PUT", token, body: { rol } });
}

export function getAuditLogsRequest(token, scope) {
  return apiFetch("/admin/logs", { token, params: { scope } });
}

export function getUserDetailRequest(token, userId) {
  return apiFetch(`/admin/usuarios/${userId}`, { token });
}

export function reactivateUserRequest(token, userId) {
  return apiFetch(`/admin/usuarios/${userId}/reactivar`, { method: "PUT", token });
}

export function deleteUserRequest(token, userId, motivo) {
  return apiFetch(`/admin/usuarios/${userId}`, { method: "DELETE", token, body: { motivo } });
}
