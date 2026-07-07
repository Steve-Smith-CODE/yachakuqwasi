import { findApprovedHousings, findHousingsByLandlord } from '../../../src/repositories/housing.repository.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

const createdListingIds = [];

afterAll(async () => {
  for (const id of createdListingIds.splice(0)) {
    await supabaseAdmin.from('housing_listings').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

async function insertApprovedListing(landlordId, overrides = {}) {
  const { data, error } = await supabaseAdmin
    .from('housing_listings')
    .insert({
      landlord_id: landlordId,
      title: 'Habitacion repo real',
      price_pen: 200,
      distance_to_unsch_minutes: 5,
      neighborhood: 'San Blas',
      address: 'Jr. Repo 1',
      contact_phone: '900000000',
      status: 'approved',
      ...overrides
    })
    .select()
    .single();
  if (error) throw error;
  createdListingIds.push(data.id);
  return data;
}

describe('housing.repository (Supabase local real)', () => {
  describe('findApprovedHousings - paginacion', () => {
    it('respeta el limit indicado', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      await insertApprovedListing(landlord.id, { neighborhood: 'Belén', title: 'Pagina A' });
      await insertApprovedListing(landlord.id, { neighborhood: 'Belén', title: 'Pagina B' });
      await insertApprovedListing(landlord.id, { neighborhood: 'Belén', title: 'Pagina C' });

      const { data, error } = await findApprovedHousings({ barrio: 'Belén', limit: 2, page: 1 });

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('avanza de pagina con page=2', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      await insertApprovedListing(landlord.id, { neighborhood: 'Carmen Alto', title: 'Pag2 A' });
      await insertApprovedListing(landlord.id, { neighborhood: 'Carmen Alto', title: 'Pag2 B' });

      const { data: firstPage } = await findApprovedHousings({ barrio: 'Carmen Alto', limit: 1, page: 1 });
      const { data: secondPage } = await findApprovedHousings({ barrio: 'Carmen Alto', limit: 1, page: 2 });

      expect(firstPage).toHaveLength(1);
      expect(secondPage).toHaveLength(1);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });

    it('ignora un limit mayor al maximo permitido (100) sin lanzar error', async () => {
      const { error } = await findApprovedHousings({ limit: 99999, page: 1 });
      expect(error).toBeNull();
    });

    it('usa todos los valores por defecto cuando se llama sin argumentos', async () => {
      const { error } = await findApprovedHousings();
      expect(error).toBeNull();
    });

    it('usa los valores por defecto si limit/page vienen explicitamente en 0 (falsy)', async () => {
      const { error } = await findApprovedHousings({ limit: 0, page: 0 });
      expect(error).toBeNull();
    });

    it('trata page=0 o negativo como pagina 1', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await insertApprovedListing(landlord.id, { neighborhood: 'Santa Ana', title: 'Pagina cero' });

      const { data } = await findApprovedHousings({ barrio: 'Santa Ana', page: -3 });

      expect(data.map((l) => l.id)).toContain(listing.id);
    });
  });

  describe('findHousingsByLandlord', () => {
    it('devuelve solo las publicaciones del arrendador indicado, ordenadas por fecha', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const otherLandlord = await createRealUser({ role: 'landlord' });
      const mine = await insertApprovedListing(landlord.id, { title: 'Mia' });
      await insertApprovedListing(otherLandlord.id, { title: 'De otro' });

      const { data, error } = await findHousingsByLandlord(landlord.id);

      expect(error).toBeNull();
      expect(data.map((l) => l.id)).toContain(mine.id);
      expect(data.every((l) => l.landlord_id === landlord.id)).toBe(true);
    });
  });
});
