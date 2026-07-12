import {
  countProfiles,
  countHousings,
  countPendingDocuments,
  findPendingDocuments,
  updateDocumentsStatusForUser,
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
import { findHousingById, findHousingsByLandlord } from '../repositories/housing.repository.js';
import { findProfileById, findAuthUserById, deleteAuthUser } from '../repositories/auth.repository.js';
import { notifyLandlordOfHousingReview, notifyUserOfBlock, notifyUserOfReactivation } from './notifications.service.js';
import { invalidateHousingCache } from './housing.service.js';
import { getStudentStats, getLandlordStats } from './stats.service.js';
import { listFavorites } from './favorites.service.js';
import { NotFoundError } from '../errors/AppError.js';
import logger from '../config/logger.js';

const LOG_SCOPE_TYPES = {
  admin: ['system', 'user', 'listing'],
  arrendadores: ['landlord_activity', 'favorite']
};

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

// Revisa DNI + carnet de un usuario como una sola decision (no documento por
// documento) - asi nunca queda "verificado" con solo la mitad de sus
// credenciales revisadas. Aprobar/rechazar sin documentos pendientes es un
// 404: no hay nada que revisar (ya se revisaron o nunca los subio).
export async function reviewUserDocuments(userId, { estado, comentario }, actor) {
  const { data: updated, error } = await updateDocumentsStatusForUser(userId, { status: estado, comment: comentario });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  if (!updated?.length) {
    throw new NotFoundError('Documentos de verificación pendientes');
  }

  if (estado === 'approved') {
    await updateProfileVerification(userId, { is_verified: true, verification_status: 'approved' });
  } else if (estado === 'rejected') {
    await updateProfileVerification(userId, { verification_status: 'rejected' });
  }

  const { error: auditError } = await insertAuditLog({
    userId: actor?.id,
    actorName: actor?.name ?? 'Admin',
    action: estado === 'approved' ? 'Aprobó credenciales' : 'Rechazó credenciales',
    details: `Usuario ${userId}: ${updated.length} documento(s) marcado(s) como ${estado}.`,
    type: 'user'
  });
  if (auditError) {
    logger.warn(`No se pudo registrar la auditoría de credenciales de ${userId}: ${auditError.message}`);
  }

  return updated;
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
  const { data: before } = await findHousingById(housingId);
  const { data, error } = await updateHousingStatusRecord(housingId, estado);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  // Si el estado no cambio de verdad (ej. re-aprobar algo que ya estaba
  // approved), no generamos ruido nuevo en el registro ni notificamos.
  const statusChanged = before?.status !== estado;

  if (statusChanged) {
    const { error: auditError } = await insertAuditLog({
      userId: actor?.id,
      actorName: actor?.name ?? 'Admin',
      action: `Moderar anuncio: ${estado}`,
      details: `Anuncio '${data?.title ?? housingId}' cambiado a estado '${estado}'.`,
      type: 'listing',
      listingId: data?.id ?? null
    });
    if (auditError) {
      logger.warn(`No se pudo registrar la auditoría del anuncio ${housingId}: ${auditError.message}`);
    }

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

    invalidateHousingCache(data?.id);
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

  const { error: auditError } = await insertAuditLog({
    userId: actor?.id,
    actorName: actor?.name ?? 'Admin',
    action: dias ? 'Suspendió usuario' : 'Bloqueó usuario',
    details: `Usuario ${userId} ${dias ? `suspendido ${dias} día(s)` : 'bloqueado'}. Motivo: ${motivo}`,
    type: 'user'
  });
  if (auditError) {
    logger.warn(`No se pudo registrar la auditoría del bloqueo de ${userId}: ${auditError.message}`);
  }

  try {
    await notifyUserOfBlock({ userId, motivo, blockedUntil });
  } catch (err) {
    logger.warn(`No se pudo notificar el bloqueo a ${userId}: ${err.message}`);
  }

  return { message: 'Usuario bloqueado' };
}

export async function unblockUser(userId, actor) {
  const { error } = await updateProfileBlock(userId, { blockedUntil: null, motivo: null });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  const { error: auditError } = await insertAuditLog({
    userId: actor?.id,
    actorName: actor?.name ?? 'Admin',
    action: 'Reactivó cuenta',
    details: `Usuario ${userId} reactivado.`,
    type: 'user'
  });
  if (auditError) {
    logger.warn(`No se pudo registrar la auditoría de la reactivación de ${userId}: ${auditError.message}`);
  }

  try {
    await notifyUserOfReactivation(userId);
  } catch (err) {
    logger.warn(`No se pudo notificar la reactivación a ${userId}: ${err.message}`);
  }

  return { message: 'Usuario reactivado' };
}

// Borrado duro e irreversible: por el "on delete cascade" del esquema, si el
// usuario es arrendador esto se lleva tambien todas sus publicaciones,
// favoritos y chats. El frontend tiene que advertirlo antes de llamar esto -
// no es lo mismo que bloquear/suspender (reversible).
export async function deleteUserAccount(userId, { motivo }, actor) {
  const { data: profile, error: profileError } = await findProfileById(userId);

  if (profileError || !profile) {
    throw new NotFoundError('Usuario');
  }

  const { error } = await deleteAuthUser(userId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  const { error: auditError } = await insertAuditLog({
    userId: actor?.id,
    actorName: actor?.name ?? 'Admin',
    action: 'Eliminó cuenta',
    details: `Cuenta de '${profile.name}' (${profile.role}) eliminada. Motivo: ${motivo}`,
    type: 'user'
  });
  if (auditError) {
    logger.warn(`No se pudo registrar la auditoría de la eliminación de ${userId}: ${auditError.message}`);
  }

  return { message: 'Cuenta eliminada' };
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

  const { error: auditError } = await insertAuditLog({
    userId: actor?.id,
    actorName: actor?.name ?? 'Admin',
    action: 'Cambio de rol',
    details: `Usuario ${userId} actualizado al rol '${role}'.`,
    type: 'user'
  });
  if (auditError) {
    logger.warn(`No se pudo registrar la auditoría del cambio de rol de ${userId}: ${auditError.message}`);
  }

  return data;
}

export async function getAuditLogs(scope) {
  const { data, error } = await findAuditLogs({ types: LOG_SCOPE_TYPES[scope] });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}

// Vista de solo lectura para que el admin "visite" el perfil de un
// estudiante/arrendador sin suplantarlo: perfil + email (solo en auth.users,
// no en profiles) + sus stats/listings o favoritos segun el rol + su rastro
// de auditoria completo (moderacion recibida + sus propias ediciones).
export async function getUserDetail(userId) {
  const { data: profile, error } = await findProfileById(userId);

  if (error || !profile) {
    throw new NotFoundError('Usuario');
  }

  const [{ data: authUser }, { data: activity, error: activityError }] = await Promise.all([
    findAuthUserById(userId),
    findAuditLogs({ userId })
  ]);

  if (activityError) {
    const err = new Error(activityError.message);
    err.statusCode = 500;
    throw err;
  }

  let stats = null;
  let listings = [];
  let favorites = [];

  if (profile.role === 'landlord') {
    const [landlordStats, listingsResult] = await Promise.all([getLandlordStats(userId), findHousingsByLandlord(userId)]);
    stats = landlordStats;
    listings = listingsResult.data || [];
  } else if (profile.role === 'student') {
    const [studentStats, favs] = await Promise.all([getStudentStats(userId), listFavorites(userId)]);
    stats = studentStats;
    favorites = favs;
  }

  return {
    profile: { ...profile, email: authUser?.user?.email ?? null },
    stats,
    listings,
    favorites,
    activity: activity || []
  };
}
