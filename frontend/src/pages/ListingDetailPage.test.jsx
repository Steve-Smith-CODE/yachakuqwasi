import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ListingDetailPage from "./ListingDetailPage.jsx";
import { getHousingRequest } from "../api/housings.js";

vi.mock("../api/housings.js", () => ({
  getHousingRequest: vi.fn()
}));

vi.mock("../components/ListingDetailModal.jsx", () => ({
  default: ({ listing, onClose }) => (
    <div data-testid="listing-detail-modal" data-listing-id={listing.id}>
      <button onClick={onClose}>cerrar-detalle</button>
    </div>
  )
}));

const mockNavigate = vi.fn();
let mockParams = { id: "h1" };
let mockLocationState = null;
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useLocation: () => ({ state: mockLocationState })
  };
});

beforeEach(() => {
  mockNavigate.mockClear();
  mockParams = { id: "h1" };
  mockLocationState = null;
  getHousingRequest.mockReset();
});

describe("ListingDetailPage", () => {
  it("con listing precargado en el state no pide el detalle de nuevo", () => {
    mockLocationState = { listing: { id: "h1", title: "Cuarto A" } };
    render(<ListingDetailPage />);

    expect(screen.getByTestId("listing-detail-modal")).toHaveAttribute("data-listing-id", "h1");
    expect(getHousingRequest).not.toHaveBeenCalled();
  });

  it("sin precarga, pide el detalle por id y lo muestra", async () => {
    getHousingRequest.mockResolvedValueOnce({ id: "h1", title: "Cuarto A" });
    render(<ListingDetailPage />);

    expect(await screen.findByTestId("listing-detail-modal")).toHaveAttribute("data-listing-id", "h1");
    expect(getHousingRequest).toHaveBeenCalledWith("h1");
  });

  it("si el listing precargado tiene otro id, igual pide el detalle correcto", () => {
    mockLocationState = { listing: { id: "otro-id", title: "Otro" } };
    getHousingRequest.mockResolvedValueOnce({ id: "h1", title: "Cuarto A" });
    render(<ListingDetailPage />);

    expect(getHousingRequest).toHaveBeenCalledWith("h1");
  });

  it("si la habitacion no existe, muestra el mensaje de no disponible", async () => {
    getHousingRequest.mockRejectedValueOnce(new Error("404"));
    render(<ListingDetailPage />);

    expect(await screen.findByText("Esta habitación ya no está disponible")).toBeInTheDocument();
  });

  it("cerrar sin background navega a /explorar", async () => {
    mockLocationState = { listing: { id: "h1", title: "Cuarto A" } };
    render(<ListingDetailPage />);

    fireEvent.click(screen.getByText("cerrar-detalle"));

    expect(mockNavigate).toHaveBeenCalledWith("/explorar");
  });

  it("cerrar con background location hace navigate(-1)", async () => {
    mockLocationState = { listing: { id: "h1", title: "Cuarto A" }, backgroundLocation: { pathname: "/explorar" } };
    render(<ListingDetailPage />);

    fireEvent.click(screen.getByText("cerrar-detalle"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("volver a explorar desde el estado de no disponible respeta backgroundLocation", async () => {
    mockLocationState = { backgroundLocation: { pathname: "/explorar" } };
    getHousingRequest.mockRejectedValueOnce(new Error("404"));
    render(<ListingDetailPage />);

    fireEvent.click(await screen.findByText("Volver a explorar"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
