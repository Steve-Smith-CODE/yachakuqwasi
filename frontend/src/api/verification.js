import { apiFetch } from "./client.js";

export function submitVerificationRequest(token, dniDataUrl, carnetDataUrl) {
  return apiFetch("/verificacion", { method: "POST", token, body: { dni: dniDataUrl, carnet: carnetDataUrl } });
}
