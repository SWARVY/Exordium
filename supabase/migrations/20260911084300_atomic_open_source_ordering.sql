create or replace function public.reorder_open_source(project_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  project_count integer;
  unique_id_count integer;
begin
  if not public.is_owner() then
    raise exception 'Only the owner can reorder projects' using errcode = '42501';
  end if;

  if project_ids is null then
    raise exception 'The complete project id list is required' using errcode = '22004';
  end if;

  -- Keep membership stable across validation and the ordering update.
  lock table public.open_source in share row exclusive mode;

  select count(*) into project_count from public.open_source;
  select count(distinct project_id) into unique_id_count
  from unnest(project_ids) as project_id;

  if cardinality(project_ids) <> project_count or unique_id_count <> project_count then
    raise exception 'The project id list must contain every project exactly once'
      using errcode = '22023';
  end if;

  if exists (
    select project_id from unnest(project_ids) as project_id
    except
    select id from public.open_source
  ) then
    raise exception 'The project id list contains an unknown project'
      using errcode = '22023';
  end if;

  update public.open_source as project
  set
    "order" = ordered_project.position - 1,
    updated_at = now()
  from unnest(project_ids) with ordinality as ordered_project(id, position)
  where project.id = ordered_project.id;
end;
$$;

revoke all on function public.reorder_open_source(uuid[]) from public;
revoke all on function public.reorder_open_source(uuid[]) from anon;
grant execute on function public.reorder_open_source(uuid[]) to authenticated;
