-- ------------------------------------------------------------
-- Herramientas de gestion de anuncio para el arrendador:
-- pausar/publicar (visibilidad) y eliminar (soft delete).
-- Ambos son independientes del "status" de moderacion del admin
-- (pending/approved/rejected), que no se toca aqui.
-- ------------------------------------------------------------
alter table housing_listings
  add column paused_at timestamptz,
  add column deleted_at timestamptz,
  add column delete_reason text;

create index idx_listings_deleted on housing_listings (deleted_at);

-- La lectura publica (RLS, clientes con anon key) tampoco debe mostrar
-- anuncios pausados o eliminados por su arrendador.
drop policy if exists "listings_public_read" on housing_listings;
create policy "listings_public_read" on housing_listings
  for select using (status = 'approved' and paused_at is null and deleted_at is null);
