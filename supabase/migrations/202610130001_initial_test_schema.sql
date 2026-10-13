-- CPS Hub V2 - isolated test schema
-- Apply only to a NEW test Supabase project. Do not run against legacy/production.
-- Every business table is scoped to auth.uid() and protected by RLS.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sku text,
  name text not null,
  category text,
  description text,
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, sku)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  document_number text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  order_number text,
  customer_id uuid references public.customers(id) on delete set null,
  channel text not null default 'Manual',
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','refunded')),
  sold_at timestamptz not null default now(),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  fees numeric(12,2) not null default 0 check (fees >= 0),
  shipping_cost numeric(12,2) not null default 0 check (shipping_cost >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','received','cancelled')),
  ordered_at timestamptz not null default now(),
  received_at timestamptz,
  total numeric(12,2) not null default 0 check (total >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type text not null check (movement_type in ('opening','purchase','sale','return','adjustment','loss')),
  quantity_delta integer not null check (quantity_delta <> 0),
  reference_type text,
  reference_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null,
  category text,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date,
  paid_at timestamptz,
  status text not null default 'pending' check (status in ('pending','paid','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_owner_name_idx on public.products(owner_id, name);
create index if not exists sales_owner_sold_at_idx on public.sales(owner_id, sold_at desc);
create index if not exists sales_owner_status_idx on public.sales(owner_id, status);
create index if not exists sale_items_sale_idx on public.sale_items(owner_id, sale_id);
create index if not exists purchases_owner_ordered_at_idx on public.purchases(owner_id, ordered_at desc);
create index if not exists inventory_movements_product_idx on public.inventory_movements(owner_id, product_id, created_at desc);
create index if not exists expenses_owner_due_date_idx on public.expenses(owner_id, due_date);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.expenses enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "products_select_own" on public.products for select to authenticated using (owner_id = (select auth.uid()));
create policy "products_insert_own" on public.products for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "products_update_own" on public.products for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "products_delete_own" on public.products for delete to authenticated using (owner_id = (select auth.uid()));

create policy "customers_select_own" on public.customers for select to authenticated using (owner_id = (select auth.uid()));
create policy "customers_insert_own" on public.customers for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "customers_update_own" on public.customers for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "customers_delete_own" on public.customers for delete to authenticated using (owner_id = (select auth.uid()));

create policy "suppliers_select_own" on public.suppliers for select to authenticated using (owner_id = (select auth.uid()));
create policy "suppliers_insert_own" on public.suppliers for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "suppliers_update_own" on public.suppliers for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "suppliers_delete_own" on public.suppliers for delete to authenticated using (owner_id = (select auth.uid()));

create policy "sales_select_own" on public.sales for select to authenticated using (owner_id = (select auth.uid()));
create policy "sales_insert_own" on public.sales for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "sales_update_own" on public.sales for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "sales_delete_own" on public.sales for delete to authenticated using (owner_id = (select auth.uid()));

create policy "sale_items_select_own" on public.sale_items for select to authenticated using (owner_id = (select auth.uid()));
create policy "sale_items_insert_own" on public.sale_items for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "sale_items_update_own" on public.sale_items for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "sale_items_delete_own" on public.sale_items for delete to authenticated using (owner_id = (select auth.uid()));

create policy "purchases_select_own" on public.purchases for select to authenticated using (owner_id = (select auth.uid()));
create policy "purchases_insert_own" on public.purchases for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "purchases_update_own" on public.purchases for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "purchases_delete_own" on public.purchases for delete to authenticated using (owner_id = (select auth.uid()));

create policy "purchase_items_select_own" on public.purchase_items for select to authenticated using (owner_id = (select auth.uid()));
create policy "purchase_items_insert_own" on public.purchase_items for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "purchase_items_update_own" on public.purchase_items for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "purchase_items_delete_own" on public.purchase_items for delete to authenticated using (owner_id = (select auth.uid()));

create policy "inventory_movements_select_own" on public.inventory_movements for select to authenticated using (owner_id = (select auth.uid()));
create policy "inventory_movements_insert_own" on public.inventory_movements for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "inventory_movements_update_own" on public.inventory_movements for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "inventory_movements_delete_own" on public.inventory_movements for delete to authenticated using (owner_id = (select auth.uid()));

create policy "expenses_select_own" on public.expenses for select to authenticated using (owner_id = (select auth.uid()));
create policy "expenses_insert_own" on public.expenses for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "expenses_update_own" on public.expenses for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "expenses_delete_own" on public.expenses for delete to authenticated using (owner_id = (select auth.uid()));

grant select, insert, update, delete on public.profiles, public.products, public.customers, public.suppliers, public.sales, public.sale_items, public.purchases, public.purchase_items, public.inventory_movements, public.expenses to authenticated;
