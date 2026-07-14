import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "./DashboardPage.jsx";
import { useAuth } from "../context/AuthContext.jsx";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn()
}));

vi.mock("./StudentDashboard.jsx", () => ({
  default: () => <div data-testid="student-dashboard" />
}));

vi.mock("./LandlordDashboard.jsx", () => ({
  default: () => <div data-testid="landlord-dashboard" />
}));

beforeEach(() => {
  useAuth.mockReset();
});

describe("DashboardPage", () => {
  it("saluda al usuario por su nombre", () => {
    useAuth.mockReturnValue({ user: { name: "Ana Torres", role: "student", is_verified: false } });
    render(<DashboardPage />);
    expect(screen.getByText(/¡Allillanchu, Ana Torres!/)).toBeInTheDocument();
  });

  it("muestra el badge Verificado por Maki solo si is_verified", () => {
    useAuth.mockReturnValue({ user: { name: "Ana", role: "student", is_verified: true } });
    const { rerender } = render(<DashboardPage />);
    expect(screen.getByText("Verificado por Maki")).toBeInTheDocument();

    useAuth.mockReturnValue({ user: { name: "Ana", role: "student", is_verified: false } });
    rerender(<DashboardPage />);
    expect(screen.queryByText("Verificado por Maki")).not.toBeInTheDocument();
  });

  it("estudiante: muestra el intro de estudiante y StudentDashboard", () => {
    useAuth.mockReturnValue({ user: { name: "Ana", role: "student", is_verified: false } });
    render(<DashboardPage />);

    expect(screen.getByText(/carnet digital/)).toBeInTheDocument();
    expect(screen.getByTestId("student-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("landlord-dashboard")).not.toBeInTheDocument();
  });

  it("arrendador: muestra el intro de arrendador y LandlordDashboard", () => {
    useAuth.mockReturnValue({ user: { name: "Luis", role: "landlord", is_verified: false } });
    render(<DashboardPage />);

    expect(screen.getByText(/monitorea las solicitudes/)).toBeInTheDocument();
    expect(screen.getByTestId("landlord-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("student-dashboard")).not.toBeInTheDocument();
  });
});
