-- Reverses inventory effects while keeping the original sale/purchase records.
-- These RPCs are deliberately SECURITY INVOKER and owner-scoped.

create or replace function public.cancel_sale(p_sale_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_sale public.sales%rowtype;
  v_item record;
begin
  if v_owner is null then raise exception 'É necessário entrar na conta.'; end if;
  if p_sale_id is null then raise exception 'Selecione a venda que deseja cancelar.'; end if;

  select * into v_sale
  from public.sales
  where id = p_sale_id and owner_id = v_owner
  for update;
  if not found then raise exception 'Venda não encontrada nesta conta.'; end if;
  if v_sale.status in ('cancelled', 'refunded') then raise exception 'Esta venda já está cancelada ou estornada.'; end if;

  if not exists (select 1 from public.sale_items where sale_id = p_sale_id and owner_id = v_owner) then
    raise exception 'A venda não possui itens para reverter; o estoque não foi alterado.';
  end if;

  -- Refuse to change stock if the original stock ledger does not match the sale lines.
  if exists (
    select 1
    from (
      select si.product_id, sum(si.quantity)::integer as item_quantity,
        coalesce((select -sum(im.quantity_delta)::integer
          from public.inventory_movements im
          where im.owner_id = v_owner and im.reference_type = 'sale'
            and im.reference_id = p_sale_id and im.product_id = si.product_id
            and im.movement_type = 'sale'), 0) as movement_quantity
      from public.sale_items si
      where si.owner_id = v_owner and si.sale_id = p_sale_id and si.product_id is not null
      group by si.product_id
    ) quantities
    where quantities.item_quantity <> quantities.movement_quantity
  ) then
    raise exception 'O histórico de estoque desta venda diverge dos itens. Faça a conciliação manual antes de cancelar.';
  end if;

  for v_item in
    select product_id, sum(quantity)::integer as quantity
    from public.sale_items
    where owner_id = v_owner and sale_id = p_sale_id and product_id is not null
    group by product_id
    order by product_id
  loop
    update public.products
    set stock_quantity = stock_quantity + v_item.quantity, updated_at = now()
    where id = v_item.product_id and owner_id = v_owner;
    if not found then raise exception 'Produto da venda não encontrado nesta conta; nenhuma alteração foi confirmada.'; end if;

    insert into public.inventory_movements(
      owner_id, product_id, movement_type, quantity_delta, reference_type, reference_id, notes
    ) values (
      v_owner, v_item.product_id, 'return', v_item.quantity,
      'sale_cancellation', p_sale_id, 'Reversão de venda cancelada; movimento original preservado'
    );
  end loop;

  update public.sales set status = 'cancelled', updated_at = now()
  where id = p_sale_id and owner_id = v_owner;
end;
$$;

create or replace function public.cancel_purchase(p_purchase_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_purchase public.purchases%rowtype;
  v_item record;
begin
  if v_owner is null then raise exception 'É necessário entrar na conta.'; end if;
  if p_purchase_id is null then raise exception 'Selecione a compra que deseja cancelar.'; end if;

  select * into v_purchase
  from public.purchases
  where id = p_purchase_id and owner_id = v_owner
  for update;
  if not found then raise exception 'Compra não encontrada nesta conta.'; end if;
  if v_purchase.status = 'cancelled' then raise exception 'Esta compra já está cancelada.'; end if;

  if v_purchase.status = 'received' then
    if not exists (select 1 from public.purchase_items where purchase_id = p_purchase_id and owner_id = v_owner) then
      raise exception 'A compra recebida não possui itens para reverter; o estoque não foi alterado.';
    end if;

    if exists (
      select 1
      from (
        select pi.product_id, sum(pi.quantity)::integer as item_quantity,
          coalesce((select sum(im.quantity_delta)::integer
            from public.inventory_movements im
            where im.owner_id = v_owner and im.reference_type = 'purchase'
              and im.reference_id = p_purchase_id and im.product_id = pi.product_id
              and im.movement_type = 'purchase'), 0) as movement_quantity
        from public.purchase_items pi
        where pi.owner_id = v_owner and pi.purchase_id = p_purchase_id and pi.product_id is not null
        group by pi.product_id
      ) quantities
      where quantities.item_quantity <> quantities.movement_quantity
    ) then
      raise exception 'O histórico de estoque desta compra diverge dos itens. Faça a conciliação manual antes de cancelar.';
    end if;

    for v_item in
      select product_id, sum(quantity)::integer as quantity
      from public.purchase_items
      where owner_id = v_owner and purchase_id = p_purchase_id and product_id is not null
      group by product_id
      order by product_id
    loop
      update public.products
      set stock_quantity = stock_quantity - v_item.quantity, updated_at = now()
      where id = v_item.product_id and owner_id = v_owner and stock_quantity >= v_item.quantity;
      if not found then raise exception 'Estoque atual insuficiente para reverter esta compra. Nenhuma alteração foi confirmada.'; end if;

      insert into public.inventory_movements(
        owner_id, product_id, movement_type, quantity_delta, reference_type, reference_id, notes
      ) values (
        v_owner, v_item.product_id, 'adjustment', -v_item.quantity,
        'purchase_cancellation', p_purchase_id, 'Reversão de compra cancelada; movimento original preservado'
      );
    end loop;
  elsif v_purchase.status <> 'pending' then
    raise exception 'Situação da compra não permite cancelamento.';
  end if;

  update public.purchases set status = 'cancelled', updated_at = now()
  where id = p_purchase_id and owner_id = v_owner;
end;
$$;

create or replace function public.apple_royal_create_sale(
  p_device_id uuid, p_reservation_id uuid, p_customer_name text, p_customer_phone text,
  p_model_snapshot text, p_sale_price numeric, p_partner_amount_due numeric,
  p_additional_costs numeric, p_amount_received numeric, p_payment_status text,
  p_status text, p_notes text
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_id uuid;
  v_device_status text;
  v_status text := coalesce(nullif(trim(p_status), ''), 'confirmed');
  v_payment_status text;
begin
  if v_owner is null then raise exception 'É necessário entrar na conta.'; end if;
  if nullif(trim(p_customer_name), '') is null or nullif(trim(p_model_snapshot), '') is null then raise exception 'Informe o cliente e o modelo vendido.'; end if;
  if coalesce(p_sale_price,0) < 0 or coalesce(p_partner_amount_due,0) < 0 or coalesce(p_additional_costs,0) < 0 or coalesce(p_amount_received,0) < 0 then
    raise exception 'Os valores da venda não podem ser negativos.';
  end if;
  if coalesce(p_amount_received,0) > coalesce(p_sale_price,0) then
    raise exception 'O valor recebido não pode ultrapassar o preço da venda.';
  end if;
  if v_status not in ('confirmed','separating','in_delivery','delivered') then raise exception 'Novas vendas devem iniciar em um status operacional válido.'; end if;
  if p_reservation_id is not null and not exists(select 1 from public.apple_royal_reservations where id=p_reservation_id and owner_id=v_owner and status='reserved') then
    raise exception 'Reserva inválida ou indisponível para esta conta.';
  end if;
  if p_device_id is not null then
    select status into v_device_status from public.apple_royal_devices where id=p_device_id and owner_id=v_owner for update;
    if not found then raise exception 'Aparelho não encontrado nesta conta.'; end if;
    if v_device_status not in ('available','reserved') then raise exception 'Este aparelho não está disponível para venda.'; end if;
    if v_device_status='reserved' and not exists (
      select 1 from public.apple_royal_reservations
      where id=p_reservation_id and owner_id=v_owner and device_id=p_device_id and status='reserved'
    ) then raise exception 'Vincule a reserva ativa deste aparelho antes de concluir a venda.'; end if;
  end if;
  v_payment_status := case
    when coalesce(p_sale_price,0) > 0 and coalesce(p_amount_received,0) >= p_sale_price then 'received'
    when coalesce(p_amount_received,0) > 0 then 'partial'
    else 'pending'
  end;

  insert into public.apple_royal_sales(owner_id,device_id,reservation_id,customer_name,customer_phone,model_snapshot,sale_price,partner_amount_due,additional_costs,amount_received,payment_status,status,notes)
  values(v_owner,p_device_id,p_reservation_id,trim(p_customer_name),nullif(trim(p_customer_phone),''),trim(p_model_snapshot),coalesce(p_sale_price,0),coalesce(p_partner_amount_due,0),coalesce(p_additional_costs,0),coalesce(p_amount_received,0),v_payment_status,v_status,nullif(trim(p_notes),'')) returning id into v_id;
  if p_device_id is not null then
    update public.apple_royal_devices set status='sold',updated_at=now() where id=p_device_id and owner_id=v_owner and status in ('available','reserved');
    if not found then raise exception 'O aparelho acabou de deixar de estar disponível.'; end if;
  end if;
  if p_reservation_id is not null then
    update public.apple_royal_reservations set status='converted',updated_at=now() where id=p_reservation_id and owner_id=v_owner;
  end if;
  insert into public.apple_royal_activity_log(owner_id,entity_type,entity_id,action,details)
  values(v_owner,'sale',v_id,'created',jsonb_build_object('device_id',p_device_id,'status',v_status,'amount_received',coalesce(p_amount_received,0)));
  return v_id;
end;
$$;

create or replace function public.apple_royal_record_receipt(
  p_sale_id uuid, p_amount numeric, p_received_at timestamptz,
  p_payment_method text, p_reference text, p_notes text
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_sale public.apple_royal_sales%rowtype;
  v_receipt_id uuid;
  v_ledger_received numeric(12,2);
  v_new_received numeric(12,2);
begin
  if v_owner is null then raise exception 'É necessário entrar na conta.'; end if;
  if p_sale_id is null then raise exception 'Selecione a venda relacionada.'; end if;
  if coalesce(p_amount,0) <= 0 then raise exception 'O valor do recebimento deve ser maior que zero.'; end if;

  select * into v_sale from public.apple_royal_sales
  where id=p_sale_id and owner_id=v_owner for update;
  if not found then raise exception 'Venda não encontrada nesta conta.'; end if;
  if v_sale.status in ('cancelled','returned') then raise exception 'Não é possível registrar recebimento para venda cancelada ou devolvida.'; end if;

  select coalesce(sum(amount),0)::numeric(12,2) into v_ledger_received
  from public.apple_royal_receipts where owner_id=v_owner and sale_id=p_sale_id;
  if v_ledger_received <> coalesce(v_sale.amount_received,0) then
    raise exception 'Há divergência entre o total da venda e o livro de recebimentos. Concilie os lançamentos antes de adicionar outro valor.';
  end if;
  v_new_received := v_ledger_received + p_amount;
  if v_new_received > coalesce(v_sale.sale_price,0) then raise exception 'O recebimento ultrapassa o valor total da venda.'; end if;

  insert into public.apple_royal_receipts(owner_id,sale_id,amount,received_at,payment_method,reference,notes)
  values(v_owner,p_sale_id,p_amount,coalesce(p_received_at,now()),nullif(trim(coalesce(p_payment_method,'')),''),nullif(trim(coalesce(p_reference,'')),''),nullif(trim(coalesce(p_notes,'')),''))
  returning id into v_receipt_id;

  update public.apple_royal_sales set amount_received=v_new_received,
    payment_status=case when v_new_received >= sale_price and sale_price > 0 then 'received' when v_new_received > 0 then 'partial' else 'pending' end,
    updated_at=now()
  where id=p_sale_id and owner_id=v_owner;
  insert into public.apple_royal_activity_log(owner_id,entity_type,entity_id,action,details)
  values(v_owner,'receipt',v_receipt_id,'created',jsonb_build_object('sale_id',p_sale_id,'amount',p_amount));
  return v_receipt_id;
end;
$$;

create or replace function public.apple_royal_record_remittance(
  p_sale_id uuid, p_amount numeric, p_status text, p_paid_at timestamptz,
  p_payment_method text, p_proof_reference text, p_notes text
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_sale public.apple_royal_sales%rowtype;
  v_remittance_id uuid;
  v_paid_total numeric(12,2);
  v_pending_total numeric(12,2);
begin
  if v_owner is null then raise exception 'É necessário entrar na conta.'; end if;
  if p_sale_id is null then raise exception 'Selecione a venda relacionada ao repasse.'; end if;
  if coalesce(p_amount,0) <= 0 then raise exception 'O valor do repasse deve ser maior que zero.'; end if;
  if p_status not in ('pending','paid') then raise exception 'Situação do repasse inválida.'; end if;

  select * into v_sale from public.apple_royal_sales
  where id=p_sale_id and owner_id=v_owner for update;
  if not found then raise exception 'Venda não encontrada nesta conta.'; end if;
  if v_sale.status in ('cancelled','returned') then raise exception 'Não é possível registrar repasse para venda cancelada ou devolvida.'; end if;

  select coalesce(sum(amount),0)::numeric(12,2) into v_paid_total
  from public.apple_royal_remittances
  where owner_id=v_owner and sale_id=p_sale_id and status='paid';
  select coalesce(sum(amount),0)::numeric(12,2) into v_pending_total
  from public.apple_royal_remittances
  where owner_id=v_owner and sale_id=p_sale_id and status='pending';
  if v_paid_total <> coalesce(v_sale.amount_remitted,0) then
    raise exception 'Há divergência entre o total da venda e o livro de repasses pagos. Concilie os lançamentos antes de adicionar outro pagamento.';
  end if;
  if p_status='paid' and v_paid_total + v_pending_total + p_amount > coalesce(v_sale.partner_amount_due,0) then
    raise exception 'O total dos repasses pagos e previstos ultrapassa o valor devido à Apple Royal.';
  end if;
  if p_status='pending' and v_paid_total + v_pending_total + p_amount > coalesce(v_sale.partner_amount_due,0) then
    raise exception 'O total de repasses previstos ultrapassa o valor devido à Apple Royal.';
  end if;

  insert into public.apple_royal_remittances(owner_id,sale_id,amount,status,paid_at,payment_method,proof_reference,notes)
  values(v_owner,p_sale_id,p_amount,p_status,case when p_status='paid' then coalesce(p_paid_at,now()) else null end,
    nullif(trim(coalesce(p_payment_method,'')),''),nullif(trim(coalesce(p_proof_reference,'')),''),nullif(trim(coalesce(p_notes,'')),''))
  returning id into v_remittance_id;
  if p_status='paid' then
    update public.apple_royal_sales set amount_remitted=v_paid_total+p_amount,updated_at=now()
    where id=p_sale_id and owner_id=v_owner;
  end if;
  insert into public.apple_royal_activity_log(owner_id,entity_type,entity_id,action,details)
  values(v_owner,'remittance',v_remittance_id,'created',jsonb_build_object('sale_id',p_sale_id,'amount',p_amount,'status',p_status));
  return v_remittance_id;
end;
$$;

create or replace function public.apple_royal_mark_remittance_paid(
  p_remittance_id uuid, p_paid_at timestamptz, p_payment_method text,
  p_proof_reference text, p_notes text
) returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_remittance public.apple_royal_remittances%rowtype;
  v_sale public.apple_royal_sales%rowtype;
  v_paid_total numeric(12,2);
  v_pending_total numeric(12,2);
begin
  if v_owner is null then raise exception 'É necessário entrar na conta.'; end if;
  if p_remittance_id is null then raise exception 'Selecione o repasse previsto.'; end if;
  select * into v_remittance from public.apple_royal_remittances
  where id=p_remittance_id and owner_id=v_owner for update;
  if not found then raise exception 'Repasse não encontrado nesta conta.'; end if;
  if v_remittance.status <> 'pending' then raise exception 'Somente repasses pendentes podem ser confirmados como pagos.'; end if;

  select * into v_sale from public.apple_royal_sales
  where id=v_remittance.sale_id and owner_id=v_owner for update;
  if not found then raise exception 'Venda vinculada não encontrada nesta conta.'; end if;
  if v_sale.status in ('cancelled','returned') then raise exception 'A venda foi cancelada ou devolvida; não confirme o repasse sem conciliar o financeiro.'; end if;

  select coalesce(sum(amount),0)::numeric(12,2) into v_paid_total
  from public.apple_royal_remittances where owner_id=v_owner and sale_id=v_sale.id and status='paid';
  select coalesce(sum(amount),0)::numeric(12,2) into v_pending_total
  from public.apple_royal_remittances where owner_id=v_owner and sale_id=v_sale.id and status='pending';
  if v_paid_total <> coalesce(v_sale.amount_remitted,0) then
    raise exception 'Há divergência entre a venda e o livro de repasses pagos. Concilie os lançamentos antes de confirmar outro pagamento.';
  end if;
  if v_paid_total + v_pending_total > coalesce(v_sale.partner_amount_due,0) then
    raise exception 'O total de repasses previstos ultrapassa o valor devido. Concilie antes de confirmar o pagamento.';
  end if;

  update public.apple_royal_remittances set status='paid',paid_at=coalesce(p_paid_at,now()),
    payment_method=coalesce(nullif(trim(coalesce(p_payment_method,'')),''),payment_method),
    proof_reference=coalesce(nullif(trim(coalesce(p_proof_reference,'')),''),proof_reference),
    notes=coalesce(nullif(trim(coalesce(p_notes,'')),''),notes)
  where id=p_remittance_id and owner_id=v_owner;
  update public.apple_royal_sales set amount_remitted=v_paid_total+v_remittance.amount,updated_at=now()
  where id=v_sale.id and owner_id=v_owner;
  insert into public.apple_royal_activity_log(owner_id,entity_type,entity_id,action,details)
  values(v_owner,'remittance',p_remittance_id,'marked_paid',jsonb_build_object('sale_id',v_sale.id,'amount',v_remittance.amount));
end;
$$;

create or replace function public.apple_royal_cancel_sale(p_sale_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_sale public.apple_royal_sales%rowtype;
  v_device_status text;
  v_paid_receipts numeric(12,2);
  v_paid_remittances numeric(12,2);
begin
  if v_owner is null then raise exception 'É necessário entrar na conta.'; end if;
  if p_sale_id is null then raise exception 'Selecione a venda que deseja cancelar.'; end if;
  select * into v_sale from public.apple_royal_sales
  where id=p_sale_id and owner_id=v_owner for update;
  if not found then raise exception 'Venda não encontrada nesta conta.'; end if;
  if v_sale.status in ('cancelled','returned') then raise exception 'Esta venda já está cancelada ou devolvida.'; end if;

  if v_sale.device_id is not null then
    select status into v_device_status from public.apple_royal_devices
    where id=v_sale.device_id and owner_id=v_owner for update;
    if not found then raise exception 'Aparelho vinculado não encontrado; a venda não foi alterada.'; end if;
    if v_device_status <> 'sold' then raise exception 'A situação atual do aparelho diverge da venda. Concilie o estoque antes de cancelar.'; end if;
    update public.apple_royal_devices set status='available',updated_at=now()
    where id=v_sale.device_id and owner_id=v_owner;
  end if;

  if v_sale.reservation_id is not null then
    update public.apple_royal_reservations set status='cancelled',updated_at=now()
    where id=v_sale.reservation_id and owner_id=v_owner and status in ('reserved','converted');
  end if;

  select coalesce(sum(amount),0)::numeric(12,2) into v_paid_receipts
  from public.apple_royal_receipts where owner_id=v_owner and sale_id=p_sale_id;
  select coalesce(sum(amount),0)::numeric(12,2) into v_paid_remittances
  from public.apple_royal_remittances where owner_id=v_owner and sale_id=p_sale_id and status='paid';

  update public.apple_royal_sales set status='cancelled',updated_at=now()
  where id=p_sale_id and owner_id=v_owner;
  insert into public.apple_royal_activity_log(owner_id,entity_type,entity_id,action,details)
  values(v_owner,'sale',p_sale_id,'cancelled',jsonb_build_object(
    'device_id',v_sale.device_id,'reservation_id',v_sale.reservation_id,
    'received_amount_preserved',v_paid_receipts,'remitted_amount_preserved',v_paid_remittances,
    'financial_reconciliation_required',(v_paid_receipts > 0 or v_paid_remittances > 0)
  ));
end;
$$;

revoke all on function public.cancel_sale(uuid) from public, anon;
revoke all on function public.cancel_purchase(uuid) from public, anon;
revoke all on function public.apple_royal_record_remittance(uuid,numeric,text,timestamptz,text,text,text) from public, anon;
revoke all on function public.apple_royal_mark_remittance_paid(uuid,timestamptz,text,text,text) from public, anon;
revoke all on function public.apple_royal_cancel_sale(uuid) from public, anon;
grant execute on function public.cancel_sale(uuid) to authenticated;
grant execute on function public.cancel_purchase(uuid) to authenticated;
grant execute on function public.apple_royal_record_remittance(uuid,numeric,text,timestamptz,text,text,text) to authenticated;
grant execute on function public.apple_royal_mark_remittance_paid(uuid,timestamptz,text,text,text) to authenticated;
grant execute on function public.apple_royal_cancel_sale(uuid) to authenticated;

