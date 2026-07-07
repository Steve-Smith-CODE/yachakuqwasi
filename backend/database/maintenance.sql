-- ============================================================
-- Funcion de mantenimiento para backend/scripts/cleanup.js.
-- Ejecutar manualmente una vez en: Supabase Dashboard > SQL Editor.
-- NO se ejecuta automaticamente desde el backend.
-- ============================================================

create or replace function public.truncate_all_tables()
returns void
language plpgsql
security definer
as $$
begin
  truncate table public.audit_logs cascade;
  truncate table public.chat_messages cascade;
  truncate table public.chats cascade;
  truncate table public.favorites cascade;
  truncate table public.verification_documents cascade;
  truncate table public.housing_listings cascade;
  truncate table public.profiles cascade;
end;
$$;

-- Solo el rol de servicio (backend con SUPABASE_SECRET_KEY) puede ejecutarla.
revoke execute on function public.truncate_all_tables() from public;
revoke execute on function public.truncate_all_tables() from anon;
revoke execute on function public.truncate_all_tables() from authenticated;
grant execute on function public.truncate_all_tables() to service_role;
