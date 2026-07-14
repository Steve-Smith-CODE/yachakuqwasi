import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UserProfileModal from "./UserProfileModal.jsx";
import { getPublicProfileRequest } from "../api/profile.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError } from "../api/client.js";

vi.mock("../api/profile.js", () => ({
  getPublicProfileRequest: vi.fn()
}));

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

beforeEach(() => {
  useAuth.mockReturnValue({ token: "tok" });
  getPublicProfileRequest.mockReset();
});

describe("UserProfileModal", () => {
  it("pide el perfil publico con el userId correcto y muestra el estado de carga", async () => {
    getPublicProfileRequest.mockResolvedValueOnce({ profile: { name: "Ana", role: "student" } });
    render(<UserProfileModal userId="u1" onClose={vi.fn()} onOpenListing={vi.fn()} />);

    expect(screen.getByText("Cargando perfil...")).toBeInTheDocument();
    await screen.findByText("Ana");
    expect(getPublicProfileRequest).toHaveBeenCalledWith("tok", "u1");
  });

  it("muestra el error si falla la carga", async () => {
    getPublicProfileRequest.mockRejectedValueOnce(new ApiError("Usuario no encontrado", 404));
    render(<UserProfileModal userId="u1" onClose={vi.fn()} onOpenListing={vi.fn()} />);

    expect(await screen.findByText("Usuario no encontrado")).toBeInTheDocument();
  });

  it("estudiante: no muestra la seccion de publicaciones", async () => {
    getPublicProfileRequest.mockResolvedValueOnce({
      profile: { name: "Ana", role: "student", faculty: "Ingeniería de Sistemas" }
    });
    render(<UserProfileModal userId="u1" onClose={vi.fn()} onOpenListing={vi.fn()} />);

    await screen.findByText("Ana");
    expect(screen.getByText("Ingeniería de Sistemas")).toBeInTheDocument();
    expect(screen.queryByText(/Publicaciones/)).not.toBeInTheDocument();
  });

  it("arrendador sin publicaciones: muestra el mensaje vacio", async () => {
    getPublicProfileRequest.mockResolvedValueOnce({ profile: { name: "Luis", role: "landlord" }, listings: [] });
    render(<UserProfileModal userId="u1" onClose={vi.fn()} onOpenListing={vi.fn()} />);

    await screen.findByText("Luis");
    expect(screen.getByText("Publicaciones (0)")).toBeInTheDocument();
    expect(screen.getByText("Sin publicaciones activas todavía.")).toBeInTheDocument();
  });

  it("arrendador con publicaciones: listarlas y abrir una llama a onOpenListing", async () => {
    const listing = { id: "h1", title: "Cuarto A", neighborhood: "Yanamilla", price_pen: 300 };
    getPublicProfileRequest.mockResolvedValueOnce({ profile: { name: "Luis", role: "landlord" }, listings: [listing] });
    const onOpenListing = vi.fn();
    render(<UserProfileModal userId="u1" onClose={vi.fn()} onOpenListing={onOpenListing} />);

    await screen.findByText("Publicaciones (1)");
    fireEvent.click(screen.getByText("Cuarto A"));

    expect(onOpenListing).toHaveBeenCalledWith(listing);
  });

  it("la X y el overlay llaman a onClose", async () => {
    getPublicProfileRequest.mockResolvedValueOnce({ profile: { name: "Ana", role: "student" } });
    const onClose = vi.fn();
    const { container } = render(<UserProfileModal userId="u1" onClose={onClose} onOpenListing={vi.fn()} />);
    await screen.findByText("Ana");

    fireEvent.click(screen.getByLabelText("Cerrar"));
    fireEvent.click(container.querySelector(".bg-slate-900\\/60"));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
