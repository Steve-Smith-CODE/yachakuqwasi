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

async function createListing(landlordId) {
  const { data } = await supabaseAdmin
    .from('housing_listings')
    .insert({
      landlord_id: landlordId,
      title: 'Habitacion integration chat',
      price_pen: 250,
      distance_to_unsch_minutes: 5,
      neighborhood: 'San Blas',
      address: 'Jr. Chat Integration 1',
      contact_phone: '900000000',
      status: 'approved'
    })
    .select()
    .single();
  createdListingIds.push(data.id);
  return data;
}

describe('Chat Integration (Supabase local real)', () => {
  it('flujo completo: estudiante inicia chat, envia mensaje, arrendador lo lee y responde', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const studentToken = await loginAndGetToken(student);
    const landlordToken = await loginAndGetToken(landlord);
    const listing = await createListing(landlord.id);

    const startRes = await request(app)
      .post('/api/chats')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ landlordId: landlord.id, listingId: listing.id });
    expect(startRes.status).toBe(201);
    const chatId = startRes.body.id;
    createdChatIds.push(chatId);

    const msg1 = await request(app)
      .post(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ text: '¿Sigue disponible el cuarto?' });
    expect(msg1.status).toBe(201);
    expect(msg1.body.sender).toBe('student');

    const listRes = await request(app).get('/api/chats').set('Authorization', `Bearer ${landlordToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.map((c) => c.id)).toContain(chatId);

    const messagesRes = await request(app)
      .get(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(messagesRes.status).toBe(200);
    expect(messagesRes.body).toHaveLength(1);

    const reply = await request(app)
      .post(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ text: 'Si, sigue disponible' });
    expect(reply.status).toBe(201);
    expect(reply.body.sender).toBe('landlord');
  });

  it('un estudiante que no participa no puede leer los mensajes de otro chat (403)', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const intruso = await createRealUser({ role: 'student' });
    const studentToken = await loginAndGetToken(student);
    const intrusoToken = await loginAndGetToken(intruso);
    const listing = await createListing(landlord.id);

    const startRes = await request(app)
      .post('/api/chats')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ landlordId: landlord.id, listingId: listing.id });
    const chatId = startRes.body.id;
    createdChatIds.push(chatId);

    const res = await request(app)
      .get(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${intrusoToken}`);
    expect(res.status).toBe(403);
  });

  it('un arrendador no puede iniciar un chat (solo estudiantes) -> 403', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const otherLandlord = await createRealUser({ role: 'landlord' });
    const token = await loginAndGetToken(landlord);
    const listing = await createListing(otherLandlord.id);

    const res = await request(app)
      .post('/api/chats')
      .set('Authorization', `Bearer ${token}`)
      .send({ landlordId: otherLandlord.id, listingId: listing.id });
    expect(res.status).toBe(403);
  });

  it('rechaza iniciar chat sin token -> 401', async () => {
    const res = await request(app).post('/api/chats').send({ landlordId: 'x', listingId: 'y' });
    expect(res.status).toBe(401);
  });
});
