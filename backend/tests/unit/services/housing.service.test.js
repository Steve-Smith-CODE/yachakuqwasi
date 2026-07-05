import { createHousing, listHousings } from '../../../src/services/housing.service.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

const createdListingIds = [];

afterAll(async () => {
  for (const id of createdListingIds.splice(0)) {
    await supabaseAdmin.from('housing_listings').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

describe('Housing Service (Supabase local real)', () => {
  describe('createHousing', () => {
    it('inserta la publicacion real con estado pending', async () => {
      const landlord = await createRealUser({ role: 'landlord', name: 'Arrendador Real' });

      const listing = await createHousing(landlord.id, {
        title: 'Habitacion real de prueba',
        description: 'Creada por test real',
        pricePen: 300,
        distanceToUnschMinutes: 12,
        neighborhood: 'San Blas',
        address: 'Jr. Real 123',
        contactPhone: '966000000',
        type: 'room'
      });
      createdListingIds.push(listing.id);

      expect(listing.landlord_id).toBe(landlord.id);
      expect(listing.status).toBe('pending');
      expect(listing.title).toBe('Habitacion real de prueba');
    });

    it('lanza error con statusCode 400 si falta un campo obligatorio (address NOT NULL)', async () => {
      const landlord = await createRealUser({ role: 'landlord' });

      await expect(
        createHousing(landlord.id, {
          title: 'Sin direccion',
          pricePen: 100,
          distanceToUnschMinutes: 5,
          neighborhood: 'Belén',
          contactPhone: '900000000'
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('listHousings', () => {
    it('solo devuelve publicaciones con estado approved', async () => {
      const landlord = await createRealUser({ role: 'landlord' });

      const { data: approved } = await supabaseAdmin
        .from('housing_listings')
        .insert({
          landlord_id: landlord.id,
          title: 'Aprobada real',
          price_pen: 200,
          distance_to_unsch_minutes: 5,
          neighborhood: 'Carmen Alto',
          address: 'Jr. Aprobada 1',
          contact_phone: '900000000',
          status: 'approved'
        })
        .select()
        .single();
      createdListingIds.push(approved.id);

      const { data: pending } = await supabaseAdmin
        .from('housing_listings')
        .insert({
          landlord_id: landlord.id,
          title: 'Pendiente real',
          price_pen: 200,
          distance_to_unsch_minutes: 5,
          neighborhood: 'Carmen Alto',
          address: 'Jr. Pendiente 1',
          contact_phone: '900000000',
          status: 'pending'
        })
        .select()
        .single();
      createdListingIds.push(pending.id);

      const result = await listHousings({ barrio: 'Carmen Alto' });
      const ids = result.map((r) => r.id);

      expect(ids).toContain(approved.id);
      expect(ids).not.toContain(pending.id);
    });

    it('filtra por precio maximo', async () => {
      const landlord = await createRealUser({ role: 'landlord' });

      const { data: barato } = await supabaseAdmin
        .from('housing_listings')
        .insert({
          landlord_id: landlord.id,
          title: 'Barata real',
          price_pen: 150,
          distance_to_unsch_minutes: 5,
          neighborhood: 'Santa Ana',
          address: 'Jr. Barata 1',
          contact_phone: '900000000',
          status: 'approved'
        })
        .select()
        .single();
      createdListingIds.push(barato.id);

      const { data: cara } = await supabaseAdmin
        .from('housing_listings')
        .insert({
          landlord_id: landlord.id,
          title: 'Cara real',
          price_pen: 500,
          distance_to_unsch_minutes: 5,
          neighborhood: 'Santa Ana',
          address: 'Jr. Cara 1',
          contact_phone: '900000000',
          status: 'approved'
        })
        .select()
        .single();
      createdListingIds.push(cara.id);

      const result = await listHousings({ barrio: 'Santa Ana', precioMax: 200 });
      const ids = result.map((r) => r.id);

      expect(ids).toContain(barato.id);
      expect(ids).not.toContain(cara.id);
    });

    it('lanza error con statusCode 500 si el tipo no es un valor valido del enum (error real de Postgres)', async () => {
      await expect(listHousings({ tipo: 'no-existe-este-tipo' })).rejects.toMatchObject({ statusCode: 500 });
    });
  });
});
