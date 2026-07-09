import { insertFavorite, deleteFavorite, findFavoritesByUser } from '../repositories/favorites.repository.js';
import { findHousingById } from '../repositories/housing.repository.js';
import { findProfileById } from '../repositories/auth.repository.js';
import { insertAuditLog } from '../repositories/admin.repository.js';
import logger from '../config/logger.js';

export async function addFavorite(userId, listingId) {
  const { data, error } = await insertFavorite(userId, listingId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  // Visible solo para el admin: señal de que un anuncio esta generando
  // interes real, aparte del contador agregado que ya ve el arrendador.
  try {
    const [{ data: listing }, { data: student }] = await Promise.all([
      findHousingById(listingId),
      findProfileById(userId)
    ]);
    await insertAuditLog({
      userId,
      actorName: student?.name ?? 'Estudiante',
      action: 'Marcó como favorito',
      details: listing?.title ?? listingId,
      type: 'favorite',
      listingId
    });
  } catch (err) {
    logger.warn(`No se pudo registrar el favorito ${listingId}: ${err.message}`);
  }

  return data;
}

export async function removeFavorite(userId, listingId) {
  const { error } = await deleteFavorite(userId, listingId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return { message: 'Favorito eliminado' };
}

export async function listFavorites(userId) {
  const { data, error } = await findFavoritesByUser(userId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data.map((row) => row.housing_listings).filter(Boolean);
}
