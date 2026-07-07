import { add, remove, list } from '../../../src/controllers/favorites.controller.js';
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
      title: 'Habitacion favorita controller',
      price_pen: 250,
      distance_to_unsch_minutes: 6,
      neighborhood: 'San Blas',
      address: 'Jr. Favorito Controller 1',
      contact_phone: '900000000',
      status: 'approved'
    })
    .select()
    .single();
  if (error) throw error;
  createdListingIds.push(data.id);
  return data;
}

describe('Favorites Controller (Supabase local real)', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  it('add agrega un favorito real y responde 201', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const listing = await insertApprovedListing(landlord.id);

    req.user = { id: student.id };
    req.body = { listingId: listing.id };
    await add(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.listing_id).toBe(listing.id);
  });

  it('remove elimina un favorito real y responde con el mensaje', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const listing = await insertApprovedListing(landlord.id);

    req.user = { id: student.id };
    req.body = { listingId: listing.id };
    await add(req, res);

    req.params.listingId = listing.id;
    await remove(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Favorito eliminado' });
  });

  it('list responde con los favoritos reales del estudiante autenticado', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const listing = await insertApprovedListing(landlord.id);

    req.user = { id: student.id };
    req.body = { listingId: listing.id };
    await add(req, res);

    req.user = { id: student.id };
    await list(req, res);

    const body = res.json.mock.calls[res.json.mock.calls.length - 1][0];
    expect(body.map((l) => l.id)).toContain(listing.id);
  });
});
