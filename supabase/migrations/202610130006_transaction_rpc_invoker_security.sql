-- The RPCs validate auth.uid() and rely on owner-scoped RLS, so they do not need elevated privileges.
alter function public.create_sale(uuid,text,text,numeric,numeric,numeric,jsonb) security invoker;
alter function public.create_purchase(uuid,text,jsonb) security invoker;
