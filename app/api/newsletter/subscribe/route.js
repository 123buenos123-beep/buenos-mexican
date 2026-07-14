import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// subscribers + vip_signup_attempts are locked to staff by RLS — the public may
// no longer INSERT directly with the anon key. This route subscribes visitors on
// their behalf using the service_role key (bypasses RLS) after rate limiting.
// Falls back to the anon key for local dev where service_role may be unset (works
// only while the legacy anon-insert policy is still in place locally).
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ── Rate limiting ────────────────────────────────────────────────────────────
// Mirrors the bookings route, but keyed on IP (signups use throwaway emails, so
// email is a useless rate-limit key — one bot cycles thousands of addresses).
//   Layer 1: in-memory burst check  — 5 signups / 60 s per IP, no DB round trip
//   Layer 2: persistent per-IP check — 20 signups / hour, survives cold starts

const _memCache = new Map();
function _memCheck(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const times = (_memCache.get(ip) || []).filter((t) => now - t < windowMs);
  if (times.length >= 5) return true;
  times.push(now);
  _memCache.set(ip, times);
  return false;
}

async function _dbCheck(ip) {
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from('vip_signup_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', since);
    if (error) return false; // fail open — don't block real users if DB/column is unavailable
    return (count || 0) >= 20;
  } catch {
    return false;
  }
}

// Log every attempt (best-effort — must never block or fail the response).
async function logAttempt(email, status, ip) {
  try {
    await supabase.from('vip_signup_attempts').insert([{ email, status, ip }]);
  } catch {
    /* logging is non-critical */
  }
}

// Deliberately loose — real validation is Postgres' UNIQUE + NOT NULL. This just
// rejects obvious junk before it ever reaches the DB.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Layer 1: fast in-memory burst check (no DB)
    if (_memCheck(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const email = (body?.email || '').toString().trim().toLowerCase();
    const name = (body?.name || '').toString().trim().slice(0, 120);

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Layer 2: persistent per-IP check
    if (await _dbCheck(ip)) {
      await logAttempt(email, 'Rate limited', ip);
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { error } = await supabase
      .from('subscribers')
      .insert([{ name: name || null, email }]);

    if (error) {
      if (error.code === '23505') {
        // unique violation — already on the list; treat as success for the UI
        await logAttempt(email, '409 Duplicate', ip);
        return NextResponse.json({ success: true, status: 'already' });
      }
      console.error('[Newsletter] Subscribe insert error:', error);
      await logAttempt(email, `Failed: ${error.message || 'unknown'}`, ip);
      return NextResponse.json(
        { error: 'Something went wrong. Please try again later.' },
        { status: 500 }
      );
    }

    await logAttempt(email, 'Success', ip);
    return NextResponse.json({ success: true, status: 'subscribed' });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
