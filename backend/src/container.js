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
//   roommates.service            -> domain/compatibility (logica pura, sin repository)
//   image.service                  -> storage.repository

export * as authService from './services/auth.service.js';
export * as housingService from './services/housing.service.js';
export * as adminService from './services/admin.service.js';
export * as chatService from './services/chat.service.js';
export * as roommatesService from './services/roommates.service.js';
export * as imageService from './services/image.service.js';
export * as geocodingService from './services/geocoding.service.js';
