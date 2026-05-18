create extension if not exists pgcrypto;

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
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.event_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.chat_messages enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "checklists_all_own"
on public.checklists for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

create policy "event_rooms_select_authenticated"
on public.event_rooms for select
using (auth.uid() is not null);

create policy "room_members_select_own"
on public.room_members for select
using (auth.uid() = user_id);

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

create or replace function public.create_event_room_with_code(
  input_category_id text,
  input_title text,
  input_event_date text,
  input_location text,
  input_entry_code text
)
returns public.event_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  new_room public.event_rooms;
begin
  if auth.uid() is null then
    raise exception 'login required';
  end if;

  if length(trim(input_entry_code)) < 4 then
    raise exception 'entry code must be at least 4 characters';
  end if;

  insert into public.event_rooms (
    category_id,
    title,
    event_date,
    location,
    entry_code_hash,
    created_by
  )
  values (
    input_category_id,
    trim(input_title),
    coalesce(nullif(input_event_date, '')::date, current_date),
    coalesce(nullif(trim(input_location), ''), '장소 미정'),
    crypt(input_entry_code, gen_salt('bf')),
    auth.uid()
  )
  returning * into new_room;

  insert into public.room_members (room_id, user_id, role)
  values (new_room.id, auth.uid(), 'owner');

  return new_room;
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

  if matched_room.entry_code_hash <> crypt(input_entry_code, matched_room.entry_code_hash) then
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
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "chat_media_select_public"
on storage.objects for select
using (bucket_id = 'chat-media');

create policy "chat_media_insert_authenticated"
on storage.objects for insert
with check (
  bucket_id = 'chat-media'
  and auth.uid() is not null
);
