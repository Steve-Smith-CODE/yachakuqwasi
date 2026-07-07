import { insertFavorite, deleteFavorite, findFavoritesByUser } from '../repositories/favorites.repository.js';

export async function addFavorite(userId, listingId) {
  const { data, error } = await insertFavorite(userId, listingId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
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
