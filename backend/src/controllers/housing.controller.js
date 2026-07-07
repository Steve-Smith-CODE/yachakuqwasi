import { createHousing, listHousings, addHousingImages, listMyHousings } from '../services/housing.service.js';

export async function create(req, res) {
  const listing = await createHousing(req.user.id, req.body);
  res.status(201).json(listing);
}

export async function uploadImages(req, res) {
  const listing = await addHousingImages(req.params.id, req.user, req.body.images);
  res.json(listing);
}

export async function list(req, res) {
  const { tipo, precio_max, barrio, page, limit } = req.query;
  const listings = await listHousings({ tipo, precioMax: precio_max, barrio, page, limit });
  res.json(listings);
}

export async function mine(req, res) {
  const listings = await listMyHousings(req.user.id);
  res.json(listings);
}
