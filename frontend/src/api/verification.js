import { apiFetch } from "./client.js";

export function submitVerificationRequest(token, imageDataUrl) {
  return apiFetch("/verificacion", { method: "POST", token, body: { image: imageDataUrl } });
}
