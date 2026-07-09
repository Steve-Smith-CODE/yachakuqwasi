import {
  createHousing,
  listHousings,
  addHousingImages,
  listMyHousings,
  getHousingById,
  updateHousing,
  setHousingVisibility,
  deleteHousing,
  restoreDeletedHousing,
  getHousingActivity
} from '../services/housing.service.js';

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

export async function update(req, res) {
  const listing = await updateHousing(req.params.id, req.user, req.body);
  res.json(listing);
}

export async function setVisibility(req, res) {
  const listing = await setHousingVisibility(req.params.id, req.user, req.body.paused);
  res.json(listing);
}

export async function remove(req, res) {
  const listing = await deleteHousing(req.params.id, req.user, req.body.reason);
  res.json(listing);
}

export async function restore(req, res) {
  const listing = await restoreDeletedHousing(req.params.id, req.user);
  res.json(listing);
}

export async function activity(req, res) {
  const logs = await getHousingActivity(req.params.id, req.user);
  res.json(logs);
}
