create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
alter extension pgcrypto set schema extensions;
create schema if not exists private;

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
  status text not null default 'active',
  event_timezone text not null default 'Asia/Seoul',
  active_from_at timestamptz not null,
  active_until_at timestamptz not null,
  closed_at timestamptz,
  deleted_at timestamptz,
  entry_code_hash text not null,
  member_count integer not null default 1,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint event_rooms_status_check check (status in ('active', 'closed', 'soft_deleted')),
  constraint event_rooms_active_window_check check (active_from_at < active_until_at)
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
alter table public.event_rooms add column if not exists status text not null default 'active';
alter table public.event_rooms add column if not exists event_timezone text not null default 'Asia/Seoul';
alter table public.event_rooms add column if not exists active_from_at timestamptz;
alter table public.event_rooms add column if not exists active_until_at timestamptz;
alter table public.event_rooms add column if not exists closed_at timestamptz;
alter table public.event_rooms add column if not exists deleted_at timestamptz;
alter table public.chat_messages add column if not exists hashtags text[] not null default '{}';

update public.event_rooms
set
  active_from_at = ((event_date - 7)::timestamp at time zone event_timezone),
  active_until_at = ((event_date + 8)::timestamp at time zone event_timezone)
where active_from_at is null
   or active_until_at is null;

alter table public.event_rooms alter column active_from_at set not null;
alter table public.event_rooms alter column active_until_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_rooms_status_check'
  ) then
    alter table public.event_rooms
    add constraint event_rooms_status_check
    check (status in ('active', 'closed', 'soft_deleted'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_rooms_active_window_check'
  ) then
    alter table public.event_rooms
    add constraint event_rooms_active_window_check
    check (active_from_at < active_until_at);
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.event_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.chat_messages enable row level security;

create unique index if not exists checklists_user_local_id_idx
on public.checklists (user_id, local_id);

create index if not exists checklist_items_checklist_sort_idx
on public.checklist_items (checklist_id, sort_order);

create index if not exists event_rooms_category_date_idx
on public.event_rooms (category_id, event_date);

create index if not exists event_rooms_active_category_window_idx
on public.event_rooms (category_id, status, active_from_at, active_until_at)
where status = 'active';

create index if not exists chat_messages_hashtags_idx
on public.chat_messages using gin (hashtags);

grant select, insert, update, delete on public.checklists to authenticated;
grant select, insert, update, delete on public.checklist_items to authenticated;

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
  status,
  event_timezone,
  active_from_at,
  active_until_at,
  closed_at,
  deleted_at,
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
to authenticated
using (
  (select auth.uid()) is not null
  and status = 'active'
  and active_from_at <= now()
  and now() < active_until_at
);

drop policy if exists "room_members_select_own" on public.room_members;
create policy "room_members_select_own"
on public.room_members for select
using (auth.uid() = user_id);

drop policy if exists "chat_messages_select_members" on public.chat_messages;
create policy "chat_messages_select_members"
on public.chat_messages for select
to authenticated
using (
  exists (
    select 1
    from public.room_members
    join public.event_rooms
      on event_rooms.id = room_members.room_id
    where room_members.room_id = chat_messages.room_id
      and room_members.user_id = (select auth.uid())
      and event_rooms.status = 'active'
      and event_rooms.active_from_at <= now()
      and now() < event_rooms.active_until_at
  )
);

drop policy if exists "chat_messages_insert_members" on public.chat_messages;
create policy "chat_messages_insert_members"
on public.chat_messages for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.room_members
    join public.event_rooms
      on event_rooms.id = room_members.room_id
    where room_members.room_id = chat_messages.room_id
      and room_members.user_id = (select auth.uid())
      and event_rooms.status = 'active'
      and event_rooms.active_from_at <= now()
      and now() < event_rooms.active_until_at
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

revoke execute on function public.create_profile_for_new_user()
from public, anon, authenticated;

drop function if exists public.upsert_checklist_with_items(
  uuid,
  text,
  text,
  text,
  text,
  text[],
  jsonb
);

create or replace function public.upsert_checklist_with_items(
  input_remote_id uuid,
  input_local_id text,
  input_category_id text,
  input_template_id text,
  input_title text,
  input_selected_conditions text[],
  input_items jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  normalized_local_id text;
  normalized_category_id text;
  normalized_template_id text;
  normalized_title text;
  saved_checklist public.checklists;
begin
  if (select auth.uid()) is null then
    raise exception 'login required';
  end if;

  normalized_local_id := nullif(trim(coalesce(input_local_id, '')), '');
  normalized_category_id := nullif(trim(coalesce(input_category_id, '')), '');
  normalized_template_id := nullif(trim(coalesce(input_template_id, '')), '');
  normalized_title := nullif(trim(coalesce(input_title, '')), '');

  if normalized_local_id is null then
    raise exception 'local id required';
  end if;

  if normalized_category_id is null then
    raise exception 'category id required';
  end if;

  if normalized_template_id is null then
    raise exception 'template id required';
  end if;

  if normalized_title is null then
    raise exception 'title required';
  end if;

  if input_remote_id is not null then
    update public.checklists
    set
      local_id = normalized_local_id,
      category_id = normalized_category_id,
      template_id = normalized_template_id,
      title = normalized_title,
      selected_conditions = coalesce(input_selected_conditions, '{}'),
      updated_at = now()
    where id = input_remote_id
      and user_id = (select auth.uid())
    returning * into saved_checklist;

    if saved_checklist.id is null then
      raise exception 'checklist not found';
    end if;
  else
    insert into public.checklists (
      user_id,
      local_id,
      category_id,
      template_id,
      title,
      selected_conditions
    )
    values (
      (select auth.uid()),
      normalized_local_id,
      normalized_category_id,
      normalized_template_id,
      normalized_title,
      coalesce(input_selected_conditions, '{}')
    )
    on conflict (user_id, local_id) do update
    set
      category_id = excluded.category_id,
      template_id = excluded.template_id,
      title = excluded.title,
      selected_conditions = excluded.selected_conditions,
      updated_at = now()
    returning * into saved_checklist;
  end if;

  delete from public.checklist_items
  where checklist_id = saved_checklist.id;

  insert into public.checklist_items (
    checklist_id,
    local_id,
    name,
    section,
    essential,
    tip,
    checked,
    custom,
    sort_order
  )
  select
    saved_checklist.id,
    nullif(trim(coalesce(item.value->>'local_id', '')), ''),
    nullif(trim(coalesce(item.value->>'name', '')), ''),
    nullif(trim(coalesce(item.value->>'section', '')), ''),
    coalesce((item.value->>'essential')::boolean, false),
    coalesce(item.value->>'tip', ''),
    coalesce((item.value->>'checked')::boolean, false),
    coalesce((item.value->>'custom')::boolean, false),
    coalesce((item.value->>'sort_order')::integer, item.ordinality::integer - 1)
  from jsonb_array_elements(coalesce(input_items, '[]'::jsonb))
    with ordinality as item(value, ordinality)
  where nullif(trim(coalesce(item.value->>'local_id', '')), '') is not null
    and nullif(trim(coalesce(item.value->>'name', '')), '') is not null
    and nullif(trim(coalesce(item.value->>'section', '')), '') is not null;

  return jsonb_build_object(
    'id', saved_checklist.id,
    'user_id', saved_checklist.user_id,
    'local_id', saved_checklist.local_id,
    'updated_at', saved_checklist.updated_at
  );
end;
$$;

revoke execute on function public.upsert_checklist_with_items(
  uuid,
  text,
  text,
  text,
  text,
  text[],
  jsonb
) from public, anon;

grant execute on function public.upsert_checklist_with_items(
  uuid,
  text,
  text,
  text,
  text,
  text[],
  jsonb
) to authenticated;

drop function if exists public.create_event_room_with_code(text, text, text, text, text);
drop function if exists public.create_event_room_with_code(text, text, text, text, text, text, text, text, text, double precision, double precision, text);
drop function if exists public.create_event_room_with_code(text, text, text, text, text, text, text, text, text, double precision, double precision, text, text);

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
  input_subject_name text,
  input_event_timezone text
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
  normalized_event_timezone text;
  normalized_active_from_at timestamptz;
  normalized_active_until_at timestamptz;
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

  normalized_event_timezone := coalesce(
    nullif(trim(coalesce(input_event_timezone, '')), ''),
    'Asia/Seoul'
  );

  if normalized_event_timezone <> 'Asia/Seoul' then
    raise exception 'unsupported event timezone';
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

  normalized_active_from_at :=
    ((normalized_event_date::date - 7)::timestamp at time zone normalized_event_timezone);
  normalized_active_until_at :=
    ((normalized_event_date::date + 8)::timestamp at time zone normalized_event_timezone);

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
    status,
    event_timezone,
    active_from_at,
    active_until_at,
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
    'active',
    normalized_event_timezone,
    normalized_active_from_at,
    normalized_active_until_at,
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
    'status', new_room.status,
    'event_timezone', new_room.event_timezone,
    'active_from_at', new_room.active_from_at,
    'active_until_at', new_room.active_until_at,
    'closed_at', new_room.closed_at,
    'deleted_at', new_room.deleted_at,
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

  if matched_room.status <> 'active'
    or matched_room.active_from_at > now()
    or now() >= matched_room.active_until_at then
    raise exception 'room closed';
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

revoke execute on function public.create_event_room_with_code(text, text, text, text, text, text, text, text, text, double precision, double precision, text, text) from public, anon;
revoke execute on function public.join_event_room_with_code(uuid, text) from public, anon;
grant execute on function public.create_event_room_with_code(text, text, text, text, text, text, text, text, text, double precision, double precision, text, text) to authenticated;
grant execute on function public.join_event_room_with_code(uuid, text) to authenticated;

create or replace function private.maintain_event_room_expiration()
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  closed_count integer;
  hard_deleted_count integer;
  soft_deleted_count integer;
begin
  update public.event_rooms
  set
    status = 'closed',
    closed_at = coalesce(closed_at, now())
  where status = 'active'
    and active_until_at <= now();
  get diagnostics closed_count = row_count;

  with hard_delete_candidates as (
    select event_rooms.id
    from public.event_rooms
    where event_rooms.status = 'closed'
      and event_rooms.closed_at <= now() - interval '3 days'
      and not exists (
        select 1
        from public.chat_messages
        where chat_messages.room_id = event_rooms.id
      )
      and not exists (
        select 1
        from public.room_members
        where room_members.room_id = event_rooms.id
          and room_members.user_id <> event_rooms.created_by
      )
      and (
        select count(*)
        from public.room_members
        where room_members.room_id = event_rooms.id
      ) = 1
  )
  delete from public.event_rooms
  where event_rooms.id in (
    select hard_delete_candidates.id
    from hard_delete_candidates
  );
  get diagnostics hard_deleted_count = row_count;

  update public.event_rooms
  set
    status = 'soft_deleted',
    deleted_at = coalesce(deleted_at, now())
  where status = 'closed'
    and closed_at <= now() - interval '3 days';
  get diagnostics soft_deleted_count = row_count;

  return jsonb_build_object(
    'closed_count', closed_count,
    'hard_deleted_count', hard_deleted_count,
    'soft_deleted_count', soft_deleted_count
  );
end;
$$;

revoke execute on function private.maintain_event_room_expiration() from public;

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
    join public.event_rooms
      on event_rooms.id = room_members.room_id
    where room_members.room_id::text = (storage.foldername(name))[1]
      and room_members.user_id = (select auth.uid())
      and event_rooms.status = 'active'
      and event_rooms.active_from_at <= now()
      and now() < event_rooms.active_until_at
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
    join public.event_rooms
      on event_rooms.id = room_members.room_id
    where room_members.room_id::text = (storage.foldername(name))[1]
      and room_members.user_id = (select auth.uid())
      and event_rooms.status = 'active'
      and event_rooms.active_from_at <= now()
      and now() < event_rooms.active_until_at
  )
);

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

do $$
begin
  perform cron.unschedule('maintain-event-room-expiration');
exception
  when others then
    null;
end;
$$;

select cron.schedule(
  'maintain-event-room-expiration',
  '17 * * * *',
  $$select private.maintain_event_room_expiration();$$
);
