-- ============================================================
-- Optimizacion de indices para el explorador publico (GET /housings)
--
-- Motivo: idx_listings_search (status, neighborhood, type, price_pen) quedo
-- desactualizado cuando 20260708000000 sumo paused_at/deleted_at al filtro
-- real de la query (findApprovedHousings): status='approved' AND
-- paused_at IS NULL AND deleted_at IS NULL, mas ORDER BY created_at DESC.
-- Sin paused_at/deleted_at en el indice, Postgres filtra esas dos columnas
-- fila por fila despues del index scan y ademas ordena aparte (no hay
-- indice que cubra el ORDER BY). Con mas publicaciones esto degrada rapido.
--
-- Fix: un indice parcial que solo indexa filas visibles (status/paused_at/
-- deleted_at pasan a ser constantes, no columnas) e incluye created_at para
-- que el ORDER BY salga gratis del index scan.
-- ============================================================

drop index if exists idx_listings_search;
drop index if exists idx_listings_deleted;

create index idx_listings_visible
  on housing_listings (neighborhood, type, price_pen, created_at desc)
  where status = 'approved' and paused_at is null and deleted_at is null;

-- Panel del arrendador (findHousingsByLandlord): landlord_id + deleted_at is
-- null, ordenado por created_at desc. idx_listings_landlord (solo landlord_id)
-- no cubre ni el filtro de soft-delete ni el orden.
create index idx_listings_landlord_active
  on housing_listings (landlord_id, created_at desc)
  where deleted_at is null;

-- ------------------------------------------------------------
-- Busqueda libre (?q=) via ilike '%termino%' en 4 columnas (repository
-- housing.repository.js). Un ilike con wildcard al inicio no puede usar un
-- indice btree normal: siempre termina en seq scan sobre toda la tabla.
-- pg_trgm + GIN indexa trigramas y si soporta '%termino%' en cualquier
-- posicion.
-- ------------------------------------------------------------
create extension if not exists pg_trgm;

create index idx_listings_title_trgm on housing_listings using gin (title gin_trgm_ops);
create index idx_listings_neighborhood_trgm on housing_listings using gin (neighborhood gin_trgm_ops);
create index idx_listings_address_trgm on housing_listings using gin (address gin_trgm_ops);
create index idx_listings_description_trgm on housing_listings using gin (description gin_trgm_ops);
