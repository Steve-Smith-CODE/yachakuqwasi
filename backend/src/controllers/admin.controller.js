import {
  getStats,
  getPendingDocuments,
  reviewUserDocuments,
  getPendingHousings,
  updateHousingStatus,
  blockUser,
  unblockUser,
  deleteUserAccount,
  getAllHousingsAdmin,
  getAllUsers,
  setUserRole,
  getAuditLogs,
  getUserDetail,
  getVerifiedDomains,
  addVerifiedDomain,
  removeVerifiedDomain
} from '../services/admin.service.js';

export async function stats(req, res) {
  res.json(await getStats());
}

export async function pendingDocuments(req, res) {
  res.json(await getPendingDocuments());
}

export async function reviewDocs(req, res) {
  const documentos = await reviewUserDocuments(req.params.userId, req.body, req.user);
  res.json({ documentos });
}

export async function pendingHousings(req, res) {
  res.json(await getPendingHousings());
}

export async function reviewHousing(req, res) {
  const listing = await updateHousingStatus(req.params.id, req.body, req.user);
  res.json({ listing });
}

export async function block(req, res) {
  const result = await blockUser(req.params.id, req.body, req.user);
  res.json(result);
}

export async function unblock(req, res) {
  const result = await unblockUser(req.params.id, req.user);
  res.json(result);
}

export async function deleteUser(req, res) {
  const result = await deleteUserAccount(req.params.id, req.body, req.user);
  res.json(result);
}

export async function allHousings(req, res) {
  res.json(await getAllHousingsAdmin());
}

export async function allUsers(req, res) {
  res.json(await getAllUsers());
}

export async function userDetail(req, res) {
  res.json(await getUserDetail(req.params.id));
}

export async function setRole(req, res) {
  const user = await setUserRole(req.params.id, req.body.rol, req.user);
  res.json({ user });
}

export async function logs(req, res) {
  res.json(await getAuditLogs(req.query.scope));
}

export async function getDomains(req, res) {
  res.json(await getVerifiedDomains());
}

export async function addDomain(req, res) {
  const domain = await addVerifiedDomain(req.body, req.user);
  res.json({ domain });
}

export async function removeDomain(req, res) {
  const result = await removeVerifiedDomain(req.params.domain, req.user);
  res.json(result);
}
