-- Link new consorcio leads to the shared CPS customer registry.
begin;
drop function if exists public.create_consorcio_lead(text,text,text,text,text,numeric,numeric,numeric,date,text,text);

create or replace function public.create_consorcio_lead(
  p_name text,
  p_customer_id uuid default null,
  p_phone text default null,
  p_city text default null,
  p_source text default null,
  p_interest text default null,
  p_desired_credit numeric default 0,
  p_desired_installment numeric default 0,
  p_available_bid numeric default 0,
  p_next_follow_up date default null,
  p_next_action text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  created_lead_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'lead name is required';
  end if;

  insert into public.consorcio_leads (
    owner_id, customer_id, name, phone, city, source, interest, desired_credit,
    desired_installment, available_bid, next_follow_up, next_action, notes
  ) values (
    auth.uid(), p_customer_id, trim(p_name), nullif(trim(p_phone), ''), nullif(trim(p_city), ''),
    nullif(trim(p_source), ''), nullif(trim(p_interest), ''), p_desired_credit,
    p_desired_installment, p_available_bid, p_next_follow_up, nullif(trim(p_next_action), ''),
    nullif(trim(p_notes), '')
  ) returning id into created_lead_id;

  insert into public.consorcio_activities (
    owner_id, lead_id, activity_type, title, details, created_by
  ) values (
    auth.uid(), created_lead_id, 'lead_created', 'Lead cadastrado',
    nullif(trim(p_notes), ''), auth.uid()
  );

  return created_lead_id;
end;
$$;

revoke all on function public.create_consorcio_lead(text,uuid,text,text,text,text,numeric,numeric,numeric,date,text,text) from public, anon;
grant execute on function public.create_consorcio_lead(text,uuid,text,text,text,text,numeric,numeric,numeric,date,text,text) to authenticated;
commit;
