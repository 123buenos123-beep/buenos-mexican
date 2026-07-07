-- ============================================================
-- Buenos Mexican — Complete Database Schema
-- Single file to reset/rebuild the entire database from scratch
-- Run this in Supabase SQL Editor on a fresh project
-- ============================================================


-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- NOTE: Run this manually in Supabase Dashboard → Settings → Database → Configuration
-- (SQL editor doesn't have permission to set database parameters)
-- ALTER DATABASE postgres SET "app.supabase_anon_key" = '<your-anon-key-here>';


-- ── Tables ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  capacity int NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text,
  email text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  date date NOT NULL,
  time time NOT NULL,
  party_size text NOT NULL,
  status text DEFAULT 'pending',
  user_id uuid REFERENCES auth.users,
  table_id uuid REFERENCES public.tables,
  created_at timestamptz DEFAULT now()
);

-- Prevents two non-cancelled bookings from ever sharing the same table
-- at the same date/time, even if application logic has a bug or two
-- requests race past the app-level availability check.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_table_slot_active_uidx
  ON public.bookings (table_id, date, time)
  WHERE status != 'cancelled';

CREATE TABLE IF NOT EXISTS public.booking_settings (
  id integer PRIMARY KEY DEFAULT 1,
  max_bookings_per_slot integer NOT NULL DEFAULT 5,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT booking_settings_singleton CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  status text DEFAULT 'active',
  subscribed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.booking_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid,
  customer_name text NOT NULL,
  email text,
  db_status text NOT NULL,
  realtime_sync text NOT NULL,
  line_notification text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vip_signup_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_blasts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subject text NOT NULL,
  html_content text NOT NULL,
  status text NOT NULL DEFAULT 'sending',
  total_sent integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blast_id uuid REFERENCES public.email_blasts(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  resend_id text UNIQUE,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_table_id ON public.bookings(table_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON public.bookings(date, time);


-- ── Seed Data ────────────────────────────────────────────────
INSERT INTO public.tables (name, capacity) VALUES
  ('Table 1', 2), ('Table 2', 2),
  ('Table 3', 4), ('Table 4', 4),
  ('Table 5', 6), ('Table 6', 6),
  ('Window Table 1', 2), ('Window Table 2', 2),
  ('VIP Booth', 8)
ON CONFLICT DO NOTHING;

INSERT INTO public.booking_settings (id, max_bookings_per_slot)
VALUES (1, 5)
ON CONFLICT (id) DO NOTHING;


-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_signup_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_blasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- bookings: rows hold customer PII (name, email, phone). Only authenticated
-- staff (the admin dashboard) may read/write directly. Server routes that need
-- privileged access use the service_role key, which bypasses RLS automatically.
-- Anon gets NO direct access: public reservations are created exclusively through
-- the create_booking() SECURITY DEFINER RPC, which runs as the function owner and
-- bypasses RLS — so anon never touches this table directly.
DROP POLICY IF EXISTS "Allow public inserts" ON public.bookings;
DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow anon update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow anon delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow anon select bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated select bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_open_access" ON public.bookings;
CREATE POLICY "bookings_staff_all" ON public.bookings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- tables
DROP POLICY IF EXISTS "Tables are viewable by everyone" ON public.tables;
DROP POLICY IF EXISTS "Staff can manage tables" ON public.tables;
CREATE POLICY "tables_read_all" ON public.tables FOR SELECT USING (true);
CREATE POLICY "tables_manage_authenticated" ON public.tables
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- customers
DROP POLICY IF EXISTS "Customers can manage own profile" ON public.customers;
DROP POLICY IF EXISTS "Staff can view all customers" ON public.customers;
CREATE POLICY "customers_own_profile" ON public.customers
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- booking_settings: anyone reads, only service role writes
DROP POLICY IF EXISTS "allow_read_booking_settings" ON public.booking_settings;
DROP POLICY IF EXISTS "allow_service_role_update_booking_settings" ON public.booking_settings;
CREATE POLICY "booking_settings_read" ON public.booking_settings FOR SELECT USING (true);
CREATE POLICY "booking_settings_write" ON public.booking_settings
  FOR UPDATE USING (auth.role() = 'service_role');

-- subscribers: the email list is PII. The public may only INSERT (newsletter
-- signup via NewsletterModal) — they cannot read, update, or delete the list.
-- Staff (admin dashboard, authenticated) manage everything. Server routes that
-- mutate subscribers (unsubscribe, email-webhook bounce handling) use the
-- service_role key, which bypasses RLS.
DROP POLICY IF EXISTS "Allow public to subscribe" ON public.subscribers;
DROP POLICY IF EXISTS "Staff can manage subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Allow anon manage subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_open_access" ON public.subscribers;
CREATE POLICY "subscribers_public_signup" ON public.subscribers
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "subscribers_staff_all" ON public.subscribers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- logging tables: open access
DROP POLICY IF EXISTS "Allow anon manage booking_attempts" ON public.booking_attempts;
CREATE POLICY "booking_attempts_open_access" ON public.booking_attempts
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon manage vip_signup_attempts" ON public.vip_signup_attempts;
CREATE POLICY "vip_signup_attempts_open_access" ON public.vip_signup_attempts
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon manage email_blasts" ON public.email_blasts;
CREATE POLICY "email_blasts_open_access" ON public.email_blasts
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon manage email_logs" ON public.email_logs;
CREATE POLICY "email_logs_open_access" ON public.email_logs
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ── Realtime Publications ────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_attempts;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_signup_attempts;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.email_blasts;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.email_logs;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── Email Notification Trigger ───────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_booking_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type',   TG_OP,
    'table',  TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW)::jsonb
  );
  PERFORM net.http_post(
    url     := 'https://tgekluwdzimtzigugvvw.supabase.co/functions/v1/send-booking-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
    ),
    body := payload
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_email();


-- ── create_booking RPC ───────────────────────────────────────
-- max_bookings_per_slot = daily cap (total bookings per day, not per time slot)
-- When a day hits the cap, suggests available slots on the next 7 days

CREATE OR REPLACE FUNCTION public.create_booking(
  p_name text,
  p_email text,
  p_phone text,
  p_date date,
  p_time time,
  p_party_size text,
  p_user_id uuid DEFAULT null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table_id uuid;
  v_booking_id uuid;
  v_party_int int;
  v_daily_bookings int;
  v_max_bookings int;

  v_operating_hours time[] := ARRAY[
    '17:00'::time, '17:30'::time, '18:00'::time, '18:30'::time, '19:00'::time,
    '19:30'::time, '20:00'::time, '20:30'::time, '21:00'::time, '21:30'::time,
    '22:00'::time, '22:30'::time, '23:00'::time, '23:30'::time, '00:00'::time, '00:30'::time
  ];
  v_alt_time time;
  v_alt_table_id uuid;
  v_day_bookings int;
  v_suggested_slots jsonb := '[]'::jsonb;

  v_sorted_times time[] := ARRAY[]::time[];
  v_later_idx int;
  v_earlier_idx int;
  v_req_idx int;
  v_oh_len int;
  v_check_date date;
  v_day_offset int;
BEGIN
  SELECT max_bookings_per_slot INTO v_max_bookings
  FROM public.booking_settings WHERE id = 1;
  IF v_max_bookings IS NULL THEN v_max_bookings := 5; END IF;

  v_party_int := (regexp_replace(p_party_size, '\D', '', 'g'))::int;

  -- Build proximity-sorted time list starting from the requested time
  v_oh_len := array_length(v_operating_hours, 1);
  FOR i IN 1..v_oh_len LOOP
    IF v_operating_hours[i] = p_time THEN v_req_idx := i; EXIT; END IF;
  END LOOP;

  IF v_req_idx IS NULL THEN
    v_sorted_times := v_operating_hours;
  ELSE
    v_sorted_times := array_append(v_sorted_times, v_operating_hours[v_req_idx]);
    v_later_idx := v_req_idx + 1;
    v_earlier_idx := v_req_idx - 1;
    WHILE (v_later_idx <= v_oh_len OR v_earlier_idx >= 1) LOOP
      IF v_later_idx <= v_oh_len THEN
        v_sorted_times := array_append(v_sorted_times, v_operating_hours[v_later_idx]);
        v_later_idx := v_later_idx + 1;
      END IF;
      IF v_earlier_idx >= 1 THEN
        v_sorted_times := array_append(v_sorted_times, v_operating_hours[v_earlier_idx]);
        v_earlier_idx := v_earlier_idx - 1;
      END IF;
    END LOOP;
  END IF;

  -- Count total bookings for this day (daily cap)
  SELECT COUNT(*) INTO v_daily_bookings
  FROM public.bookings b
  WHERE b.date = p_date AND b.status != 'cancelled';

  -- Day is full → find available slots on the next 7 days
  IF v_daily_bookings >= v_max_bookings THEN

    FOR v_day_offset IN 1..7 LOOP
      v_check_date := p_date + v_day_offset;
      EXIT WHEN jsonb_array_length(v_suggested_slots) >= 4;

      SELECT COUNT(*) INTO v_day_bookings
      FROM public.bookings b
      WHERE b.date = v_check_date AND b.status != 'cancelled';

      IF v_day_bookings < v_max_bookings THEN
        FOREACH v_alt_time IN ARRAY v_sorted_times LOOP
          EXIT WHEN jsonb_array_length(v_suggested_slots) >= 4;

          v_alt_table_id := NULL;
          SELECT t.id INTO v_alt_table_id
          FROM public.tables t
          WHERE t.is_active = true
            AND t.capacity >= v_party_int
            AND NOT EXISTS (
              SELECT 1 FROM public.bookings b
              WHERE b.table_id = t.id
                AND b.date = v_check_date
                AND b.time = v_alt_time
                AND b.status != 'cancelled'
            )
          ORDER BY t.capacity ASC LIMIT 1;

          IF v_alt_table_id IS NOT NULL THEN
            v_suggested_slots := v_suggested_slots || jsonb_build_array(
              jsonb_build_object(
                'date', to_char(v_check_date, 'YYYY-MM-DD'),
                'time', to_char(v_alt_time, 'HH24:MI')
              )
            );
          END IF;
        END LOOP;
      END IF;
    END LOOP;

    RETURN jsonb_build_object(
      'error', 'TIME_SLOT_FULL',
      'message', 'Ay caramba! The whole day is fully booked — our fiesta is sold out! Snag a spot on another day below:',
      'suggested_slots', v_suggested_slots
    );
  END IF;

  -- Day has capacity → find a table for the requested time slot
  SELECT t.id INTO v_table_id
  FROM public.tables t
  WHERE t.is_active = true
    AND t.capacity >= v_party_int
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.table_id = t.id
        AND b.date = p_date
        AND b.time = p_time
        AND b.status != 'cancelled'
    )
  ORDER BY t.capacity ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- No table at this time → suggest other times today
  IF v_table_id IS NULL THEN

    FOREACH v_alt_time IN ARRAY v_sorted_times LOOP
      EXIT WHEN jsonb_array_length(v_suggested_slots) >= 4;
      IF v_alt_time = p_time THEN CONTINUE; END IF;

      v_alt_table_id := NULL;
      SELECT t.id INTO v_alt_table_id
      FROM public.tables t
      WHERE t.is_active = true
        AND t.capacity >= v_party_int
        AND NOT EXISTS (
          SELECT 1 FROM public.bookings b
          WHERE b.table_id = t.id
            AND b.date = p_date
            AND b.time = v_alt_time
            AND b.status != 'cancelled'
        )
      ORDER BY t.capacity ASC LIMIT 1;

      IF v_alt_table_id IS NOT NULL THEN
        v_suggested_slots := v_suggested_slots || jsonb_build_array(
          jsonb_build_object(
            'date', to_char(p_date, 'YYYY-MM-DD'),
            'time', to_char(v_alt_time, 'HH24:MI')
          )
        );
      END IF;
    END LOOP;

    RETURN jsonb_build_object(
      'error', 'TIME_SLOT_FULL',
      'message', 'Oof! Every table is taken at this time — too popular for our own good! Pick another slot below:',
      'suggested_slots', v_suggested_slots
    );
  END IF;

  -- Insert the booking
  INSERT INTO public.bookings (
    name, email, phone, date, time, party_size, user_id, table_id, status
  ) VALUES (
    p_name, p_email, p_phone, p_date, p_time, p_party_size, p_user_id, v_table_id, 'pending'
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'table_id', v_table_id
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'error', 'DOUBLE_BOOKING_CONFLICT',
      'message', 'This slot was just taken by another customer. Please try again.'
    );
  WHEN others THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;
