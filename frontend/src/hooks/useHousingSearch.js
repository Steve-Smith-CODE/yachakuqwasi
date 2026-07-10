import { useCallback, useEffect, useMemo, useState } from "react";
import { listHousingsRequest } from "../api/housings.js";
import { ApiError } from "../api/client.js";

const PAGE_SIZE = 24;

// Encapsula la busqueda/paginacion de ExplorePage: filtros de servidor
// (barrio, tipo, searchQuery) + un filtro de cliente adicional (roomSearch)
// sobre lo ya cargado. Extraido de ExplorePage.jsx para poder testearlo
// aislado del render (bug historico: "Zona/Calle" no consultaba toda la BD).
export function useHousingSearch() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [barrio, setBarrio] = useState("");
  const [tipo, setTipo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roomSearch, setRoomSearch] = useState("");

  const load = useCallback(
    async (overrideTipo = tipo) => {
      setLoading(true);
      setError("");
      try {
        const data = await listHousingsRequest({
          barrio: barrio || undefined,
          tipo: overrideTipo || undefined,
          q: searchQuery.trim() || undefined,
          page: 1,
          limit: PAGE_SIZE
        });
        setListings(data);
        setPage(1);
        setHasMore(data.length === PAGE_SIZE);
        return data;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar las habitaciones.");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [barrio, tipo, searchQuery]
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await listHousingsRequest({
        barrio: barrio || undefined,
        tipo: tipo || undefined,
        q: searchQuery.trim() || undefined,
        page: nextPage,
        limit: PAGE_SIZE
      });
      setListings((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      // silencioso: el usuario puede volver a tocar "Cargar más"
    } finally {
      setLoadingMore(false);
    }
  }, [barrio, tipo, searchQuery, page, hasMore, loadingMore]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase();
    return listings.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.neighborhood.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
    );
  }, [listings, searchQuery]);

  const visibleListings = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    if (!q) return filteredListings;
    return filteredListings.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.neighborhood.toLowerCase().includes(q) ||
        String(item.price_pen).includes(q) ||
        (item.amenities || []).some((a) => a.toLowerCase().includes(q))
    );
  }, [filteredListings, roomSearch]);

  // Nota: a diferencia del reset inline que reemplaza, este resetFilters no
  // depende de que barrio/tipo/searchQuery ya esten actualizados en el mismo
  // tick (setState es asincrono): dispara la carga con parametros explicitos
  // en vez de leer el estado que React todavia no re-renderizo.
  const resetFilters = useCallback(async () => {
    setSearchQuery("");
    setRoomSearch("");
    setBarrio("");
    setTipo("");
    setLoading(true);
    setError("");
    try {
      const data = await listHousingsRequest({ page: 1, limit: PAGE_SIZE });
      setListings(data);
      setPage(1);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las habitaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    listings,
    loading,
    loadingMore,
    error,
    hasMore,
    barrio,
    setBarrio,
    tipo,
    setTipo,
    searchQuery,
    setSearchQuery,
    roomSearch,
    setRoomSearch,
    filteredListings,
    visibleListings,
    load,
    loadMore,
    resetFilters
  };
}
