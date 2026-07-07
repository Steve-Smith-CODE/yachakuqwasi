import { searchHousingsTool } from '../../../../src/services/maki/tools.js';
import * as housingService from '../../../../src/services/housing.service.js';
import { supabaseAdmin } from '../../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../../helpers/testData.js';

const createdListingIds = [];

afterAll(async () => {
  for (const id of createdListingIds.splice(0)) {
    await supabaseAdmin.from('housing_listings').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

describe('searchHousingsTool', () => {
  it('busca alojamientos reales aprobados y mapea los campos esperados', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const { data: listing } = await supabaseAdmin
      .from('housing_listings')
      .insert({
        landlord_id: landlord.id,
        title: 'Habitacion para Maki',
        price_pen: 300,
        distance_to_unsch_minutes: 7,
        neighborhood: 'Maki Barrio Real',
        address: 'Jr. Maki 1',
        contact_phone: '900000000',
        status: 'approved'
      })
      .select()
      .single();
    createdListingIds.push(listing.id);

    const result = await searchHousingsTool.execute({ barrio: 'Maki Barrio Real' });

    expect(result.total).toBeGreaterThanOrEqual(1);
    const mapped = result.listings.find((l) => l.titulo === 'Habitacion para Maki');
    expect(mapped.barrio).toBe('Maki Barrio Real');
    expect(Number(mapped.precio_soles)).toBe(300);
    expect(mapped.minutos_a_la_unsch).toBe(7);
  });

  it('pasa tipo y precio_max cuando vienen con el tipo correcto (string/number)', async () => {
    const originalFn = housingService.listHousings;
    housingService.listHousings = jest.fn().mockResolvedValue([]);

    try {
      await searchHousingsTool.execute({ tipo: 'room', precio_max: 300, barrio: 'San Blas' });

      expect(housingService.listHousings).toHaveBeenCalledWith({
        tipo: 'room',
        precioMax: 300,
        barrio: 'San Blas'
      });
    } finally {
      housingService.listHousings = originalFn;
    }
  });

  it('ignora argumentos con tipos incorrectos (no son string/number)', async () => {
    const originalFn = housingService.listHousings;
    housingService.listHousings = jest.fn().mockResolvedValue([]);

    try {
      await searchHousingsTool.execute({ tipo: 123, precio_max: '200', barrio: 456 });

      expect(housingService.listHousings).toHaveBeenCalledWith({
        tipo: undefined,
        precioMax: undefined,
        barrio: undefined
      });
    } finally {
      housingService.listHousings = originalFn;
    }
  });

  it('devuelve como maximo 5 resultados', async () => {
    const originalFn = housingService.listHousings;
    const many = Array.from({ length: 8 }, (_, i) => ({
      title: `L${i}`,
      neighborhood: 'X',
      price_pen: 100,
      distance_to_unsch_minutes: 5
    }));
    housingService.listHousings = jest.fn().mockResolvedValue(many);

    try {
      const result = await searchHousingsTool.execute({});
      expect(result.total).toBe(8);
      expect(result.listings).toHaveLength(5);
    } finally {
      housingService.listHousings = originalFn;
    }
  });

  it('devuelve un error legible si listHousings falla', async () => {
    const originalFn = housingService.listHousings;
    housingService.listHousings = jest.fn().mockRejectedValue(new Error('DB caida'));

    try {
      const result = await searchHousingsTool.execute({});
      expect(result).toEqual({ error: 'No se pudo consultar el listado de alojamientos en este momento.' });
    } finally {
      housingService.listHousings = originalFn;
    }
  });
});
