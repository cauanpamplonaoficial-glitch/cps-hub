Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
begin;

-- Anonymous clients have no row policies in the exposed schema and need no table privileges.
revoke all privileges on all tables in schema public from anon;
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon;

-- Keep business events append-only. Transaction RPCs insert these rows but do not edit or delete them.
revoke update, delete on table
  public.sale_items,
  public.purchase_items,
  public.inventory_movements,
  public.apple_royal_receipts,
  public.apple_royal_activity_log
from authenticated;

-- Preserve source records; cancellation is represented by a status transition and compensating entries.
revoke delete on table
  public.products,
  public.expenses,
  public.sales,
  public.purchases,
  public.apple_royal_devices,
  public.apple_royal_reservations,
  public.apple_royal_sales,
  public.apple_royal_receipts,
  public.apple_royal_remittances,
  public.apple_royal_deliveries,
  public.apple_royal_after_sales,
  public.apple_royal_documents,
  public.apple_royal_activity_log
from authenticated;

commit;

