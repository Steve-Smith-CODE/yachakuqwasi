import request from 'supertest';
import app from '../../src/server.js';
import { createRealUser, cleanupCreatedUsers, trackUserForCleanup, uniqueEmail } from '../helpers/testData.js';

afterAll(async () => {
  await cleanupCreatedUsers();
});

describe('Auth Integration (Supabase local real)', () => {
  describe('POST /api/auth/login', () => {
    it('debe devolver token real con credenciales validas', async () => {
      const user = await createRealUser({ role: 'student' });

      const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('student');
    });

    it('debe rechazar credenciales invalidas', async () => {
      const user = await createRealUser({ role: 'student' });

      const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'ContraseniaMala1!' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('debe rechazar la peticion si falta el password', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'sinpassword@test.local' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo estudiante real', async () => {
      const email = uniqueEmail('integration-register');

      const res = await request(app).post('/api/auth/register').send({
        name: 'Nuevo Estudiante Integration',
        email,
        password: 'SecurePass123!',
        role: 'student'
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      trackUserForCleanup(res.body.id);
    });

    it('debe rechazar el registro si el email ya existe', async () => {
      const user = await createRealUser({ role: 'student' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Dup', email: user.email, password: 'SecurePass123!' });

      expect(res.status).toBe(400);
    });
  });
});
