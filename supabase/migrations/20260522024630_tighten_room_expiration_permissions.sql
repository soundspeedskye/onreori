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

revoke execute on function public.join_event_room_with_code(uuid, text)
from public, anon;

grant execute on function public.join_event_room_with_code(uuid, text)
to authenticated;

revoke execute on function public.create_profile_for_new_user()
from public, anon, authenticated;

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

notify pgrst, 'reload schema';
