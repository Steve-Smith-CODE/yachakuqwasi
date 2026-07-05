import request from 'supertest';
import app from '../../src/app.js';
import { supabaseAdmin } from '../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../helpers/testData.js';

const createdDocIds = [];
const createdListingIds = [];

afterAll(async () => {
  for (const id of createdDocIds.splice(0)) {
    await supabaseAdmin.from('verification_documents').delete().eq('id', id).catch?.(() => {});
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

describe('Admin Integration (Supabase local real)', () => {
  it('debe obtener estadisticas reales del dashboard', async () => {
    const admin = await createRealUser({ role: 'admin' });
    const token = await loginAndGetToken(admin);

    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalHousings');
    expect(res.body).toHaveProperty('pendingDocuments');
  });

  it('debe obtener documentos pendientes reales', async () => {
    const admin = await createRealUser({ role: 'admin' });
    const token = await loginAndGetToken(admin);
    const student = await createRealUser({ role: 'student' });
    const { data: doc } = await supabaseAdmin
      .from('verification_documents')
      .insert({ user_id: student.id, doc_url: 'https://example.com/x.png', status: 'pending' })
      .select()
      .single();
    createdDocIds.push(doc.id);

    const res = await request(app).get('/api/admin/documentos/pendientes').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.map((d) => d.id)).toContain(doc.id);
  });

  it('debe aprobar un documento real y verificar identidad del usuario', async () => {
    const admin = await createRealUser({ role: 'admin' });
    const token = await loginAndGetToken(admin);
    const student = await createRealUser({ role: 'student' });
    const { data: doc } = await supabaseAdmin
      .from('verification_documents')
      .insert({ user_id: student.id, doc_url: 'https://example.com/y.png', status: 'pending' })
      .select()
      .single();
    createdDocIds.push(doc.id);

    const res = await request(app)
      .put(`/api/admin/documentos/${doc.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'approved', comentario: 'Valido' });

    expect(res.status).toBe(200);
    expect(res.body.documento.status).toBe('approved');
  });

  it('debe bloquear a un usuario real', async () => {
    const admin = await createRealUser({ role: 'admin' });
    const token = await loginAndGetToken(admin);
    const student = await createRealUser({ role: 'student' });

    const res = await request(app)
      .put(`/api/admin/usuarios/${student.id}/bloquear`)
      .set('Authorization', `Bearer ${token}`)
      .send({ motivo: 'Publicaciones fraudulentas', dias: 7 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Usuario bloqueado');
  });

  it('debe listar una habitacion pendiente real, aprobarla, y que pase a aparecer en el listado publico', async () => {
    const admin = await createRealUser({ role: 'admin' });
    const token = await loginAndGetToken(admin);
    const landlord = await createRealUser({ role: 'landlord' });
    const { data: listing } = await supabaseAdmin
      .from('housing_listings')
      .insert({
        landlord_id: landlord.id,
        title: 'Habitacion pendiente integration',
        price_pen: 260,
        distance_to_unsch_minutes: 5,
        neighborhood: 'Carmen Alto',
        address: 'Jr. Integration Pendiente 1',
        contact_phone: '900000000',
        status: 'pending'
      })
      .select()
      .single();
    createdListingIds.push(listing.id);

    const pendingRes = await request(app)
      .get('/api/admin/habitaciones/pendientes')
      .set('Authorization', `Bearer ${token}`);
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.map((l) => l.id)).toContain(listing.id);

    const approveRes = await request(app)
      .put(`/api/admin/habitaciones/${listing.id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'approved' });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.listing.status).toBe('approved');

    const publicRes = await request(app).get('/api/housings?barrio=Carmen Alto');
    expect(publicRes.body.map((l) => l.id)).toContain(listing.id);
  });

  it('debe rechazar el cambio de estado de habitacion si "estado" no es valido', async () => {
    const admin = await createRealUser({ role: 'admin' });
    const token = await loginAndGetToken(admin);
    const landlord = await createRealUser({ role: 'landlord' });
    const { data: listing } = await supabaseAdmin
      .from('housing_listings')
      .insert({
        landlord_id: landlord.id,
        title: 'Habitacion estado invalido integration',
        price_pen: 260,
        distance_to_unsch_minutes: 5,
        neighborhood: 'Carmen Alto',
        address: 'Jr. Integration Invalido 1',
        contact_phone: '900000000',
        status: 'pending'
      })
      .select()
      .single();
    createdListingIds.push(listing.id);

    const res = await request(app)
      .put(`/api/admin/habitaciones/${listing.id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'no-es-un-estado-valido' });

    expect(res.status).toBe(400);
  });

  it('debe rechazar la revision de documento si "estado" no es approved/rejected', async () => {
    const admin = await createRealUser({ role: 'admin' });
    const token = await loginAndGetToken(admin);
    const student = await createRealUser({ role: 'student' });
    const { data: doc } = await supabaseAdmin
      .from('verification_documents')
      .insert({ user_id: student.id, doc_url: 'https://example.com/z.png', status: 'pending' })
      .select()
      .single();
    createdDocIds.push(doc.id);

    const res = await request(app)
      .put(`/api/admin/documentos/${doc.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'no-es-un-estado-valido' });

    expect(res.status).toBe(400);
  });

  it('debe rechazar el bloqueo de usuario si falta el motivo', async () => {
    const admin = await createRealUser({ role: 'admin' });
    const token = await loginAndGetToken(admin);
    const student = await createRealUser({ role: 'student' });

    const res = await request(app)
      .put(`/api/admin/usuarios/${student.id}/bloquear`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dias: 7 });

    expect(res.status).toBe(400);
  });

  it('debe rechazar el acceso si el usuario autenticado no es admin', async () => {
    const student = await createRealUser({ role: 'student' });
    const token = await loginAndGetToken(student);

    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
