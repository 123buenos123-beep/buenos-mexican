# Buenos Mexican Cuisine — Restaurant Reservation Platform

A production-grade restaurant reservation and management system for Buenos Mexican Cuisine, Pattaya. Built on **Next.js 16** with **Supabase** for real-time PostgreSQL data, **WebSocket-driven live dashboards**, a concurrency-safe booking engine, and a multi-channel notification pipeline.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Feature Documentation](#feature-documentation)
  - [1. Real-time Streaming](#1-real-time-streaming)
  - [2. Reservation Management Actions](#2-reservation-management-actions)
  - [3. Filters & Search Controls](#3-filters--search-controls)
  - [4. Interactive Statistics Cards](#4-interactive-statistics-cards)
  - [5. Smart Daily Cap & Cross-Day Suggestions (RPC)](#5-smart-daily-cap--cross-day-suggestions-rpc)
  - [6. Interactive Location Map](#6-interactive-location-map)
  - [7. Grab Delivery Integration](#7-grab-delivery-integration)
  - [8. Social Media & Customer Engagement](#8-social-media--customer-engagement)
  - [9. Newsletter System](#9-newsletter-system)
  - [10. Subscribers Panel](#10-subscribers-panel)
- [Security & Protection](#security--protection)
  - [Admin Route Protection (Proxy)](#admin-route-protection-proxy)
  - [Data Access (Row Level Security)](#data-access-row-level-security)
  - [Cloudflare Turnstile](#cloudflare-turnstile)
  - [Honeypot Field](#honeypot-field)
  - [Rate Limiting (Two-Layer)](#rate-limiting-two-layer)
  - [Monday Closed Day](#monday-closed-day)
  - [Frontend Offline Fallback](#frontend-offline-fallback)
- [Local Setup & Environment Variables](#local-setup--environment-variables)
- [Database Setup](#database-setup)
- [Project Structure](#project-structure)
- [Notification Pipeline](#notification-pipeline)

---

## Project Overview

Buenos Mexican Cuisine is a premium restaurant platform handling the full lifecycle of table reservations — from customer-facing booking forms to a real-time admin dashboard for restaurant staff.

### Core Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | Next.js 16 (App Router), React 19 | Server/client rendering, routing, API routes |
| **Database** | PostgreSQL via Supabase | Relational data, RPC functions, Row Level Security |
| **Auth** | Supabase Auth + `@supabase/ssr` | Cookie-based sessions, server-side route protection |
| **Real-time** | Supabase Realtime (WebSockets) | Live dashboard updates via WAL replication |
| **Animations** | Framer Motion, Swiper.js | Scroll effects, marquee carousels, micro-interactions |
| **Styling** | Vanilla CSS (CSS variables) | Premium design system with warm rustic theme |
| **Email** | Resend API | Transactional branded HTML emails |
| **Notifications** | LINE Messaging API | Instant push alerts to restaurant managers |
| **Data Sync** | Google Apps Script | Automated Google Sheets backup of confirmed reservations |
| **Security** | Cloudflare Turnstile | Invisible CAPTCHA bot protection |

---

## Architecture

### Booking Flow

```
Customer fills form
  → POST /api/bookings
      → In-memory rate check (5 req / 30s per IP)
      → Supabase rate check (3 req / 5 min per email)
      → Monday closed-day check
      → Honeypot validation
      → Cloudflare Turnstile verification
      → create_booking() RPC
          → Daily cap check (max N bookings per day)
          → FOR UPDATE SKIP LOCKED table assignment
          → If day full → suggest slots on next 7 days
          → If slot full → suggest nearby times same day
          → INSERT booking row
      → 200 OK → Customer sees confirmation
      → pg_net async trigger → Edge Function
          → Resend email to customer
          → LINE push to manager
          → Google Sheets row append (confirmed only)
```

### Admin Dashboard Real-time Flow

```
PostgreSQL WAL
  → Supabase Realtime
      → WebSocket (browser)
          → INSERT  → add booking card + audio chime
          → UPDATE  → update status badge in-place
          → DELETE  → remove card with exit animation
          → Any     → recalculate stat counters
```

---

## Feature Documentation

### 1. Real-time Streaming

The admin dashboard receives live updates without polling, powered by Supabase Realtime Channels.

1. PostgreSQL's WAL captures every `INSERT`, `UPDATE`, `DELETE` on the `bookings` table.
2. Supabase reads the WAL and broadcasts over the `supabase_realtime` publication.
3. `AdminDashboard.js` subscribes to the `admin-bookings` channel via `supabase.channel()`.
4. Each event type triggers specific React state mutations.
5. On reconnect after a disconnect, a full `fetchBookings()` re-sync fires to catch missed events.

**Key files:** `components/AdminDashboard.js`, `app/admin/page.js`

---

### 2. Reservation Management Actions

Three state-change actions are available per booking:

| Action | DB Effect | Availability Effect |
|:---|:---|:---|
| **Confirm** | `status = 'confirmed'` | Table remains occupied |
| **Cancel** | `status = 'cancelled'` | Table freed (excluded from `status != 'cancelled'` queries) |
| **Delete** | Hard delete row | Table freed immediately |

All actions are disabled when the system is offline (`isSystemOnline = false`).

---

### 3. Filters & Search Controls

Three client-side filters chain together — a booking must pass all to appear:

| Filter | Type | Behavior |
|:---|:---|:---|
| **Search** | Text input | Filters by `name` or `email` (case-insensitive) |
| **Date** | Toggle pills | `All Time` or `Today` |
| **Status** | Dropdown | `pending`, `confirmed`, `cancelled` |

---

### 4. Interactive Statistics Cards

Four clickable filter cards in the Live Bookings header, computed directly from React state on every Realtime event — clicking one filters the list below to that status:

| Card | Source |
|:---|:---|
| Total | `bookings.length` |
| Pending | `.filter(b => b.status === 'pending').length` |
| Confirmed | `.filter(b => b.status === 'confirmed').length` |
| Cancelled | `.filter(b => b.status === 'cancelled').length` |

The Subscribers tab has its own equivalent set (Total / Active / Unsubscribed) — see [10. Subscribers Panel](#10-subscribers-panel).

---

### 5. Smart Daily Cap & Cross-Day Suggestions (RPC)

The `create_booking` PostgreSQL RPC handles booking logic atomically at the database level.

#### Daily Cap

`max_bookings_per_slot` in `booking_settings` (id=1) controls the **total bookings allowed per calendar day** across all time slots. This is a restaurant-wide daily capacity limit, not a per-time-slot limit.

#### Algorithm

1. Parse party size (strips non-digits from `p_party_size`, e.g. `"2 People"` → `2`).
2. Count all non-cancelled bookings for the requested date.
3. **If day is full** → scan the next 7 days for available capacity. Return up to 4 `{date, time}` suggestion objects sorted by time proximity to the original request.
4. **If day has capacity** → find the smallest table with `capacity >= party_size` and no conflicting booking for the requested slot using `FOR UPDATE SKIP LOCKED`.
5. **If requested time slot is full** (all tables taken at that time, but day has remaining capacity) → suggest up to 4 nearby times on the same day.
6. **If table found** → `INSERT` booking and return `{success, booking_id, table_id}`.

#### Concurrency Safety

`FOR UPDATE SKIP LOCKED` locks the selected table row for the transaction duration. Concurrent requests skip locked rows and find the next available table, or fall back gracefully to the full/suggestion response.

A `unique_violation` exception handler catches any remaining edge cases and returns `DOUBLE_BOOKING_CONFLICT` (mapped to HTTP 409 by the API route).

#### Cross-Day Suggestions Frontend

When the API returns `suggested_slots: [{date, time}]`, the booking form renders clickable "Available alternatives" buttons. Clicking one updates both the date and time pickers and resubmits. Monday suggestions are filtered out client-side since the restaurant is closed on Mondays.

---

### 6. Interactive Location Map

Google Maps embed in `components/Location.js` pointing to Jomtien Complex, Pattaya. Uses `loading="lazy"` and Framer Motion `whileInView` entry animation.

---

### 7. Grab Delivery Integration

Customers can order delivery via Grab Food. The restaurant's Grab profile (`https://r.grab.com/o/Zn6bI3Ar`) is linked from:
- Hero section CTA button
- Menu page footer
- Site footer

---

### 8. Social Media & Customer Engagement

SVG icon links in the shared footer to Facebook, Instagram, and TikTok. Implemented in `components/FooterSocials.js`.

---

### 9. Newsletter System

Full newsletter management system accessible via the admin dashboard's "Newsletter" tab.

**Subscriber flow:**
- Customers subscribe via `NewsletterModal` (triggered from navbar VIP button)
- Stored in `public.subscribers` with `is_active` flag and `status` field
- Unsubscribe via a per-email link (`/api/unsubscribe?email=...`); the link's base URL is derived from the request host so it never points at localhost

**Campaign management (`components/NewsletterAdmin.js`):**
- Rich text editor (react-quill-new) for composing HTML emails
- Throttled batch send via `/api/newsletter/send` — ~1.6 emails/sec (600ms apart) to stay under Resend's 2 req/sec limit, with 429 backoff-retry. Sends from a verified-domain address (`RESEND_FROM_EMAIL`), never the `onboarding@resend.dev` test sender
- Real-time campaign progress via Supabase Realtime
- Delivery tracking: `email_blasts` and `email_logs` tables track sent/delivered/bounced per subscriber

**Webhook tracking (`/api/email-webhook`):**
- Resend POSTs delivery events (delivered, bounced, failed)
- Smart bounce classification: hard bounces deactivate the subscriber; soft bounces keep them active
- Updates `email_logs` status and `email_blasts` counters in real time

---

### 10. Subscribers Panel

A dedicated admin tab (`components/SubscribersAdmin.js`) for viewing newsletter subscriber counts, separate from the Newsletter tab's compose/send/track workflow.

- Three clickable stat cards: **Total / Active / Unsubscribed**, computed from `subscribers.is_active`
- Search by name or email
- List view showing name, email, subscribe date, and status badge per subscriber
- Realtime updates via a `postgres_changes` subscription on the `subscribers` table — new signups and unsubscribes appear instantly, same pattern as the Live Bookings tab

**Key files:** `components/SubscribersAdmin.js`, `app/admin/page.js`

---

## Security & Protection

### Admin Route Protection (Proxy)

**File:** `proxy.js` (Next.js 16 proxy — equivalent to middleware in earlier versions)

**How it works:**
- Uses `@supabase/ssr`'s `createServerClient` to read and refresh the Supabase session from cookies on every request to `/admin/*`.
- Unauthenticated requests to `/admin` are redirected to `/admin/login` before the page renders — no client-side JavaScript runs.
- Authenticated requests to `/admin/login` are redirected to `/admin` (already logged in).

**Auth flow:**
1. User navigates to `/admin/login`, enters credentials.
2. `supabase.auth.signInWithPassword()` sets a secure cookie (via `createBrowserClient` from `@supabase/ssr`).
3. `proxy.js` reads the cookie on subsequent requests and allows access.
4. Sign out clears the cookie and proxy redirects back to `/admin/login`.

> **Important:** `proxy.js` only guards the admin *pages*. The real protection for
> the underlying data is Row Level Security (below) — the proxy is a UX/redirect
> layer, not the data boundary.

---

### Data Access (Row Level Security)

The Supabase anon key is public — it ships to every browser. RLS, not the anon
key, is what actually protects customer data. Policies are defined in
`supabase/schema.sql`.

**Tables holding PII are closed to anon:**

| Table | anon (public) | authenticated (staff) | service_role (server) |
|:---|:---|:---|:---|
| `bookings` | no direct access¹ | full (admin dashboard) | full (bypasses RLS) |
| `subscribers` | `INSERT` only (signup) | full (admin dashboard) | full (bypasses RLS) |

¹ Public reservations are created solely through the `create_booking()`
`SECURITY DEFINER` RPC, which runs as the function owner and bypasses RLS — so
anon never needs (or gets) direct access to the `bookings` table.

**Why the admin dashboard still works with the anon key:** the browser client
(`lib/supabase.js`) sends the logged-in user's JWT alongside the anon key, so its
requests run as the `authenticated` role and satisfy the staff policies. A visitor
without a session is plain `anon` and is denied.

**Server routes** that need privileged writes use the `service_role` key
(`SUPABASE_SERVICE_ROLE_KEY`), which bypasses RLS entirely: `cancel-booking`,
`unsubscribe`, `admin/booking-settings`, and `email-webhook` (bounce handling).

> **Note:** the logging tables (`booking_attempts`, `vip_signup_attempts`) remain
> anon-accessible so the public booking route and signup modal can write to them.
> They contain email/name and are a candidate for the same lockdown next.

To apply this to an existing database, run
`supabase/migrations/20260707120000_lock_pii_rls.sql` in the SQL Editor
(idempotent). A fresh `schema.sql` run already includes it.

---

### Cloudflare Turnstile

Invisible CAPTCHA protecting the booking form from automated spam.

**Client-side** (`components/Reserve.js`):
- Loads the Turnstile script with `render=explicit`.
- Captures the token via callback; clears on expiry/error.
- Blocks form submission if `turnstileToken` is empty.

**Server-side** (`app/api/bookings/route.js`):
- Sends token + client IP to Cloudflare's `siteverify` endpoint.
- Rejects with HTTP 400 if verification fails.

**Environment variables:**
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=   # Public (client-side)
TURNSTILE_SECRET_KEY=             # Private (server-side only)
```

> **Test keys** (development only): Site key `1x00000000000000000000AA` / Secret `1x0000000000000000000000000000000AA`

---

### Honeypot Field

A hidden `website` input in the booking form, invisible to humans but filled by bots. If the field is non-empty, the server logs the attempt and returns a fake `200 OK` with mock IDs — silently dropping the request without a DB write.

---

### Rate Limiting (Two-Layer)

**File:** `app/api/bookings/route.js`

Two independent layers protect against flooding:

| Layer | Mechanism | Limit | Survives deploy? |
|:---|:---|:---|:---|
| **In-memory** | `Map<ip, timestamps[]>` | 5 requests / 30s per IP | No (fast pre-check, catches obvious bots) |
| **Supabase** | Count rows in `booking_attempts` | 3 attempts / 5 min per email | Yes |

The Supabase layer queries existing `booking_attempts` rows for the same email within the last 5 minutes. It fails open — if Supabase is unavailable, real users still get through.

IP is extracted from `x-forwarded-for` → `x-real-ip` → fallback `127.0.0.1`.

---

### Monday Closed Day

The restaurant is closed on Mondays. Enforced at three levels:

1. **Date picker** (`components/Reserve.js`) — Mondays are skipped when generating the 30-day date options array.
2. **API** (`app/api/bookings/route.js`) — Returns HTTP 400 with a clear message if a Monday date is submitted directly.
3. **Suggestions filter** (`components/Reserve.js`) — Any Monday in the cross-day suggestion response is filtered out before display.

---

### Frontend Offline Fallback

Two-layer detection in the admin dashboard:

1. `navigator.onLine` + `online`/`offline` window events
2. Supabase channel status (`SUBSCRIBED`, `CHANNEL_ERROR`, `CLOSED`)

When offline:
- Red gradient alert banner appears at the top of the viewport
- All action buttons (Confirm, Cancel, Delete) are disabled
- Status indicator pulses red

When reconnected:
- The active tab's Realtime channel resubscribes and triggers a full refetch to catch any events missed while offline
- Green toast: "Back online — data synced"

---

## Local Setup & Environment Variables

### Prerequisites
- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))
- Cloudflare Turnstile keys ([dash.cloudflare.com](https://dash.cloudflare.com))

### Install

```bash
git clone <repository-url>
cd buenos-mexican
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-jwt-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-jwt-key   # Server-only — bypasses RLS for admin/server routes. Never expose to the browser.

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# Notification pipeline (used by Supabase Edge Function)
RESEND_API_KEY=re_your_resend_api_key
# Newsletter "From" address — must be at a Resend-verified domain, otherwise blasts
# only reach the Resend account owner. Defaults to newsletter@buenosmexicanrestaurant.com.
RESEND_FROM_EMAIL=Buenos Mexican <newsletter@buenosmexicanrestaurant.com>
LINE_CHANNEL_ACCESS_TOKEN=your-line-bot-channel-access-token
LINE_MANAGER_USER_ID=Uyour-line-manager-user-id
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/your-script-id/exec

# Site URL — used in newsletter unsubscribe links
# Set to your deployed URL in production (Vercel env vars)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Run Locally

```bash
npm run dev      # http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
```

---

## Database Setup

The full database schema is in a single file: **`supabase/schema.sql`**

To set up a fresh database:
1. Go to **Supabase Dashboard → SQL Editor**
2. Paste the contents of `supabase/schema.sql` and run

> **Note:** The `ALTER DATABASE` line near the top of `schema.sql` requires superuser access. Skip it if it errors — run everything else. That line sets the `app.supabase_anon_key` config used by the email trigger function; you can set it manually in **Supabase Dashboard → Settings → Database → Configuration** if needed.

### Incremental migrations

`schema.sql` is the full source of truth and already reflects the current state. For an **already-provisioned** database, apply changes without re-running everything from `supabase/migrations/` (paste each into the SQL Editor — they're idempotent). Applied so far:

- `20260707120000_lock_pii_rls.sql` — initial PII lockdown (superseded by v2)
- `20260708120000_lock_pii_rls_v2.sql` — deterministic PII lockdown for `bookings` / `subscribers` (drops all policies, recreates the intended ones)
- `20260708130000_booking_full_message.sql` — reword the "day fully booked" message in `create_booking`

> These were applied by hand in the SQL Editor, so Supabase's migration-history table doesn't track them — apply new ones the same way rather than via `supabase db push`.

### Deploy Edge Function Secrets

```bash
npx supabase secrets set --project-ref your-project-ref \
  RESEND_API_KEY="re_your_key" \
  LINE_CHANNEL_ACCESS_TOKEN="your_token" \
  LINE_MANAGER_USER_ID="your_user_id" \
  GOOGLE_SHEET_WEBHOOK_URL="your_url"
```

> **Note:** Don't try to set `SUPABASE_SERVICE_ROLE_KEY` here — Supabase reserves the `SUPABASE_` prefix and auto-injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_DB_URL` into every Edge Function automatically. The CLI will reject any attempt to set them manually.

---

## Project Structure

```
buenos-mexican/
├── app/
│   ├── admin/
│   │   ├── page.js               # Admin dashboard (tabs: bookings, newsletter, subscribers, monitor)
│   │   └── login/
│   │       └── page.js           # Admin login page (protected by proxy.js)
│   ├── api/
│   │   ├── bookings/route.js     # POST: rate limit → honeypot → Turnstile → RPC
│   │   ├── admin/booking-settings/route.js  # GET/POST: daily cap setting
│   │   ├── email-webhook/route.js           # Resend delivery event webhook
│   │   ├── newsletter/send/route.js         # Throttled newsletter campaign send
│   │   └── unsubscribe/route.js            # Tokenized unsubscribe handler
│   ├── menu/
│   │   ├── layout.js             # Menu page layout
│   │   └── page.js               # Full menu explorer with section nav
│   ├── globals.css               # Design system (CSS variables, typography, components)
│   ├── layout.js                 # Root layout (fonts, metadata, structured data)
│   ├── page.js                   # Landing page
│   ├── robots.ts                 # Robots.txt
│   └── sitemap.ts                # Dynamic sitemap
├── components/
│   ├── AdminDashboard.js         # Real-time booking cards, stats, filters, actions
│   ├── ClientEffects.js          # Client-only effects wrapper (cursor, scroll progress)
│   ├── DynamicBackground.js      # Day-based hero background image rotation
│   ├── FooterSocials.js          # Social media icon links (FB, IG, TikTok)
│   ├── GrabFooterButton.js       # Grab Food order CTA button
│   ├── Hero.js                   # Landing hero with animated tagline and CTAs
│   ├── IntegrityMonitor.js       # Admin system monitor tab (DB health, pipeline logs)
│   ├── Location.js               # Contact info, Google Maps embed, opening hours
│   ├── MenuCategories.js         # Auto-scrolling Swiper marquee of menu categories
│   ├── MenuItemModal.js          # Menu item detail modal (photo, description, price)
│   ├── Navbar.js                 # Responsive navigation with mobile drawer
│   ├── NewsletterAdmin.js        # Newsletter campaign composer and campaign tracker
│   ├── NewsletterModal.js        # VIP newsletter subscription modal
│   ├── Reserve.js                # Booking form (wheel pickers, Turnstile, suggestions)
│   ├── Reviews.js                # Customer testimonials carousel
│   ├── Salsas.js                 # Reverse-direction Swiper marquee of salsa cards
│   ├── ScrollProgress.js         # Thin progress bar at top of viewport
│   ├── SmoothScroll.js           # Lenis smooth scroll wrapper
│   ├── Specials.js               # Today's specials section
│   ├── SubscribersAdmin.js       # Admin subscriber counts (Total/Active/Unsubscribed), search, list
│   ├── VipFooterButton.js        # Floating VIP newsletter signup button
│   └── WheelPicker.js            # iOS-style drum picker (date / time / party size)
├── lib/
│   ├── menu-data.js              # Full restaurant menu (items, prices, images, categories)
│   └── supabase.js               # Supabase browser client (createBrowserClient from @supabase/ssr)
├── supabase/
│   ├── functions/
│   │   └── send-booking-email/   # Deno Edge Function: email + LINE + Google Sheets
│   ├── backend_specs.md          # Backend architecture reference
│   └── schema.sql                # Complete database schema (single source of truth)
├── proxy.js                      # Next.js 16 proxy — protects /admin/* routes server-side
├── .env.local                    # Environment variables (not committed)
├── jsconfig.json                 # Path aliases (@/ → root)
└── next.config.mjs               # Next.js config
```

---

## Notification Pipeline

When a booking is created or its status changes, a PostgreSQL trigger fires an async HTTP POST to a Supabase Edge Function, which distributes notifications across channels:

```
Booking INSERT/UPDATE
  → AFTER INSERT OR UPDATE trigger: on_booking_created
      → notify_booking_email() function
          → pg_net async HTTP POST to Edge Function
              → Resend API  → customer email (pending / confirmed)
              → LINE Push   → manager notification
              → Apps Script → Google Sheets row (confirmed bookings only)
```

- **Non-blocking**: `pg_net` makes the HTTP call asynchronously — the booking insert returns immediately.
- **Google Sheets**: Only syncs confirmed bookings to avoid polluting the sheet with unreviewed requests.
- **Edge Function**: TypeScript/Deno, deployed on Supabase's global edge network.
