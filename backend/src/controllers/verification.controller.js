import { submitVerificationDocument } from '../services/verification.service.js';

export async function submit(req, res) {
  const documentos = await submitVerificationDocument(req.user.id, { dni: req.body.dni, carnet: req.body.carnet });
  res.status(201).json({ documentos });
}
