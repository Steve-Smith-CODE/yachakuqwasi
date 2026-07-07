import { apiFetch } from "./client.js";

export function getCompatibilityRequest(token, profileA, profileB) {
  return apiFetch("/roommates/compatibilidad", { method: "POST", token, body: { profileA, profileB } });
}
