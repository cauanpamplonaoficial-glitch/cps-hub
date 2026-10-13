-- CPS Hub V2 test hardening: FK indexes and cross-owner reference guards.
-- Applied only to Supabase project abxmblwgsuiayfhkwzvu (isolated test).
create index if not exists customers_owner_id_idx on public.customers(owner_id);
create index if not exists suppliers_owner_id_idx on public.suppliers(owner_id);
create index if not exists sales_customer_id_idx on public.sales(customer_id);
create index if not exists sale_items_sale_id_idx on public.sale_items(sale_id);
create index if not exists sale_items_product_id_idx on public.sale_items(product_id);
create index if not exists sale_items_owner_sale_idx on public.sale_items(owner_id, sale_id);
create index if not exists purchases_supplier_id_idx on public.purchases(supplier_id);
create index if not exists purchase_items_purchase_id_idx on public.purchase_items(purchase_id);
create index if not exists purchase_items_product_id_idx on public.purchase_items(product_id);
create index if not exists purchase_items_owner_purchase_idx on public.purchase_items(owner_id, purchase_id);
create index if not exists inventory_movements_product_id_idx on public.inventory_movements(product_id);
create index if not exists inventory_movements_owner_product_created_idx on public.inventory_movements(owner_id, product_id, created_at desc);
drop index if exists public.inventory_movements_product_idx;
drop index if exists public.sale_items_sale_idx;

create or replace function public.assert_same_owner()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare ref_owner uuid;
begin
  if tg_table_name = 'sales' and new.customer_id is not null then
    select owner_id into ref_owner from public.customers where id = new.customer_id;
    if ref_owner is distinct from new.owner_id then raise exception 'customer_id must belong to the same owner'; end if;
  elsif tg_table_name = 'sale_items' then
    select owner_id into ref_owner from public.sales where id = new.sale_id;
    if ref_owner is distinct from new.owner_id then raise exception 'sale_id must belong to the same owner'; end if;
    if new.product_id is not null then
      select owner_id into ref_owner from public.products where id = new.product_id;
      if ref_owner is distinct from new.owner_id then raise exception 'product_id must belong to the same owner'; end if;
    end if;
  elsif tg_table_name = 'purchases' and new.supplier_id is not null then
    select owner_id into ref_owner from public.suppliers where id = new.supplier_id;
    if ref_owner is distinct from new.owner_id then raise exception 'supplier_id must belong to the same owner'; end if;
  elsif tg_table_name = 'purchase_items' then
    select owner_id into ref_owner from public.purchases where id = new.purchase_id;
    if ref_owner is distinct from new.owner_id then raise exception 'purchase_id must belong to the same owner'; end if;
    if new.product_id is not null then
      select owner_id into ref_owner from public.products where id = new.product_id;
      if ref_owner is distinct from new.owner_id then raise exception 'product_id must belong to the same owner'; end if;
    end if;
  elsif tg_table_name = 'inventory_movements' then
    select owner_id into ref_owner from public.products where id = new.product_id;
    if ref_owner is distinct from new.owner_id then raise exception 'product_id must belong to the same owner'; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists sales_owner_reference_guard on public.sales;
create trigger sales_owner_reference_guard before insert or update of owner_id, customer_id on public.sales for each row execute function public.assert_same_owner();
drop trigger if exists sale_items_owner_reference_guard on public.sale_items;
create trigger sale_items_owner_reference_guard before insert or update of owner_id, sale_id, product_id on public.sale_items for each row execute function public.assert_same_owner();
drop trigger if exists purchases_owner_reference_guard on public.purchases;
create trigger purchases_owner_reference_guard before insert or update of owner_id, supplier_id on public.purchases for each row execute function public.assert_same_owner();
drop trigger if exists purchase_items_owner_reference_guard on public.purchase_items;
create trigger purchase_items_owner_reference_guard before insert or update of owner_id, purchase_id, product_id on public.purchase_items for each row execute function public.assert_same_owner();
drop trigger if exists inventory_movements_owner_reference_guard on public.inventory_movements;
create trigger inventory_movements_owner_reference_guard before insert or update of owner_id, product_id on public.inventory_movements for each row execute function public.assert_same_owner();
revoke all on function public.assert_same_owner() from public, anon, authenticated;
