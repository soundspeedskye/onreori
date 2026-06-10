create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
alter extension pgcrypto set schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  category_id text not null,
  template_id text not null,
  title text not null,
  selected_conditions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  local_id text not null,
  name text not null,
  section text not null,
  essential boolean not null default false,
  tip text not null default '',
  checked boolean not null default false,
  custom boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.event_rooms (
  id uuid primary key default gen_random_uuid(),
  category_id text not null,
  title text not null,
  event_date date not null,
  location text not null,
  event_url text,
  location_name text,
  address text,
  road_address text,
  latitude double precision,
  longitude double precision,
  subject_name text,
  entry_code_hash text not null,
  member_count integer not null default 1,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id uuid not null references public.event_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.event_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  type text not null check (type in ('text', 'image')),
  body text not null,
  media_url text,
  hashtags text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.event_rooms add column if not exists event_url text;
alter table public.event_rooms add column if not exists location_name text;
alter table public.event_rooms add column if not exists address text;
alter table public.event_rooms add column if not exists road_address text;
alter table public.event_rooms add column if not exists latitude double precision;
alter table public.event_rooms add column if not exists longitude double precision;
alter table public.event_rooms add column if not exists subject_name text;
alter table public.chat_messages add column if not exists hashtags text[] not null default '{}';

alter table public.profiles enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.event_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.chat_messages enable row level security;

create index if not exists event_rooms_category_date_idx
on public.event_rooms (category_id, event_date);

create index if not exists chat_messages_hashtags_idx
on public.chat_messages using gin (hashtags);

revoke select on public.event_rooms from anon, authenticated;
grant select (
  id,
  category_id,
  title,
  event_date,
  location,
  event_url,
  location_name,
  address,
  road_address,
  latitude,
  longitude,
  subject_name,
  member_count,
  created_by,
  created_at
) on public.event_rooms to anon, authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "checklists_all_own" on public.checklists;
create policy "checklists_all_own"
on public.checklists for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "checklist_items_all_own" on public.checklist_items;
create policy "checklist_items_all_own"
on public.checklist_items for all
using (
  exists (
    select 1
    from public.checklists
    where checklists.id = checklist_items.checklist_id
      and checklists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.checklists
    where checklists.id = checklist_items.checklist_id
      and checklists.user_id = auth.uid()
  )
);

drop policy if exists "event_rooms_select_authenticated" on public.event_rooms;
create policy "event_rooms_select_authenticated"
on public.event_rooms for select
using (auth.uid() is not null);

drop policy if exists "room_members_select_own" on public.room_members;
create policy "room_members_select_own"
on public.room_members for select
using (auth.uid() = user_id);

drop policy if exists "chat_messages_select_members" on public.chat_messages;
create policy "chat_messages_select_members"
on public.chat_messages for select
using (
  exists (
    select 1
    from public.room_members
    where room_members.room_id = chat_messages.room_id
      and room_members.user_id = auth.uid()
  )
);

drop policy if exists "chat_messages_insert_members" on public.chat_messages;
create policy "chat_messages_insert_members"
on public.chat_messages for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.room_members
    where room_members.room_id = chat_messages.room_id
      and room_members.user_id = auth.uid()
  )
  and (
    (
      type = 'text'
      and media_url is null
    )
    or (
      type = 'image'
      and media_url is not null
      and array_length(storage.foldername(media_url), 1) = 2
      and (storage.foldername(media_url))[1] = room_id::text
      and (storage.foldername(media_url))[2] = (select auth.uid())::text
    )
  )
);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

drop function if exists public.create_event_room_with_code(text, text, text, text, text);
drop function if exists public.create_event_room_with_code(text, text, text, text, text, text, text, text, text, double precision, double precision, text);

create or replace function public.create_event_room_with_code(
  input_category_id text,
  input_title text,
  input_event_date text,
  input_location text,
  input_entry_code text,
  input_event_url text,
  input_location_name text,
  input_address text,
  input_road_address text,
  input_latitude double precision,
  input_longitude double precision,
  input_subject_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_category_id text;
  normalized_title text;
  normalized_event_date text;
  normalized_location text;
  normalized_event_url text;
  normalized_location_name text;
  normalized_address text;
  normalized_road_address text;
  normalized_latitude double precision;
  normalized_longitude double precision;
  normalized_subject_name text;
  new_room public.event_rooms;
begin
  if auth.uid() is null then
    raise exception 'login required';
  end if;

  normalized_category_id := trim(coalesce(input_category_id, ''));
  normalized_title := nullif(trim(coalesce(input_title, '')), '');
  normalized_event_date := nullif(trim(coalesce(input_event_date, '')), '');
  normalized_location := nullif(trim(coalesce(input_location, '')), '');

  if normalized_title is null then
    raise exception 'title required';
  end if;

  if normalized_event_date is null then
    raise exception 'event date required';
  end if;

  if length(trim(coalesce(input_entry_code, ''))) < 4 then
    raise exception 'entry code must be at least 4 characters';
  end if;

  if normalized_category_id in ('EVENT_DAY', 'POPUP') and normalized_location is null then
    raise exception 'location required';
  end if;

  if normalized_category_id = 'CAFE_EVENT' then
    normalized_location := '장소 없음';
    normalized_event_url := null;
    normalized_location_name := null;
    normalized_address := null;
    normalized_road_address := null;
    normalized_latitude := null;
    normalized_longitude := null;
    normalized_subject_name := coalesce(
      nullif(trim(coalesce(input_subject_name, '')), ''),
      normalized_title
    );
  else
    normalized_location := coalesce(normalized_location, '장소 미정');
    normalized_event_url := nullif(trim(coalesce(input_event_url, '')), '');
    normalized_location_name := nullif(trim(coalesce(input_location_name, '')), '');
    normalized_address := nullif(trim(coalesce(input_address, '')), '');
    normalized_road_address := nullif(trim(coalesce(input_road_address, '')), '');
    normalized_latitude := input_latitude;
    normalized_longitude := input_longitude;
    normalized_subject_name := nullif(trim(coalesce(input_subject_name, '')), '');
  end if;

  insert into public.event_rooms (
    category_id,
    title,
    event_date,
    location,
    event_url,
    location_name,
    address,
    road_address,
    latitude,
    longitude,
    subject_name,
    entry_code_hash,
    created_by
  )
  values (
    normalized_category_id,
    normalized_title,
    normalized_event_date::date,
    normalized_location,
    normalized_event_url,
    normalized_location_name,
    normalized_address,
    normalized_road_address,
    normalized_latitude,
    normalized_longitude,
    normalized_subject_name,
    extensions.crypt(input_entry_code, extensions.gen_salt('bf')),
    auth.uid()
  )
  returning * into new_room;

  insert into public.room_members (room_id, user_id, role)
  values (new_room.id, auth.uid(), 'owner');

  return jsonb_build_object(
    'id', new_room.id,
    'category_id', new_room.category_id,
    'title', new_room.title,
    'event_date', new_room.event_date,
    'location', new_room.location,
    'event_url', new_room.event_url,
    'location_name', new_room.location_name,
    'address', new_room.address,
    'road_address', new_room.road_address,
    'latitude', new_room.latitude,
    'longitude', new_room.longitude,
    'subject_name', new_room.subject_name,
    'member_count', new_room.member_count,
    'created_by', new_room.created_by,
    'created_at', new_room.created_at
  );
end;
$$;

create or replace function public.join_event_room_with_code(
  input_room_id uuid,
  input_entry_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_room public.event_rooms;
begin
  if auth.uid() is null then
    raise exception 'login required';
  end if;

  select *
  into matched_room
  from public.event_rooms
  where id = input_room_id;

  if matched_room.id is null then
    raise exception 'room not found';
  end if;

  if matched_room.entry_code_hash <> extensions.crypt(input_entry_code, matched_room.entry_code_hash) then
    raise exception 'invalid entry code';
  end if;

  insert into public.room_members (room_id, user_id)
  values (input_room_id, auth.uid())
  on conflict (room_id, user_id) do nothing;

  update public.event_rooms
  set member_count = (
    select count(*)
    from public.room_members
    where room_id = input_room_id
  )
  where id = input_room_id;
end;
$$;

revoke execute on function public.create_event_room_with_code(text, text, text, text, text, text, text, text, text, double precision, double precision, text) from public;
revoke execute on function public.join_event_room_with_code(uuid, text) from public;
grant execute on function public.create_event_room_with_code(text, text, text, text, text, text, text, text, text, double precision, double precision, text) to authenticated;
grant execute on function public.join_event_room_with_code(uuid, text) to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'chat-media',
  'chat-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "chat_media_select_public" on storage.objects;
drop policy if exists "chat_media_select_members" on storage.objects;
create policy "chat_media_select_members"
on storage.objects for select
using (
  bucket_id = 'chat-media'
  and (select auth.uid()) is not null
  and array_length(storage.foldername(name), 1) = 2
  and exists (
    select 1
    from public.room_members
    where room_members.room_id::text = (storage.foldername(name))[1]
      and room_members.user_id = (select auth.uid())
  )
);

drop policy if exists "chat_media_insert_authenticated" on storage.objects;
create policy "chat_media_insert_authenticated"
on storage.objects for insert
with check (
  bucket_id = 'chat-media'
  and (select auth.uid()) is not null
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1
    from public.room_members
    where room_members.room_id::text = (storage.foldername(name))[1]
      and room_members.user_id = (select auth.uid())
  )
);
