alter table public.event_rooms add column if not exists event_url text;
alter table public.event_rooms add column if not exists location_name text;
alter table public.event_rooms add column if not exists address text;
alter table public.event_rooms add column if not exists road_address text;
alter table public.event_rooms add column if not exists latitude double precision;
alter table public.event_rooms add column if not exists longitude double precision;
alter table public.event_rooms add column if not exists subject_name text;

grant select (
  event_url,
  location_name,
  address,
  road_address,
  latitude,
  longitude,
  subject_name
) on public.event_rooms to anon, authenticated;

notify pgrst, 'reload schema';
