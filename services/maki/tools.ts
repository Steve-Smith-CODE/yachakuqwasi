// Definicion de herramientas agnostica al proveedor de IA: describe que
// puede hacer Maki y como ejecutarlo, sin saber nada de Gemini. La capa que
// sabe hablar con Gemini (maki.service.ts) traduce esto a su formato.
export interface MakiTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5001/api";

export const searchHousingsTool: MakiTool = {
  name: "search_housings",
  description:
    "Busca alojamientos ya aprobados y disponibles en YachakuqWasi, filtrando opcionalmente por barrio, tipo (room/apartment/shared/family) y precio mensual maximo en soles.",
  parameters: {
    type: "OBJECT",
    properties: {
      barrio: { type: "STRING", description: "Barrio de Ayacucho, ej. San Blas" },
      tipo: { type: "STRING", description: "room, apartment, shared o family" },
      precio_max: { type: "NUMBER", description: "Precio mensual maximo en soles" },
    },
  },
  execute: async (args) => {
    const url = new URL(`${BACKEND_API_URL}/housings`);
    if (typeof args.barrio === "string") url.searchParams.set("barrio", args.barrio);
    if (typeof args.tipo === "string") url.searchParams.set("tipo", args.tipo);
    if (typeof args.precio_max === "number") url.searchParams.set("precio_max", String(args.precio_max));

    try {
      const res = await fetch(url);
      if (!res.ok) {
        return { error: "No se pudo consultar el listado de alojamientos en este momento." };
      }
      const listings = (await res.json()) as Array<Record<string, unknown>>;
      return {
        total: listings.length,
        listings: listings.slice(0, 5).map((l) => ({
          titulo: l.title,
          barrio: l.neighborhood,
          precio_soles: l.price_pen,
          minutos_a_la_unsch: l.distance_to_unsch_minutes,
        })),
      };
    } catch {
      return { error: "El backend de alojamientos no esta disponible en este momento." };
    }
  },
};

export const makiTools: MakiTool[] = [searchHousingsTool];
