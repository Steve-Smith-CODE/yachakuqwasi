import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NavBar from "./NavBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { listNotificationsRequest } from "../api/notifications.js";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

vi.mock("../api/notifications.js", () => ({
  listNotificationsRequest: vi.fn(),
  markNotificationReadRequest: vi.fn(),
  markAllNotificationsReadRequest: vi.fn()
}));

const mockNavigate = vi.fn();
let mockPathname = "/explorar";
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockPathname })
  };
});

function renderNavBar(authOverrides = {}, props = {}) {
  useAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
    openAuthModal: vi.fn(),
    ...authOverrides
  });
  return render(
    <MemoryRouter>
      <NavBar onOpenMaki={vi.fn()} soundOn={false} onToggleSound={vi.fn()} {...props} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockPathname = "/explorar";
  mockNavigate.mockClear();
  listNotificationsRequest.mockReset().mockResolvedValue({ notifications: [], unreadCount: 0 });
});

describe("NavBar", () => {
  it("muestra Ingresar/Registrarse si no esta autenticado y abre el modal de login", () => {
    const openAuthModal = vi.fn();
    renderNavBar({ openAuthModal });

    fireEvent.click(screen.getByText("Ingresar / Registrarse"));

    expect(openAuthModal).toHaveBeenCalledWith("login");
  });

  it("muestra el nombre y rol del usuario autenticado", () => {
    renderNavBar({ isAuthenticated: true, user: { name: "Ana Torres", role: "student" } });

    expect(screen.getByText("Ana Torres")).toBeInTheDocument();
    expect(screen.getByText("Estudiante")).toBeInTheDocument();
  });

  it("Salir cierra sesion y navega a /explorar", () => {
    const logout = vi.fn();
    renderNavBar({ isAuthenticated: true, user: { name: "Ana", role: "student" }, logout });

    fireEvent.click(screen.getByTitle("Cerrar sesión"));

    expect(logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/explorar");
  });

  it("Mi Portal UNSCH apunta a /admin para un administrador", () => {
    renderNavBar({ isAuthenticated: true, user: { name: "Admin", role: "admin" } });

    expect(screen.getByText("Mi Portal UNSCH").closest("a")).toHaveAttribute("href", "/admin");
  });

  it("Mi Portal UNSCH apunta a /portal para un arrendador", () => {
    renderNavBar({ isAuthenticated: true, user: { name: "Luis", role: "landlord" } });

    expect(screen.getByText("Mi Portal UNSCH").closest("a")).toHaveAttribute("href", "/portal");
  });

  it("el boton Publicar Habitacion aparece para arrendador y admin, no para estudiante", () => {
    const { unmount } = renderNavBar({ isAuthenticated: true, user: { name: "Luis", role: "landlord" } });
    expect(screen.getByText("Publicar Habitación")).toBeInTheDocument();
    unmount();

    renderNavBar({ isAuthenticated: true, user: { name: "Ana", role: "student" } });
    expect(screen.queryByText("Publicar Habitación")).not.toBeInTheDocument();
  });

  it("resalta la pestaña Explorar cuando esa es la ruta activa", () => {
    mockPathname = "/explorar";
    renderNavBar();

    expect(screen.getByText("Explorar Habitaciones").closest("a")).toHaveClass("text-guindo");
  });

  it("el boton de Maki llama a onOpenMaki", () => {
    const onOpenMaki = vi.fn();
    renderNavBar({}, { onOpenMaki });

    fireEvent.click(screen.getByText("Mascota IA: Maki"));

    expect(onOpenMaki).toHaveBeenCalled();
  });

  it("el boton de sonido refleja el estado y llama a onToggleSound", () => {
    const onToggleSound = vi.fn();
    renderNavBar({}, { soundOn: true, onToggleSound });

    expect(screen.getByText("Música activada")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Música activada"));

    expect(onToggleSound).toHaveBeenCalled();
  });
});
