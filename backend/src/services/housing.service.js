import {
  insertHousing,
  findApprovedHousings,
  findHousingById,
  updateHousingImages,
  findHousingsByLandlord
} from '../repositories/housing.repository.js';
import { geocode } from './geocoding.service.js';
import { uploadHousingImages } from './image.service.js';
import { NotFoundError, ForbiddenError, AppError } from '../errors/AppError.js';
import logger from '../config/logger.js';

// Geocodificar es best-effort: si Nominatim falla o no responde, la
// publicacion se crea igual, solo sin coordenadas. Se omite en tests para no
// depender de red externa ni del limite de 1 req/segundo de Nominatim.
export async function resolveCoordinates(address, neighborhood) {
  if (process.env.NODE_ENV === 'test') {
    return { coordinateX: null, coordinateY: null };
  }

  try {
    const coords = await geocode(`${address}, ${neighborhood}, Ayacucho, Peru`);
    if (!coords) return { coordinateX: null, coordinateY: null };
    return { coordinateX: coords.lon, coordinateY: coords.lat };
  } catch (err) {
    logger.warn('No se pudo geocodificar la direccion: ' + err.message);
    return { coordinateX: null, coordinateY: null };
  }
}

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

  const { coordinateX, coordinateY } = await resolveCoordinates(address, neighborhood);

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
    status: 'pending',
    coordinate_x: coordinateX,
    coordinate_y: coordinateY
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return listing;
}

export async function addHousingImages(housingId, user, images) {
  const { data: listing, error } = await findHousingById(housingId);

  if (error || !listing) {
    throw new NotFoundError('Alojamiento');
  }

  if (listing.landlord_id !== user.id && user.role !== 'admin') {
    throw new ForbiddenError('No puedes editar fotos de una publicación que no es tuya');
  }

  const newUrls = await uploadHousingImages(housingId, images);
  const allImages = [...(listing.images || []), ...newUrls];

  const { data: updated, error: updateError } = await updateHousingImages(housingId, allImages);

  if (updateError) {
    throw new AppError(updateError.message, 400, 'IMAGE_UPDATE_FAILED');
  }

  return updated;
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

export async function listMyHousings(landlordId) {
  const { data, error } = await findHousingsByLandlord(landlordId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}
