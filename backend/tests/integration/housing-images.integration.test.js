import request from 'supertest';
import app from '../../src/app.js';
import { supabaseAdmin } from '../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../helpers/testData.js';

const TINY_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const createdListingIds = [];

afterAll(async () => {
  for (const id of createdListingIds.splice(0)) {
    await supabaseAdmin.from('housing_listings').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

async function loginAndGetToken(user) {
  const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
  return res.body.token;
}

async function createListing(landlordId) {
  const { data } = await supabaseAdmin
    .from('housing_listings')
    .insert({
      landlord_id: landlordId,
      title: 'Habitacion para fotos integration',
      price_pen: 250,
      distance_to_unsch_minutes: 5,
      neighborhood: 'San Blas',
      address: 'Jr. Fotos 1',
      contact_phone: '900000000',
      status: 'pending'
    })
    .select()
    .single();
  createdListingIds.push(data.id);
  return data;
}

describe('Housing Images Integration (Supabase Storage real)', () => {
  it('el dueño (landlord) puede subir fotos a su propia publicacion', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const token = await loginAndGetToken(landlord);
    const listing = await createListing(landlord.id);

    const res = await request(app)
      .post(`/api/housings/${listing.id}/imagenes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ images: [TINY_PNG_BASE64] });

    expect(res.status).toBe(200);
    expect(res.body.images).toHaveLength(1);
    expect(res.body.images[0]).toMatch(/\.webp$/);
  });

  it('un admin puede subir fotos a la publicacion de otro', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const admin = await createRealUser({ role: 'admin' });
    const token = await loginAndGetToken(admin);
    const listing = await createListing(landlord.id);

    const res = await request(app)
      .post(`/api/housings/${listing.id}/imagenes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ images: [TINY_PNG_BASE64] });

    expect(res.status).toBe(200);
  });

  it('un arrendador NO puede subir fotos a la publicacion de otro arrendador (403)', async () => {
    const owner = await createRealUser({ role: 'landlord' });
    const intruso = await createRealUser({ role: 'landlord' });
    const token = await loginAndGetToken(intruso);
    const listing = await createListing(owner.id);

    const res = await request(app)
      .post(`/api/housings/${listing.id}/imagenes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ images: [TINY_PNG_BASE64] });

    expect(res.status).toBe(403);
  });

  it('rechaza sin token -> 401', async () => {
    const res = await request(app).post('/api/housings/00000000-0000-0000-0000-000000000000/imagenes').send({ images: [TINY_PNG_BASE64] });
    expect(res.status).toBe(401);
  });

  it('rechaza un body sin imagenes -> 400', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const token = await loginAndGetToken(landlord);
    const listing = await createListing(landlord.id);

    const res = await request(app)
      .post(`/api/housings/${listing.id}/imagenes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ images: [] });

    expect(res.status).toBe(400);
  });

  it('devuelve 404 si la publicacion no existe', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const token = await loginAndGetToken(landlord);

    const res = await request(app)
      .post('/api/housings/00000000-0000-0000-0000-000000000000/imagenes')
      .set('Authorization', `Bearer ${token}`)
      .send({ images: [TINY_PNG_BASE64] });

    expect(res.status).toBe(404);
  });
});
