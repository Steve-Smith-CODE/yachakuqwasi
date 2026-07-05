import { requireAuth, requireRole } from '../../../src/middlewares/auth.middleware.js';
import { supabasePublic, supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

afterAll(async () => {
  await cleanupCreatedUsers();
});

async function realToken(user) {
  const { data, error } = await supabasePublic.auth.signInWithPassword({ email: user.email, password: user.password });
  if (error) throw error;
  return data.session.access_token;
}

describe('Auth Middleware (Supabase local real)', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  describe('requireAuth', () => {
    it('rechaza si no hay header Authorization', async () => {
      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('rechaza un token invalido (garbage, no firmado por Supabase)', async () => {
      req.headers.authorization = 'Bearer esto-no-es-un-jwt-valido';

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token invalido o expirado' });
      expect(next).not.toHaveBeenCalled();
    });

    it('rechaza un token real valido si el perfil fue borrado', async () => {
      const user = await createRealUser({ role: 'student' });
      const token = await realToken(user);
      await supabaseAdmin.from('profiles').delete().eq('id', user.id);

      req.headers.authorization = `Bearer ${token}`;
      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Perfil de usuario no encontrado' });
      expect(next).not.toHaveBeenCalled();
    });

    it('adjunta req.user y llama next() con un token real y valido', async () => {
      const user = await createRealUser({ role: 'landlord', name: 'Arrendador Middleware' });
      const token = await realToken(user);

      req.headers.authorization = `Bearer ${token}`;
      await requireAuth(req, res, next);

      expect(req.user).toMatchObject({ id: user.id, email: user.email, role: 'landlord', name: 'Arrendador Middleware' });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('rechaza con 403 si no hay req.user', () => {
      requireRole('admin')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('rechaza con 403 si el rol no coincide', () => {
      req.user = { role: 'student' };

      requireRole('admin', 'landlord')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('permite continuar si el rol coincide', () => {
      req.user = { role: 'admin' };

      requireRole('admin', 'landlord')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
