import { register, login, refresh, forgotPassword } from '../../../src/controllers/auth.controller.js';
import { createRealUser, cleanupCreatedUsers, trackUserForCleanup, uniqueEmail } from '../../helpers/testData.js';

afterAll(async () => {
  await cleanupCreatedUsers();
});

describe('Auth Controller (Supabase local real)', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  describe('register', () => {
    it('responde 400 si faltan campos obligatorios (no llega a tocar Supabase)', async () => {
      req.body = { email: 'a@b.com' };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('registra un usuario real y responde 201 con id + email', async () => {
      const email = uniqueEmail('ctrl-register');
      req.body = { email, password: 'TestPass123!', name: 'Ana Controller' };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const body = res.json.mock.calls[0][0];
      expect(body.email).toBe(email);
      trackUserForCleanup(body.id);
    });
  });

  describe('login', () => {
    it('responde 400 si faltan credenciales', async () => {
      req.body = { email: 'a@b.com' };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('hace login real y responde con token + perfil', async () => {
      const user = await createRealUser({ role: 'student', name: 'Login Controller' });
      req.body = { email: user.email, password: user.password };

      await login(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.token).toEqual(expect.any(String));
      expect(body.user.name).toBe('Login Controller');
    });
  });

  describe('refresh', () => {
    it('responde 400 si falta el refreshToken', async () => {
      req.body = {};

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('refresca la sesion real y responde con un token nuevo', async () => {
      const user = await createRealUser({ role: 'student' });
      req.body = { email: user.email, password: user.password };
      await login(req, res);
      const { refreshToken } = res.json.mock.calls[0][0];

      req.body = { refreshToken };
      await refresh(req, res);

      const body = res.json.mock.calls[1][0];
      expect(body.token).toEqual(expect.any(String));
      expect(body.refreshToken).toEqual(expect.any(String));
    });
  });

  describe('forgotPassword', () => {
    it('responde con el mensaje generico de confirmacion', async () => {
      req.body = { email: uniqueEmail('ctrl-forgot') };

      await forgotPassword(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.message).toMatch(/restablecer tu contraseña/i);
    });
  });
});
