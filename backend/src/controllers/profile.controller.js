import { updateProfile, changePassword, changeAvatar } from '../services/profile.service.js';

export async function me(req, res) {
  res.json({ profile: req.user });
}

export async function updateMe(req, res) {
  const profile = await updateProfile(req.user.id, req.body);
  res.json({ profile });
}

export async function updatePassword(req, res) {
  const result = await changePassword(req.user.id, req.body.password);
  res.json(result);
}

export async function updateAvatar(req, res) {
  const profile = await changeAvatar(req.user.id, req.body.image);
  res.json({ profile });
}
