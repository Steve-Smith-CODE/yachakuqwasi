import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";
import { useAuth } from "./context/AuthContext.jsx";

vi.mock("./context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

vi.mock("./pages/ExplorePage.jsx", () => ({ default: () => <div>Pagina Explorar</div> }));
vi.mock("./pages/LoginPage.jsx", () => ({ default: () => <div>Pagina Login</div> }));
vi.mock("./pages/ListingDetailPage.jsx", () => ({ default: () => <div>Pagina Detalle Habitacion</div> }));
vi.mock("./pages/PublishPage.jsx", () => ({ default: () => <div>Pagina Publicar</div> }));
vi.mock("./pages/AdminPage.jsx", () => ({ default: () => <div>Pagina Admin</div> }));
vi.mock("./pages/DashboardPage.jsx", () => ({ default: () => <div>Pagina Portal</div> }));
vi.mock("./pages/AccountSettingsPage.jsx", () => ({ default: () => <div>Pagina Cuenta</div> }));
vi.mock("./pages/ResetPasswordPage.jsx", () => ({ default: () => <div>Pagina Restablecer</div> }));

vi.mock("./components/NavBar.jsx", () => ({
  default: ({ onToggleSound, soundOn }) => (
    <div data-testid="navbar" data-sound-on={String(soundOn)}>
      <button onClick={onToggleSound}>Toggle Sound</button>
    </div>
  )
}));
vi.mock("./components/MakiChat.jsx", () => ({ default: () => null }));
vi.mock("./components/AuthModal.jsx", () => ({ default: () => null }));

function setAuth(overrides = {}) {
  useAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    openAuthModal: vi.fn(),
    ...overrides
  });
}

function renderApp(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAuth.mockReset();
});

describe("App routing", () => {
  it("/ redirige a /explorar", async () => {
    setAuth();
    renderApp("/");
    expect(await screen.findByText("Pagina Explorar")).toBeInTheDocument();
  });

  it("una ruta desconocida redirige a /explorar", async () => {
    setAuth();
    renderApp("/esto-no-existe");
    expect(await screen.findByText("Pagina Explorar")).toBeInTheDocument();
  });

  it("/login muestra la pagina de login", async () => {
    setAuth();
    renderApp("/login");
    expect(await screen.findByText("Pagina Login")).toBeInTheDocument();
  });

  it("/restablecer-password muestra esa pagina", async () => {
    setAuth();
    renderApp("/restablecer-password");
    expect(await screen.findByText("Pagina Restablecer")).toBeInTheDocument();
  });

  it("/habitacion/:id sin backgroundLocation se resuelve como pantalla normal", async () => {
    setAuth();
    renderApp("/habitacion/h1");
    expect(await screen.findByText("Pagina Detalle Habitacion")).toBeInTheDocument();
  });

  it("/publicar sin sesion redirige a explorar (ProtectedRoute)", async () => {
    setAuth({ isAuthenticated: false, user: null });
    renderApp("/publicar");
    expect(await screen.findByText("Pagina Explorar")).toBeInTheDocument();
  });

  it("/publicar autenticado como arrendador muestra la pagina de publicar", async () => {
    setAuth({ isAuthenticated: true, user: { role: "landlord" } });
    renderApp("/publicar");
    expect(await screen.findByText("Pagina Publicar")).toBeInTheDocument();
  });

  it("/publicar autenticado como estudiante redirige (rol no permitido)", async () => {
    setAuth({ isAuthenticated: true, user: { role: "student" } });
    renderApp("/publicar");
    expect(await screen.findByText("Pagina Explorar")).toBeInTheDocument();
  });

  it("/portal autenticado como estudiante muestra el dashboard", async () => {
    setAuth({ isAuthenticated: true, user: { role: "student" } });
    renderApp("/portal");
    expect(await screen.findByText("Pagina Portal")).toBeInTheDocument();
  });

  it("/admin sin ser admin redirige a explorar", async () => {
    setAuth({ isAuthenticated: true, user: { role: "landlord" } });
    renderApp("/admin");
    expect(await screen.findByText("Pagina Explorar")).toBeInTheDocument();
  });

  it("/admin autenticado como admin muestra el panel", async () => {
    setAuth({ isAuthenticated: true, user: { role: "admin" } });
    renderApp("/admin");
    expect(await screen.findByText("Pagina Admin")).toBeInTheDocument();
  });

  it("/cuenta solo requiere estar autenticado, sin importar el rol", async () => {
    setAuth({ isAuthenticated: true, user: { role: "student" } });
    renderApp("/cuenta");
    expect(await screen.findByText("Pagina Cuenta")).toBeInTheDocument();
  });

  it("toggleSound reproduce/pausa el audio y refleja el estado en NavBar", async () => {
    setAuth();
    renderApp("/explorar");
    await screen.findByText("Pagina Explorar");

    const navbar = screen.getByTestId("navbar");
    expect(navbar).toHaveAttribute("data-sound-on", "false");

    fireEvent.click(screen.getByText("Toggle Sound"));
    expect(screen.getByTestId("navbar")).toHaveAttribute("data-sound-on", "true");

    fireEvent.click(screen.getByText("Toggle Sound"));
    expect(screen.getByTestId("navbar")).toHaveAttribute("data-sound-on", "false");
  });
});
