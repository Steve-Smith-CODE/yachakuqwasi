import {
  getStats,
  getPendingDocuments,
  reviewDocument,
  getPendingHousings,
  updateHousingStatus,
  blockUser
} from '../services/admin.service.js';

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

export async function pendingHousings(req, res) {
  res.json(await getPendingHousings());
}

export async function reviewHousing(req, res) {
  const listing = await updateHousingStatus(req.params.id, req.body);
  res.json({ listing });
}

export async function block(req, res) {
  const result = await blockUser(req.params.id, req.body);
  res.json(result);
}
