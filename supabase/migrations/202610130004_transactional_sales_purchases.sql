-- CPS Hub V2: transactional sales/purchases, operational archive views, remove consorcio from app surface.
-- Apply only to the isolated V2 test project.

create or replace function public.create_sale(
  p_customer_id uuid,
  p_channel text,
  p_notes text,
  p_discount numeric,
  p_fees numeric,
  p_shipping_cost numeric,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_sale_id uuid;
  v_product_id uuid;
  v_quantity integer;
  v_unit_price numeric(12,2);
  v_unit_cost numeric(12,2);
  v_name text;
  v_stock integer;
  v_subtotal numeric(12,2) := 0;
  v_item jsonb;
begin
  if v_owner is null then raise exception 'É necessário entrar na conta.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Adicione pelo menos um produto à venda.';
  end if;
  if coalesce(p_discount,0) < 0 or coalesce(p_fees,0) < 0 or coalesce(p_shipping_cost,0) < 0 then
    raise exception 'Desconto, taxas e frete não podem ser negativos.';
  end if;
  if p_customer_id is not null and not exists (
    select 1 from public.customers c where c.id=p_customer_id and c.owner_id=v_owner
  ) then raise exception 'Cliente inválido para esta conta.'; end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    if v_quantity is null or v_quantity <= 0 or v_unit_price is null or v_unit_price < 0 then
      raise exception 'Quantidade e preço de venda inválidos.';
    end if;
    select p.stock_quantity, p.name, p.cost_price into v_stock, v_name, v_unit_cost
      from public.products p where p.id=v_product_id and p.owner_id=v_owner and p.active=true for update;
    if not found then raise exception 'Produto não encontrado ou inativo.'; end if;
    if v_stock < v_quantity then raise exception 'Estoque insuficiente para % (disponível: %, solicitado: %).', v_name, v_stock, v_quantity; end if;
    v_subtotal := v_subtotal + (v_quantity * v_unit_price);
  end loop;

  insert into public.sales(owner_id,customer_id,channel,status,subtotal,discount,fees,shipping_cost,notes)
  values(v_owner,p_customer_id,coalesce(nullif(trim(p_channel),''),'Manual'),'confirmed',v_subtotal,
    coalesce(p_discount,0),coalesce(p_fees,0),coalesce(p_shipping_cost,0),nullif(trim(p_notes),''))
  returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    select p.stock_quantity, p.name, p.cost_price into v_stock, v_name, v_unit_cost
      from public.products p where p.id=v_product_id and p.owner_id=v_owner and p.active=true for update;
    if v_stock < v_quantity then raise exception 'Estoque insuficiente para %.', v_name; end if;
    update public.products set stock_quantity=stock_quantity-v_quantity, updated_at=now()
      where id=v_product_id and owner_id=v_owner;
    insert into public.sale_items(owner_id,sale_id,product_id,product_name,quantity,unit_price,unit_cost)
      values(v_owner,v_sale_id,v_product_id,v_name,v_quantity,v_unit_price,v_unit_cost);
    insert into public.inventory_movements(owner_id,product_id,movement_type,quantity_delta,reference_type,reference_id,notes)
      values(v_owner,v_product_id,'sale',-v_quantity,'sale',v_sale_id,'Baixa automática pela venda');
  end loop;
  return v_sale_id;
end;
$$;

create or replace function public.create_purchase(
  p_supplier_id uuid,
  p_notes text,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_purchase_id uuid;
  v_product_id uuid;
  v_quantity integer;
  v_unit_cost numeric(12,2);
  v_name text;
  v_total numeric(12,2) := 0;
  v_item jsonb;
begin
  if v_owner is null then raise exception 'É necessário entrar na conta.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Adicione pelo menos um produto à compra.';
  end if;
  if p_supplier_id is not null and not exists (
    select 1 from public.suppliers s where s.id=p_supplier_id and s.owner_id=v_owner
  ) then raise exception 'Fornecedor inválido para esta conta.'; end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_cost := (v_item->>'unit_cost')::numeric;
    if v_quantity is null or v_quantity <= 0 or v_unit_cost is null or v_unit_cost < 0 then
      raise exception 'Quantidade e custo unitário inválidos.';
    end if;
    select p.name into v_name from public.products p
      where p.id=v_product_id and p.owner_id=v_owner and p.active=true for update;
    if not found then raise exception 'Produto não encontrado ou inativo.'; end if;
    v_total := v_total + (v_quantity * v_unit_cost);
  end loop;

  insert into public.purchases(owner_id,supplier_id,status,received_at,total,notes)
    values(v_owner,p_supplier_id,'received',now(),v_total,nullif(trim(p_notes),''))
    returning id into v_purchase_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_cost := (v_item->>'unit_cost')::numeric;
    select p.name into v_name from public.products p
      where p.id=v_product_id and p.owner_id=v_owner and p.active=true for update;
    insert into public.purchase_items(owner_id,purchase_id,product_id,product_name,quantity,unit_cost)
      values(v_owner,v_purchase_id,v_product_id,v_name,v_quantity,v_unit_cost);
    update public.products set stock_quantity=stock_quantity+v_quantity, cost_price=v_unit_cost, updated_at=now()
      where id=v_product_id and owner_id=v_owner;
    insert into public.inventory_movements(owner_id,product_id,movement_type,quantity_delta,reference_type,reference_id,notes)
      values(v_owner,v_product_id,'purchase',v_quantity,'purchase',v_purchase_id,'Entrada automática pela compra recebida');
  end loop;
  return v_purchase_id;
end;
$$;

revoke all on function public.create_sale(uuid,text,text,numeric,numeric,numeric,jsonb) from public, anon;
revoke all on function public.create_purchase(uuid,text,jsonb) from public, anon;
grant execute on function public.create_sale(uuid,text,text,numeric,numeric,numeric,jsonb) to authenticated;
grant execute on function public.create_purchase(uuid,text,jsonb) to authenticated;

-- Imported V1 archive stays preserved, but the active app does not expose consorcio records.
create index if not exists v1_archive_owner_type_imported_idx
  on public.v1_archive(claimed_by, entity_name, imported_at desc);
