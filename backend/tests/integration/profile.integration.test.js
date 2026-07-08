import request from 'supertest';
import app from '../../src/app.js';
import { createRealUser, cleanupCreatedUsers } from '../helpers/testData.js';

afterAll(async () => {
  await cleanupCreatedUsers();
});

async function loginAndGetToken(user) {
  const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
  return res.body.token;
}

const TINY_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('Profile Integration (Supabase local real)', () => {
  it('GET /api/perfil devuelve el perfil real del usuario autenticado', async () => {
    const student = await createRealUser({ role: 'student' });
    const token = await loginAndGetToken(student);

    const res = await request(app).get('/api/perfil').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.id).toBe(student.id);
  });

  it('GET /api/perfil rechaza peticiones sin token', async () => {
    const res = await request(app).get('/api/perfil');
    expect(res.status).toBe(401);
  });

  it('debe actualizar nombre y telefono del propio perfil', async () => {
    const student = await createRealUser({ role: 'student' });
    const token = await loginAndGetToken(student);

    const res = await request(app)
      .patch('/api/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nombre Actualizado', phone: '966111222' });

    expect(res.status).toBe(200);
    expect(res.body.profile.name).toBe('Nombre Actualizado');
    expect(res.body.profile.phone).toBe('966111222');
  });

  it('no debe permitir cambiar role/is_verified via mass-assignment (Zod strip)', async () => {
    const student = await createRealUser({ role: 'student' });
    const token = await loginAndGetToken(student);

    const res = await request(app)
      .patch('/api/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Intento De Escalada', role: 'admin', is_verified: true });

    expect(res.status).toBe(200);
    expect(res.body.profile.role).toBe('student');
    expect(res.body.profile.is_verified).toBe(false);
  });

  it('debe rechazar body vacio', async () => {
    const student = await createRealUser({ role: 'student' });
    const token = await loginAndGetToken(student);

    const res = await request(app).patch('/api/perfil').set('Authorization', `Bearer ${token}`).send({});

    expect(res.status).toBe(400);
  });

  it('debe rechazar peticiones sin token', async () => {
    const res = await request(app).patch('/api/perfil').send({ name: 'X' });
    expect(res.status).toBe(401);
  });

  it('debe cambiar la contraseña y permitir login con la nueva', async () => {
    const student = await createRealUser({ role: 'student' });
    const token = await loginAndGetToken(student);

    const res = await request(app)
      .patch('/api/perfil/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'NuevaPass123!' });

    expect(res.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'NuevaPass123!' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
  });

  it('debe rechazar una contraseña muy corta', async () => {
    const student = await createRealUser({ role: 'student' });
    const token = await loginAndGetToken(student);

    const res = await request(app)
      .patch('/api/perfil/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: '123' });

    expect(res.status).toBe(400);
  });

  it('debe subir una foto de perfil real y guardar la URL en el propio perfil', async () => {
    const student = await createRealUser({ role: 'student' });
    const token = await loginAndGetToken(student);

    const res = await request(app)
      .post('/api/perfil/avatar')
      .set('Authorization', `Bearer ${token}`)
      .send({ image: TINY_PNG_BASE64 });

    expect(res.status).toBe(200);
    expect(res.body.profile.avatar_url).toMatch(/\.webp$/);
    expect(res.body.profile.avatar_url).toContain('avatars');
  });
});
