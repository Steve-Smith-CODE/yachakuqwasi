import request from 'supertest';
import app from '../../src/app.js';
import { supabaseAdmin } from '../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../helpers/testData.js';

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

describe('Housing Integration (Supabase local real)', () => {
  it('debe publicar un alojamiento real correctamente si el usuario es arrendador', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const token = await loginAndGetToken(landlord);

    const housingData = {
      title: 'Habitacion centrica integration',
      description: 'Cerca de la universidad UNSCH',
      pricePen: 350,
      address: 'Jr. Ayacucho 123, Huamanga',
      neighborhood: 'San Blas',
      distanceToUnschMinutes: 10,
      contactPhone: '966123456',
      type: 'room'
    };

    const res = await request(app).post('/api/housings').set('Authorization', `Bearer ${token}`).send(housingData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('pending');
    createdListingIds.push(res.body.id);
  });

  it('debe rechazar la publicacion si el usuario autenticado no es arrendador ni admin', async () => {
    const student = await createRealUser({ role: 'student' });
    const token = await loginAndGetToken(student);

    const res = await request(app)
      .post('/api/housings')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'No deberia poder' });

    expect(res.status).toBe(403);
  });

  it('debe rechazar la publicacion sin token de autenticacion', async () => {
    const res = await request(app).post('/api/housings').send({ title: 'Sin token' });

    expect(res.status).toBe(401);
  });

  it('debe rechazar la publicacion si el body no cumple el esquema (falta address)', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const token = await loginAndGetToken(landlord);

    const res = await request(app)
      .post('/api/housings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Sin direccion',
        pricePen: 100,
        distanceToUnschMinutes: 5,
        neighborhood: 'Belén',
        contactPhone: '900000000'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  it('debe listar alojamientos aprobados reales con filtros, sin requerir autenticacion', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const { data: approved } = await supabaseAdmin
      .from('housing_listings')
      .insert({
        landlord_id: landlord.id,
        title: 'Aprobada integration',
        price_pen: 200,
        distance_to_unsch_minutes: 8,
        neighborhood: 'Santa Ana',
        address: 'Jr. Santa Ana 1',
        contact_phone: '900000000',
        type: 'room',
        status: 'approved'
      })
      .select()
      .single();
    createdListingIds.push(approved.id);

    const res = await request(app).get('/api/housings?tipo=room&barrio=Santa Ana');

    expect(res.status).toBe(200);
    expect(res.body.map((l) => l.id)).toContain(approved.id);
  });

  it('debe devolver el detalle de una publicacion aprobada real sin requerir autenticacion', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const { data: approved } = await supabaseAdmin
      .from('housing_listings')
      .insert({
        landlord_id: landlord.id,
        title: 'Detalle integration',
        price_pen: 260,
        distance_to_unsch_minutes: 9,
        neighborhood: 'Santa Ana',
        address: 'Jr. Detalle Integration 1',
        contact_phone: '900000000',
        type: 'room',
        status: 'approved'
      })
      .select()
      .single();
    createdListingIds.push(approved.id);

    const res = await request(app).get(`/api/housings/${approved.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(approved.id);
  });

  it('debe devolver 404 si la publicacion no existe o no esta aprobada', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app).get(`/api/housings/${fakeId}`);

    expect(res.status).toBe(404);
  });
});
