create unique index if not exists checklists_user_local_id_idx
on public.checklists (user_id, local_id);

create index if not exists checklist_items_checklist_sort_idx
on public.checklist_items (checklist_id, sort_order);

grant select, insert, update, delete on public.checklists to authenticated;
grant select, insert, update, delete on public.checklist_items to authenticated;

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

notify pgrst, 'reload schema';
