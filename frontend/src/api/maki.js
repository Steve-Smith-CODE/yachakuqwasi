import { apiFetch } from "./client.js";

export function sendMakiMessage(message, history) {
  return apiFetch("/maki/chat", { method: "POST", body: { message, history } });
}
