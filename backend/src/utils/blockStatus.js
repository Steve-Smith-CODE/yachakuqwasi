// blocked_until null puede significar "nunca bloqueado" o "bloqueo
// permanente" - blocked_reason es el que de verdad marca un bloqueo activo;
// un blocked_until en el pasado significa que la suspension temporal ya vencio.
export function isProfileBlocked(profile) {
  return Boolean(profile?.blocked_reason) && (!profile.blocked_until || new Date(profile.blocked_until) > new Date());
}
