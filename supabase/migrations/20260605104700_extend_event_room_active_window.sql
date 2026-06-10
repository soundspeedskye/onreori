update public.event_rooms
set
  active_from_at = ((event_date - 7)::timestamp at time zone event_timezone),
  active_until_at = ((event_date + 8)::timestamp at time zone event_timezone)
where active_from_at is distinct from ((event_date - 7)::timestamp at time zone event_timezone)
   or active_until_at is distinct from ((event_date + 8)::timestamp at time zone event_timezone);

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
  text
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
  text
) to authenticated;

notify pgrst, 'reload schema';
