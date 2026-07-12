-- ============================================================
-- Notificaciones de usuario: registro nuevo (para admins) y
-- bloqueo/reactivacion de cuenta (para el usuario afectado).
-- Reusa la tabla notifications existente - actor_id ya es una FK
-- nullable a profiles, asi que para 'new_user' apunta al usuario
-- recien registrado (no hace falta una columna nueva).
-- ============================================================
alter type notification_type add value 'new_user';
alter type notification_type add value 'account_blocked';
alter type notification_type add value 'account_reactivated';
