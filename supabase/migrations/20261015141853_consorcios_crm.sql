-- CRM operacional de consorcios para CPS Hub V2.
-- Aplicar somente no Supabase de teste autorizado; nenhuma linha legada e importada aqui.

begin;

create table if not exists public.consorcio_leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  name text not null check (length(trim(name)) > 0),
  phone text,
  city text,
  source text,
  interest text,
  desired_credit numeric(14,2) not null default 0 check (desired_credit >= 0),
  desired_installment numeric(14,2) not null default 0 check (desired_installment >= 0),
  available_bid numeric(14,2) not null default 0 check (available_bid >= 0),
  urgency text not null default 'medium' check (urgency in ('high','medium','low')),
  temperature text not null default 'warm' check (temperature in ('hot','warm','cold')),
  stage text not null default 'new' check (stage in ('new','contacted','qualified','simulation','follow_up','negotiation','proposal','documentation','closed','lost')),
  loss_reason text,
  primary_objection text,
  qualification jsonb not null default '{}'::jsonb,
  last_contact_at timestamptz,
  next_follow_up date,
  next_action text,
  responsible_id uuid references auth.users(id) on delete set null,
  notes text,
  legacy_id text,
  legacy_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, legacy_id)
);

create table if not exists public.consorcio_activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id uuid not null references public.consorcio_leads(id) on delete restrict,
  activity_type text not null check (activity_type in ('lead_created','call','whatsapp','instagram','meeting','note','simulation','proposal','follow_up','stage_changed','temperature_changed','documentation','closed','lost','other')),
  title text not null check (length(trim(title)) > 0),
  details text,
  outcome text,
  occurred_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  next_action text,
  next_follow_up date,
  created_at timestamptz not null default now()
);

create index if not exists consorcio_leads_owner_stage_idx
  on public.consorcio_leads(owner_id, stage, created_at desc);
create index if not exists consorcio_leads_owner_followup_idx
  on public.consorcio_leads(owner_id, next_follow_up)
  where next_follow_up is not null and stage not in ('closed','lost');
create index if not exists consorcio_activities_owner_lead_date_idx
  on public.consorcio_activities(owner_id, lead_id, occurred_at desc);

alter table public.consorcio_leads enable row level security;
alter table public.consorcio_activities enable row level security;

revoke all on public.consorcio_leads, public.consorcio_activities from public, anon;
grant select, insert, update on public.consorcio_leads to authenticated;
grant select, insert on public.consorcio_activities to authenticated;

drop policy if exists consorcio_leads_select_own on public.consorcio_leads;
create policy consorcio_leads_select_own
  on public.consorcio_leads for select to authenticated
  using (owner_id = (select auth.uid()));
drop policy if exists consorcio_leads_insert_own on public.consorcio_leads;
create policy consorcio_leads_insert_own
  on public.consorcio_leads for insert to authenticated
  with check (owner_id = (select auth.uid()));
drop policy if exists consorcio_leads_update_own on public.consorcio_leads;
create policy consorcio_leads_update_own
  on public.consorcio_leads for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists consorcio_activities_select_own on public.consorcio_activities;
create policy consorcio_activities_select_own
  on public.consorcio_activities for select to authenticated
  using (owner_id = (select auth.uid()));
drop policy if exists consorcio_activities_insert_own on public.consorcio_activities;
create policy consorcio_activities_insert_own
  on public.consorcio_activities for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and created_by = (select auth.uid())
    and exists (
      select 1
      from public.consorcio_leads lead
      where lead.id = lead_id
        and lead.owner_id = (select auth.uid())
    )
  );

create or replace function public.assert_consorcio_lead_customer_owner()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  customer_owner uuid;
begin
  if new.customer_id is not null then
    select customer.owner_id
      into customer_owner
      from public.customers as customer
      where customer.id = new.customer_id;

    if customer_owner is distinct from new.owner_id then
      raise exception 'customer_id must belong to the same owner';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.assert_consorcio_lead_customer_owner() from public, anon, authenticated;
drop trigger if exists consorcio_lead_customer_owner_guard on public.consorcio_leads;
create trigger consorcio_lead_customer_owner_guard
  before insert or update of owner_id, customer_id on public.consorcio_leads
  for each row execute function public.assert_consorcio_lead_customer_owner();

create or replace function public.assert_consorcio_activity_lead_owner()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  lead_owner uuid;
begin
  select lead.owner_id
    into lead_owner
    from public.consorcio_leads as lead
    where lead.id = new.lead_id;

  if lead_owner is distinct from new.owner_id then
    raise exception 'lead_id must belong to the same owner';
  end if;

  return new;
end;
$$;

revoke all on function public.assert_consorcio_activity_lead_owner() from public, anon, authenticated;
drop trigger if exists consorcio_activity_lead_owner_guard on public.consorcio_activities;
create trigger consorcio_activity_lead_owner_guard
  before insert or update of owner_id, lead_id on public.consorcio_activities
  for each row execute function public.assert_consorcio_activity_lead_owner();

commit;
