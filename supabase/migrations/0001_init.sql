-- Travel Vault — esquema inicial (fase 1: solo tablas + RLS, sin lógica de sync todavía)
-- Ejecutar en Supabase → SQL Editor (o vía `supabase db push` si usas la CLI).

create extension if not exists "pgcrypto";

create table if not exists destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  country text,
  country_code text,
  type text not null check (type in ('city','country')),
  status text not null check (status in ('want_to_go','planned','visited')),
  companions text[] not null default '{}',
  trip_start date,
  trip_end date,
  lat double precision,
  lng double precision,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references destinations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  text text not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references destinations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  caption text not null default '',
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists destinations_user_idx on destinations(user_id);
create index if not exists journal_entries_destination_idx on journal_entries(destination_id);
create index if not exists photos_destination_idx on photos(destination_id);
create index if not exists destinations_deleted_at_idx
  on destinations(deleted_at)
  where deleted_at is not null;

create index if not exists journal_entries_deleted_at_idx
  on journal_entries(deleted_at)
  where deleted_at is not null;

create index if not exists photos_deleted_at_idx
  on photos(deleted_at)
  where deleted_at is not null;


-- updated_at siempre lo pone el servidor, nunca el cliente (evita bugs de reloj
-- desincronizado entre dispositivos cuando se implemente el sync en la fase 4).
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger destinations_set_updated_at before update on destinations
  for each row execute function set_updated_at();
create trigger journal_entries_set_updated_at before update on journal_entries
  for each row execute function set_updated_at();
create trigger photos_set_updated_at before update on photos
  for each row execute function set_updated_at();

alter table destinations enable row level security;
alter table journal_entries enable row level security;
alter table photos enable row level security;

create policy "own rows" on destinations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bucket de Storage para las fotos (fase 5). Se crea aquí ya, aunque no se use
-- hasta que se implemente subida/descarga.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "own photos in storage" on storage.objects
  for all using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
