// @ts-nocheck
/// <reference lib="deno.ns" />

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = 'Buenos Mexican Cuisine <onboarding@resend.dev>';

// LINE Config
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
const LINE_MANAGER_USER_ID = Deno.env.get('LINE_MANAGER_USER_ID');

// Google Sheets Config
const GOOGLE_SHEET_WEBHOOK_URL = Deno.env.get('GOOGLE_SHEET_WEBHOOK_URL');

// ─── Timeout helper — aborts fetch after timeoutMs to prevent Deno worker kill ───
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

interface Booking {
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  party_size: string | number;
  status: string;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  record: Booking;
  old_record?: Booking;
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const booking = payload.record;

    if (!booking) {
      return new Response(JSON.stringify({ error: 'No booking record found' }), { status: 400 });
    }

    const { name, email, phone, date, time, party_size, status } = booking;
    const isUpdate = payload.type === 'UPDATE';

    // Format date
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });

    // Format time (HH:MM from "HH:MM:SS")
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const formattedTime = `${h12}:${minutes} ${ampm}`;

    // Define content based on status
    let subject = '';
    let statusHeadline = '';
    let statusIcon = '';
    let statusColor = '';
    let message = '';

    if (status === 'confirmed') {
      subject = `✅ Booking Confirmed — ${formattedDate} at ${formattedTime}`;
      statusHeadline = 'Your Table is Confirmed!';
      statusIcon = '✅';
      statusColor = '#33691E';
      message = "Your reservation is all set — we can't wait to host you!";
    } else if (status === 'cancelled') {
      subject = `❌ Booking Cancelled — Buenos Mexican Cuisine`;
      statusHeadline = 'Reservation Cancelled';
      statusIcon = '❌';
      statusColor = '#8B1C1C';
      message = "We're sorry to hear you can't make it. Your reservation has been successfully cancelled.";
    } else {
      subject = `🕒 Booking Received — ${formattedDate} at ${formattedTime}`;
      statusHeadline = 'Reservation Received';
      statusIcon = '🕒';
      statusColor = '#f97316';
      message = "We've received your booking request! Our team will review it and confirm your table shortly.";
    }

    // Customer self-service cancel link — shown on pending/confirmed emails only,
    // never on a cancellation email. The booking UUID acts as the secret token.
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://buenosmexican.com';
    const cancelSection = status !== 'cancelled' ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center">
                    <a href="${SITE_URL}/api/cancel-booking?id=${booking.id}" target="_blank" style="display:inline-block;padding:12px 30px;background:#FFFFFF;color:#8B1C1C;border:1.5px solid #E0C9A6;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">Cancel Reservation</a>
                  </td>
                </tr>
              </table>` : '';

    const emailHtml = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${statusHeadline} — Buenos Mexican Cuisine</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .content-padding { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F4ECD8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${statusHeadline} — Buenos Mexican Cuisine</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4ECD8;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(62,39,35,0.12);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#3E2723 0%,#5C2317 50%,#4A2A1F 100%);padding:36px 40px 32px;text-align:center;">
              <div style="height:3px;background:linear-gradient(90deg,transparent,#D4AF37,#B87333,#D4AF37,transparent);border-radius:2px;margin-bottom:20px;"></div>
              <h1 style="margin:0 0 6px;font-size:28px;font-weight:900;color:#FDF6EE;letter-spacing:1.5px;text-transform:uppercase;line-height:1.2;">Buenos Mexican</h1>
              <p style="margin:0 0 20px;font-size:13px;font-weight:600;color:#D4AF37;letter-spacing:3px;text-transform:uppercase;">✦ &nbsp; Authentic Cuisine &nbsp; ✦</p>
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,175,55,0.3),transparent);"></div>
            </td>
          </tr>

          <!-- STATUS BANNER -->
          <tr>
            <td style="background-color:${statusColor};padding:14px 40px;text-align:center;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${statusIcon} &nbsp; ${statusHeadline}</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td class="content-padding" style="background-color:#FFFFFF;padding:40px;">
              <p style="font-size:18px;color:#3E2723;margin:0 0 8px;font-weight:700;">Hello, ${name}! 🌮</p>
              <p style="font-size:15px;color:#5D4037;line-height:1.75;margin:0 0 32px;">${message}</p>

              <!-- Booking Details Card -->
              <div style="background:#F4ECD8;border-radius:12px;padding:28px;border-left:4px solid #D4AF37;margin-bottom:28px;">
                <p style="font-size:11px;font-weight:800;color:#8C7365;margin:0 0 18px;text-transform:uppercase;letter-spacing:2px;">📋 &nbsp; Reservation Details</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(139,99,77,0.12);font-size:14px;color:#8C7365;font-weight:600;">👤 Name</td>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(139,99,77,0.12);font-size:14px;color:#3E2723;font-weight:700;text-align:right;">${name}</td>
                  </tr>
                  ${phone ? `<tr>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(139,99,77,0.12);font-size:14px;color:#8C7365;font-weight:600;">📞 Phone</td>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(139,99,77,0.12);font-size:14px;color:#3E2723;font-weight:700;text-align:right;">${phone}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(139,99,77,0.12);font-size:14px;color:#8C7365;font-weight:600;">📅 Date</td>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(139,99,77,0.12);font-size:14px;color:#3E2723;font-weight:700;text-align:right;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(139,99,77,0.12);font-size:14px;color:#8C7365;font-weight:600;">🕐 Time</td>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(139,99,77,0.12);font-size:14px;color:#3E2723;font-weight:700;text-align:right;">${formattedTime}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(139,99,77,0.12);font-size:14px;color:#8C7365;font-weight:600;">👥 Guests</td>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(139,99,77,0.12);font-size:14px;color:#3E2723;font-weight:700;text-align:right;">${party_size}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;font-size:14px;color:#8C7365;font-weight:600;">📍 Status</td>
                    <td style="padding:10px 0;font-size:14px;font-weight:800;color:${statusColor};text-align:right;">${status.toUpperCase()}</td>
                  </tr>
                </table>
              </div>
${cancelSection}
              <p style="font-size:13px;color:#9C8577;line-height:1.6;margin:0;text-align:center;">
                Questions? Call us or visit us at Jomtien Complex, Pattaya.
              </p>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="background-color:#FFFFFF;padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#EDE6DA,transparent);"></div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#FFFFFF;padding:28px 40px 20px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="https://www.facebook.com/profile.php?id=61571573732880" target="_blank" style="text-decoration:none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="28" height="28" alt="Facebook" style="display:inline-block;border:0;">
                    </a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://www.instagram.com/buenosmexican" target="_blank" style="text-decoration:none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="28" height="28" alt="Instagram" style="display:inline-block;border:0;">
                    </a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://www.tiktok.com/@buenosmexican" target="_blank" style="text-decoration:none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" width="28" height="28" alt="TikTok" style="display:inline-block;border:0;">
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;font-size:12px;color:#8C7365;font-weight:600;">Buenos Mexican Cuisine</p>
              <p style="margin:0;font-size:11px;color:#B09080;line-height:1.5;">Jomtien Complex, 413/9-10 Thappraya Rd, Pattaya City, Chon Buri 20150</p>
            </td>
          </tr>

          <!-- COPYRIGHT BAR -->
          <tr>
            <td style="background-color:#FAF7F2;padding:18px 40px;text-align:center;border-top:1px solid #EDE6DA;">
              <p style="margin:0;font-size:10px;color:#C4B5A8;">© ${new Date().getFullYear()} Buenos Mexican Cuisine. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

    // ─── Helper: Send LINE alert to manager for integration failures ───
    const sendLineAlert = async (alertMessage: string) => {
      if (!LINE_CHANNEL_ACCESS_TOKEN || !LINE_MANAGER_USER_ID) return;
      try {
        await fetchWithTimeout(
          'https://api.line.me/v2/bot/message/push',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
              to: LINE_MANAGER_USER_ID,
              messages: [{ type: 'text', text: alertMessage }],
            }),
          },
          4000
        );
      } catch (alertErr) {
        console.error('[Alert] Failed to send LINE alert:', alertErr);
      }
    };

    // ─── Env vars for DB update ───
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // ─── Build LINE message ───
    const lineMessage = isUpdate
      ? `🔄 Booking Updated!\n\n👤 Name: ${name}\n📍 New Status: ${status.toUpperCase()}\n📅 Date: ${date}\n🕐 Time: ${formattedTime}`
      : `🔔 New Booking Alert!\n\n👤 Name: ${name}\n📞 Phone: ${phone || '—'}\n📅 Date: ${date}\n🕐 Time: ${formattedTime}\n👥 Guests: ${party_size}\n📧 Email: ${email}`;

    // ═══════════════════════════════════════════════════════════════════
    // Promise.all — Run all integrations concurrently, each isolated
    // DB PATCH is in a finally block — guaranteed to run even on timeout
    // ═══════════════════════════════════════════════════════════════════
    let lineStatus = '➖ Skipped';
    let results: any[] = [];

    try {
      results = await Promise.all([

        // ── 1. Send Email via Resend ──────────────────────────────────
        (async () => {
          try {
            const res = await fetchWithTimeout(
              'https://api.resend.com/emails',
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${RESEND_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: FROM_EMAIL,
                  to: email,
                  subject: subject,
                  html: emailHtml,
                }),
              },
              4000
            );
            if (!res.ok) {
              const errBody = await res.text().catch(() => '');
              console.error(`[Email] Send failed (${res.status}): ${errBody}`);
              return { service: 'email', success: false, error: `HTTP ${res.status}` };
            }
            console.log(`[Email] ✅ Sent to ${email}`);
            return { service: 'email', success: true };
          } catch (err) {
            if (err.name === 'AbortError') {
              console.error('[Email] Timeout after 4s');
              return { service: 'email', success: false, error: 'Timeout after 4s' };
            }
            console.error('[Email] Exception:', err);
            return { service: 'email', success: false, error: err.message || String(err) };
          }
        })(),

        // ── 2. Send LINE Notification ─────────────────────────────────
        (async () => {
          if (!LINE_CHANNEL_ACCESS_TOKEN || !LINE_MANAGER_USER_ID) {
            lineStatus = '❌ Failed (401 Bad Token)';
            return { service: 'line', success: false, error: 'Missing credentials' };
          }
          try {
            const res = await fetchWithTimeout(
              'https://api.line.me/v2/bot/message/push',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
                },
                body: JSON.stringify({
                  to: LINE_MANAGER_USER_ID,
                  messages: [{ type: 'text', text: lineMessage }],
                }),
              },
              4000
            );
            if (res.ok) {
              lineStatus = '✅ Sent (200 OK)';
              console.log('[LINE] ✅ Notification sent');
              return { service: 'line', success: true };
            } else {
              const errData = await res.json().catch(() => ({}));
              lineStatus = `❌ Failed (${res.status} ${errData.message || 'Bad Token'})`;
              console.error(`[LINE] Failed (${res.status}):`, errData);
              return { service: 'line', success: false, error: `HTTP ${res.status}` };
            }
          } catch (err) {
            if (err.name === 'AbortError') {
              lineStatus = '❌ Failed (Timeout 4s)';
              console.error('[LINE] Timeout after 4s');
              return { service: 'line', success: false, error: 'Timeout after 4s' };
            }
            console.error('[LINE] Error Name:', err?.name || 'N/A');
            console.error('[LINE] Error Message:', err?.message || String(err));
            console.error('[LINE] Error Cause:', err?.cause || 'N/A');
            lineStatus = `❌ Failed (${err.message || String(err)})`;
            return { service: 'line', success: false, error: err.message || String(err) };
          }
        })(),

        // ── 3. Sync to Google Sheets (confirmed bookings only) ────────
        (async () => {
          if (!GOOGLE_SHEET_WEBHOOK_URL || status !== 'confirmed') {
            return { service: 'sheets', success: true, skipped: true };
          }
          try {
            const res = await fetchWithTimeout(
              GOOGLE_SHEET_WEBHOOK_URL,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  timestamp: new Date().toISOString(),
                  operation: 'INSERT',
                  ...booking,
                  formatted_time: formattedTime,
                  formatted_date: formattedDate,
                }),
              },
              4000
            );
            if (!res.ok) {
              const errBody = await res.text().catch(() => '');
              console.error(`[Google Sheets] Sync failed (${res.status}): ${errBody}`);
              await sendLineAlert(
                `⚠️ Google Sheets Sync Failed\n\n👤 Guest: ${name}\n📅 Date: ${formattedDate}\n🕐 Time: ${formattedTime}\n👥 Guests: ${party_size}\n❌ Error: HTTP ${res.status}\n⏰ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}\n\n📌 Action: Please add this booking to the spreadsheet manually.`
              );
              return { service: 'sheets', success: false, error: `HTTP ${res.status}` };
            }
            console.log('[Google Sheets] ✅ Synced');
            return { service: 'sheets', success: true };
          } catch (err) {
            if (err.name === 'AbortError') {
              console.error('[Google Sheets] Timeout after 4s');
              await sendLineAlert(
                `⚠️ Google Sheets Sync Timed Out\n\n👤 Guest: ${name}\n📅 Date: ${formattedDate}\n🕐 Time: ${formattedTime}\n👥 Guests: ${party_size}\n❌ Error: Timeout after 4s\n⏰ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}\n\n📌 Action: Please add this booking to the spreadsheet manually.`
              );
              return { service: 'sheets', success: false, error: 'Timeout after 4s' };
            }
            console.error('[Google Sheets] Exception:', err);
            await sendLineAlert(
              `⚠️ Google Sheets Sync Exception\n\n👤 Guest: ${name}\n📅 Date: ${formattedDate}\n🕐 Time: ${formattedTime}\n👥 Guests: ${party_size}\n❌ Error: ${err.message || String(err)}\n⏰ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}\n\n📌 Action: Please add this booking to the spreadsheet manually.`
            );
            return { service: 'sheets', success: false, error: err.message || String(err) };
          }
        })(),
      ]);

      console.log('[Booking Pipeline] Complete:', JSON.stringify(results.map(r => `${r.service}: ${r.success ? '✅' : '❌'}`)));

    } finally {
      // ── 4. Always update booking_attempts — guaranteed even if integrations time out ──
      // Retry loop: the API route inserts booking_attempts AFTER the RPC returns, but the
      // DB trigger fires the edge function during the RPC — so the row may not exist yet.
      // We retry up to 6 times (~3s window) until PostgREST confirms a row was matched.
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && booking.id) {
        let patched = false;
        for (let attempt = 0; attempt < 6 && !patched; attempt++) {
          if (attempt > 0) {
            await new Promise(r => setTimeout(r, 500));
          }
          try {
            const res = await fetchWithTimeout(
              `${SUPABASE_URL}/rest/v1/booking_attempts?booking_id=eq.${booking.id}`,
              {
                method: 'PATCH',
                headers: {
                  'apikey': SUPABASE_SERVICE_ROLE_KEY,
                  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation',
                },
                body: JSON.stringify({ line_notification: lineStatus }),
              },
              5000
            );
            if (res.ok) {
              const rows = await res.json().catch(() => []);
              if (Array.isArray(rows) && rows.length > 0) {
                console.log(`[DB Update] ✅ booking_attempts updated (attempt ${attempt + 1}) with: ${lineStatus}`);
                patched = true;
              } else {
                console.warn(`[DB Update] No rows matched on attempt ${attempt + 1} — row not inserted yet, retrying...`);
              }
            } else {
              const errBody = await res.text().catch(() => '');
              console.error(`[DB Update] Failed (${res.status}): ${errBody}`);
            }
          } catch (err) {
            console.error(`[DB Update] Exception (attempt ${attempt + 1}):`, err.name === 'AbortError' ? 'Timeout after 5s' : err);
          }
        }
        if (!patched) {
          console.error(`[DB Update] ❌ Could not patch booking_attempts after 6 attempts for booking_id=${booking.id}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
