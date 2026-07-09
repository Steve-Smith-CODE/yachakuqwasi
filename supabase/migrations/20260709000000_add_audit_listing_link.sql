-- ------------------------------------------------------------
-- El registro de auditoria se separa por audiencia:
-- - 'system' / 'user' / 'listing' -> acciones del admin (ya existian).
-- - 'landlord_activity' -> acciones del arrendador sobre su propio
--   anuncio (pausar, publicar, editar, eliminar, restaurar).
-- - 'favorite' -> un estudiante marco un anuncio como favorito
--   (visible solo para el admin, como señal de interes real).
-- listing_id permite que cualquier fila del registro sea "clicable"
-- y lleve directo al anuncio correspondiente.
-- ------------------------------------------------------------
alter table audit_logs
  add column listing_id uuid references housing_listings (id) on delete set null;

create index idx_audit_listing on audit_logs (listing_id);

alter type audit_log_type add value if not exists 'landlord_activity';
alter type audit_log_type add value if not exists 'favorite';
