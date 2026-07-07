-- ============================================================
-- Lock down PII (v2) — deterministic version
-- ============================================================
-- v1 (20260707120000_lock_pii_rls.sql) dropped only the policy named
-- "bookings_open_access", but the live bookings table still carried a
-- separate legacy policy (under a different name) that kept granting anon
-- read access — so customer names/emails/phones stayed readable.
--
-- This version drops EVERY existing policy on both tables by enumerating
-- pg_policies, then recreates only the intended ones. Naming no longer
-- matters. Idempotent — safe to run more than once.
--
-- Paste into the Supabase SQL Editor and run.
-- ============================================================

ALTER TABLE public.bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on both tables
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('bookings', 'subscribers')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- bookings: authenticated staff only. Public reservations are created via the
-- create_booking() SECURITY DEFINER RPC, which bypasses RLS; server routes use
-- the service_role key, which also bypasses RLS. Anon gets no direct access.
CREATE POLICY "bookings_staff_all" ON public.bookings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- subscribers: public may INSERT (newsletter signup) but not read/update/delete.
CREATE POLICY "subscribers_public_signup" ON public.subscribers
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "subscribers_staff_all" ON public.subscribers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verify (should list exactly the three policies above, none granting anon SELECT):
-- SELECT tablename, policyname, roles, cmd FROM pg_policies
-- WHERE schemaname='public' AND tablename IN ('bookings','subscribers');
