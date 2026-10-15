create or replace function public.apple_royal_record_receipt(
  p_sale_id uuid,
  p_amount numeric,
  p_received_at timestamptz,
  p_payment_method text,
  p_reference text,
  p_notes text
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_sale public.apple_royal_sales%rowtype;
  v_receipt_id uuid;
  v_new_received numeric(12,2);
begin
  if v_owner is null then
    raise exception 'É necessário entrar na conta.';
  end if;
  if p_sale_id is null then
    raise exception 'Selecione a venda relacionada.';
  end if;
  if coalesce(p_amount, 0) <= 0 then
    raise exception 'O valor do recebimento deve ser maior que zero.';
  end if;

  select * into v_sale
  from public.apple_royal_sales
  where id = p_sale_id and owner_id = v_owner
  for update;

  if not found then
    raise exception 'Venda não encontrada nesta conta.';
  end if;
  if v_sale.status in ('cancelled', 'returned') then
    raise exception 'Não é possível registrar recebimento para uma venda cancelada ou devolvida.';
  end if;

  v_new_received := coalesce(v_sale.amount_received, 0) + p_amount;
  if v_sale.sale_price > 0 and v_new_received > v_sale.sale_price then
    raise exception 'O recebimento ultrapassa o valor total da venda.';
  end if;

  insert into public.apple_royal_receipts (
    owner_id, sale_id, amount, received_at, payment_method, reference, notes
  )
  values (
    v_owner, p_sale_id, p_amount, coalesce(p_received_at, now()),
    nullif(trim(coalesce(p_payment_method, '')), ''),
    nullif(trim(coalesce(p_reference, '')), ''),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into v_receipt_id;

  update public.apple_royal_sales
  set amount_received = v_new_received,
      payment_status = case
        when v_sale.sale_price <= 0 or v_new_received >= v_sale.sale_price then 'received'
        when v_new_received > 0 then 'partial'
        else 'pending'
      end,
      updated_at = now()
  where id = p_sale_id and owner_id = v_owner;

  insert into public.apple_royal_activity_log(owner_id, entity_type, entity_id, action, details)
  values (v_owner, 'receipt', v_receipt_id, 'created', jsonb_build_object('sale_id', p_sale_id, 'amount', p_amount));

  return v_receipt_id;
end;
$$;

revoke all on function public.apple_royal_record_receipt(uuid, numeric, timestamptz, text, text, text) from public, anon;
grant execute on function public.apple_royal_record_receipt(uuid, numeric, timestamptz, text, text, text) to authenticated;
