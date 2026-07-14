import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminUserDetailModal from "./AdminUserDetailModal.jsx";
import { getUserDetailRequest } from "../api/admin.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError } from "../api/client.js";

vi.mock("../api/admin.js", () => ({
  getUserDetailRequest: vi.fn()
}));

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

const LANDLORD_DETAIL = {
  profile: {
    id: "u1",
    name: "Rosa Landlord",
    role: "landlord",
    email: "rosa@test.com",
    phone: "966123456",
    is_verified: true,
    blocked_until: null
  },
  stats: { totalListings: 3, favoritesReceived: 5, contactsReceived: 2 },
  listings: [{ id: "h1", title: "Cuarto A", neighborhood: "Yanamilla", status: "approved" }],
  favorites: [],
  activity: [{ id: "l1", type: "listing", action: "Publicó un anuncio", created_at: "2026-01-01T00:00:00Z", details: null }]
};

const STUDENT_DETAIL = {
  profile: {
    id: "u2",
    name: "Ana Estudiante",
    role: "student",
    email: "ana@unsch.edu.pe",
    faculty: "Ingeniería de Sistemas",
    is_verified: false,
    blocked_until: "2026-02-01T00:00:00Z"
  },
  stats: { savedFavorites: 4, activeChats: 1 },
  listings: [],
  favorites: [{ id: "h2", title: "Cuarto B", neighborhood: "Magdalena", status: "approved" }],
  activity: []
};

beforeEach(() => {
  useAuth.mockReturnValue({ token: "tok" });
  getUserDetailRequest.mockReset();
});

describe("AdminUserDetailModal", () => {
  it("muestra el estado de carga y luego pide el detalle con el userId correcto", async () => {
    getUserDetailRequest.mockResolvedValueOnce(LANDLORD_DETAIL);
    render(<AdminUserDetailModal userId="u1" onClose={vi.fn()} onOpenListing={vi.fn()} />);

    expect(screen.getByText("Cargando perfil...")).toBeInTheDocument();
    await screen.findByText("Rosa Landlord");
    expect(getUserDetailRequest).toHaveBeenCalledWith("tok", "u1");
  });

  it("muestra el error si falla la carga del perfil", async () => {
    getUserDetailRequest.mockRejectedValueOnce(new ApiError("No autorizado", 403));
    render(<AdminUserDetailModal userId="u1" onClose={vi.fn()} onOpenListing={vi.fn()} />);

    expect(await screen.findByText("No autorizado")).toBeInTheDocument();
  });

  it("arrendador: muestra stats, verificado, y sus publicaciones", async () => {
    getUserDetailRequest.mockResolvedValueOnce(LANDLORD_DETAIL);
    const onOpenListing = vi.fn();
    render(<AdminUserDetailModal userId="u1" onClose={vi.fn()} onOpenListing={onOpenListing} />);

    await screen.findByText("Rosa Landlord");
    expect(screen.getByText("Verificado")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Cuarto A")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cuarto A"));
    expect(onOpenListing).toHaveBeenCalledWith(LANDLORD_DETAIL.listings[0]);
  });

  it("estudiante: muestra sin verificar, bloqueado, y sus favoritos", async () => {
    getUserDetailRequest.mockResolvedValueOnce(STUDENT_DETAIL);
    render(<AdminUserDetailModal userId="u2" onClose={vi.fn()} onOpenListing={vi.fn()} />);

    await screen.findByText("Ana Estudiante");
    expect(screen.getByText("Sin verificar")).toBeInTheDocument();
    expect(screen.getByText("Bloqueado")).toBeInTheDocument();
    expect(screen.getByText("Cuarto B")).toBeInTheDocument();
    expect(screen.getByText("Sin actividad registrada todavía.")).toBeInTheDocument();
  });

  it("muestra la actividad reciente cuando existe", async () => {
    getUserDetailRequest.mockResolvedValueOnce(LANDLORD_DETAIL);
    render(<AdminUserDetailModal userId="u1" onClose={vi.fn()} onOpenListing={vi.fn()} />);

    expect(await screen.findByText("Publicó un anuncio")).toBeInTheDocument();
  });

  it("la X y el overlay llaman a onClose", async () => {
    getUserDetailRequest.mockResolvedValueOnce(LANDLORD_DETAIL);
    const onClose = vi.fn();
    const { container } = render(<AdminUserDetailModal userId="u1" onClose={onClose} onOpenListing={vi.fn()} />);
    await screen.findByText("Rosa Landlord");

    fireEvent.click(screen.getByLabelText("Cerrar"));
    fireEvent.click(container.querySelector(".bg-slate-900\\/60"));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
