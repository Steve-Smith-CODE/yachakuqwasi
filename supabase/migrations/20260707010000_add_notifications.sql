create type notification_type as enum (
  'listing_approved',
  'listing_flagged',
  'listing_suspended',
  'listing_pending_review'
);

create table notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references profiles (id) on delete cascade,
  actor_id      uuid references profiles (id) on delete set null,
  type          notification_type not null,
  title         text not null,
  body          text,
  listing_id    uuid references housing_listings (id) on delete cascade,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_notifications_recipient_created on notifications (recipient_id, created_at desc);
create index idx_notifications_recipient_unread on notifications (recipient_id) where read_at is null;

alter table notifications enable row level security;

create policy "notifications_self_read" on notifications
  for select using (auth.uid() = recipient_id);

create policy "notifications_self_update" on notifications
  for update using (auth.uid() = recipient_id);
