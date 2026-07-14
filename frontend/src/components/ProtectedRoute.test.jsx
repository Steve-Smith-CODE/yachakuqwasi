import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { useAuth } from "../context/AuthContext.jsx";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Navigate: (props) => {
      mockNavigate(props);
      return null;
    }
  };
});

beforeEach(() => {
  mockNavigate.mockClear();
});

describe("ProtectedRoute", () => {
  it("redirige a /explorar y abre el modal de login si no esta autenticado", () => {
    const openAuthModal = vi.fn();
    useAuth.mockReturnValue({ user: null, isAuthenticated: false, openAuthModal });

    render(
      <ProtectedRoute>
        <div>Contenido privado</div>
      </ProtectedRoute>
    );

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/explorar", replace: true });
    expect(openAuthModal).toHaveBeenCalledWith("login");
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
  });

  it("redirige a /explorar si el rol del usuario no esta permitido", () => {
    useAuth.mockReturnValue({
      user: { id: "u1", role: "student" },
      isAuthenticated: true,
      openAuthModal: vi.fn()
    });

    render(
      <ProtectedRoute roles={["admin"]}>
        <div>Solo admin</div>
      </ProtectedRoute>
    );

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/explorar", replace: true });
    expect(screen.queryByText("Solo admin")).not.toBeInTheDocument();
  });

  it("renderiza los children si esta autenticado y el rol esta permitido", () => {
    useAuth.mockReturnValue({
      user: { id: "u1", role: "admin" },
      isAuthenticated: true,
      openAuthModal: vi.fn()
    });

    render(
      <ProtectedRoute roles={["admin"]}>
        <div>Panel admin</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Panel admin")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("renderiza los children si esta autenticado y no se restringe por rol", () => {
    useAuth.mockReturnValue({
      user: { id: "u1", role: "student" },
      isAuthenticated: true,
      openAuthModal: vi.fn()
    });

    render(
      <ProtectedRoute>
        <div>Cualquier autenticado</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Cualquier autenticado")).toBeInTheDocument();
  });
});
