-- Revoke table privileges inherited from Supabase default grants.
-- RLS remains the row-level boundary; grants are reduced to the operations needed by the UI.
begin;
revoke delete on public.consorcio_leads from authenticated;
revoke update, delete on public.consorcio_activities from authenticated;
grant select, insert, update on public.consorcio_leads to authenticated;
grant select, insert on public.consorcio_activities to authenticated;
commit;
