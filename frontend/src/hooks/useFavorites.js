import { useCallback, useEffect, useState } from "react";
import { listFavoritesRequest, addFavoriteRequest, removeFavoriteRequest } from "../api/favorites.js";

// Extraido de ExplorePage.jsx: carga los favoritos del usuario autenticado
// y expone un toggle optimista. No decide que hacer si el usuario no esta
// autenticado (eso depende de openAuthModal, que vive en el componente).
export function useFavorites(isAuthenticated, token) {
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      return;
    }
    listFavoritesRequest(token)
      .then((data) => setFavoriteIds(new Set(data.map((l) => l.id))))
      .catch(() => {});
  }, [isAuthenticated, token]);

  const toggleFavorite = useCallback(
    async (listing) => {
      const isFav = favoriteIds.has(listing.id);
      try {
        if (isFav) {
          await removeFavoriteRequest(token, listing.id);
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(listing.id);
            return next;
          });
        } else {
          await addFavoriteRequest(token, listing.id);
          setFavoriteIds((prev) => new Set(prev).add(listing.id));
        }
      } catch {
        // silencioso: el corazon simplemente no cambia si falla
      }
    },
    [favoriteIds, token]
  );

  return { favoriteIds, toggleFavorite };
}
