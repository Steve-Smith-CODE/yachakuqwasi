import { apiFetch } from "./client.js";

export function listFavoritesRequest(token) {
  return apiFetch("/favoritos", { token });
}

export function addFavoriteRequest(token, listingId) {
  return apiFetch("/favoritos", { method: "POST", token, body: { listingId } });
}

export function removeFavoriteRequest(token, listingId) {
  return apiFetch(`/favoritos/${listingId}`, { method: "DELETE", token });
}
