import { listHousings } from '../housing.service.js';

// Definicion de herramientas agnostica al proveedor de IA: describe que
// puede hacer Maki y como ejecutarlo, sin saber nada de Gemini/Groq. La capa
// que sabe hablar con cada proveedor (maki.service.js / groq.provider.js)
// traduce esto a su formato.
export const searchHousingsTool = {
  name: 'search_housings',
  description:
    'Busca alojamientos ya aprobados y disponibles en YachakuqWasi, filtrando opcionalmente por barrio, tipo (room/apartment/shared/family) y precio mensual maximo en soles.',
  parameters: {
    type: 'OBJECT',
    properties: {
      barrio: { type: 'STRING', description: 'Distrito de la provincia de Huamanga, ej. San Juan Bautista' },
      tipo: { type: 'STRING', description: 'room, apartment, shared o family' },
      precio_max: { type: 'NUMBER', description: 'Precio mensual maximo en soles' }
    }
  },
  execute: async (args) => {
    try {
      const listings = await listHousings({
        tipo: typeof args.tipo === 'string' ? args.tipo : undefined,
        precioMax: typeof args.precio_max === 'number' ? args.precio_max : undefined,
        barrio: typeof args.barrio === 'string' ? args.barrio : undefined
      });

      return {
        total: listings.length,
        listings: listings.slice(0, 5).map((l) => ({
          titulo: l.title,
          barrio: l.neighborhood,
          precio_soles: l.price_pen,
          minutos_a_la_unsch: l.distance_to_unsch_minutes
        }))
      };
    } catch {
      return { error: 'No se pudo consultar el listado de alojamientos en este momento.' };
    }
  }
};

export const makiTools = [searchHousingsTool];
