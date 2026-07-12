import { updateProfile, changePassword, changeAvatar, getPublicProfile, setInstitutionalEmail } from '../services/profile.service.js';

export async function me(req, res) {
  res.json({ profile: req.user });
}

export async function publicProfile(req, res) {
  res.json(await getPublicProfile(req.params.id));
}

export async function updateMe(req, res) {
  const profile = await updateProfile(req.user.id, req.body, req.user);
  res.json({ profile });
}

export async function updatePassword(req, res) {
  const result = await changePassword(req.user.id, req.body.password, req.user);
  res.json(result);
}

export async function updateAvatar(req, res) {
  const profile = await changeAvatar(req.user.id, req.body.image, req.user);
  res.json({ profile });
}

export async function updateInstitutionalEmail(req, res) {
  const profile = await setInstitutionalEmail(req.user.id, req.body.institutionalEmail, req.user);
  res.json({ profile });
}
