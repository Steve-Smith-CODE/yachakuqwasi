import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ListingDetailModal from "./ListingDetailModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { startChatRequest } from "../api/chat.js";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

vi.mock("../api/chat.js", () => ({
  startChatRequest: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("./UserProfileModal.jsx", () => ({
  default: ({ userId, onClose }) => (
    <div data-testid="user-profile-modal" data-user-id={userId}>
      <button onClick={onClose}>Cerrar perfil</button>
    </div>
  )
}));

const LISTING = {
  id: "h1",
  title: "Cuarto amoblado cerca a la UNSCH",
  type: "room",
  neighborhood: "Yanamilla",
  address: "Jr. Los Álamos 123",
  description: "Cuarto amplio",
  distance_to_unsch_minutes: 5,
  price_pen: 300,
  contact_phone: "966123456",
  images: [],
  amenities: [],
  landlord_id: "landlord-1",
  verified_by_maki: false,
  profiles: { name: "Rosa Landlord", avatar_url: null }
};

beforeEach(() => {
  mockNavigate.mockClear();
  startChatRequest.mockReset();
});

function setAuth(overrides = {}) {
  useAuth.mockReturnValue({
    isAuthenticated: false,
    user: null,
    token: null,
    openAuthModal: vi.fn(),
    ...overrides
  });
}

describe("ListingDetailModal", () => {
  it("no renderiza nada si no hay listing", () => {
    setAuth();
    const { container } = render(<ListingDetailModal listing={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra titulo, direccion, precio y distancia", () => {
    setAuth();
    render(<ListingDetailModal listing={LISTING} onClose={vi.fn()} />);

    expect(screen.getByText("Cuarto amoblado cerca a la UNSCH")).toBeInTheDocument();
    expect(screen.getByText(/Yanamilla • Jr\. Los Álamos 123/)).toBeInTheDocument();
    expect(screen.getByText(/S\/\. 300/)).toBeInTheDocument();
  });

  it("muestra el boton de chat para un visitante no autenticado", () => {
    setAuth({ isAuthenticated: false });
    render(<ListingDetailModal listing={LISTING} onClose={vi.fn()} />);
    expect(screen.getByText("Chatear dentro de YachakuqWasi")).toBeInTheDocument();
  });

  it("no muestra el boton de chat para un arrendador autenticado", () => {
    setAuth({ isAuthenticated: true, user: { role: "landlord" } });
    render(<ListingDetailModal listing={LISTING} onClose={vi.fn()} />);
    expect(screen.queryByText("Chatear dentro de YachakuqWasi")).not.toBeInTheDocument();
  });

  it("si no esta autenticado, chatear abre el modal de login en vez de iniciar el chat", () => {
    const openAuthModal = vi.fn();
    setAuth({ isAuthenticated: false, openAuthModal });
    render(<ListingDetailModal listing={LISTING} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText("Chatear dentro de YachakuqWasi"));

    expect(openAuthModal).toHaveBeenCalledWith("login");
    expect(startChatRequest).not.toHaveBeenCalled();
  });

  it("estudiante autenticado: chatear inicia el chat, cierra el modal y navega a /portal", async () => {
    startChatRequest.mockResolvedValueOnce({ id: "chat1" });
    const onClose = vi.fn();
    setAuth({ isAuthenticated: true, user: { role: "student" }, token: "tok" });
    render(<ListingDetailModal listing={LISTING} onClose={onClose} />);

    fireEvent.click(screen.getByText("Chatear dentro de YachakuqWasi"));

    await waitFor(() => expect(startChatRequest).toHaveBeenCalledWith("tok", "landlord-1", "h1"));
    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/portal");
  });

  it("si falla el inicio del chat, muestra el error y no navega", async () => {
    startChatRequest.mockRejectedValueOnce(new Error("No se pudo iniciar el chat."));
    const onClose = vi.fn();
    setAuth({ isAuthenticated: true, user: { role: "student" }, token: "tok" });
    render(<ListingDetailModal listing={LISTING} onClose={onClose} />);

    fireEvent.click(screen.getByText("Chatear dentro de YachakuqWasi"));

    expect(await screen.findByText("No se pudo iniciar el chat.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("la X, el overlay y Escape cierran el modal", () => {
    setAuth();
    const onClose = vi.fn();
    const { container } = render(<ListingDetailModal listing={LISTING} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Cerrar detalle"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector(".bg-slate-900\\/60"));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("click en el anfitrion abre el perfil con el landlord_id correcto", () => {
    setAuth();
    render(<ListingDetailModal listing={LISTING} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText("Rosa Landlord"));

    expect(screen.getByTestId("user-profile-modal")).toHaveAttribute("data-user-id", "landlord-1");
  });

  it("el boton de anfitrion esta deshabilitado si no hay landlord_id", () => {
    setAuth();
    render(<ListingDetailModal listing={{ ...LISTING, landlord_id: null }} onClose={vi.fn()} />);

    expect(screen.getByText("Rosa Landlord").closest("button")).toBeDisabled();
  });

  it("muestra el badge Maki Verificado solo si el listing esta verificado", () => {
    setAuth();
    render(<ListingDetailModal listing={{ ...LISTING, verified_by_maki: true }} onClose={vi.fn()} />);
    expect(screen.getByText("Maki Verificado")).toBeInTheDocument();
  });
});
