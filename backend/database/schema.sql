-- ============================================================
-- YachakuqWasi / Alójate UNSCH — Esquema de base de datos
-- Motor: PostgreSQL (Supabase), autenticación: Supabase Auth (auth.users)
-- Reemplaza los mocks de backend/src/routes/*.js por datos reales.
-- Ejecutar en: Supabase Dashboard > SQL Editor, o via `supabase db push`.
--
-- v2: reemplaza la tabla "users" propia por "profiles", ligada 1:1 a
-- auth.users. El login/registro ahora los maneja Supabase Auth
-- (backend/src/services/auth.service.js) en vez de bcrypt + JWT propio.
-- ============================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type user_role as enum ('student', 'landlord', 'admin');
create type verification_status as enum ('none', 'pending', 'approved', 'rejected');
create type housing_type as enum ('room', 'apartment', 'shared', 'family');
create type housing_status as enum ('approved', 'pending', 'suspended', 'flagged');
create type chat_presence as enum ('online', 'offline');
create type message_sender as enum ('student', 'landlord');
create type audit_log_type as enum ('system', 'user', 'listing');

-- ------------------------------------------------------------
-- Trigger genérico para mantener updated_at
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- TABLA: profiles
-- Datos de aplicación de cada usuario. id = auth.users.id (1:1).
-- El email/password ya viven en auth.users, gestionados por Supabase Auth.
-- ------------------------------------------------------------
create table profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  name                  text not null,
  role                  user_role not null default 'student',
  faculty               text,
  career                text,
  phone                 text,
  is_verified           boolean not null default false,
  verification_status   verification_status not null default 'none',
  verification_doc_url  text,
  blocked_until         timestamptz,
  blocked_reason        text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_profiles_role on profiles (role);
create index idx_profiles_verification_status on profiles (verification_status);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Crea el profile automaticamente cuando Supabase Auth crea un auth.users
-- (se dispara con supabase.auth.admin.createUser({ user_metadata: {...} })).
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role, faculty, career, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student'),
    new.raw_user_meta_data->>'faculty',
    new.raw_user_meta_data->>'career',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ------------------------------------------------------------
-- TABLA: housing_listings
-- Publicaciones de alquiler creadas por arrendadores.
-- ------------------------------------------------------------
create table housing_listings (
  id                          uuid primary key default gen_random_uuid(),
  landlord_id                 uuid not null references profiles (id) on delete cascade,
  title                       text not null,
  type                        housing_type not null default 'room',
  price_pen                   numeric(8, 2) not null check (price_pen >= 0),
  distance_to_unsch_minutes   integer not null check (distance_to_unsch_minutes >= 0),
  neighborhood                text not null,
  address                     text not null,
  description                 text,
  contact_phone               text not null,
  amenities                   text[] not null default '{}',
  images                      text[] not null default '{}',
  coordinate_x                numeric(5, 2),
  coordinate_y                numeric(5, 2),
  verified_by_maki            boolean not null default false,
  status                      housing_status not null default 'pending',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_listings_status on housing_listings (status);
create index idx_listings_neighborhood on housing_listings (neighborhood);
create index idx_listings_type on housing_listings (type);
create index idx_listings_price on housing_listings (price_pen);
create index idx_listings_landlord on housing_listings (landlord_id);
-- Búsqueda combinada típica del explorador: barrio + tipo + precio máx.
create index idx_listings_search on housing_listings (status, neighborhood, type, price_pen);

create trigger trg_listings_updated_at
  before update on housing_listings
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- TABLA: favorites
-- Habitaciones guardadas por un estudiante (❤️).
-- ------------------------------------------------------------
create table favorites (
  user_id     uuid not null references profiles (id) on delete cascade,
  listing_id  uuid not null references housing_listings (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index idx_favorites_listing on favorites (listing_id);

-- ------------------------------------------------------------
-- TABLA: chats
-- Conversación directa entre un estudiante y un arrendador,
-- generalmente asociada a una publicación.
-- ------------------------------------------------------------
create table chats (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references profiles (id) on delete cascade,
  landlord_id    uuid not null references profiles (id) on delete cascade,
  listing_id     uuid references housing_listings (id) on delete set null,
  last_message   text,
  unread         boolean not null default true,
  status         chat_presence not null default 'offline',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (student_id, landlord_id, listing_id)
);

create index idx_chats_student on chats (student_id);
create index idx_chats_landlord on chats (landlord_id);

create trigger trg_chats_updated_at
  before update on chats
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- TABLA: chat_messages
-- Mensajes individuales dentro de un chat.
-- ------------------------------------------------------------
create table chat_messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references chats (id) on delete cascade,
  sender      message_sender not null,
  text        text not null,
  created_at  timestamptz not null default now()
);

create index idx_messages_chat_created on chat_messages (chat_id, created_at);

-- ------------------------------------------------------------
-- TABLA: verification_documents
-- Historial de credenciales subidas para verificación de identidad
-- (endpoint admin: GET /documentos/pendientes, PUT /documentos/:id).
-- ------------------------------------------------------------
create table verification_documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete cascade,
  doc_url       text not null,
  status        verification_status not null default 'pending',
  comment       text,
  reviewed_by   uuid references profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);

create index idx_verifdocs_status on verification_documents (status);
create index idx_verifdocs_user on verification_documents (user_id);

-- ------------------------------------------------------------
-- TABLA: audit_logs
-- Bitácora de acciones del sistema (panel de administrador).
-- ------------------------------------------------------------
create table audit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles (id) on delete set null,
  actor_name   text not null,
  action       text not null,
  details      text,
  type         audit_log_type not null default 'user',
  created_at   timestamptz not null default now()
);

create index idx_audit_created_desc on audit_logs (created_at desc);
create index idx_audit_type on audit_logs (type);

-- ============================================================
-- Row Level Security (RLS) — Supabase la exige para exponer
-- tablas vía su API REST/Realtime. El backend usa la secret key
-- (supabaseAdmin), que ignora RLS; estas policies cubren el caso
-- de que el frontend algún día consulte Supabase directamente con
-- la publishable key.
-- ============================================================
alter table profiles enable row level security;
alter table housing_listings enable row level security;
alter table favorites enable row level security;
alter table chats enable row level security;
alter table chat_messages enable row level security;
alter table verification_documents enable row level security;
alter table audit_logs enable row level security;

-- Lectura pública de publicaciones aprobadas (explorador sin login)
create policy "listings_public_read" on housing_listings
  for select using (status = 'approved');

-- Un usuario puede leer y actualizar su propio profile
create policy "profiles_self_read" on profiles
  for select using (auth.uid() = id);

create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id);

-- El resto de accesos (escritura de listings, chats, admin) deben ir
-- por el backend con la secret key, o ampliarse con policies propias
-- de auth.uid() segun se necesite.
