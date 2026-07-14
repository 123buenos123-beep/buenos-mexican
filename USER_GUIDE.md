# Buenos Mexican Restaurant — User Guide

Complete guide for managing the Buenos Mexican website and admin system.

---

## Table of Contents

1. [Website Overview](#1-website-overview)
2. [Admin Panel Login](#2-admin-panel-login)
3. [Managing Bookings](#3-managing-bookings)
4. [Booking Capacity Settings](#4-booking-capacity-settings)
5. [Newsletter System](#5-newsletter-system)
6. [System Monitor](#6-system-monitor)
7. [Customer Booking Flow](#7-customer-booking-flow)
8. [Production Setup Checklist](#8-production-setup-checklist)
9. [Common Issues & Fixes](#9-common-issues--fixes)

---

## 1. Website Overview

The website has two parts:

| Part | URL | Who uses it |
|---|---|---|
| Public website | `buenosmexicanrestaurant.com` | Customers |
| Admin panel | `buenosmexicanrestaurant.com/admin` | Restaurant staff |

**Public pages:**
- **Homepage** — hero, menu categories, salsas, specials, reviews, booking form, location
- **Menu page** — full menu with photos, prices, and item details (`/menu`)

**Integrations running in the background:**
- **Resend** — sends booking confirmation/update/cancellation emails to customers
- **LINE** — sends new booking alerts to the manager's LINE account
- **Google Sheets** — logs confirmed bookings to a spreadsheet automatically
- **Cloudflare Turnstile** — protects the booking form from bots

---

## 2. Admin Panel Login

Go to: `buenosmexicanrestaurant.com/admin`

You will be redirected to the login page automatically if not signed in.

**Login credentials** — use the email and password set up in Supabase Auth (Dashboard → Authentication → Users).

Once logged in you will see four tabs:
- **Live Bookings** — manage all reservations
- **Newsletter** — compose and send marketing emails
- **Subscribers** — see subscriber counts (Total / Active / Unsubscribed) and search the list
- **System Monitor** — check integration health and logs

To sign out, click **Sign out** in the top-right corner.

> If you forget your password, reset it in Supabase Dashboard → Authentication → Users → click the user → Send password reset.

---

## 3. Managing Bookings

### Viewing Bookings

The **Live Bookings** tab shows all reservations in real time. New bookings appear instantly without refreshing.

**Filter options:**
- Click **All Time / Today** to switch between all bookings and today only
- Click the stat cards (Pending / Confirmed / Cancelled) to filter by status
- Use the search bar to find a customer by name, email, or phone

### Booking Statuses

| Status | Meaning |
|---|---|
| **Pending** | Customer submitted — awaiting staff confirmation |
| **Confirmed** | Staff confirmed — customer receives confirmation email |
| **Cancelled** | Booking cancelled — customer receives cancellation email |

### Actions on Each Booking

- **✓ Confirm** — marks the booking confirmed and triggers a confirmation email + Google Sheets sync
- **✕ Cancel** — marks it cancelled and sends a cancellation email to the customer
- **🗑 Delete** — permanently removes the booking (requires a second click to confirm)

> Confirming a booking is what triggers the Google Sheets entry. Do not skip this step if you want the spreadsheet to stay up to date.

### Sound Alert

A chime plays automatically when a new booking arrives, so staff know without watching the screen.

---

## 4. Booking Capacity Settings

At the top of the Live Bookings tab there is a **Max bookings per time slot** setting.

This is the **daily cap** — the maximum number of bookings allowed on any single day (across all time slots combined).

**To change it:**
1. Click **✏️ Edit**
2. Type the new number (1–500)
3. Click **Save** or press Enter

When a day reaches the cap, customers who try to book will be shown alternative available dates automatically.

**Default value:** 5 bookings per day.

> Adjust this before busy seasons (holidays, events) or when you want to limit walk-ins.

---

## 5. Newsletter System

### Composing and Sending

1. Go to **Newsletter** tab → **Compose & Send**
2. Enter a **Subject line** (e.g. "🎉 Secret Menu Item This Weekend!")
3. Write the email body using the rich text editor
   - Use the toolbar for bold, italic, headings, colours, lists, etc.
   - To add an image: click the **image icon** in the toolbar → paste a direct image URL (Imgur, Google Drive, Unsplash, etc.)
4. Click **Email Preview** to see exactly how the email will look to subscribers
5. Click **Send Blast** → confirm the popup

The email is sent to **all active subscribers** at a throttled rate (about 1.6 emails/second, to stay under Resend's limit), so a large list takes a few minutes to finish. A branded header and unsubscribe link are added automatically to every email.

> Always preview before sending — you cannot unsend a blast.

### Tracking Delivery

After sending, the tab switches to **Tracking & Analytics** automatically.

You can see:
- **Total Sent** — number of recipients
- **Delivered** — confirmed by Resend (updated in real time via webhook)
- **Failed / Bounced** — emails that could not be delivered
- A table of failed/bounced addresses with the reason

Subscribers who hard-bounce (invalid email address, domain doesn't exist) are **automatically marked inactive** and will not receive future blasts.

### Managing Subscribers

Subscribers are added when customers sign up via the VIP button on the website. They can unsubscribe at any time via the link at the bottom of every newsletter email.

To see how many subscribers you have, go to the **Subscribers** tab. It shows:
- **Total / Active / Unsubscribed** counts (click a card to filter the list below)
- A searchable list with each subscriber's name, email, sign-up date, and status

For anything beyond viewing (e.g. manually editing a row), use Supabase Dashboard → Table Editor → `subscribers`.

---

## 6. System Monitor

The **System Monitor** tab shows the health of all integrations.

### Service Status Cards

| Card | What it checks |
|---|---|
| **Supabase DB** | Whether the database is reachable |
| **WebSocket** | Whether real-time updates are connected |
| **LINE API Gateway** | Whether LINE credentials are configured |

### Booking Pipeline Log

Every booking attempt (successful or not) is logged here with three pipeline steps:

| Column | Meaning |
|---|---|
| DB Status | Was the booking saved to the database? |
| Realtime Sync | Did the live dashboard update? |
| LINE Status | Was the manager notified via LINE? |

Common status values:
- `✅ 201 Created` — booking saved successfully
- `❌ Security Check Failed` — Turnstile CAPTCHA failed
- `❌ 409 Slot Conflict` — time slot was full
- `✅ Sent (200 OK)` — LINE notification delivered
- `❌ Failed (401 Bad Token)` — LINE token is invalid or expired

Click **Refresh** to reload all logs. Click **Clear Logs** to wipe the log table (useful for a clean start — does not affect actual bookings).

### VIP Sign-up Log

Shows every newsletter subscription attempt, including duplicates caught (409 = email already subscribed).

### Email Blast Queue

History of all newsletter campaigns with their send status (sending / completed).

---

## 7. Customer Booking Flow

This is what happens when a customer books a table on the website:

1. Customer fills in name, email, phone, selects date/time/party size
2. Passes Cloudflare Turnstile CAPTCHA
3. Reviews and confirms the booking
4. **Immediately:** booking saved to database with status `pending`
5. **Immediately:** manager receives a LINE notification
6. **Immediately:** customer receives a "Booking Received" email
7. **When staff confirm in admin:** customer receives a "Booking Confirmed" email + booking logged to Google Sheets

**What customers cannot do:**
- Book on Mondays (closed — blocked in both the date picker and the server)
- Book a date in the past
- Submit without completing the CAPTCHA
- Submit the same email more than 3 times in 5 minutes

### Customer Cancellations

Every booking email (received & confirmed) contains a **Cancel Reservation** button.

1. Customer clicks the button in their email
2. Lands on a confirmation page showing their booking details
3. Clicks **Confirm Cancellation**
4. The booking is marked `cancelled` — the customer gets a cancellation email and the manager gets a LINE alert automatically

The cancelled booking appears in the admin dashboard in real time (moves to the Cancelled filter). No staff action is required, but the freed-up slot immediately becomes available for other customers. Past bookings and already-cancelled bookings cannot be cancelled through the link.

---

## 8. Production Setup Checklist

Before going live, make sure these are configured in **Vercel → Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL          = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = <anon key from Supabase>
SUPABASE_SERVICE_ROLE_KEY         = <service role key from Supabase>
NEXT_PUBLIC_SITE_URL              = https://buenosmexicanrestaurant.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY    = <from Cloudflare Turnstile dashboard>
TURNSTILE_SECRET_KEY              = <from Cloudflare Turnstile dashboard>
RESEND_API_KEY                    = <from resend.com>
RESEND_FROM_EMAIL                 = Buenos Mexican <newsletter@buenosmexicanrestaurant.com>   # must be a Resend-verified domain
LINE_CHANNEL_ACCESS_TOKEN         = <from LINE Developers console>
LINE_MANAGER_USER_ID              = <LINE user ID of the manager>
GOOGLE_SHEET_WEBHOOK_URL          = <Google Apps Script deployment URL>
```

And in **Supabase → Edge Functions → Secrets**:
```
RESEND_API_KEY
LINE_CHANNEL_ACCESS_TOKEN
LINE_MANAGER_USER_ID
GOOGLE_SHEET_WEBHOOK_URL
```

> Don't add `SUPABASE_SERVICE_ROLE_KEY` here — Supabase reserves that name and injects it (along with `SUPABASE_URL` and `SUPABASE_ANON_KEY`) into every Edge Function automatically. Trying to set it manually will be rejected.

After any environment variable change in Vercel, redeploy for the changes to take effect.

---

## 9. Common Issues & Fixes

### Booking emails not sending
- Check that `RESEND_API_KEY` is set in Supabase Edge Function secrets
- Go to Supabase → Edge Functions → `send-booking-email` → Logs to see the error
- Verify the Resend sending domain is verified at resend.com/domains

### Newsletter only reaches my own email (not real subscribers)
- Resend will not deliver to other addresses until you send from a **verified domain**. Verify your domain at resend.com/domains, then set `RESEND_FROM_EMAIL` in Vercel to an address on that domain (e.g. `newsletter@buenosmexicanrestaurant.com`) and redeploy.
- Make sure Vercel's `RESEND_API_KEY` belongs to the **same** Resend account where the domain is verified (the account that sends the booking emails).

### LINE notifications not arriving
- Check `LINE_CHANNEL_ACCESS_TOKEN` is valid and not expired
- The System Monitor → Booking Pipeline Log will show `❌ Failed (401 Bad Token)` if the token is wrong
- Regenerate the token in LINE Developers Console if needed

### Google Sheets not updating
- Google Sheets only syncs when a booking is **Confirmed** (not on pending)
- Check Supabase Edge Function logs for `[Google Sheets]` entries
- The manager will receive a LINE alert if a sync fails with instructions to add the row manually

### Customers can't complete the booking form (CAPTCHA fails)
- Verify `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are real keys (not test keys) in Vercel
- Check that the domain is added to the Turnstile site in Cloudflare dashboard

### Unsubscribe links in emails go to localhost
- This is now prevented in code — newsletter links are built from the live request host and never emit a localhost URL. If you still see it, confirm the blast was sent from the live site (not a local `npm run dev`), and set `NEXT_PUBLIC_SITE_URL=https://buenosmexicanrestaurant.com` in Vercel as a backstop.

### Admin panel shows "Connection Lost"
- Usually a temporary network issue — the panel reconnects automatically
- If persistent, check Supabase project status at status.supabase.com

### New booking doesn't appear in dashboard
- The dashboard uses real-time WebSocket — check the **Live** indicator in the top-right is green
- If it shows **Offline**, refresh the page to reconnect

---

*Buenos Mexican Restaurant — buenosmexicanrestaurant.com*
