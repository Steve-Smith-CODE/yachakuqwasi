import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFavorites } from "./useFavorites.js";
import { listFavoritesRequest, addFavoriteRequest, removeFavoriteRequest } from "../api/favorites.js";

vi.mock("../api/favorites.js", () => ({
  listFavoritesRequest: vi.fn(),
  addFavoriteRequest: vi.fn(),
  removeFavoriteRequest: vi.fn()
}));

beforeEach(() => {
  listFavoritesRequest.mockReset();
  addFavoriteRequest.mockReset();
  removeFavoriteRequest.mockReset();
});

describe("useFavorites", () => {
  it("no consulta favoritos si el usuario no esta autenticado", async () => {
    const { result } = renderHook(() => useFavorites(false, null));
    expect(listFavoritesRequest).not.toHaveBeenCalled();
    expect(result.current.favoriteIds.size).toBe(0);
  });

  it("carga los favoritos del usuario autenticado", async () => {
    listFavoritesRequest.mockResolvedValueOnce([{ id: "a" }, { id: "b" }]);
    const { result } = renderHook(() => useFavorites(true, "tok"));

    await waitFor(() => expect(result.current.favoriteIds.size).toBe(2));
    expect(listFavoritesRequest).toHaveBeenCalledWith("tok");
  });

  it("agrega un favorito nuevo de forma optimista", async () => {
    listFavoritesRequest.mockResolvedValueOnce([]);
    addFavoriteRequest.mockResolvedValueOnce({});
    const { result } = renderHook(() => useFavorites(true, "tok"));
    await waitFor(() => expect(listFavoritesRequest).toHaveBeenCalled());

    await act(async () => {
      await result.current.toggleFavorite({ id: "x" });
    });

    expect(addFavoriteRequest).toHaveBeenCalledWith("tok", "x");
    expect(result.current.favoriteIds.has("x")).toBe(true);
  });

  it("quita un favorito existente", async () => {
    listFavoritesRequest.mockResolvedValueOnce([{ id: "x" }]);
    removeFavoriteRequest.mockResolvedValueOnce({});
    const { result } = renderHook(() => useFavorites(true, "tok"));
    await waitFor(() => expect(result.current.favoriteIds.has("x")).toBe(true));

    await act(async () => {
      await result.current.toggleFavorite({ id: "x" });
    });

    expect(removeFavoriteRequest).toHaveBeenCalledWith("tok", "x");
    expect(result.current.favoriteIds.has("x")).toBe(false);
  });
});
