import request from 'supertest';
import app from '../../src/app.js';
import { supabaseAdmin } from '../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../helpers/testData.js';

const createdListingIds = [];
const createdChatIds = [];

afterAll(async () => {
  for (const id of createdChatIds.splice(0)) {
    await supabaseAdmin.from('chats').delete().eq('id', id).catch?.(() => {});
  }
  for (const id of createdListingIds.splice(0)) {
    await supabaseAdmin.from('housing_listings').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

async function loginAndGetToken(user) {
  const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
  return res.body.token;
}

async function createListing(landlordId, status = 'approved') {
  const { data } = await supabaseAdmin
    .from('housing_listings')
    .insert({
      landlord_id: landlordId,
      title: 'Habitacion integration stats',
      price_pen: 250,
      distance_to_unsch_minutes: 5,
      neighborhood: 'San Blas',
      address: 'Jr. Stats Integration 1',
      contact_phone: '900000000',
      status
    })
    .select()
    .single();
  createdListingIds.push(data.id);
  return data;
}

describe('Stats Integration (Supabase local real)', () => {
  it('GET /api/stats/estudiante devuelve conteos reales de favoritos y chats', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const studentToken = await loginAndGetToken(student);
    const listing = await createListing(landlord.id);

    await request(app)
      .post('/api/favoritos')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ listingId: listing.id });

    const chatRes = await request(app)
      .post('/api/chats')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ landlordId: landlord.id, listingId: listing.id });
    createdChatIds.push(chatRes.body.id);

    const res = await request(app).get('/api/stats/estudiante').set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.savedFavorites).toBe(1);
    expect(res.body.activeChats).toBe(1);
  });

  it('GET /api/stats/arrendador devuelve conteos reales de anuncios, favoritos recibidos y contactos', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const student = await createRealUser({ role: 'student' });
    const landlordToken = await loginAndGetToken(landlord);
    const studentToken = await loginAndGetToken(student);

    const approved = await createListing(landlord.id, 'approved');
    await createListing(landlord.id, 'pending');

    await request(app)
      .post('/api/favoritos')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ listingId: approved.id });

    const chatRes = await request(app)
      .post('/api/chats')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ landlordId: landlord.id, listingId: approved.id });
    createdChatIds.push(chatRes.body.id);

    const res = await request(app).get('/api/stats/arrendador').set('Authorization', `Bearer ${landlordToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalListings).toBe(2);
    expect(res.body.listingsByStatus.approved).toBe(1);
    expect(res.body.listingsByStatus.pending).toBe(1);
    expect(res.body.favoritesReceived).toBe(1);
    expect(res.body.contactsReceived).toBe(1);
  });

  it('un estudiante no puede pedir /api/stats/arrendador (403)', async () => {
    const student = await createRealUser({ role: 'student' });
    const token = await loginAndGetToken(student);

    const res = await request(app).get('/api/stats/arrendador').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('rechaza peticiones sin token', async () => {
    const res = await request(app).get('/api/stats/estudiante');
    expect(res.status).toBe(401);
  });
});
