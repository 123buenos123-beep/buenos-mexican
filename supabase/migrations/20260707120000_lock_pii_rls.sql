-- ============================================================
-- Lock down PII: restrict anon access to bookings & subscribers
-- ============================================================
-- BEFORE: bookings and subscribers had `FOR ALL TO anon` policies with
-- USING (true), so anyone holding the public anon key (shipped to every
-- browser) could read the entire customer list — names, emails, phones —
-- straight from the Supabase REST API.
--
-- AFTER:
--   • bookings     — authenticated staff only. Public reservations still work:
--                    they are created via the create_booking() SECURITY DEFINER
--                    RPC, which bypasses RLS. Server routes use service_role.
--   • subscribers  — public may INSERT (newsletter signup) but not read/update.
--                    Admin (authenticated) manages the list; unsubscribe and the
--                    email-webhook bounce handler use service_role.
--
-- Idempotent — safe to run more than once. Paste into the Supabase SQL Editor.
-- ============================================================

-- Ensure RLS is on (no-op if already enabled)
ALTER TABLE public.bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- ── bookings ────────────────────────────────────────────────
DROP POLICY IF EXISTS "bookings_open_access" ON public.bookings;
DROP POLICY IF EXISTS "bookings_staff_all"   ON public.bookings;
CREATE POLICY "bookings_staff_all" ON public.bookings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── subscribers ─────────────────────────────────────────────
DROP POLICY IF EXISTS "subscribers_open_access"   ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_public_signup" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_staff_all"     ON public.subscribers;
CREATE POLICY "subscribers_public_signup" ON public.subscribers
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "subscribers_staff_all" ON public.subscribers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
