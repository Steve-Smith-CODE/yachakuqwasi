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

  async function insertOwnedListing(landlordId, overrides = {}) {
    const { data, error } = await supabaseAdmin
      .from('housing_listings')
      .insert({
        landlord_id: landlordId,
        title: 'Anuncio de gestion integration',
        price_pen: 300,
        distance_to_unsch_minutes: 10,
        neighborhood: 'San Blas',
        address: 'Jr. Gestion 1',
        contact_phone: '900000001',
        type: 'room',
        status: 'approved',
        ...overrides
      })
      .select()
      .single();
    if (error) throw error;
    createdListingIds.push(data.id);
    return data;
  }

  describe('PATCH /api/housings/:id (editar)', () => {
    it('guarda un campo cosmetico al instante sin volver a pending', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const token = await loginAndGetToken(landlord);
      const listing = await insertOwnedListing(landlord.id);

      const res = await request(app)
        .patch(`/api/housings/${listing.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Descripcion actualizada' });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Descripcion actualizada');
      expect(res.body.status).toBe('approved');
    });

    it('vuelve a pending si se edita un campo sensible de una publicacion aprobada', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const token = await loginAndGetToken(landlord);
      const listing = await insertOwnedListing(landlord.id);

      const res = await request(app)
        .patch(`/api/housings/${listing.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ pricePen: 999 });

      expect(res.status).toBe(200);
      expect(res.body.price_pen).toBe(999);
      expect(res.body.status).toBe('pending');
    });

    it('rechaza la edicion si el usuario no es el dueño ni admin', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const other = await createRealUser({ role: 'landlord' });
      const otherToken = await loginAndGetToken(other);
      const listing = await insertOwnedListing(landlord.id);

      const res = await request(app)
        .patch(`/api/housings/${listing.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Intento ajeno' });

      expect(res.status).toBe(403);
    });

    it('devuelve 404 si la publicacion no existe', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const token = await loginAndGetToken(landlord);
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await request(app)
        .patch(`/api/housings/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'No existe' });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/housings/:id/visibilidad (pausar/publicar)', () => {
    it('pausa y luego publica de nuevo el anuncio del propio dueño', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const token = await loginAndGetToken(landlord);
      const listing = await insertOwnedListing(landlord.id);

      const paused = await request(app)
        .patch(`/api/housings/${listing.id}/visibilidad`)
        .set('Authorization', `Bearer ${token}`)
        .send({ paused: true });
      expect(paused.status).toBe(200);
      expect(paused.body.paused_at).not.toBeNull();

      const published = await request(app)
        .patch(`/api/housings/${listing.id}/visibilidad`)
        .set('Authorization', `Bearer ${token}`)
        .send({ paused: false });
      expect(published.status).toBe(200);
      expect(published.body.paused_at).toBeNull();
    });

    it('un anuncio pausado no aparece en el listado publico', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const token = await loginAndGetToken(landlord);
      const listing = await insertOwnedListing(landlord.id, { neighborhood: 'Barrio Pausado Test' });

      await request(app)
        .patch(`/api/housings/${listing.id}/visibilidad`)
        .set('Authorization', `Bearer ${token}`)
        .send({ paused: true });

      const res = await request(app).get('/api/housings?barrio=Barrio Pausado Test');
      expect(res.status).toBe(200);
      expect(res.body.map((l) => l.id)).not.toContain(listing.id);
    });

    it('rechaza cambiar visibilidad de un anuncio ajeno', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const other = await createRealUser({ role: 'landlord' });
      const otherToken = await loginAndGetToken(other);
      const listing = await insertOwnedListing(landlord.id);

      const res = await request(app)
        .patch(`/api/housings/${listing.id}/visibilidad`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ paused: true });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/housings/:id y POST /api/housings/:id/restaurar', () => {
    it('elimina (soft delete) y desaparece de /mine, luego se restaura y reaparece', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const token = await loginAndGetToken(landlord);
      const listing = await insertOwnedListing(landlord.id);

      const deleted = await request(app)
        .delete(`/api/housings/${listing.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'rented' });
      expect(deleted.status).toBe(200);
      expect(deleted.body.deleted_at).not.toBeNull();

      const mineAfterDelete = await request(app).get('/api/housings/mine').set('Authorization', `Bearer ${token}`);
      expect(mineAfterDelete.body.map((l) => l.id)).not.toContain(listing.id);

      const restored = await request(app)
        .post(`/api/housings/${listing.id}/restaurar`)
        .set('Authorization', `Bearer ${token}`);
      expect(restored.status).toBe(200);
      expect(restored.body.deleted_at).toBeNull();

      const mineAfterRestore = await request(app).get('/api/housings/mine').set('Authorization', `Bearer ${token}`);
      expect(mineAfterRestore.body.map((l) => l.id)).toContain(listing.id);
    });

    it('rechaza eliminar un anuncio ajeno', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const other = await createRealUser({ role: 'landlord' });
      const otherToken = await loginAndGetToken(other);
      const listing = await insertOwnedListing(landlord.id);

      const res = await request(app)
        .delete(`/api/housings/${listing.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({});

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/housings/:id/historial', () => {
    it('registra y devuelve la actividad propia del arrendador sobre su anuncio', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const token = await loginAndGetToken(landlord);
      const listing = await insertOwnedListing(landlord.id);

      await request(app)
        .patch(`/api/housings/${listing.id}/visibilidad`)
        .set('Authorization', `Bearer ${token}`)
        .send({ paused: true });

      const res = await request(app)
        .get(`/api/housings/${listing.id}/historial`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.some((log) => log.action === 'Pausó anuncio' && log.listing_id === listing.id)).toBe(true);
    });

    it('rechaza ver el historial de un anuncio ajeno', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const other = await createRealUser({ role: 'landlord' });
      const otherToken = await loginAndGetToken(other);
      const listing = await insertOwnedListing(landlord.id);

      const res = await request(app)
        .get(`/api/housings/${listing.id}/historial`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });
});
