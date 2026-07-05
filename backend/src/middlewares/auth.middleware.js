import { createRemoteJWKSet, jwtVerify } from 'jose';
import { supabaseAdmin } from '../config/supabase.js';

const jwks = createRemoteJWKSet(new URL(process.env.SUPABASE_JWKS_URL));

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(token, jwks, {
      issuer: `${process.env.SUPABASE_URL}/auth/v1`
    }));
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', payload.sub)
    .single();

  if (error || !profile) {
    return res.status(401).json({ error: 'Perfil de usuario no encontrado' });
  }

  req.user = { id: payload.sub, email: payload.email, ...profile };
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para esta accion' });
    }
    next();
  };
}
