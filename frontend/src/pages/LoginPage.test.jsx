import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import LoginPage from "./LoginPage.jsx";
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

describe("LoginPage", () => {
  it("abre el modal de login y redirige a /explorar (ruta legacy /login)", () => {
    const openAuthModal = vi.fn();
    useAuth.mockReturnValue({ openAuthModal });

    render(<LoginPage />);

    expect(openAuthModal).toHaveBeenCalledWith("login");
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/explorar", replace: true });
  });
});
