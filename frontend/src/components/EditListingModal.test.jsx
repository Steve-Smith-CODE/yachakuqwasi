import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditListingModal from "./EditListingModal.jsx";
import { updateHousingRequest } from "../api/housings.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError } from "../api/client.js";

vi.mock("../api/housings.js", () => ({
  updateHousingRequest: vi.fn()
}));

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

const LISTING = {
  id: "h1",
  title: "Cuarto amoblado",
  type: "room",
  price_pen: 300,
  distance_to_unsch_minutes: 10,
  neighborhood: "Yanamilla",
  address: "Jr. Los Álamos 123",
  description: "Cuarto amplio",
  contact_phone: "966123456",
  amenities: ["WiFi"],
  status: "approved"
};

beforeEach(() => {
  useAuth.mockReturnValue({ token: "tok" });
  updateHousingRequest.mockReset();
});

describe("EditListingModal", () => {
  it("precarga los valores del listing en el formulario", () => {
    render(<EditListingModal listing={LISTING} onClose={vi.fn()} onUpdated={vi.fn()} />);

    expect(screen.getByDisplayValue("Cuarto amoblado")).toBeInTheDocument();
    expect(screen.getByDisplayValue("300")).toBeInTheDocument();
    expect(screen.getByDisplayValue("966123456")).toBeInTheDocument();
    expect(screen.getByText("WiFi")).toBeInTheDocument();
  });

  it("no muestra la advertencia de revision si no se cambio nada sensible", () => {
    render(<EditListingModal listing={LISTING} onClose={vi.fn()} onUpdated={vi.fn()} />);
    expect(screen.queryByText(/volverá a/)).not.toBeInTheDocument();
  });

  it("muestra la advertencia de revision al cambiar el precio de un anuncio aprobado", () => {
    render(<EditListingModal listing={LISTING} onClose={vi.fn()} onUpdated={vi.fn()} />);

    fireEvent.change(screen.getByDisplayValue("300"), { target: { value: "350" } });

    expect(screen.getByText(/volverá a/)).toBeInTheDocument();
  });

  it("guardar llama a updateHousingRequest y luego a onUpdated y onClose", async () => {
    const onUpdated = vi.fn();
    const onClose = vi.fn();
    updateHousingRequest.mockResolvedValueOnce({ ...LISTING, title: "Cuarto renovado" });
    render(<EditListingModal listing={LISTING} onClose={onClose} onUpdated={onUpdated} />);

    fireEvent.change(screen.getByDisplayValue("Cuarto amoblado"), { target: { value: "Cuarto renovado" } });
    fireEvent.click(screen.getByText("Guardar cambios"));

    await waitFor(() => expect(updateHousingRequest).toHaveBeenCalledWith("tok", "h1", expect.objectContaining({ title: "Cuarto renovado" })));
    expect(onUpdated).toHaveBeenCalledWith({ ...LISTING, title: "Cuarto renovado" });
    expect(onClose).toHaveBeenCalled();
  });

  it("muestra un error si falla el guardado y no cierra el modal", async () => {
    updateHousingRequest.mockRejectedValueOnce(new ApiError("No se pudo actualizar", 400));
    const onClose = vi.fn();
    render(<EditListingModal listing={LISTING} onClose={onClose} onUpdated={vi.fn()} />);

    fireEvent.click(screen.getByText("Guardar cambios"));

    expect(await screen.findByText("No se pudo actualizar")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Cancelar, la X y el overlay llaman a onClose sin guardar", () => {
    const onClose = vi.fn();
    const { container } = render(<EditListingModal listing={LISTING} onClose={onClose} onUpdated={vi.fn()} />);

    fireEvent.click(screen.getByText("Cancelar"));
    fireEvent.click(screen.getByLabelText("Cerrar edición"));
    fireEvent.click(container.querySelector(".bg-slate-900\\/60"));

    expect(onClose).toHaveBeenCalledTimes(3);
    expect(updateHousingRequest).not.toHaveBeenCalled();
  });

  it("permite agregar y quitar un servicio (amenity)", () => {
    render(<EditListingModal listing={LISTING} onClose={vi.fn()} onUpdated={vi.fn()} />);
    const input = screen.getByPlaceholderText("Ej. Wi-Fi de fibra, Baño privado");

    fireEvent.change(input, { target: { value: "Agua caliente" } });
    fireEvent.click(screen.getByText("Agregar"));
    expect(screen.getByText("Agua caliente")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("×")[1]);
    expect(screen.queryByText("Agua caliente")).not.toBeInTheDocument();
  });

  it("no agrega un servicio vacio ni duplicado", () => {
    render(<EditListingModal listing={LISTING} onClose={vi.fn()} onUpdated={vi.fn()} />);
    const input = screen.getByPlaceholderText("Ej. Wi-Fi de fibra, Baño privado");

    fireEvent.click(screen.getByText("Agregar"));
    fireEvent.change(input, { target: { value: "WiFi" } });
    fireEvent.click(screen.getByText("Agregar"));

    expect(screen.getAllByText("WiFi")).toHaveLength(1);
  });
});
