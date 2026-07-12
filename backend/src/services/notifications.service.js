import {
  insertNotifications,
  findNotificationsForUser,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  findAdminIds
} from '../repositories/notifications.repository.js';
import { NotFoundError, AppError } from '../errors/AppError.js';

const REVIEW_TYPE_BY_STATUS = {
  approved: 'listing_approved',
  flagged: 'listing_flagged',
  suspended: 'listing_suspended'
};

const REVIEW_TITLE_BY_STATUS = {
  approved: 'Tu publicación fue aprobada',
  flagged: 'Tu publicación fue observada',
  suspended: 'Tu publicación fue suspendida'
};

export async function listMyNotifications(userId) {
  const [{ data, error }, { count, error: countError }] = await Promise.all([
    findNotificationsForUser(userId),
    countUnreadNotifications(userId)
  ]);

  if (error || countError) {
    throw new AppError((error || countError).message, 500, 'NOTIFICATIONS_FETCH_FAILED');
  }

  return { notifications: data, unreadCount: count ?? 0 };
}

export async function markAsRead(id, userId) {
  const { data, error } = await markNotificationRead(id, userId);

  if (error) {
    throw new AppError(error.message, 400, 'NOTIFICATION_UPDATE_FAILED');
  }
  if (!data) {
    throw new NotFoundError('Notificación');
  }

  return data;
}

export async function markAllAsRead(userId) {
  const { error } = await markAllNotificationsRead(userId);

  if (error) {
    throw new AppError(error.message, 400, 'NOTIFICATIONS_UPDATE_FAILED');
  }

  return { message: 'Notificaciones marcadas como leídas' };
}

export async function notifyLandlordOfHousingReview({ landlordId, listingId, listingTitle, estado, actorId }) {
  const type = REVIEW_TYPE_BY_STATUS[estado];
  if (!type) return;

  await insertNotifications([
    {
      recipient_id: landlordId,
      actor_id: actorId ?? null,
      type,
      title: REVIEW_TITLE_BY_STATUS[estado],
      body: listingTitle,
      listing_id: listingId
    }
  ]);
}

export async function notifyAdminsOfHousingPendingReview({ listingId, listingTitle, actorId, title }) {
  const { data: admins, error } = await findAdminIds();
  if (error || !admins?.length) return;

  const rows = admins.map((admin) => ({
    recipient_id: admin.id,
    actor_id: actorId ?? null,
    type: 'listing_pending_review',
    title: title || 'Nueva publicación pendiente de revisión',
    body: listingTitle,
    listing_id: listingId
  }));

  await insertNotifications(rows);
}

export async function notifyAdminsOfNewHousing({ listingId, listingTitle, actorId }) {
  return notifyAdminsOfHousingPendingReview({ listingId, listingTitle, actorId });
}

const ROLE_LABEL = { student: 'estudiante', landlord: 'arrendador' };

// actor_id ya es una FK nullable a profiles (se usaba para "quien disparo la
// notificacion"); para este tipo la reusamos para apuntar al usuario recien
// registrado, asi el admin puede abrir su perfil desde la notificacion sin
// necesitar una columna nueva.
export async function notifyAdminsOfNewUser({ userId, userName, role }) {
  const { data: admins, error } = await findAdminIds();
  if (error || !admins?.length) return;

  const rows = admins.map((admin) => ({
    recipient_id: admin.id,
    actor_id: userId,
    type: 'new_user',
    title: 'Nuevo usuario registrado',
    body: `${userName} se registró como ${ROLE_LABEL[role] || role}`
  }));

  await insertNotifications(rows);
}

export async function notifyUserOfBlock({ userId, motivo, blockedUntil }) {
  await insertNotifications([
    {
      recipient_id: userId,
      type: 'account_blocked',
      title: blockedUntil ? 'Tu cuenta fue suspendida temporalmente' : 'Tu cuenta fue bloqueada',
      body: motivo
    }
  ]);
}

export async function notifyUserOfReactivation(userId) {
  await insertNotifications([
    {
      recipient_id: userId,
      type: 'account_reactivated',
      title: 'Tu cuenta fue reactivada',
      body: 'Ya puedes volver a usar tu cuenta con normalidad.'
    }
  ]);
}
