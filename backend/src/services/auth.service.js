import { createAuthUser, signInWithPassword, findProfileById } from '../repositories/auth.repository.js';

export async function registerUser({ email, password, name, role, faculty, career, phone }) {
  const { data, error } = await createAuthUser({
    email,
    password,
    name,
    role: role || 'student',
    faculty,
    career,
    phone
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return { id: data.user.id, email: data.user.email };
}

export async function loginUser({ email, password }) {
  const { data, error } = await signInWithPassword({ email, password });

  if (error) {
    const err = new Error('Credenciales invalidas');
    err.statusCode = 401;
    throw err;
  }

  const { data: profile } = await findProfileById(data.user.id);

  return {
    token: data.session.access_token,
    user: { id: data.user.id, email: data.user.email, ...profile }
  };
}
