import { insertHousing, findApprovedHousings } from '../repositories/housing.repository.js';

export async function createHousing(landlordId, data) {
  const {
    title,
    description,
    pricePen,
    distanceToUnschMinutes,
    neighborhood,
    address,
    type,
    amenities,
    contactPhone,
    images
  } = data;

  const { data: listing, error } = await insertHousing({
    landlord_id: landlordId,
    title,
    description,
    price_pen: pricePen,
    distance_to_unsch_minutes: distanceToUnschMinutes,
    neighborhood,
    address,
    type: type || 'room',
    amenities: amenities || [],
    contact_phone: contactPhone,
    images: images || [],
    status: 'pending'
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return listing;
}

export async function listHousings(filters = {}) {
  const { data, error } = await findApprovedHousings(filters);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}
