-- Lock down the four logging tables. They were left "open access" (FOR ALL TO
-- anon) in the 2026-07-08 PII lockdown, but they leak PII the same way:
--   * booking_attempts   → customer_name + email of every booking attempt
--   * email_logs         → recipient_email of every blast = the subscriber list
--   * vip_signup_attempts→ signup emails
--   * email_blasts       → newsletter content + stats (and anon could tamper)
--
-- Writers after this migration:
--   * bookings route     → service_role (code change in the same commit)
--   * NewsletterModal    → anon INSERT into vip_signup_attempts (kept, write-only)
--   * newsletter send    → runs as the authenticated admin (forwards their JWT)
--   * email-webhook      → service_role (already)
-- Readers: admin dashboards (authenticated) only.

-- Drop EVERY existing policy on these tables by enumerating pg_policies —
-- dropping by name has already bitten us once (legacy policies under other names).
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies
             WHERE schemaname = 'public'
               AND tablename IN ('booking_attempts', 'vip_signup_attempts',
                                 'email_blasts', 'email_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

CREATE POLICY "booking_attempts_staff_all" ON public.booking_attempts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "vip_signup_attempts_public_log" ON public.vip_signup_attempts
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "vip_signup_attempts_staff_all" ON public.vip_signup_attempts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "email_blasts_staff_all" ON public.email_blasts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "email_logs_staff_all" ON public.email_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
