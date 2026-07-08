import { registerUser, loginUser, forgotPassword } from '../../../src/services/auth.service.js';
import * as authRepo from '../../../src/repositories/auth.repository.js';
import { createRealUser, cleanupCreatedUsers, trackUserForCleanup, uniqueEmail } from '../../helpers/testData.js';

afterAll(async () => {
  await cleanupCreatedUsers();
});

describe('Auth Service (Supabase local real)', () => {
  describe('registerUser', () => {
    it('crea el usuario real en Supabase Auth y devuelve id + email', async () => {
      const email = uniqueEmail('register');

      const result = await registerUser({
        email,
        password: 'TestPass123!',
        name: 'Rubén Mendoza',
        role: 'student'
      });
      trackUserForCleanup(result.id);

      expect(result.email).toBe(email);
      expect(result.id).toEqual(expect.any(String));
    });

    it('lanza error con statusCode 400 si el email ya esta registrado', async () => {
      const existing = await createRealUser({ role: 'student' });

      await expect(
        registerUser({ email: existing.email, password: 'OtherPass123!', name: 'Duplicado' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('loginUser', () => {
    it('devuelve un token real y el perfil creado por el trigger de Supabase', async () => {
      const user = await createRealUser({ role: 'student', name: 'Ruben Login', career: 'Ingenieria de Sistemas' });

      const result = await loginUser({ email: user.email, password: user.password });

      expect(result.token).toEqual(expect.any(String));
      expect(result.user).toMatchObject({
        id: user.id,
        email: user.email,
        name: 'Ruben Login',
        role: 'student',
        career: 'Ingenieria de Sistemas'
      });
    });

    it('lanza error con statusCode 401 si las credenciales son invalidas', async () => {
      const user = await createRealUser({ role: 'student' });

      await expect(loginUser({ email: user.email, password: 'ContraseniaIncorrecta1!' })).rejects.toMatchObject({
        message: 'Credenciales invalidas',
        statusCode: 401
      });
    });
  });

  describe('forgotPassword', () => {
    it('devuelve el mismo mensaje generico para un email real registrado', async () => {
      const user = await createRealUser({ role: 'student' });

      const result = await forgotPassword({ email: user.email });

      expect(result).toEqual({
        message: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.'
      });
    });

    it('devuelve el mismo mensaje generico para un email que no existe (no revela si esta registrado)', async () => {
      const result = await forgotPassword({ email: uniqueEmail('no-existe') });

      expect(result).toEqual({
        message: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.'
      });
    });

    it('no lanza y devuelve el mismo mensaje si Supabase falla al enviar el correo', async () => {
      const originalFn = authRepo.requestPasswordReset;
      authRepo.requestPasswordReset = jest.fn().mockRejectedValue(new Error('SMTP no configurado'));

      try {
        const result = await forgotPassword({ email: uniqueEmail('smtp-caido') });
        expect(result).toEqual({
          message: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.'
        });
      } finally {
        authRepo.requestPasswordReset = originalFn;
      }
    });
  });
});
