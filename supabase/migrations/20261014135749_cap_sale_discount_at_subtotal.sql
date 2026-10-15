-- Prevent net-negative sales caused by a discount larger than the sale subtotal.
alter table public.sales
  add constraint sales_discount_lte_subtotal
  check (discount <= subtotal) not valid;

alter table public.sales
  validate constraint sales_discount_lte_subtotal;
