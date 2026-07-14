import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ListingHistoryPanel from "./ListingHistoryPanel.jsx";
import { getHousingActivityRequest } from "../api/housings.js";

vi.mock("../api/housings.js", () => ({
  getHousingActivityRequest: vi.fn()
}));

beforeEach(() => {
  getHousingActivityRequest.mockReset();
});

describe("ListingHistoryPanel", () => {
  it("no consulta el historial hasta que se abre", () => {
    render(<ListingHistoryPanel listingId="h1" token="tok" />);
    expect(getHousingActivityRequest).not.toHaveBeenCalled();
  });

  it("al abrir por primera vez carga y muestra el historial", async () => {
    getHousingActivityRequest.mockResolvedValueOnce([
      { id: "l1", action: "Anuncio publicado", created_at: "2026-01-01T00:00:00Z", details: null }
    ]);

    render(<ListingHistoryPanel listingId="h1" token="tok" />);
    fireEvent.click(screen.getByText("Historial de este anuncio"));

    expect(getHousingActivityRequest).toHaveBeenCalledWith("tok", "h1");
    expect(await screen.findByText("Anuncio publicado")).toBeInTheDocument();
  });

  it("muestra el mensaje vacio si no hay actividad", async () => {
    getHousingActivityRequest.mockResolvedValueOnce([]);

    render(<ListingHistoryPanel listingId="h1" token="tok" />);
    fireEvent.click(screen.getByText("Historial de este anuncio"));

    expect(await screen.findByText("Aún no hay actividad registrada.")).toBeInTheDocument();
  });

  it("si la carga falla, cae a la lista vacia en vez de romper", async () => {
    getHousingActivityRequest.mockRejectedValueOnce(new Error("500"));

    render(<ListingHistoryPanel listingId="h1" token="tok" />);
    fireEvent.click(screen.getByText("Historial de este anuncio"));

    expect(await screen.findByText("Aún no hay actividad registrada.")).toBeInTheDocument();
  });

  it("no vuelve a pedir el historial al cerrar y reabrir", async () => {
    getHousingActivityRequest.mockResolvedValueOnce([]);

    render(<ListingHistoryPanel listingId="h1" token="tok" />);
    const toggle = screen.getByText("Historial de este anuncio");
    fireEvent.click(toggle);
    await waitFor(() => expect(getHousingActivityRequest).toHaveBeenCalledTimes(1));

    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(getHousingActivityRequest).toHaveBeenCalledTimes(1);
  });
});
