grant select (
  status,
  event_timezone,
  active_from_at,
  active_until_at,
  closed_at,
  deleted_at
) on public.event_rooms to anon, authenticated;

notify pgrst, 'reload schema';
