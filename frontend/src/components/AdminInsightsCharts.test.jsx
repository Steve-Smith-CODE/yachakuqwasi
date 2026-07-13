import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminInsightsCharts from "./AdminInsightsCharts.jsx";

const TREND = [
  { date: "01/07", usuarios: 2, anuncios: 1 },
  { date: "02/07", usuarios: 0, anuncios: 3 }
];

describe("AdminInsightsCharts", () => {
  it("renderiza el grafico de tendencia de registros con su titulo", () => {
    render(<AdminInsightsCharts registrationTrend={TREND} housingByStatus={{}} />);
    expect(screen.getByText("Tendencia de Registros")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /gráfico de línea/i })).toBeInTheDocument();
  });

  it("muestra la leyenda con las cantidades reales por estado", () => {
    render(
      <AdminInsightsCharts
        registrationTrend={TREND}
        housingByStatus={{ approved: 5, pending: 2, suspended: 0, flagged: 1 }}
      />
    );

    expect(screen.getByText("Aprobadas")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Pendientes")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Observadas")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("omite los estados en cero de la leyenda", () => {
    render(<AdminInsightsCharts registrationTrend={TREND} housingByStatus={{ approved: 3, suspended: 0 }} />);

    expect(screen.getByText("Aprobadas")).toBeInTheDocument();
    expect(screen.queryByText("Suspendidas")).not.toBeInTheDocument();
  });

  it("muestra un mensaje cuando no hay anuncios publicados todavia", () => {
    render(<AdminInsightsCharts registrationTrend={TREND} housingByStatus={{}} />);
    expect(screen.getByText("Todavía no hay anuncios publicados.")).toBeInTheDocument();
  });
});
