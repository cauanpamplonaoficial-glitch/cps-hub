-- Index foreign keys reported by Supabase performance advisor.
-- Isolated CPS Hub V2 test project only.
create index if not exists apple_royal_activity_log_owner_idx on public.apple_royal_activity_log(owner_id);
create index if not exists apple_royal_after_sales_sale_idx on public.apple_royal_after_sales(sale_id);
create index if not exists apple_royal_deliveries_owner_idx on public.apple_royal_deliveries(owner_id);
create index if not exists apple_royal_deliveries_sale_idx on public.apple_royal_deliveries(sale_id);
create index if not exists apple_royal_documents_owner_idx on public.apple_royal_documents(owner_id);
create index if not exists apple_royal_receipts_owner_idx on public.apple_royal_receipts(owner_id);
create index if not exists apple_royal_receipts_sale_idx on public.apple_royal_receipts(sale_id);
create index if not exists apple_royal_remittances_sale_idx on public.apple_royal_remittances(sale_id);
create index if not exists apple_royal_reservations_device_idx on public.apple_royal_reservations(device_id);
create index if not exists apple_royal_sales_device_idx on public.apple_royal_sales(device_id);
create index if not exists apple_royal_sales_reservation_idx on public.apple_royal_sales(reservation_id);
