import {
  countProfiles,
  countHousings,
  countPendingDocuments,
  findPendingDocuments,
  updateDocumentStatus,
  updateProfileVerification,
  findPendingHousings,
  updateHousingStatusRecord,
  updateProfileBlock
} from '../repositories/admin.repository.js';

export async function getStats() {
  const [users, housings, pendingDocs] = await Promise.all([
    countProfiles(),
    countHousings(),
    countPendingDocuments()
  ]);

  return {
    totalUsers: users.count ?? 0,
    totalHousings: housings.count ?? 0,
    pendingDocuments: pendingDocs.count ?? 0
  };
}

export async function getPendingDocuments() {
  const { data, error } = await findPendingDocuments();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}

export async function reviewDocument(docId, { estado, comentario }) {
  const { data: doc, error } = await updateDocumentStatus(docId, { status: estado, comment: comentario });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  if (estado === 'approved') {
    await updateProfileVerification(doc.user_id, { is_verified: true, verification_status: 'approved' });
  } else if (estado === 'rejected') {
    await updateProfileVerification(doc.user_id, { verification_status: 'rejected' });
  }

  return doc;
}

export async function getPendingHousings() {
  const { data, error } = await findPendingHousings();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}

export async function updateHousingStatus(housingId, { estado }) {
  const { data, error } = await updateHousingStatusRecord(housingId, estado);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return data;
}

export async function blockUser(userId, { motivo, dias }) {
  const blockedUntil = dias ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString() : null;

  const { error } = await updateProfileBlock(userId, { blockedUntil, motivo });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return { message: 'Usuario bloqueado' };
}
