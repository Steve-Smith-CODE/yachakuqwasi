import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Home } from "lucide-react";
import StatCard from "./StatCard.jsx";

describe("StatCard", () => {
  it("muestra label, valor e icono", () => {
    render(<StatCard icon={Home} label="Anuncios activos" value={12} />);

    expect(screen.getByText("Anuncios activos")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(document.querySelector(".lucide-house")).toBeInTheDocument();
  });

  it("muestra el hint cuando se provee", () => {
    render(<StatCard label="Vistas" value={100} hint="Últimos 30 días" />);
    expect(screen.getByText("Últimos 30 días")).toBeInTheDocument();
  });

  it("no muestra hint si no se provee", () => {
    render(<StatCard label="Vistas" value={100} />);
    expect(screen.queryByText(/últimos/i)).not.toBeInTheDocument();
  });

  it("aplica la clase de color segun el tone", () => {
    render(<StatCard label="Pendientes" value={3} tone="amber" />);
    expect(screen.getByText("3")).toHaveClass("text-amber-600");
  });

  it("usa tone slate por defecto si no se reconoce", () => {
    render(<StatCard label="Otros" value={5} tone="inexistente" />);
    expect(screen.getByText("5")).toHaveClass("text-slate-900");
  });

  it("renderiza children en vez de value/hint cuando se proveen", () => {
    render(
      <StatCard label="Custom">
        <span>Contenido custom</span>
      </StatCard>
    );
    expect(screen.getByText("Contenido custom")).toBeInTheDocument();
  });

  it("no muestra badge de tendencia si no se provee trend", () => {
    render(<StatCard label="Vistas" value={100} />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("muestra badge de tendencia 'up' en verde con el porcentaje", () => {
    render(<StatCard label="Cuentas" value={50} trend={{ direction: "up", pct: 12 }} />);
    const badge = screen.getByText("12%");
    expect(badge).toHaveClass("text-emerald-600");
  });

  it("muestra badge de tendencia 'down' en rojo con el porcentaje", () => {
    render(<StatCard label="Cuentas" value={50} trend={{ direction: "down", pct: 8 }} />);
    const badge = screen.getByText("8%");
    expect(badge).toHaveClass("text-red-600");
  });

  it("muestra badge de tendencia 'flat' en gris con 0%", () => {
    render(<StatCard label="Cuentas" value={50} trend={{ direction: "flat", pct: 0 }} />);
    const badge = screen.getByText("0%");
    expect(badge).toHaveClass("text-slate-500");
  });
});
