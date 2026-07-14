import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExplorePage from "./ExplorePage.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useHousingSearch } from "../hooks/useHousingSearch.js";
import { useFavorites } from "../hooks/useFavorites.js";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

vi.mock("../hooks/useHousingSearch.js", () => ({
  useHousingSearch: vi.fn()
}));

vi.mock("../hooks/useFavorites.js", () => ({
  useFavorites: vi.fn()
}));

vi.mock("../components/ListingsMap.jsx", () => ({
  default: () => <div data-testid="listings-map" />
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/explorar" })
  };
});

const LISTING = {
  id: "h1",
  title: "Cuarto cerca al campus",
  type: "room",
  neighborhood: "Yanamilla",
  address: "Jr. Los Álamos 123",
  distance_to_unsch_minutes: 5,
  price_pen: 300,
  contact_phone: "966123456",
  images: [],
  amenities: []
};

function baseSearch(overrides = {}) {
  return {
    loading: false,
    loadingMore: false,
    error: "",
    hasMore: false,
    barrio: "",
    setBarrio: vi.fn(),
    tipo: "",
    setTipo: vi.fn(),
    searchQuery: "",
    setSearchQuery: vi.fn(),
    roomSearch: "",
    setRoomSearch: vi.fn(),
    visibleListings: [LISTING],
    load: vi.fn().mockResolvedValue([LISTING]),
    loadMore: vi.fn(),
    resetFilters: vi.fn(),
    ...overrides
  };
}

beforeEach(() => {
  mockNavigate.mockClear();
  useAuth.mockReturnValue({ isAuthenticated: false, user: null, token: null, openAuthModal: vi.fn() });
  useFavorites.mockReturnValue({ favoriteIds: new Set(), toggleFavorite: vi.fn() });
  useHousingSearch.mockReturnValue(baseSearch());
});

describe("ExplorePage", () => {
  it("muestra el estado de carga de las publicaciones", () => {
    useHousingSearch.mockReturnValue(baseSearch({ loading: true }));
    render(<ExplorePage />);
    expect(screen.getByText("Cargando publicaciones reales...")).toBeInTheDocument();
  });

  it("muestra el conteo de habitaciones cuando no esta cargando", () => {
    render(<ExplorePage />);
    expect(screen.getByText(/1 habitaciones/)).toBeInTheDocument();
  });

  it("muestra el error de busqueda si existe", () => {
    useHousingSearch.mockReturnValue(baseSearch({ error: "No se pudo conectar con el servidor." }));
    render(<ExplorePage />);
    expect(screen.getByText("No se pudo conectar con el servidor.")).toBeInTheDocument();
  });

  it("buscar zona llama a load()", async () => {
    const search = baseSearch();
    useHousingSearch.mockReturnValue(search);
    render(<ExplorePage />);

    fireEvent.submit(screen.getByPlaceholderText("Ej. San Blas, Carmen Alto..."));

    await waitFor(() => expect(search.load).toHaveBeenCalled());
  });

  it("click en un tipo llama a setTipo y a load con ese valor", async () => {
    const search = baseSearch();
    useHousingSearch.mockReturnValue(search);
    render(<ExplorePage />);

    fireEvent.click(screen.getByText("Individual"));

    expect(search.setTipo).toHaveBeenCalledWith("room");
    await waitFor(() => expect(search.load).toHaveBeenCalledWith("room"));
  });

  it("abrir una habitacion navega a /habitacion/:id con el listing en el state", () => {
    render(<ExplorePage />);

    fireEvent.click(screen.getByText("Cuarto cerca al campus"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/habitacion/h1",
      expect.objectContaining({ state: expect.objectContaining({ listing: LISTING }) })
    );
  });

  it("favorito sin autenticar abre el modal de login en vez de togglear", () => {
    const openAuthModal = vi.fn();
    const toggleFavorite = vi.fn();
    useAuth.mockReturnValue({ isAuthenticated: false, user: null, token: null, openAuthModal });
    useFavorites.mockReturnValue({ favoriteIds: new Set(), toggleFavorite });
    render(<ExplorePage />);

    fireEvent.click(document.querySelector(".lucide-heart").closest("button"));

    expect(openAuthModal).toHaveBeenCalledWith("login");
    expect(toggleFavorite).not.toHaveBeenCalled();
  });

  it("favorito autenticado llama a toggleFavorite", () => {
    const toggleFavorite = vi.fn();
    useAuth.mockReturnValue({ isAuthenticated: true, user: { role: "student" }, token: "tok", openAuthModal: vi.fn() });
    useFavorites.mockReturnValue({ favoriteIds: new Set(), toggleFavorite });
    render(<ExplorePage />);

    fireEvent.click(document.querySelector(".lucide-heart").closest("button"));

    expect(toggleFavorite).toHaveBeenCalledWith(LISTING);
  });

  it("muestra Cargar mas habitaciones cuando hasMore es true, y llama a loadMore", () => {
    const search = baseSearch({ hasMore: true });
    useHousingSearch.mockReturnValue(search);
    render(<ExplorePage />);

    fireEvent.click(screen.getByText("Cargar más habitaciones"));

    expect(search.loadMore).toHaveBeenCalled();
  });

  it("sin resultados muestra Restablecer Filtros y llama a resetFilters", () => {
    const search = baseSearch({ visibleListings: [] });
    useHousingSearch.mockReturnValue(search);
    render(<ExplorePage />);

    fireEvent.click(screen.getByText("Restablecer Filtros"));

    expect(search.resetFilters).toHaveBeenCalled();
  });

  it("Publicar Gratis abre el registro si no es arrendador/admin autenticado", () => {
    const openAuthModal = vi.fn();
    useAuth.mockReturnValue({ isAuthenticated: false, user: null, token: null, openAuthModal });
    render(<ExplorePage />);

    fireEvent.click(screen.getByText("Publicar Gratis"));

    expect(openAuthModal).toHaveBeenCalledWith("signup");
    expect(mockNavigate).not.toHaveBeenCalledWith("/publicar");
  });

  it("Publicar Gratis navega a /publicar si es arrendador autenticado", () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { role: "landlord" }, token: "tok", openAuthModal: vi.fn() });
    render(<ExplorePage />);

    fireEvent.click(screen.getByText("Publicar Gratis"));

    expect(mockNavigate).toHaveBeenCalledWith("/publicar");
  });
});
