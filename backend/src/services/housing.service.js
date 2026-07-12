import {
  insertHousing,
  findApprovedHousings,
  findHousingById,
  findApprovedHousingById,
  updateHousingImages,
  findHousingsByLandlord,
  updateHousingFields,
  setHousingPaused,
  softDeleteHousing,
  restoreHousing
} from '../repositories/housing.repository.js';
import { geocode } from './geocoding.service.js';
import { uploadHousingImages } from './image.service.js';
import { notifyAdminsOfNewHousing, notifyAdminsOfHousingPendingReview } from './notifications.service.js';
import { insertAuditLog, findAuditLogs } from '../repositories/admin.repository.js';
import { NotFoundError, ForbiddenError, AppError } from '../errors/AppError.js';
import logger from '../config/logger.js';
import { withCache, cacheDeletePrefix } from '../utils/cache.js';

const LIST_CACHE_PREFIX = 'housings:list:';
const LIST_CACHE_TTL_MS = 30_000; // el explorador tolera ~30s de retraso; una moderacion/edicion invalida al toque igual
const DETAIL_CACHE_TTL_MS = 60_000;

// Las publicaciones nuevas quedan "pending" (invisibles en el explorador
// publico) hasta que un admin las aprueba, asi que 30s de cache no oculta
// nada que un usuario esperara ver de inmediato.
export function invalidateHousingCache(housingId) {
  cacheDeletePrefix(LIST_CACHE_PREFIX);
  if (housingId) cacheDeletePrefix(`housings:detail:${housingId}`);
}

const FIELD_LABEL = {
  title: 'título',
  description: 'descripción',
  price_pen: 'precio',
  distance_to_unsch_minutes: 'distancia',
  neighborhood: 'distrito',
  address: 'dirección',
  type: 'tipo',
  amenities: 'servicios',
  contact_phone: 'teléfono'
};

const DELETE_REASON_LABEL = {
  rented: 'ya alquiló',
  data_changed: 'cambió sus datos',
  other: 'otro motivo'
};

// Historial de acciones del arrendador sobre su propio anuncio (pausar,
// publicar, editar, eliminar, restaurar). Es un registro aparte del de
// moderacion del admin (ver admin.service.js) - ambos comparten la tabla
// audit_logs pero se filtran por `type` para no mezclarse.
// findOwnedHousingOrThrow deja pasar a un admin sobre publicaciones ajenas
// (bypass de dueño), asi que esta misma funcion puede terminar registrando
// una accion del admin, no del arrendador - en ese caso va a type 'listing'
// (donde ya vive la moderacion) para que no aparezca mezclada como si el
// arrendador se hubiera editado/eliminado su propio anuncio.
async function logLandlordActivity({ user, listingId, action, details }) {
  try {
    await insertAuditLog({
      userId: user.id,
      actorName: user.name ?? 'Arrendador',
      action,
      details,
      type: user.role === 'admin' ? 'listing' : 'landlord_activity',
      listingId
    });
  } catch (err) {
    logger.warn(`No se pudo registrar actividad del arrendador en ${listingId}: ${err.message}`);
  }
}

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

export async function createHousing(landlordId, data, actor) {
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

  try {
    await notifyAdminsOfNewHousing({ listingId: listing.id, listingTitle: listing.title, actorId: landlordId });
  } catch (err) {
    logger.warn(`No se pudo notificar a los admins de la publicación ${listing.id}: ${err.message}`);
  }

  await logLandlordActivity({
    user: actor ?? { id: landlordId, role: 'landlord' },
    listingId: listing.id,
    action: 'Creó anuncio',
    details: listing.title
  });

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
  const cacheKey = LIST_CACHE_PREFIX + JSON.stringify(filters);

  return withCache(cacheKey, LIST_CACHE_TTL_MS, async () => {
    const { data, error } = await findApprovedHousings(filters);

    if (error) {
      const err = new Error(error.message);
      err.statusCode = 500;
      throw err;
    }

    return data;
  });
}

export async function getHousingById(id) {
  return withCache(`housings:detail:${id}`, DETAIL_CACHE_TTL_MS, async () => {
    const { data, error } = await findApprovedHousingById(id);

    if (error || !data) {
      throw new NotFoundError('Alojamiento');
    }

    return data;
  });
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

const EDITABLE_FIELDS = {
  title: 'title',
  description: 'description',
  pricePen: 'price_pen',
  distanceToUnschMinutes: 'distance_to_unsch_minutes',
  neighborhood: 'neighborhood',
  address: 'address',
  type: 'type',
  amenities: 'amenities',
  contactPhone: 'contact_phone'
};

// Cambiar estos campos afecta lo que el admin ya aprobo (precio, ubicacion,
// como contactar), asi que el anuncio vuelve a "pending" para re-revision.
// Los campos cosmeticos (titulo, descripcion, comodidades, distancia) se
// guardan al instante sin pasar de nuevo por moderacion.
const SENSITIVE_FIELDS = new Set(['price_pen', 'address', 'contact_phone', 'neighborhood']);

function sensitiveFieldChanged(column, newValue, oldValue) {
  if (column === 'price_pen') return Number(newValue) !== Number(oldValue);
  return String(newValue ?? '').trim() !== String(oldValue ?? '').trim();
}

async function findOwnedHousingOrThrow(housingId, user, actionMessage) {
  const { data: listing, error } = await findHousingById(housingId);

  if (error || !listing || listing.deleted_at) {
    throw new NotFoundError('Alojamiento');
  }

  if (listing.landlord_id !== user.id && user.role !== 'admin') {
    throw new ForbiddenError(actionMessage);
  }

  return listing;
}

export async function updateHousing(housingId, user, data) {
  const listing = await findOwnedHousingOrThrow(housingId, user, 'No puedes editar una publicación que no es tuya');

  const patch = {};
  let touchesSensitive = false;

  for (const [key, column] of Object.entries(EDITABLE_FIELDS)) {
    if (data[key] === undefined) continue;

    const changed = Array.isArray(data[key])
      ? JSON.stringify(data[key]) !== JSON.stringify(listing[column])
      : sensitiveFieldChanged(column, data[key], listing[column]);

    if (!changed) continue;

    patch[column] = data[key];
    if (SENSITIVE_FIELDS.has(column)) touchesSensitive = true;
  }

  if (Object.keys(patch).length === 0) {
    return listing;
  }

  if (touchesSensitive && listing.status === 'approved') {
    patch.status = 'pending';
  }

  const { data: updated, error: updateError } = await updateHousingFields(housingId, patch);

  if (updateError) {
    throw new AppError(updateError.message, 400, 'HOUSING_UPDATE_FAILED');
  }

  if (patch.status === 'pending') {
    try {
      await notifyAdminsOfHousingPendingReview({
        listingId: updated.id,
        listingTitle: updated.title,
        actorId: user.id,
        title: 'Publicación editada, pendiente de revisión'
      });
    } catch (err) {
      logger.warn(`No se pudo notificar a los admins de la edición del anuncio ${housingId}: ${err.message}`);
    }
  }

  const changedLabels = Object.keys(patch)
    .filter((column) => column !== 'status')
    .map((column) => FIELD_LABEL[column] || column);
  await logLandlordActivity({
    user,
    listingId: updated.id,
    action: 'Editó anuncio',
    details: `Campos actualizados: ${changedLabels.join(', ')}.${patch.status === 'pending' ? ' Vuelve a revisión.' : ''}`
  });

  invalidateHousingCache(updated.id);
  return updated;
}

export async function setHousingVisibility(housingId, user, paused) {
  await findOwnedHousingOrThrow(housingId, user, 'No puedes cambiar la visibilidad de una publicación que no es tuya');

  const { data: updated, error } = await setHousingPaused(housingId, paused);

  if (error) {
    throw new AppError(error.message, 400, 'HOUSING_VISIBILITY_FAILED');
  }

  await logLandlordActivity({
    user,
    listingId: updated.id,
    action: paused ? 'Pausó anuncio' : 'Publicó anuncio',
    details: updated.title
  });

  invalidateHousingCache(updated.id);
  return updated;
}

export async function deleteHousing(housingId, user, reason) {
  await findOwnedHousingOrThrow(housingId, user, 'No puedes eliminar una publicación que no es tuya');

  const { data: updated, error } = await softDeleteHousing(housingId, reason);

  if (error) {
    throw new AppError(error.message, 400, 'HOUSING_DELETE_FAILED');
  }

  await logLandlordActivity({
    user,
    listingId: updated.id,
    action: 'Eliminó anuncio',
    details: `${updated.title}${reason ? ` — motivo: ${DELETE_REASON_LABEL[reason] || reason}` : ''}`
  });

  invalidateHousingCache(updated.id);
  return updated;
}

// Deshacer un "Eliminar" reciente (toast de undo). No pasa por
// findOwnedHousingOrThrow porque ese helper rechaza listings ya eliminados,
// que es justo el caso que aqui queremos revertir.
export async function restoreDeletedHousing(housingId, user) {
  const { data: listing, error } = await findHousingById(housingId);

  if (error || !listing) {
    throw new NotFoundError('Alojamiento');
  }

  if (listing.landlord_id !== user.id && user.role !== 'admin') {
    throw new ForbiddenError('No puedes restaurar una publicación que no es tuya');
  }

  if (!listing.deleted_at) {
    return listing;
  }

  const { data: updated, error: restoreError } = await restoreHousing(housingId);

  if (restoreError) {
    throw new AppError(restoreError.message, 400, 'HOUSING_RESTORE_FAILED');
  }

  await logLandlordActivity({
    user,
    listingId: updated.id,
    action: 'Restauró anuncio',
    details: updated.title
  });

  invalidateHousingCache(updated.id);
  return updated;
}

export async function getHousingActivity(housingId, user) {
  const listing = await findOwnedHousingOrThrow(housingId, user, 'No puedes ver el historial de una publicación que no es tuya');

  const { data, error } = await findAuditLogs({ types: ['landlord_activity'], listingId: listing.id });

  if (error) {
    throw new AppError(error.message, 500, 'HOUSING_ACTIVITY_FETCH_FAILED');
  }

  return data;
}
