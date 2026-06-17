alter table public.event_rooms
add column if not exists primary_language text default 'ko';

alter table public.event_rooms
add column if not exists language_codes text[] default array['ko']::text[];

with normalized as (
  select
    id,
    case
      when cardinality(supported_codes) > 0 then supported_codes
      else array['ko']::text[]
    end as normalized_language_codes,
    lower(trim(coalesce(primary_language, ''))) as normalized_primary_language
  from (
    select
      id,
      primary_language,
      array(
        select supported.code
        from unnest(array['ko', 'en', 'ja', 'zh']::text[]) as supported(code)
        where supported.code = any(
          array(
            select lower(trim(language_code))
            from unnest(coalesce(language_codes, array[]::text[])) as language_values(language_code)
            where nullif(trim(language_code), '') is not null
          )
        )
      ) as supported_codes
    from public.event_rooms
  ) rooms
)
update public.event_rooms
set
  language_codes = normalized.normalized_language_codes,
  primary_language = case
    when normalized.normalized_primary_language = any(normalized.normalized_language_codes)
      then normalized.normalized_primary_language
    else normalized.normalized_language_codes[1]
  end
from normalized
where event_rooms.id = normalized.id;

alter table public.event_rooms
alter column primary_language set default 'ko',
alter column primary_language set not null,
alter column language_codes set default array['ko']::text[],
alter column language_codes set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_rooms_primary_language_check'
      and conrelid = 'public.event_rooms'::regclass
  ) then
    alter table public.event_rooms
    add constraint event_rooms_primary_language_check
    check (primary_language in ('ko', 'en', 'ja', 'zh'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_rooms_language_codes_check'
      and conrelid = 'public.event_rooms'::regclass
  ) then
    alter table public.event_rooms
    add constraint event_rooms_language_codes_check
    check (
      cardinality(language_codes) > 0
      and array_position(language_codes, null::text) is null
      and language_codes <@ array['ko', 'en', 'ja', 'zh']::text[]
    );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_rooms_primary_language_in_language_codes_check'
      and conrelid = 'public.event_rooms'::regclass
  ) then
    alter table public.event_rooms
    add constraint event_rooms_primary_language_in_language_codes_check
    check (primary_language = any(language_codes));
  end if;
end;
$$;

create index if not exists event_rooms_language_codes_idx
on public.event_rooms using gin (language_codes);

grant select (
  primary_language,
  language_codes
) on public.event_rooms to anon, authenticated;

drop function if exists public.create_event_room_with_code(
  text,
  text,
  text,
  text,
  text
);

drop function if exists public.create_event_room_with_code(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text
);

drop function if exists public.create_event_room_with_code(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  text
);

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
  input_event_timezone text,
  input_primary_language text default 'ko',
  input_language_codes text[] default array['ko']::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  supported_language_codes text[] := array['ko', 'en', 'ja', 'zh']::text[];
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
  normalized_primary_language text;
  normalized_language_codes text[];
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

  if normalized_event_date !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'event date required';
  end if;

  normalized_event_timezone := coalesce(
    nullif(trim(coalesce(input_event_timezone, '')), ''),
    'Asia/Seoul'
  );

  if normalized_event_timezone <> 'Asia/Seoul' then
    raise exception 'unsupported event timezone';
  end if;

  normalized_language_codes := array(
    select supported.code
    from unnest(supported_language_codes) as supported(code)
    where supported.code = any(
      array(
        select lower(trim(language_code))
        from unnest(coalesce(input_language_codes, array[]::text[])) as language_values(language_code)
        where nullif(trim(language_code), '') is not null
      )
    )
  );

  if cardinality(normalized_language_codes) = 0 then
    normalized_language_codes := array['ko']::text[];
  end if;

  normalized_primary_language := lower(trim(coalesce(input_primary_language, '')));

  if not (normalized_primary_language = any(supported_language_codes))
    or not (normalized_primary_language = any(normalized_language_codes)) then
    normalized_primary_language := normalized_language_codes[1];
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

  if normalized_active_from_at > now()
    or now() >= normalized_active_until_at then
    raise exception 'room can only be created during active window';
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
    primary_language,
    language_codes,
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
    normalized_primary_language,
    normalized_language_codes,
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
    'primary_language', new_room.primary_language,
    'language_codes', new_room.language_codes,
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

revoke execute on function public.create_event_room_with_code(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  text,
  text,
  text[]
) from public, anon;

grant execute on function public.create_event_room_with_code(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  text,
  text,
  text[]
) to authenticated;

notify pgrst, 'reload schema';
