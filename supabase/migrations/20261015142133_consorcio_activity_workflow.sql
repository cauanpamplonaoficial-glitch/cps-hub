-- Record activity and update follow-up fields in one transaction.
begin;

create or replace function public.record_consorcio_activity(
  p_lead_id uuid,
  p_activity_type text,
  p_title text,
  p_details text default null,
  p_outcome text default null,
  p_occurred_at timestamptz default now(),
  p_next_action text default null,
  p_next_follow_up date default null
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  activity_id uuid;
  activity_owner uuid := auth.uid();
begin
  if activity_owner is null then
    raise exception 'authentication required';
  end if;

  update public.consorcio_leads
     set last_contact_at = case
           when p_activity_type in ('call','whatsapp','instagram','meeting','follow_up') then p_occurred_at
           else last_contact_at
         end,
         next_action = nullif(trim(p_next_action), ''),
         next_follow_up = p_next_follow_up,
         updated_at = now()
   where id = p_lead_id and owner_id = activity_owner;

  if not found then
    raise exception 'lead not found or not accessible';
  end if;

  insert into public.consorcio_activities (
    owner_id, lead_id, activity_type, title, details, outcome,
    occurred_at, created_by, next_action, next_follow_up
  ) values (
    activity_owner, p_lead_id, p_activity_type, trim(p_title),
    nullif(trim(p_details), ''), nullif(trim(p_outcome), ''),
    p_occurred_at, activity_owner, nullif(trim(p_next_action), ''), p_next_follow_up
  ) returning id into activity_id;

  return activity_id;
end;
$$;

revoke all on function public.record_consorcio_activity(uuid,text,text,text,text,timestamptz,text,date) from public, anon;
grant execute on function public.record_consorcio_activity(uuid,text,text,text,text,timestamptz,text,date) to authenticated;

commit;
