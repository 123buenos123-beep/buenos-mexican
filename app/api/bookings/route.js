import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sanitise error strings — never leak raw HTML to the client
function sanitizeMsg(msg) {
  if (!msg || typeof msg !== 'string') return '';
  if (msg.trimStart().startsWith('<') || msg.includes('<!DOCTYPE')) {
    return 'Something went wrong. Please try again or call us directly.';
  }
  return msg.replace(/<[^>]*>/g, '').slice(0, 500);
}

// ── Rate limiting ────────────────────────────────────────────────────────────
// Two-layer approach:
//   1. In-memory pre-check  — catches obvious bots instantly, no DB round trip
//   2. Supabase persistence — survives Vercel deploys / serverless cold starts

// Layer 1: in-memory (5 hits / 30 s per IP → obvious bot)
const _memCache = new Map();
function _memCheck(ip) {
  const now = Date.now();
  const window = 30_000;
  const times = (_memCache.get(ip) || []).filter(t => now - t < window);
  if (times.length >= 5) return true;
  times.push(now);
  _memCache.set(ip, times);
  return false;
}

// Layer 2: Supabase — 3 attempts per email in 5 minutes (persists across deploys)
async function _dbCheck(email) {
  try {
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from('booking_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.toLowerCase().trim())
      .gte('created_at', since);
    if (error) return false; // fail open — don't block real users if DB is down
    return (count || 0) >= 3;
  } catch {
    return false;
  }
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
  if (!token) return false;

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}&remoteip=${encodeURIComponent(ip)}`,
    });

    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('Turnstile verification request error:', err);
    return false;
  }
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';

    // 1. Rate Limiting — Layer 1: fast in-memory check (no DB)
    if (_memCheck(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.', message: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, phone, date, time, partySize, website, turnstileToken } = body;

    // 1b. Rate Limiting — Layer 2: persistent Supabase check by email
    if (email && await _dbCheck(email)) {
      return NextResponse.json(
        { error: 'Too many booking attempts. Please wait 5 minutes before trying again.', message: 'Too many booking attempts. Please wait 5 minutes before trying again.' },
        { status: 429 }
      );
    }

    // 2. Monday closed-day check
    if (date) {
      const day = new Date(date + 'T00:00:00').getDay();
      if (day === 1) {
        return NextResponse.json(
          { error: 'We are closed on Mondays. Please choose another day.', message: 'We are closed on Mondays. Please choose another day.' },
          { status: 400 }
        );
      }
    }

    // 3. Honeypot Validation
    if (website) {
      console.warn(`[Bot Blocked] Honeypot filled by IP ${ip}. website = "${website}"`);
      await supabase.from('booking_attempts').insert([{
        customer_name: name || 'Bot Attempt',
        email: email || '',
        db_status: '❌ Bot Blocked (Honeypot)',
        realtime_sync: '➖ Skipped',
        line_notification: '➖ Skipped'
      }]);
      return NextResponse.json({
        success: true,
        booking_id: 'mock-bot-id-success',
        table_id: 'mock-bot-table-id'
      });
    }

    // 3. Turnstile Verification
    const isHuman = await verifyTurnstile(turnstileToken, ip);
    if (!isHuman) {
      await supabase.from('booking_attempts').insert([{
        customer_name: name || 'Verification Failed',
        email: email || '',
        db_status: '❌ Security Check Failed',
        realtime_sync: '➖ Skipped',
        line_notification: '➖ Skipped'
      }]);
      return NextResponse.json(
        { 
          error: 'Security check failed. Please refresh the page and try again.',
          message: 'Security check failed. Please refresh the page and try again.'
        },
        { status: 400 }
      );
    }

    // 4. Database Insertion
    const { data, error } = await supabase.rpc('create_booking', {
      p_name: name,
      p_email: email,
      p_phone: phone,
      p_date: date,
      p_time: time,
      p_party_size: partySize,
    });

    if (error || (data && data.error)) {
      const errString = error?.message || data?.error || '';
      const message = data?.message || errString;
      const suggestedSlots = data?.suggested_slots || [];
      
      const isConflict = 
        error?.status === 409 || 
        error?.code === '23505' ||
        errString.toLowerCase().includes('duplicate') ||
        errString.toLowerCase().includes('conflict') ||
        errString.toLowerCase().includes('unique constraint') ||
        message.toLowerCase().includes('duplicate') ||
        message.toLowerCase().includes('conflict') ||
        message.toLowerCase().includes('unique constraint');

      await supabase.from('booking_attempts').insert([{
        customer_name: name,
        email: email,
        db_status: isConflict ? '❌ 409 Slot Conflict' : `❌ Error: ${errString || message}`,
        realtime_sync: '➖ Skipped',
        line_notification: '➖ Skipped'
      }]);

      return NextResponse.json(
        { error: sanitizeMsg(errString), message: sanitizeMsg(message), suggested_slots: suggestedSlots },
        { status: isConflict ? 409 : 400 }
      );
    }

    // Log successful booking
    await supabase.from('booking_attempts').insert([{
      booking_id: data.booking_id,
      customer_name: name,
      email: email,
      db_status: '✅ 201 Created',
      realtime_sync: '✅ Success',
      line_notification: '⏳ Sending...'
    }]);

    return NextResponse.json({
      success: true,
      booking_id: data.booking_id,
      table_id: data.table_id
    });

  } catch (err) {
    console.error('Booking API handler error:', err);
    const isConflict = 
      err?.status === 409 || 
      err?.code === '23505' ||
      err?.message?.toLowerCase().includes('duplicate') ||
      err?.message?.toLowerCase().includes('conflict') ||
      err?.message?.toLowerCase().includes('unique constraint');
      
    // Log unexpected errors
    try {
      const body = await request.clone().json().catch(() => ({}));
      await supabase.from('booking_attempts').insert([{
        customer_name: body.name || 'Unknown',
        email: body.email || '',
        db_status: `❌ 500 Error: ${err?.message || 'Unexpected'}`,
        realtime_sync: '➖ Skipped',
        line_notification: '➖ Skipped'
      }]);
    } catch (_) {}

    return NextResponse.json(
      { 
        error: sanitizeMsg(err?.message) || 'An unexpected error occurred. Please try again or call us directly.',
        message: sanitizeMsg(err?.message) || 'An unexpected error occurred. Please try again or call us directly.'
      },
      { status: isConflict ? 409 : 500 }
    );
  }
}
