import { addFavorite, removeFavorite, listFavorites } from '../../../src/services/favorites.service.js';
import * as favoritesRepo from '../../../src/repositories/favorites.repository.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

const createdListingIds = [];

afterAll(async () => {
  for (const id of createdListingIds.splice(0)) {
    await supabaseAdmin.from('housing_listings').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

async function insertApprovedListing(landlordId) {
  const { data, error } = await supabaseAdmin
    .from('housing_listings')
    .insert({
      landlord_id: landlordId,
      title: 'Habitacion favorita real',
      price_pen: 250,
      distance_to_unsch_minutes: 6,
      neighborhood: 'San Blas',
      address: 'Jr. Favorito 1',
      contact_phone: '900000000',
      status: 'approved'
    })
    .select()
    .single();
  if (error) throw error;
  createdListingIds.push(data.id);
  return data;
}

describe('Favorites Service (Supabase local real)', () => {
  describe('addFavorite', () => {
    it('agrega un favorito real', async () => {
      const student = await createRealUser({ role: 'student' });
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await insertApprovedListing(landlord.id);

      const favorite = await addFavorite(student.id, listing.id);

      expect(favorite.user_id).toBe(student.id);
      expect(favorite.listing_id).toBe(listing.id);
    });

    it('lanza error con statusCode 400 si el listing_id no existe (violacion de FK real)', async () => {
      const student = await createRealUser({ role: 'student' });
      const fakeListingId = '00000000-0000-0000-0000-000000000000';

      await expect(addFavorite(student.id, fakeListingId)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('removeFavorite', () => {
    it('elimina un favorito real', async () => {
      const student = await createRealUser({ role: 'student' });
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await insertApprovedListing(landlord.id);
      await addFavorite(student.id, listing.id);

      const result = await removeFavorite(student.id, listing.id);

      expect(result).toEqual({ message: 'Favorito eliminado' });
      const { data } = await supabaseAdmin
        .from('favorites')
        .select('*')
        .eq('user_id', student.id)
        .eq('listing_id', listing.id);
      expect(data).toHaveLength(0);
    });

    it('lanza error con statusCode 400 si el repositorio falla', async () => {
      const originalFn = favoritesRepo.deleteFavorite;
      favoritesRepo.deleteFavorite = jest.fn().mockResolvedValue({ error: { message: 'fail' } });

      try {
        await expect(removeFavorite('cualquier-id', 'cualquier-listing')).rejects.toMatchObject({ statusCode: 400 });
      } finally {
        favoritesRepo.deleteFavorite = originalFn;
      }
    });
  });

  describe('listFavorites', () => {
    it('devuelve los alojamientos favoritos reales del estudiante', async () => {
      const student = await createRealUser({ role: 'student' });
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await insertApprovedListing(landlord.id);
      await addFavorite(student.id, listing.id);

      const favorites = await listFavorites(student.id);

      expect(favorites.map((l) => l.id)).toContain(listing.id);
    });

    it('lanza error con statusCode 500 si el repositorio falla', async () => {
      const originalFn = favoritesRepo.findFavoritesByUser;
      favoritesRepo.findFavoritesByUser = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });

      try {
        await expect(listFavorites('cualquier-id')).rejects.toMatchObject({ statusCode: 500 });
      } finally {
        favoritesRepo.findFavoritesByUser = originalFn;
      }
    });
  });
});
