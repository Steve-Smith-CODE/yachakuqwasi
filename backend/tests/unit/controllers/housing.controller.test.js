import { create, list, mine, show } from '../../../src/controllers/housing.controller.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

const createdListingIds = [];

afterAll(async () => {
  for (const id of createdListingIds.splice(0)) {
    await supabaseAdmin.from('housing_listings').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

describe('Housing Controller (Supabase local real)', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  it('create publica una habitacion real con el landlord autenticado y responde 201', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    req.user = { id: landlord.id };
    req.body = {
      title: 'Habitacion Controller Real',
      pricePen: 280,
      distanceToUnschMinutes: 9,
      neighborhood: 'San Blas',
      address: 'Jr. Controller 1',
      contactPhone: '900000000'
    };

    await create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.landlord_id).toBe(landlord.id);
    createdListingIds.push(body.id);
  });

  it('list devuelve solo publicaciones aprobadas reales aplicando filtros', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const { data: approved } = await supabaseAdmin
      .from('housing_listings')
      .insert({
        landlord_id: landlord.id,
        title: 'Approved Controller Real',
        price_pen: 220,
        distance_to_unsch_minutes: 6,
        neighborhood: 'Belén',
        address: 'Jr. Belen 1',
        contact_phone: '900000000',
        status: 'approved'
      })
      .select()
      .single();
    createdListingIds.push(approved.id);

    req.query = { barrio: 'Belén' };
    await list(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.map((l) => l.id)).toContain(approved.id);
  });

  it('mine devuelve solo las publicaciones reales del arrendador autenticado', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const { data: listing } = await supabaseAdmin
      .from('housing_listings')
      .insert({
        landlord_id: landlord.id,
        title: 'Mia controller real',
        price_pen: 200,
        distance_to_unsch_minutes: 5,
        neighborhood: 'San Blas',
        address: 'Jr. Mia Controller 1',
        contact_phone: '900000000',
        status: 'pending'
      })
      .select()
      .single();
    createdListingIds.push(listing.id);

    req.user = { id: landlord.id };
    await mine(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.map((l) => l.id)).toContain(listing.id);
  });

  it('show devuelve la publicacion aprobada real por id', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const { data: listing } = await supabaseAdmin
      .from('housing_listings')
      .insert({
        landlord_id: landlord.id,
        title: 'Show controller real',
        price_pen: 260,
        distance_to_unsch_minutes: 7,
        neighborhood: 'San Blas',
        address: 'Jr. Show 1',
        contact_phone: '900000000',
        status: 'approved'
      })
      .select()
      .single();
    createdListingIds.push(listing.id);

    req.params = { id: listing.id };
    await show(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.id).toBe(listing.id);
  });
});
