// Punto unico donde queda documentada la composicion real de capas del
// backend: que service usa que repository. No es inyeccion de dependencias
// clasica (los services importan sus repositories directo, como modulos ES
// - que ya son singletons) sino un indice explicito para que la relacion
// sea visible sin tener que recorrer cada archivo.
//
//   servicio              -> repository(s) que usa
//   ----------------------------------------------------
//   auth.service           -> auth.repository
//   housing.service         -> housing.repository, storage.repository (via image.service),
//                              geocoding.service (best-effort, no toca Supabase)
//   admin.service            -> admin.repository
//   chat.service               -> chat.repository
//   image.service                  -> storage.repository
//   avatar.service                   -> storage.repository
//   profile.service                    -> profile.repository, auth.repository (password), avatar.service
//   stats.service                        -> housing.repository, favorites.repository, chat.repository
//   notifications.service                  -> notifications.repository
//     (housing.service y admin.service llaman a notifications.service de forma
//      best-effort al crear/revisar publicaciones, sin que un fallo ahi tumbe la request)

export * as authService from './services/auth.service.js';
export * as housingService from './services/housing.service.js';
export * as adminService from './services/admin.service.js';
export * as chatService from './services/chat.service.js';
export * as imageService from './services/image.service.js';
export * as geocodingService from './services/geocoding.service.js';
export * as avatarService from './services/avatar.service.js';
export * as profileService from './services/profile.service.js';
export * as statsService from './services/stats.service.js';
export * as notificationsService from './services/notifications.service.js';
