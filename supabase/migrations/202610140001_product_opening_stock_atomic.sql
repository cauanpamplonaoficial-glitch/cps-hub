create or replace function public.create_product_with_opening_stock(
  p_sku text,
  p_name text,
  p_category text,
  p_description text,
  p_cost_price numeric,
  p_sale_price numeric,
  p_stock_quantity integer,
  p_min_stock integer
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_product_id uuid;
  v_initial_stock integer := coalesce(p_stock_quantity, 0);
begin
  if v_owner is null then
    raise exception 'Autenticação necessária.';
  end if;
  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'O nome do produto é obrigatório.';
  end if;
  if v_initial_stock < 0 then
    raise exception 'O estoque inicial não pode ser negativo.';
  end if;
  if coalesce(p_cost_price, 0) < 0 or coalesce(p_sale_price, 0) < 0 or coalesce(p_min_stock, 0) < 0 then
    raise exception 'Preço e estoque mínimo não podem ser negativos.';
  end if;

  insert into public.products (
    owner_id, sku, name, category, description, cost_price, sale_price,
    stock_quantity, min_stock, active
  )
  values (
    v_owner, nullif(trim(coalesce(p_sku, '')), ''), trim(p_name),
    nullif(trim(coalesce(p_category, '')), ''),
    nullif(trim(coalesce(p_description, '')), ''),
    coalesce(p_cost_price, 0), coalesce(p_sale_price, 0),
    v_initial_stock, coalesce(p_min_stock, 0), true
  )
  returning id into v_product_id;

  if v_initial_stock > 0 then
    insert into public.inventory_movements (
      owner_id, product_id, movement_type, quantity_delta,
      reference_type, reference_id, notes
    )
    values (
      v_owner, v_product_id, 'opening', v_initial_stock,
      'product', v_product_id, 'Estoque inicial informado no cadastro do produto'
    );
  end if;

  return v_product_id;
end;
$$;

revoke all on function public.create_product_with_opening_stock(text, text, text, text, numeric, numeric, integer, integer) from public, anon;
grant execute on function public.create_product_with_opening_stock(text, text, text, text, numeric, numeric, integer, integer) to authenticated;
