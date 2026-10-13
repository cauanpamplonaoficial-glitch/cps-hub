-- Only allow creation of new active reservations/sales in their initial workflow states.
-- Apply only to isolated CPS Hub V2 test project.
create or replace function public.apple_royal_create_reservation(
  p_device_id uuid, p_customer_name text, p_customer_phone text, p_desired_model text,
  p_agreed_price numeric, p_deposit_amount numeric, p_expires_at timestamptz,
  p_status text, p_notes text
) returns uuid
language plpgsql security invoker set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_id uuid;
  v_device_status text;
  v_status text := coalesce(nullif(trim(p_status), ''), 'reserved');
begin
  if v_owner is null then raise exception 'É necessário entrar na conta.'; end if;
  if nullif(trim(p_customer_name), '') is null then raise exception 'Informe o nome do cliente.'; end if;
  if coalesce(p_agreed_price,0) < 0 or coalesce(p_deposit_amount,0) < 0 then raise exception 'Preço e sinal não podem ser negativos.'; end if;
  if v_status <> 'reserved' then raise exception 'Novas reservas devem iniciar como reservadas.'; end if;
  if p_device_id is not null then
    select status into v_device_status from public.apple_royal_devices where id=p_device_id and owner_id=v_owner for update;
    if not found then raise exception 'Aparelho não encontrado nesta conta.'; end if;
    if v_device_status <> 'available' then raise exception 'Este aparelho não está disponível para reserva.'; end if;
  end if;
  insert into public.apple_royal_reservations(owner_id,device_id,customer_name,customer_phone,desired_model,agreed_price,deposit_amount,expires_at,status,notes)
  values(v_owner,p_device_id,trim(p_customer_name),nullif(trim(p_customer_phone),''),nullif(trim(p_desired_model),''),coalesce(p_agreed_price,0),coalesce(p_deposit_amount,0),p_expires_at,'reserved',nullif(trim(p_notes),'')) returning id into v_id;
  if p_device_id is not null then
    update public.apple_royal_devices set status='reserved',updated_at=now() where id=p_device_id and owner_id=v_owner and status='available';
    if not found then raise exception 'O aparelho acabou de deixar de estar disponível.'; end if;
  end if;
  insert into public.apple_royal_activity_log(owner_id,entity_type,entity_id,action,details)
  values(v_owner,'reservation',v_id,'created',jsonb_build_object('device_id',p_device_id,'status','reserved'));
  return v_id;
end;
$$;
create or replace function public.apple_royal_create_sale(
  p_device_id uuid, p_reservation_id uuid, p_customer_name text, p_customer_phone text,
  p_model_snapshot text, p_sale_price numeric, p_partner_amount_due numeric,
  p_additional_costs numeric, p_amount_received numeric, p_payment_status text,
  p_status text, p_notes text
) returns uuid
language plpgsql security invoker set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_id uuid;
  v_device_status text;
  v_status text := coalesce(nullif(trim(p_status), ''), 'confirmed');
  v_payment_status text := coalesce(nullif(trim(p_payment_status), ''), 'pending');
begin
  if v_owner is null then raise exception 'É necessário entrar na conta.'; end if;
  if nullif(trim(p_customer_name), '') is null or nullif(trim(p_model_snapshot), '') is null then raise exception 'Informe o cliente e o modelo vendido.'; end if;
  if coalesce(p_sale_price,0)<0 or coalesce(p_partner_amount_due,0)<0 or coalesce(p_additional_costs,0)<0 or coalesce(p_amount_received,0)<0 then raise exception 'Os valores da venda não podem ser negativos.'; end if;
  if v_status not in ('confirmed','separating','in_delivery','delivered') then raise exception 'Novas vendas devem iniciar em um status operacional válido.'; end if;
  if v_payment_status not in ('pending','partial','received') then raise exception 'Status de pagamento inválido para nova venda.'; end if;
  if p_reservation_id is not null and not exists(select 1 from public.apple_royal_reservations where id=p_reservation_id and owner_id=v_owner and status='reserved') then raise exception 'Reserva inválida ou não ativa para esta conta.'; end if;
  if p_device_id is not null then
    select status into v_device_status from public.apple_royal_devices where id=p_device_id and owner_id=v_owner for update;
    if not found then raise exception 'Aparelho não encontrado nesta conta.'; end if;
    if v_device_status not in ('available','reserved') then raise exception 'Este aparelho não está disponível para venda.'; end if;
  end if;
  insert into public.apple_royal_sales(owner_id,device_id,reservation_id,customer_name,customer_phone,model_snapshot,sale_price,partner_amount_due,additional_costs,amount_received,payment_status,status,notes)
  values(v_owner,p_device_id,p_reservation_id,trim(p_customer_name),nullif(trim(p_customer_phone),''),trim(p_model_snapshot),coalesce(p_sale_price,0),coalesce(p_partner_amount_due,0),coalesce(p_additional_costs,0),coalesce(p_amount_received,0),v_payment_status,v_status,nullif(trim(p_notes),'')) returning id into v_id;
  if p_device_id is not null then
    update public.apple_royal_devices set status='sold',updated_at=now() where id=p_device_id and owner_id=v_owner and status in ('available','reserved');
    if not found then raise exception 'O aparelho acabou de deixar de estar disponível.'; end if;
  end if;
  if p_reservation_id is not null then
    update public.apple_royal_reservations set status='converted',updated_at=now() where id=p_reservation_id and owner_id=v_owner and status='reserved';
    if not found then raise exception 'A reserva deixou de estar ativa.'; end if;
  end if;
  insert into public.apple_royal_activity_log(owner_id,entity_type,entity_id,action,details)
  values(v_owner,'sale',v_id,'created',jsonb_build_object('device_id',p_device_id,'status',v_status));
  return v_id;
end;
$$;