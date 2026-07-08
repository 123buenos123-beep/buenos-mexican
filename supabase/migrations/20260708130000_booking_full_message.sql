-- ============================================================
-- Reword the "whole day fully booked" message in create_booking()
-- ============================================================
-- Only the day-full message text changed (dropped "Ay caramba!"). Everything
-- else in the function is identical to schema.sql. CREATE OR REPLACE updates
-- the function in place. Paste into the Supabase SQL Editor and run.
-- ============================================================

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
      'message', '😔 Sorry, we''re fully booked on this day. Try one of these dates instead:',
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
