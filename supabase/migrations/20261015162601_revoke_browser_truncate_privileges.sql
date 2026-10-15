revoke truncate on all tables in schema public from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke truncate on tables from public, anon, authenticated;
