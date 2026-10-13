-- Guard Apple Royal sale/reservation consistency.
-- Apply only to the isolated CPS Hub V2 test project.
create or replace function public.apple_royal_validate_sale_reservation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_reservation public.apple_royal_reservations%rowtype;
begin
  if new.reservation_id is null then
    return new;
  end if;

  select * into v_reservation
  from public.apple_royal_reservations
  where id = new.reservation_id
    and owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'Reserva não encontrada nesta conta.';
  end if;

  if v_reservation.status <> 'reserved' then
    raise exception 'A reserva não está mais ativa.';
  end if;

  if v_reservation.device_id is not null
     and new.device_id is distinct from v_reservation.device_id then
    raise exception 'O aparelho da venda deve ser o mesmo da reserva.';
  end if;

  return new;
end;
$$;

drop trigger if exists apple_royal_sales_validate_reservation on public.apple_royal_sales;
create trigger apple_royal_sales_validate_reservation
before insert on public.apple_royal_sales
for each row execute function public.apple_royal_validate_sale_reservation();

revoke all on function public.apple_royal_validate_sale_reservation() from public, anon;
grant execute on function public.apple_royal_validate_sale_reservation() to authenticated;
