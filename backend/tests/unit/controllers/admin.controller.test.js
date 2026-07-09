import {
  stats,
  pendingDocuments,
  reviewDoc,
  pendingHousings,
  reviewHousing,
  block,
  allHousings,
  allUsers,
  setRole,
  logs
} from '../../../src/controllers/admin.controller.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

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

describe('Admin Controller (Supabase local real)', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  it('stats responde con conteos reales de la base de datos', async () => {
    const before = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    await createRealUser({ role: 'student' });

    await stats(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.totalUsers).toBe((before.count ?? 0) + 1);
  });

  it('pendingDocuments responde con los documentos reales en estado pending', async () => {
    const student = await createRealUser({ role: 'student' });
    const { data: doc } = await supabaseAdmin
      .from('verification_documents')
      .insert({ user_id: student.id, doc_url: 'https://example.com/doc.png', status: 'pending' })
      .select()
      .single();
    createdDocIds.push(doc.id);

    await pendingDocuments(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.map((d) => d.id)).toContain(doc.id);
  });

  it('reviewDoc aprueba un documento real y envuelve el resultado en { documento }', async () => {
    const student = await createRealUser({ role: 'student' });
    const { data: doc } = await supabaseAdmin
      .from('verification_documents')
      .insert({ user_id: student.id, doc_url: 'https://example.com/doc2.png', status: 'pending' })
      .select()
      .single();
    createdDocIds.push(doc.id);

    req.params.id = doc.id;
    req.body = { estado: 'approved', comentario: 'Valido' };
    await reviewDoc(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.documento.status).toBe('approved');
  });

  it('pendingHousings responde con las habitaciones reales en estado pending', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const { data: listing } = await supabaseAdmin
      .from('housing_listings')
      .insert({
        landlord_id: landlord.id,
        title: 'Habitacion pendiente controller',
        price_pen: 250,
        distance_to_unsch_minutes: 6,
        neighborhood: 'San Blas',
        address: 'Jr. Controller Pendiente 1',
        contact_phone: '900000000',
        status: 'pending'
      })
      .select()
      .single();
    createdListingIds.push(listing.id);

    await pendingHousings(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.map((l) => l.id)).toContain(listing.id);
  });

  it('reviewHousing aprueba una habitacion real y envuelve el resultado en { listing }', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const { data: listing } = await supabaseAdmin
      .from('housing_listings')
      .insert({
        landlord_id: landlord.id,
        title: 'Habitacion a aprobar controller',
        price_pen: 250,
        distance_to_unsch_minutes: 6,
        neighborhood: 'San Blas',
        address: 'Jr. Controller Aprobar 1',
        contact_phone: '900000000',
        status: 'pending'
      })
      .select()
      .single();
    createdListingIds.push(listing.id);

    req.params.id = listing.id;
    req.body = { estado: 'approved' };
    await reviewHousing(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.listing.status).toBe('approved');
  });

  it('block bloquea a un usuario real y responde con el mensaje', async () => {
    const student = await createRealUser({ role: 'student' });
    req.params.id = student.id;
    req.body = { motivo: 'Fraude', dias: 7 };

    await block(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Usuario bloqueado' });
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).single();
    expect(profile.blocked_reason).toBe('Fraude');
  });

  it('allHousings responde con todas las publicaciones reales', async () => {
    const landlord = await createRealUser({ role: 'landlord' });
    const { data: listing } = await supabaseAdmin
      .from('housing_listings')
      .insert({
        landlord_id: landlord.id,
        title: 'Habitacion allHousings controller',
        price_pen: 250,
        distance_to_unsch_minutes: 6,
        neighborhood: 'San Blas',
        address: 'Jr. AllHousings 1',
        contact_phone: '900000000',
        status: 'pending'
      })
      .select()
      .single();
    createdListingIds.push(listing.id);

    await allHousings(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.map((l) => l.id)).toContain(listing.id);
  });

  it('allUsers responde con todos los perfiles reales', async () => {
    const student = await createRealUser({ role: 'student' });

    await allUsers(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.map((u) => u.id)).toContain(student.id);
  });

  it('setRole actualiza el rol real y envuelve el resultado en { user }', async () => {
    const student = await createRealUser({ role: 'student' });
    req.params.id = student.id;
    req.body = { rol: 'landlord' };
    req.user = { id: student.id, name: 'Admin Test' };

    await setRole(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.user.role).toBe('landlord');
  });

  it('logs responde con la bitacora real de auditoria', async () => {
    const student = await createRealUser({ role: 'student' });
    req.params.id = student.id;
    req.body = { motivo: 'Auditoria', dias: 1 };
    await block(req, res);

    await logs(req, res);

    const body = res.json.mock.calls[res.json.mock.calls.length - 1][0];
    expect(Array.isArray(body)).toBe(true);
  });
});
