import { addFavorite, removeFavorite, listFavorites } from '../services/favorites.service.js';

export async function add(req, res) {
  const favorite = await addFavorite(req.user.id, req.body.listingId);
  res.status(201).json(favorite);
}

export async function remove(req, res) {
  const result = await removeFavorite(req.user.id, req.params.listingId);
  res.json(result);
}

export async function list(req, res) {
  res.json(await listFavorites(req.user.id));
}
