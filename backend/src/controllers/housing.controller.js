import { createHousing, listHousings, addHousingImages } from '../services/housing.service.js';

export async function create(req, res) {
  const listing = await createHousing(req.user.id, req.body);
  res.status(201).json(listing);
}

export async function uploadImages(req, res) {
  const listing = await addHousingImages(req.params.id, req.user, req.body.images);
  res.json(listing);
}

export async function list(req, res) {
  const { tipo, precio_max, barrio } = req.query;
  const listings = await listHousings({ tipo, precioMax: precio_max, barrio });
  res.json(listings);
}
