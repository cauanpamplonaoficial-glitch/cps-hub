create or replace function public.apple_royal_record_initial_receipt()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if coalesce(new.amount_received, 0) > 0 then
    insert into public.apple_royal_receipts (
      owner_id, sale_id, amount, received_at, payment_method, notes
    )
    values (
      new.owner_id,
      new.id,
      new.amount_received,
      coalesce(new.sold_at, now()),
      'Não informado',
      'Recebimento inicial informado no cadastro da venda'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists apple_royal_sales_record_initial_receipt on public.apple_royal_sales;
create trigger apple_royal_sales_record_initial_receipt
after insert on public.apple_royal_sales
for each row
execute function public.apple_royal_record_initial_receipt();

revoke all on function public.apple_royal_record_initial_receipt() from public, anon;
