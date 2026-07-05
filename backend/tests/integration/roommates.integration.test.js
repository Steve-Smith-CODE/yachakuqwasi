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

describe('Roommates Integration (Supabase local real)', () => {
  it('debe calcular el score de compatibilidad con un usuario autenticado', async () => {
    const student = await createRealUser({ role: 'student' });
    const token = await loginAndGetToken(student);

    const res = await request(app)
      .post('/api/roommates/compatibilidad')
      .set('Authorization', `Bearer ${token}`)
      .send({
        profileA: { fumador: false, mascotas: true, horario: 'diurno', presupuestoMax: 500 },
        profileB: { fumador: false, mascotas: false, horario: 'diurno', presupuestoMax: 500 }
      });

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(0.8);
  });

  it('debe rechazar la peticion sin token', async () => {
    const res = await request(app).post('/api/roommates/compatibilidad').send({});
    expect(res.status).toBe(401);
  });

  it('debe rechazar un body invalido (falta profileB)', async () => {
    const student = await createRealUser({ role: 'student' });
    const token = await loginAndGetToken(student);

    const res = await request(app)
      .post('/api/roommates/compatibilidad')
      .set('Authorization', `Bearer ${token}`)
      .send({ profileA: { fumador: false, mascotas: true, horario: 'diurno', presupuestoMax: 500 } });

    expect(res.status).toBe(400);
  });
});
