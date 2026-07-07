import { submitVerificationDocument } from '../services/verification.service.js';

export async function submit(req, res) {
  const documento = await submitVerificationDocument(req.user.id, req.body.image);
  res.status(201).json({ documento });
}
