create schema if not exists private;

alter table public.event_rooms add column if not exists status text not null default 'active';
alter table public.event_rooms add column if not exists event_timezone text not null default 'Asia/Seoul';
alter table public.event_rooms add column if not exists active_from_at timestamptz;
alter table public.event_rooms add column if not exists active_until_at timestamptz;
alter table public.event_rooms add column if not exists closed_at timestamptz;
alter table public.event_rooms add column if not exists deleted_at timestamptz;

update public.event_rooms
set
  active_from_at = ((event_date - 5)::timestamp at time zone event_timezone),
  active_until_at = ((event_date + 4)::timestamp at time zone event_timezone)
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

create index if not exists event_rooms_active_category_window_idx
on public.event_rooms (category_id, status, active_from_at, active_until_at)
where status = 'active';

grant select (
  status,
  event_timezone,
  active_from_at,
  active_until_at,
  closed_at,
  deleted_at
) on public.event_rooms to anon, authenticated;

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
      and room_members.user_id = auth.uid()
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
  auth.uid() = user_id
  and exists (
    select 1
    from public.room_members
    join public.event_rooms
      on event_rooms.id = room_members.room_id
    where room_members.room_id = chat_messages.room_id
      and room_members.user_id = auth.uid()
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
    ((normalized_event_date::date - 5)::timestamp at time zone normalized_event_timezone);
  normalized_active_until_at :=
    ((normalized_event_date::date + 4)::timestamp at time zone normalized_event_timezone);

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

revoke execute on function public.create_event_room_with_code(text, text, text, text, text, text, text, text, text, double precision, double precision, text, text) from public;
grant execute on function public.create_event_room_with_code(text, text, text, text, text, text, text, text, text, double precision, double precision, text, text) to authenticated;

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

revoke execute on function public.join_event_room_with_code(uuid, text) from public;
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

notify pgrst, 'reload schema';
