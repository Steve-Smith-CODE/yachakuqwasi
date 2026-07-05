import { supabasePublic, supabaseAdmin } from '../config/supabase.js';

export async function registerUser({ email, password, name, role, faculty, career, phone }) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: role || 'student', faculty, career, phone }
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return { id: data.user.id, email: data.user.email };
}

export async function loginUser({ email, password }) {
  const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });

  if (error) {
    const err = new Error('Credenciales invalidas');
    err.statusCode = 401;
    throw err;
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return {
    token: data.session.access_token,
    user: { id: data.user.id, email: data.user.email, ...profile }
  };
}
