-- CPS Hub V2: preserve complete V1 source records in a private archive.
-- The live test database has this migration applied; this file records the schema for reproducibility.
CREATE TABLE IF NOT EXISTS public.v1_archive (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_name text NOT NULL,
  legacy_id text NOT NULL,
  payload jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  claimed_by uuid REFERENCES auth.users(id),
  claimed_at timestamptz,
  UNIQUE(entity_name, legacy_id)
);
ALTER TABLE public.v1_archive ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.v1_archive FROM anon, authenticated;
GRANT SELECT ON public.v1_archive TO authenticated;
CREATE POLICY v1_archive_owner_read ON public.v1_archive
  FOR SELECT TO authenticated USING (claimed_by = auth.uid());
CREATE INDEX IF NOT EXISTS v1_archive_entity_idx ON public.v1_archive(entity_name);
CREATE INDEX IF NOT EXISTS v1_archive_claimed_by_idx ON public.v1_archive(claimed_by);

-- Operational records retain original IDs and full JSON payloads for audit/reconciliation.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS legacy_id text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS legacy_data jsonb;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS legacy_id text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS legacy_data jsonb;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS legacy_id text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS legacy_data jsonb;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS legacy_id text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS legacy_data jsonb;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS legacy_id text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS legacy_data jsonb;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS legacy_id text;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS legacy_data jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS products_owner_legacy_id_uq ON public.products(owner_id, legacy_id) WHERE legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS customers_owner_legacy_id_uq ON public.customers(owner_id, legacy_id) WHERE legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS suppliers_owner_legacy_id_uq ON public.suppliers(owner_id, legacy_id) WHERE legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sales_owner_legacy_id_uq ON public.sales(owner_id, legacy_id) WHERE legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS purchases_owner_legacy_id_uq ON public.purchases(owner_id, legacy_id) WHERE legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS inventory_movements_owner_legacy_id_uq ON public.inventory_movements(owner_id, legacy_id) WHERE legacy_id IS NOT NULL;
