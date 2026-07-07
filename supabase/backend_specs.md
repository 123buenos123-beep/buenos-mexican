# Backend Specifications — Buenos Mexican

## Overview

The backend is built on **Supabase** (PostgreSQL + Realtime + Auth + Edge Functions). All booking logic runs inside a single PostgreSQL RPC function for atomicity. External notifications are handled by a Deno Edge Function triggered asynchronously via `pg_net`.

---

## Database Schema

Single source of truth: **`supabase/schema.sql`**

Run this file in Supabase SQL Editor to build the full database from scratch. Every statement is idempotent (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`, exception-guarded `ALTER PUBLICATION`), so it's safe to re-run in full against an existing project.

---

### Tables

#### `public.tables`
Physical restaurant tables available for assignment.

| Column | Type | Description |
|:---|:---|:---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Table label (e.g. "Window Table 1") |
| `capacity` | `int` | Max guests |
| `is_active` | `boolean` | Whether table is in service |
| `created_at` | `timestamptz` | — |

Seeded with 9 tables: two 2-tops, two more 2-tops (window), two 4-tops, two 6-tops, and one 8-top VIP booth.

---

#### `public.bookings`
All reservation records.

| Column | Type | Default | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `name` | `text` | — | Customer full name |
| `email` | `text` | — | Customer email |
| `phone` | `text` | — | Customer phone |
| `date` | `date` | — | Reservation date |
| `time` | `time` | — | Reservation time |
| `party_size` | `text` | — | e.g. `"2 People"` |
| `user_id` | `uuid` | `null` | Auth user reference (optional) |
| `table_id` | `uuid` | — | Assigned table FK |
| `status` | `text` | `'pending'` | `pending` / `confirmed` / `cancelled` |
| `created_at` | `timestamptz` | `now()` | — |

A partial unique index, `bookings_table_slot_active_uidx`, enforces `(table_id, date, time)` uniqueness among non-cancelled bookings — this is what makes the `unique_violation` handler in `create_booking` reachable, catching any race that slips past the RPC's own locking.

---

#### `public.booking_settings`
Single-row configuration table (id = 1).

| Column | Type | Description |
|:---|:---|:---|
| `id` | `int` | Always 1 |
| `max_bookings_per_slot` | `int` | **Daily cap** — total bookings allowed per calendar day across all time slots (default `5`) |
| `updated_at` | `timestamptz` | Last modified |

> Despite the column name, this is a **daily cap**, not a per-slot cap. The `create_booking` RPC counts `WHERE date = p_date` (not `AND time = p_time`).

---

#### `public.booking_attempts`
Audit log of every booking API call, regardless of outcome.

| Column | Type | Description |
|:---|:---|:---|
| `id` | `uuid` | Primary key |
| `booking_id` | `uuid` | FK to booking (successful attempts only) |
| `customer_name` | `text` | — |
| `email` | `text` | Used by the Supabase rate limiter layer |
| `db_status` | `text` | e.g. `✅ 201 Created`, `❌ Bot Blocked (Honeypot)` |
| `realtime_sync` | `text` | Pipeline status label |
| `line_notification` | `text` | Pipeline status label |
| `created_at` | `timestamptz` | Used for 5-minute rate limit window |

---

#### `public.subscribers`
Newsletter VIP subscribers.

| Column | Type | Description |
|:---|:---|:---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Optional display name |
| `email` | `text` | Unique subscriber email |
| `is_active` | `boolean` | `false` = unsubscribed or hard-bounced. This is the field that actually gates sending — `/api/newsletter/send` filters `WHERE is_active = true` |
| `status` | `text` | Defaults to `'active'`; informational only, not used to gate sending |
| `subscribed_at` | `timestamptz` | — |

Viewable in the admin dashboard's **Subscribers** tab (`components/SubscribersAdmin.js`).

---

#### `public.vip_signup_attempts`
Audit log of newsletter signup attempts (parallel to `booking_attempts`).

| Column | Type | Description |
|:---|:---|:---|
| `id` | `uuid` | Primary key |
| `email` | `text` | — |
| `status` | `text` | e.g. success, duplicate (409 = already subscribed) |
| `created_at` | `timestamptz` | — |

Shown in the admin System Monitor tab as the "VIP Sign-up Log".

---

#### `public.email_blasts`
Newsletter campaign records.

| Column | Type | Description |
|:---|:---|:---|
| `id` | `uuid` | Primary key |
| `subject` | `text` | Email subject line |
| `html_content` | `text` | Full HTML body |
| `status` | `text` | `sending` / `completed` (default `'sending'`) |
| `total_sent` | `int` | Total recipients targeted |
| `sent_count` | `int` | Successfully handed off to Resend |
| `delivered_count` | `int` | Confirmed delivered (via webhook) |
| `failed_count` | `int` | Bounced or failed |
| `created_at` | `timestamptz` | When send started |
| `completed_at` | `timestamptz` | When the batch finished |

---

#### `public.email_logs`
Per-recipient delivery log for each campaign.

| Column | Type | Description |
|:---|:---|:---|
| `id` | `uuid` | Primary key |
| `blast_id` | `uuid` | FK to `email_blasts`, `ON DELETE CASCADE` |
| `recipient_email` | `text` | Recipient address (not a subscriber FK) |
| `resend_id` | `text` | Resend message ID, unique — used for webhook matching |
| `status` | `text` | `sent` / `delivered` / `bounced` / `failed` (default `'sent'`) |
| `error_message` | `text` | Bounce/failure reason |
| `updated_at` | `timestamptz` | Last webhook update |

---

## RPC: `public.create_booking`

The core booking function. Runs entirely in PostgreSQL for atomicity.

### Signature

```sql
create_booking(
  p_name        text,
  p_email       text,
  p_phone       text,
  p_date        date,
  p_time        time,
  p_party_size  text,
  p_user_id     uuid DEFAULT null
) RETURNS jsonb
```

### Logic

1. Read `max_bookings_per_slot` from `booking_settings` (default `5` if the row is missing).
2. Parse party size integer from `p_party_size` string.
3. Pre-compute a proximity-sorted time array starting from `p_time` (later times first, then earlier, alternating outward) — reused for building suggestion lists.
4. Count total non-cancelled bookings for `p_date`.
5. **If daily cap reached** → scan the next 7 days. For each day under cap, iterate the proximity-sorted times looking for a table with `capacity >= party_size` **and no conflicting booking at that exact date/time**. Return up to 4 `{date, time}` suggestions as `suggested_slots`.
6. **If cap not reached** → find the smallest available table (`capacity >= party_size`, no conflicting booking at the requested date/time) using `FOR UPDATE SKIP LOCKED`.
7. **If no table found at requested time** → suggest nearby times on the same day (same proximity sort, same conflict-checked search — never suggests a slot that's actually taken).
8. **If table found** → `INSERT` booking, return `{success, booking_id, table_id}`.

There is intentionally **no fallback that ignores the availability check** — every table lookup (the real booking, and both suggestion builders) requires the table to be genuinely free at that date/time. An earlier version of this function had a fallback that dropped the conflict check when the ideal query returned nothing, which could silently double-book a table; that's been removed. The partial unique index on `bookings(table_id, date, time)` (excluding cancelled rows) is the last line of defense if a race still slips through.

### Return Shape

```json
// Success
{ "success": true, "booking_id": "uuid", "table_id": "uuid" }

// Day full — cross-day suggestions
{
  "error": "TIME_SLOT_FULL",
  "message": "Ay caramba! ...",
  "suggested_slots": [
    { "date": "2026-06-27", "time": "19:00" },
    { "date": "2026-06-27", "time": "19:30" }
  ]
}

// Time slot full — same-day suggestions
{
  "error": "TIME_SLOT_FULL",
  "message": "Oof! Every table is taken at this time...",
  "suggested_slots": [
    { "date": "2026-06-25", "time": "18:30" }
  ]
}

// Race condition caught at the DB level
{ "error": "DOUBLE_BOOKING_CONFLICT", "message": "This slot was just taken by another customer. Please try again." }

// Unexpected exception
{ "error": "SQLERRM message" }
```

---

## Security (RLS)

Every table has RLS enabled, but access control in this app is enforced at the **application layer** (Next.js proxy gates `/admin/*`, and the `anon` key is used everywhere including the admin dashboard) rather than per-table RLS restrictions. Current policies:

| Table | Policy |
|:---|:---|
| `bookings` | Open — `FOR ALL` to `anon, authenticated` |
| `tables` | `SELECT` open to everyone; `INSERT/UPDATE/DELETE` restricted to `authenticated` |
| `customers` | `authenticated` only, restricted to own row (`auth.uid() = id`) |
| `booking_settings` | `SELECT` open to everyone; `UPDATE` restricted to `service_role` |
| `subscribers` | Open — `FOR ALL` to `anon, authenticated` |
| `booking_attempts` | Open — `FOR ALL` to `anon, authenticated` |
| `vip_signup_attempts` | Open — `FOR ALL` to `anon, authenticated` |
| `email_blasts` | Open — `FOR ALL` to `anon, authenticated` |
| `email_logs` | Open — `FOR ALL` to `anon, authenticated` |

The real gate for the admin surface is `proxy.js` (session check before `/admin/*` pages render) — not RLS. Anyone with the anon/publishable key can read/write these tables directly via the REST API; this is a deliberate simplicity tradeoff for a small single-tenant app, not an oversight.

---

## Triggers

### `on_booking_created`
- **Type**: `AFTER INSERT OR UPDATE OF status ON public.bookings`
- **Action**: Calls `notify_booking_email()` which uses `pg_net` to POST the booking record to the `send-booking-email` Edge Function asynchronously, authenticated with the `app.supabase_anon_key` database setting.

---

## Edge Function: `send-booking-email`

**Location**: `supabase/functions/send-booking-email/index.ts`
**Runtime**: Deno (deployed on Supabase global edge)
**Verify JWT**: disabled — the trigger's Bearer token isn't checked, so this function doesn't depend on the legacy anon-key JWT format

Handles three notification channels based on booking status, run concurrently via `Promise.all`:

| Channel | Trigger | Payload |
|:---|:---|:---|
| **Resend email** | Any status | Status-specific HTML email to customer, includes a self-service cancel link for pending/confirmed |
| **LINE Push** | Any status | Summary card to manager's LINE chat |
| **Google Sheets** | `confirmed` only | Append row via Apps Script webhook |

Google Sheets sync is restricted to confirmed bookings only to avoid polluting the sheet with unreviewed requests. If the Sheets sync fails or times out, a LINE alert is sent to the manager with instructions to add the row manually.

After the three channels settle, the function retries (up to 6 times, ~3s window) patching `booking_attempts.line_notification` with the LINE delivery status — retried because the DB trigger fires the edge function during the RPC transaction, so the `booking_attempts` row (inserted by the API route after the RPC returns) may not exist yet on the first attempt.

**Secrets required** (set via `supabase secrets set --project-ref <ref>`):
```
RESEND_API_KEY
LINE_CHANNEL_ACCESS_TOKEN
LINE_MANAGER_USER_ID
GOOGLE_SHEET_WEBHOOK_URL
SITE_URL              # optional — defaults to https://buenosmexicanrestaurant.com if unset
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are **not** set manually — Supabase reserves the `SUPABASE_` prefix and injects both automatically into every Edge Function's runtime with the project's current values.

---

## API Routes

### `POST /api/bookings`

Booking submission pipeline:

1. In-memory rate check: 5 requests / 30s per IP
2. Supabase rate check: 3 attempts / 5 min per email (queries `booking_attempts`)
3. Monday closed-day check (returns 400 if `date.getDay() === 1`)
4. Honeypot check: `website` field must be empty
5. Cloudflare Turnstile verification
6. `create_booking` RPC call
7. Log result to `booking_attempts`

### `GET/POST /api/admin/booking-settings`

Read or update `max_bookings_per_slot` in `booking_settings`. Admin dashboard only.

### `GET/POST /api/cancel-booking`

Customer self-service cancellation, reached via the link in booking emails.
- **GET**: Renders an HTML confirmation page for the booking `id` in the query string (or an info page if not found / already cancelled / date has passed).
- **POST**: Updates `status = 'cancelled'`, guarded by `.neq('status', 'cancelled')` so the DB trigger's email-on-status-change doesn't fire twice for an already-cancelled booking. Treats "no row updated" as success so the customer isn't shown a confusing error for a no-op.

### `POST /api/newsletter/send`

Throttled batch send to all active subscribers. Reads `subscribers WHERE is_active = true`, creates an `email_blasts` record, sends via Resend, and logs each send to `email_logs`.

### `POST /api/email-webhook`

Resend webhook receiver. Maps Resend event types to local statuses:
- `email.delivered` → `delivered`
- `email.bounced` → `bounced` (hard: deactivate subscriber; soft: keep active)
- `email.failed` → `failed` (deactivate subscriber)

Updates `email_logs` and `email_blasts` counters.

### `GET/POST /api/unsubscribe`

Looked up **by email**, not a signed token — the query string is `?email=...`.
- **GET**: Renders an HTML unsubscribe confirmation page (no DB write).
- **POST**: Sets `is_active = false` for the subscriber matching the email. Does not touch the `status` text column.

---

## Auth

**Package**: `@supabase/ssr`

`lib/supabase.js` uses `createBrowserClient` which stores the Supabase session in cookies (not localStorage). This allows `proxy.js` to read and verify the session server-side on every request to `/admin/*`.

`proxy.js` (Next.js 16's file convention — `middleware` was renamed to `proxy` in v16.0.0; this is not a workaround, it's the current standard):
- Uses `createServerClient` from `@supabase/ssr`
- Calls `supabase.auth.getUser()` to verify the session from cookies
- Unauthenticated → redirect to `/admin/login`
- Authenticated at `/admin/login` → redirect to `/admin`
- `matcher: ['/admin/:path*']` — only runs on admin routes
