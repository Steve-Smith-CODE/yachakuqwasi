import { apiFetch } from "./client.js";

export function getStudentStatsRequest(token) {
  return apiFetch("/stats/estudiante", { token });
}

export function getLandlordStatsRequest(token) {
  return apiFetch("/stats/arrendador", { token });
}
