import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandlordDashboard from "./LandlordDashboard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  listMyHousingsRequest,
  setHousingVisibilityRequest,
  deleteHousingRequest,
  restoreHousingRequest
} from "../api/housings.js";
import { listChatsRequest, getMessagesRequest, sendMessageRequest } from "../api/chat.js";
import { submitVerificationRequest } from "../api/verification.js";
import { getLandlordStatsRequest } from "../api/stats.js";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

vi.mock("../api/housings.js", () => ({
  listMyHousingsRequest: vi.fn(),
  setHousingVisibilityRequest: vi.fn(),
  deleteHousingRequest: vi.fn(),
  restoreHousingRequest: vi.fn(),
  getHousingActivityRequest: vi.fn().mockResolvedValue([])
}));

vi.mock("../api/chat.js", () => ({
  listChatsRequest: vi.fn(),
  getMessagesRequest: vi.fn(),
  sendMessageRequest: vi.fn()
}));

vi.mock("../api/verification.js", () => ({
  submitVerificationRequest: vi.fn()
}));

vi.mock("../api/stats.js", () => ({
  getLandlordStatsRequest: vi.fn()
}));

vi.mock("../components/ListingActionsMenu.jsx", () => ({
  default: ({ onEdit, onTogglePause, onDelete }) => (
    <div data-testid="listing-actions">
      <button onClick={onEdit}>mock-editar</button>
      <button onClick={() => onTogglePause(true)}>mock-pausar</button>
      <button onClick={() => onDelete("rented")}>mock-eliminar</button>
    </div>
  )
}));

vi.mock("../components/EditListingModal.jsx", () => ({
  default: ({ listing, onClose }) => (
    <div data-testid="edit-modal" data-listing-id={listing.id}>
      <button onClick={onClose}>cerrar-edit</button>
    </div>
  )
}));

vi.mock("../components/UserProfileModal.jsx", () => ({
  default: ({ userId, onClose }) => (
    <div data-testid="user-profile-modal" data-user-id={userId}>
      <button onClick={onClose}>Cerrar perfil</button>
    </div>
  )
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

const LISTING = {
  id: "h1",
  title: "Cuarto A",
  neighborhood: "Yanamilla",
  price_pen: 300,
  status: "approved",
  type: "room",
  images: [],
  paused_at: null
};

const CHAT = {
  id: "c1",
  student: { id: "s1", name: "Ana Torres", avatar_url: null },
  housing_listings: { title: "Cuarto A" }
};

function setupDefaults() {
  useAuth.mockReturnValue({ token: "tok", user: { is_verified: false } });
  listMyHousingsRequest.mockResolvedValue([]);
  listChatsRequest.mockResolvedValue([]);
  getMessagesRequest.mockResolvedValue([]);
  getLandlordStatsRequest.mockResolvedValue(null);
  submitVerificationRequest.mockResolvedValue({});
}

function renderPage() {
  return render(
    <MemoryRouter>
      <LandlordDashboard />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setupDefaults();
});

describe("LandlordDashboard", () => {
  it("muestra el estado de carga y luego el mensaje vacio sin anuncios", async () => {
    renderPage();
    expect(screen.getByText("Cargando tus publicaciones...")).toBeInTheDocument();
    expect(await screen.findByText("Aún no tienes habitaciones publicadas.")).toBeInTheDocument();
  });

  it("lista los anuncios del arrendador", async () => {
    listMyHousingsRequest.mockResolvedValue([LISTING]);
    renderPage();
    expect(await screen.findByText("Cuarto A")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("pausar un anuncio actualiza el estado optimista y muestra el toast con deshacer", async () => {
    listMyHousingsRequest.mockResolvedValue([LISTING]);
    setHousingVisibilityRequest.mockResolvedValueOnce({ ...LISTING, paused_at: "2026-01-01T00:00:00Z" });
    renderPage();
    await screen.findByText("Cuarto A");

    fireEvent.click(screen.getByText("mock-pausar"));

    expect(await screen.findByText("Pausado")).toBeInTheDocument();
    await waitFor(() => expect(setHousingVisibilityRequest).toHaveBeenCalledWith("tok", "h1", true));
    expect(await screen.findByText("Anuncio pausado")).toBeInTheDocument();
  });

  it("deshacer la pausa vuelve a llamar al backend con el valor invertido", async () => {
    listMyHousingsRequest.mockResolvedValue([LISTING]);
    setHousingVisibilityRequest.mockResolvedValueOnce({ ...LISTING, paused_at: "2026-01-01T00:00:00Z" });
    setHousingVisibilityRequest.mockResolvedValueOnce({ ...LISTING, paused_at: null });
    renderPage();
    await screen.findByText("Cuarto A");
    fireEvent.click(screen.getByText("mock-pausar"));
    await screen.findByText("Anuncio pausado");

    fireEvent.click(screen.getByText("Deshacer"));

    await waitFor(() => expect(setHousingVisibilityRequest).toHaveBeenCalledWith("tok", "h1", false));
  });

  it("eliminar un anuncio lo quita de la lista y muestra el toast con el motivo", async () => {
    listMyHousingsRequest.mockResolvedValue([LISTING]);
    deleteHousingRequest.mockResolvedValueOnce({});
    renderPage();
    await screen.findByText("Cuarto A");

    fireEvent.click(screen.getByText("mock-eliminar"));

    await waitFor(() => expect(deleteHousingRequest).toHaveBeenCalledWith("tok", "h1", "rented"));
    expect(await screen.findByText("Anuncio eliminado · Ya alquilé")).toBeInTheDocument();
  });

  it("deshacer la eliminacion restaura el anuncio", async () => {
    listMyHousingsRequest.mockResolvedValueOnce([LISTING]).mockResolvedValueOnce([LISTING]);
    deleteHousingRequest.mockResolvedValueOnce({});
    restoreHousingRequest.mockResolvedValueOnce({});
    renderPage();
    await screen.findByText("Cuarto A");
    fireEvent.click(screen.getByText("mock-eliminar"));
    await screen.findByText("Anuncio eliminado · Ya alquilé");

    fireEvent.click(screen.getByText("Deshacer"));

    await waitFor(() => expect(restoreHousingRequest).toHaveBeenCalledWith("tok", "h1"));
  });

  it("editar abre el modal de edicion con el anuncio correcto", async () => {
    listMyHousingsRequest.mockResolvedValue([LISTING]);
    renderPage();
    await screen.findByText("Cuarto A");

    fireEvent.click(screen.getByText("mock-editar"));

    expect(screen.getByTestId("edit-modal")).toHaveAttribute("data-listing-id", "h1");
  });

  it("usa las stats del backend para anuncios activos/totales cuando estan disponibles", async () => {
    getLandlordStatsRequest.mockResolvedValue({
      listingsByStatus: { approved: 5, pending: 2 },
      totalListings: 8,
      favoritesReceived: 12,
      contactsReceived: 4
    });
    renderPage();

    expect(await screen.findByText("5")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("verificacion: se habilita el envio solo con ambos documentos", async () => {
    renderPage();
    await screen.findByText("DNI");

    const submitBtn = screen.getByText("Enviar");
    expect(submitBtn).toBeDisabled();

    const dniInput = screen.getByText("DNI").closest("label").querySelector("input[type='file']");
    const carnetInput = screen.getByText("Título").closest("label").querySelector("input[type='file']");
    fireEvent.change(dniInput, { target: { files: [new File(["dni"], "dni.png", { type: "image/png" })] } });
    fireEvent.change(carnetInput, { target: { files: [new File(["t"], "t.png", { type: "image/png" })] } });

    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => expect(submitVerificationRequest).toHaveBeenCalled());
    expect(await screen.findByText("En revisión")).toBeInTheDocument();
  });

  it("selecciona el primer chat automaticamente y permite responder", async () => {
    listChatsRequest.mockResolvedValue([CHAT]);
    sendMessageRequest.mockResolvedValueOnce({ id: "m1", sender: "landlord", text: "Claro, sigue disponible" });
    renderPage();

    await screen.findByPlaceholderText("Responde al estudiante...");
    fireEvent.change(screen.getByPlaceholderText("Responde al estudiante..."), {
      target: { value: "Claro, sigue disponible" }
    });
    fireEvent.submit(screen.getByPlaceholderText("Responde al estudiante...").closest("form"));

    await waitFor(() => expect(sendMessageRequest).toHaveBeenCalledWith("tok", "c1", "Claro, sigue disponible"));
    expect(await screen.findByText("Claro, sigue disponible")).toBeInTheDocument();
  });

  it("click en el avatar del chat abre el perfil del estudiante", async () => {
    listChatsRequest.mockResolvedValue([CHAT]);
    renderPage();
    await screen.findByPlaceholderText("Responde al estudiante...");

    fireEvent.click(screen.getByAltText("Ana Torres"));

    expect(screen.getByTestId("user-profile-modal")).toHaveAttribute("data-user-id", "s1");
  });

  it("sin conversaciones muestra el mensaje vacio del chat", async () => {
    renderPage();
    expect(await screen.findByText("Aún no tienes conversaciones con estudiantes interesados.")).toBeInTheDocument();
  });
});
