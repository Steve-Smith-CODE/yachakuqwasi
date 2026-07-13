import { describe, it, expect } from "vitest";
import { dailySeries, buildRegistrationTrend, periodTrend } from "./adminStats.js";

const NOW = new Date("2026-07-13T15:00:00Z");

function itemAt(daysAgo) {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return { created_at: d.toISOString() };
}

describe("dailySeries", () => {
  it("devuelve un balde por cada uno de los ultimos N dias, incluyendo hoy", () => {
    const series = dailySeries([], 7, NOW);
    expect(series).toHaveLength(7);
    expect(series[6].date.toDateString()).toBe(NOW.toDateString());
  });

  it("cuenta los items en el dia correcto segun created_at", () => {
    const items = [itemAt(0), itemAt(0), itemAt(2)];
    const series = dailySeries(items, 7, NOW);
    expect(series[6].count).toBe(2);
    expect(series[4].count).toBe(1);
    expect(series[5].count).toBe(0);
  });

  it("ignora items sin created_at", () => {
    const series = dailySeries([{ id: "x" }], 7, NOW);
    expect(series.reduce((acc, b) => acc + b.count, 0)).toBe(0);
  });
});

describe("buildRegistrationTrend", () => {
  it("combina series de usuarios y anuncios por fecha", () => {
    const users = [itemAt(0), itemAt(0)];
    const housings = [itemAt(0)];
    const trend = buildRegistrationTrend(users, housings, 7, NOW);

    expect(trend).toHaveLength(7);
    const today = trend[6];
    expect(today.usuarios).toBe(2);
    expect(today.anuncios).toBe(1);
    expect(today.date).toEqual(expect.any(String));
  });
});

describe("periodTrend", () => {
  it("reporta 'up' cuando el periodo actual tiene mas items que el anterior", () => {
    const items = [itemAt(0), itemAt(1), itemAt(8)];
    const result = periodTrend(items, 7, NOW);
    expect(result.direction).toBe("up");
    expect(result.pct).toBeGreaterThan(0);
  });

  it("reporta 'down' cuando el periodo actual tiene menos items que el anterior", () => {
    const items = [itemAt(0), itemAt(8), itemAt(9), itemAt(10)];
    const result = periodTrend(items, 7, NOW);
    expect(result.direction).toBe("down");
    expect(result.pct).toBeGreaterThan(0);
  });

  it("reporta 'flat' cuando no hay items en ninguno de los dos periodos", () => {
    const result = periodTrend([], 7, NOW);
    expect(result).toEqual({ direction: "flat", pct: 0 });
  });

  it("reporta 'up' al 100% cuando hay items nuevos pero el periodo anterior estaba en cero", () => {
    const items = [itemAt(0), itemAt(1)];
    const result = periodTrend(items, 7, NOW);
    expect(result).toEqual({ direction: "up", pct: 100 });
  });
});
