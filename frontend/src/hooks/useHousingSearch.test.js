import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useHousingSearch } from "./useHousingSearch.js";
import { listHousingsRequest } from "../api/housings.js";

vi.mock("../api/housings.js", () => ({
  listHousingsRequest: vi.fn()
}));

function makeListing(id) {
  return {
    id,
    title: `Cuarto ${id}`,
    neighborhood: "San Blas",
    price_pen: 300 + id,
    amenities: ["wifi"]
  };
}

beforeEach(() => {
  listHousingsRequest.mockReset();
  listHousingsRequest.mockResolvedValue([]);
});

describe("useHousingSearch", () => {
  it("carga la primera pagina al montar", async () => {
    listHousingsRequest.mockResolvedValueOnce([makeListing(1), makeListing(2)]);

    const { result } = renderHook(() => useHousingSearch());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(listHousingsRequest).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 24 })
    );
    expect(result.current.visibleListings).toHaveLength(2);
  });

  // Regresion del bug corregido en 6b821ca: "Zona/Calle" debe consultar el
  // backend (parametro q) con toda la base de datos, no solo filtrar en el
  // cliente lo que ya esta cargado en pantalla.
  it("al buscar por Zona/Calle, consulta el backend con el termino (q), no solo filtra localmente", async () => {
    listHousingsRequest.mockResolvedValue([makeListing(1)]);
    const { result } = renderHook(() => useHousingSearch());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSearchQuery("Carmen Alto"));
    await act(async () => {
      await result.current.load();
    });

    expect(listHousingsRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "Carmen Alto", page: 1 })
    );
  });

  it("loadMore agrega resultados y avanza de pagina mientras hasMore sea true", async () => {
    listHousingsRequest.mockResolvedValueOnce(
      Array.from({ length: 24 }, (_, i) => makeListing(i + 1))
    );
    const { result } = renderHook(() => useHousingSearch());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    listHousingsRequest.mockResolvedValueOnce([makeListing(100)]);
    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.visibleListings).toHaveLength(25);
    expect(result.current.hasMore).toBe(false);
    expect(listHousingsRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 })
    );
  });

  it("roomSearch filtra en el cliente sin volver a llamar al backend", async () => {
    listHousingsRequest.mockResolvedValueOnce([makeListing(1), makeListing(2)]);
    const { result } = renderHook(() => useHousingSearch());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const callsBefore = listHousingsRequest.mock.calls.length;
    act(() => result.current.setRoomSearch("Cuarto 1"));

    expect(result.current.visibleListings).toHaveLength(1);
    expect(listHousingsRequest.mock.calls.length).toBe(callsBefore);
  });

  it("resetFilters limpia los filtros y recarga sin arrastrar los valores anteriores", async () => {
    listHousingsRequest.mockResolvedValue([makeListing(1)]);
    const { result } = renderHook(() => useHousingSearch());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setBarrio("San Blas");
      result.current.setTipo("room");
      result.current.setSearchQuery("algo");
    });

    await act(async () => {
      await result.current.resetFilters();
    });

    expect(result.current.barrio).toBe("");
    expect(result.current.tipo).toBe("");
    expect(result.current.searchQuery).toBe("");
    expect(listHousingsRequest).toHaveBeenLastCalledWith({ page: 1, limit: 24 });
  });
});
