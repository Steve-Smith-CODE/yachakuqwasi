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

async function publishListing(token) {
  const res = await request(app)
    .post('/api/housings')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Habitacion integration notifications',
      description: 'Cerca de la universidad UNSCH',
      pricePen: 300,
      address: 'Jr. Notificaciones 1, Huamanga',
      neighborhood: 'San Blas',
      distanceToUnschMinutes: 8,
      contactPhone: '966123456',
      type: 'room'
    });
  createdListingIds.push(res.body.id);
  return res.body;
}

describe('Notifications Integration (Supabase local real)', () => {
  it('al crear una publicacion, todos los admins reciben una notificacion', async () => {
    const admin1 = await createRealUser({ role: 'admin' });
    const admin2 = await createRealUser({ role: 'admin' });
    const landlord = await createRealUser({ role: 'landlord' });
    const landlordToken = await loginAndGetToken(landlord);
    const admin1Token = await loginAndGetToken(admin1);
    const admin2Token = await loginAndGetToken(admin2);

    const listing = await publishListing(landlordToken);

    const res1 = await request(app).get('/api/notificaciones').set('Authorization', `Bearer ${admin1Token}`);
    const res2 = await request(app).get('/api/notificaciones').set('Authorization', `Bearer ${admin2Token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.notifications.some((n) => n.listing_id === listing.id && n.type === 'listing_pending_review')).toBe(true);
    expect(res2.body.notifications.some((n) => n.listing_id === listing.id && n.type === 'listing_pending_review')).toBe(true);
  });

  it('al aprobar/observar/suspender, el arrendador dueño recibe la notificacion correspondiente', async () => {
    const admin = await createRealUser({ role: 'admin' });
    const landlord = await createRealUser({ role: 'landlord' });
    const adminToken = await loginAndGetToken(admin);
    const landlordToken = await loginAndGetToken(landlord);

    const cases = [
      { estado: 'approved', type: 'listing_approved' },
      { estado: 'flagged', type: 'listing_flagged' },
      { estado: 'suspended', type: 'listing_suspended' }
    ];

    for (const { estado, type } of cases) {
      const listing = await publishListing(landlordToken);

      const reviewRes = await request(app)
        .put(`/api/admin/habitaciones/${listing.id}/estado`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado });
      expect(reviewRes.status).toBe(200);

      const notifRes = await request(app).get('/api/notificaciones').set('Authorization', `Bearer ${landlordToken}`);
      expect(notifRes.status).toBe(200);
      expect(notifRes.body.notifications.some((n) => n.listing_id === listing.id && n.type === type)).toBe(true);
    }
  });

  it('marcar como leida baja el unreadCount, y no se puede marcar la de otro usuario', async () => {
    const admin1 = await createRealUser({ role: 'admin' });
    const admin2 = await createRealUser({ role: 'admin' });
    const landlord = await createRealUser({ role: 'landlord' });
    const landlordToken = await loginAndGetToken(landlord);
    const admin1Token = await loginAndGetToken(admin1);
    const admin2Token = await loginAndGetToken(admin2);

    await publishListing(landlordToken);

    const before = await request(app).get('/api/notificaciones').set('Authorization', `Bearer ${admin1Token}`);
    const unreadBefore = before.body.unreadCount;
    const notificationId = before.body.notifications[0].id;

    const readRes = await request(app)
      .put(`/api/notificaciones/${notificationId}/leer`)
      .set('Authorization', `Bearer ${admin1Token}`);
    expect(readRes.status).toBe(200);

    const after = await request(app).get('/api/notificaciones').set('Authorization', `Bearer ${admin1Token}`);
    expect(after.body.unreadCount).toBe(unreadBefore - 1);

    const intrusoRes = await request(app)
      .put(`/api/notificaciones/${notificationId}/leer`)
      .set('Authorization', `Bearer ${admin2Token}`);
    expect(intrusoRes.status).toBe(404);
  });

  it('rechaza peticiones sin token', async () => {
    const res = await request(app).get('/api/notificaciones');
    expect(res.status).toBe(401);
  });

  it('marcar todas como leidas deja el unreadCount en 0', async () => {
    const admin = await createRealUser({ role: 'admin' });
    const landlord = await createRealUser({ role: 'landlord' });
    const adminToken = await loginAndGetToken(admin);
    const landlordToken = await loginAndGetToken(landlord);

    await publishListing(landlordToken);
    await publishListing(landlordToken);

    const before = await request(app).get('/api/notificaciones').set('Authorization', `Bearer ${adminToken}`);
    expect(before.body.unreadCount).toBeGreaterThan(0);

    const readAllRes = await request(app)
      .put('/api/notificaciones/leer-todas')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(readAllRes.status).toBe(200);
    expect(readAllRes.body).toEqual({ message: 'Notificaciones marcadas como leídas' });

    const after = await request(app).get('/api/notificaciones').set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.unreadCount).toBe(0);
  });

  it('rechaza marcar todas como leidas sin token', async () => {
    const res = await request(app).put('/api/notificaciones/leer-todas');
    expect(res.status).toBe(401);
  });
});
