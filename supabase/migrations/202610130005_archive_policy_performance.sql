-- Keep private V1 archive scoped to its owner while avoiding per-row auth calls.
drop policy if exists v1_archive_owner_read on public.v1_archive;
create policy v1_archive_owner_read on public.v1_archive for select to authenticated using (claimed_by = (select auth.uid()));
