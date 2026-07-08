import { registerUser, loginUser, forgotPassword as requestForgotPassword } from '../services/auth.service.js';

export async function register(req, res) {
  const { email, password, name, role, faculty, career, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password y name son obligatorios' });
  }

  const user = await registerUser({ email, password, name, role, faculty, career, phone });
  res.status(201).json(user);
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son obligatorios' });
  }

  const result = await loginUser({ email, password });
  res.json(result);
}

export async function forgotPassword(req, res) {
  const result = await requestForgotPassword({ email: req.body.email });
  res.json(result);
}
