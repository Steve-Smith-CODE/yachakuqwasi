import { getStats, getPendingDocuments, reviewDocument, blockUser } from '../services/admin.service.js';

export async function stats(req, res) {
  res.json(await getStats());
}

export async function pendingDocuments(req, res) {
  res.json(await getPendingDocuments());
}

export async function reviewDoc(req, res) {
  const documento = await reviewDocument(req.params.id, req.body);
  res.json({ documento });
}

export async function block(req, res) {
  const result = await blockUser(req.params.id, req.body);
  res.json(result);
}
