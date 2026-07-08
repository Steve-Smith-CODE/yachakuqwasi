import { createHousing, listHousings, addHousingImages, listMyHousings, getHousingById } from '../services/housing.service.js';

export async function create(req, res) {
  const listing = await createHousing(req.user.id, req.body);
  res.status(201).json(listing);
}

export async function uploadImages(req, res) {
  const listing = await addHousingImages(req.params.id, req.user, req.body.images);
  res.json(listing);
}

export async function list(req, res) {
  const { tipo, precio_max, barrio, q, page, limit } = req.query;
  const listings = await listHousings({ tipo, precioMax: precio_max, barrio, q, page, limit });
  res.json(listings);
}

export async function mine(req, res) {
  const listings = await listMyHousings(req.user.id);
  res.json(listings);
}

export async function show(req, res) {
  const listing = await getHousingById(req.params.id);
  res.json(listing);
}
