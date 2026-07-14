-- Lock public newsletter signup behind the server route.
--
-- Previously NewsletterModal inserted straight into public.subscribers from the
-- browser with the anon key (policy "subscribers_public_signup"). Because the
-- anon key ships in the client bundle, a bot could POST directly to the Supabase
-- REST endpoint and flood the subscriber list, bypassing the form entirely.
--
-- Signups now go through /api/newsletter/subscribe, which rate-limits and then
-- inserts with the service_role key (bypasses RLS). So anon no longer needs —
-- and must not have — direct INSERT on these tables.

-- 1. Per-IP rate limiting needs somewhere to record the source IP.
ALTER TABLE public.vip_signup_attempts ADD COLUMN IF NOT EXISTS ip text;

-- 2. Revoke the public (anon) INSERT policies. The staff (authenticated) and
--    service_role paths are unaffected: staff policies remain and service_role
--    bypasses RLS entirely.
DROP POLICY IF EXISTS "subscribers_public_signup" ON public.subscribers;
DROP POLICY IF EXISTS "vip_signup_attempts_public_log" ON public.vip_signup_attempts;
