import {
  countProfiles,
  countHousings,
  countPendingDocuments,
  findPendingDocuments,
  updateDocumentStatus,
  updateProfileVerification,
  findPendingHousings,
  updateHousingStatusRecord,
  updateProfileBlock,
  findAllHousingsAdmin,
  findAllProfiles,
  updateProfileRole,
  insertAuditLog,
  findAuditLogs
} from '../repositories/admin.repository.js';
import { notifyLandlordOfHousingReview } from './notifications.service.js';
import logger from '../config/logger.js';

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

export async function reviewDocument(docId, { estado, comentario }, actor) {
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

  await insertAuditLog({
    userId: actor?.id,
    actorName: actor?.name ?? 'Admin',
    action: estado === 'approved' ? 'Aprobó credencial' : 'Rechazó credencial',
    details: `Documento ${docId} marcado como ${estado}.`,
    type: 'user'
  });

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

export async function updateHousingStatus(housingId, { estado }, actor) {
  const { data, error } = await updateHousingStatusRecord(housingId, estado);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  await insertAuditLog({
    userId: actor?.id,
    actorName: actor?.name ?? 'Admin',
    action: `Moderar anuncio: ${estado}`,
    details: `Anuncio '${data?.title ?? housingId}' cambiado a estado '${estado}'.`,
    type: 'listing'
  });

  try {
    if (data) {
      await notifyLandlordOfHousingReview({
        landlordId: data.landlord_id,
        listingId: data.id,
        listingTitle: data.title,
        estado,
        actorId: actor?.id
      });
    }
  } catch (err) {
    logger.warn(`No se pudo notificar sobre el anuncio ${housingId}: ${err.message}`);
  }

  return data;
}

export async function blockUser(userId, { motivo, dias }, actor) {
  const blockedUntil = dias ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString() : null;

  const { error } = await updateProfileBlock(userId, { blockedUntil, motivo });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  await insertAuditLog({
    userId: actor?.id,
    actorName: actor?.name ?? 'Admin',
    action: 'Bloqueó usuario',
    details: `Usuario ${userId} bloqueado. Motivo: ${motivo}`,
    type: 'user'
  });

  return { message: 'Usuario bloqueado' };
}

export async function getAllHousingsAdmin() {
  const { data, error } = await findAllHousingsAdmin();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}

export async function getAllUsers() {
  const { data, error } = await findAllProfiles();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}

export async function setUserRole(userId, role, actor) {
  const { data, error } = await updateProfileRole(userId, role);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  await insertAuditLog({
    userId: actor?.id,
    actorName: actor?.name ?? 'Admin',
    action: 'Cambio de rol',
    details: `Usuario ${userId} actualizado al rol '${role}'.`,
    type: 'user'
  });

  return data;
}

export async function getAuditLogs() {
  const { data, error } = await findAuditLogs();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}
