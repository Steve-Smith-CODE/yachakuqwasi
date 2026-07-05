import { createHousing, listHousings } from '../services/housing.service.js';

export async function create(req, res) {
  const listing = await createHousing(req.user.id, req.body);
  res.status(201).json(listing);
}

export async function list(req, res) {
  const { tipo, precio_max, barrio } = req.query;
  const listings = await listHousings({ tipo, precioMax: precio_max, barrio });
  res.json(listings);
}
