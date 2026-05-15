import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = 'Buenos Mexican Cuisine <onboarding@resend.dev>';

serve(async (req) => {
  try {
    const payload = await req.json();
    const booking = payload.record;

    if (!booking) {
      return new Response(JSON.stringify({ error: 'No booking record found' }), { status: 400 });
    }

    const { name, email, date, time, party_size } = booking;

    // Format date
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Format time (HH:MM from "HH:MM:SS")
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const formattedTime = `${h12}:${minutes} ${ampm}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmed — Buenos Mexican Cuisine</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4ecd8;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:600px;margin:40px auto;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(62,39,35,0.18);">

          <!-- Header -->
          <div style="background-color:#3E2723;padding:36px 40px 28px;text-align:center;">
            <div style="font-size:1.8rem;color:#ffffff;letter-spacing:1px;font-weight:900;">
              Buenos Mexican Cuisine
            </div>
            <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:0.78rem;letter-spacing:2px;text-transform:uppercase;">Authentic Mexican Experience</p>
          </div>

          <!-- Green Banner -->
          <div style="background-color:#33691E;padding:14px 40px;text-align:center;">
            <p style="color:#ffffff;margin:0;font-weight:700;font-size:1rem;letter-spacing:0.5px;">
              ✅ &nbsp; Your Table is Confirmed!
            </p>
          </div>

          <!-- Body -->
          <div style="background:#ffffff;padding:40px;">
            <p style="font-size:1.15rem;color:#3E2723;margin:0 0 6px;">
              Hello, <strong>${name}</strong>! 🌮
            </p>
            <p style="color:#5D4037;line-height:1.75;margin:0 0 32px;font-size:0.97rem;">
              Thank you for choosing <strong>Buenos Mexican Cuisine</strong>. Your reservation is all set — we can't wait to host you for an amazing meal!
            </p>

            <!-- Booking Details Card -->
            <div style="background:#f4ecd8;border-radius:12px;padding:28px;border-left:5px solid #8B1C1C;margin-bottom:28px;">
              <p style="font-size:1rem;font-weight:700;color:#8B1C1C;margin:0 0 18px;text-transform:uppercase;letter-spacing:1px;">📋 Reservation Details</p>
              <table style="width:100%;border-collapse:collapse;">
                <tr style="border-bottom:1px dashed #c9b99a;">
                  <td style="padding:11px 0;color:#795548;font-size:0.88rem;font-weight:600;">👤 Guest Name</td>
                  <td style="padding:11px 0;color:#3E2723;font-weight:700;text-align:right;">${name}</td>
                </tr>
                <tr style="border-bottom:1px dashed #c9b99a;">
                  <td style="padding:11px 0;color:#795548;font-size:0.88rem;font-weight:600;">📅 Date</td>
                  <td style="padding:11px 0;color:#3E2723;font-weight:700;text-align:right;">${formattedDate}</td>
                </tr>
                <tr style="border-bottom:1px dashed #c9b99a;">
                  <td style="padding:11px 0;color:#795548;font-size:0.88rem;font-weight:600;">🕐 Time</td>
                  <td style="padding:11px 0;color:#3E2723;font-weight:700;text-align:right;">${formattedTime}</td>
                </tr>
                <tr>
                  <td style="padding:11px 0;color:#795548;font-size:0.88rem;font-weight:600;">👥 Party Size</td>
                  <td style="padding:11px 0;color:#3E2723;font-weight:700;text-align:right;">${party_size} ${party_size === '1' ? 'Person' : 'People'}</td>
                </tr>
              </table>
            </div>

            <!-- Note Box -->
            <div style="background:#fffde7;border-radius:8px;padding:16px 20px;border:1px dashed #f9a825;margin-bottom:32px;">
              <p style="color:#5D4037;margin:0;font-size:0.875rem;line-height:1.65;">
                📍 <strong>Need to cancel or make changes?</strong><br>
                Simply reply to this email and our team will assist you right away.
              </p>
            </div>

            <!-- Daily Specials Reminder -->
            <div style="background:#f4ecd8;border-radius:10px;padding:20px 24px;border:1px dashed #795548;margin-bottom:32px;">
              <p style="color:#3E2723;margin:0 0 10px;font-weight:700;font-size:0.95rem;">🌶️ Don't Miss Our Daily Specials!</p>
              <p style="color:#5D4037;margin:0;font-size:0.85rem;line-height:1.6;">
                Tue: Margarita Madness &nbsp;·&nbsp; Wed: Nacho Night &nbsp;·&nbsp; Thu: Taco Discount<br>
                Fri: Fajita Fiesta &nbsp;·&nbsp; Sat: Burrito Bash &nbsp;·&nbsp; Sun: Quesadilla Chill
              </p>
            </div>

            <p style="color:#5D4037;line-height:1.75;margin:0;font-size:0.97rem;">
              See you soon,<br>
              <strong style="color:#3E2723;font-size:1rem;">The Buenos Mexican Cuisine Team</strong> 🌶️
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f4ecd8;padding:22px 40px;text-align:center;border-top:2px dashed #795548;">
            <p style="color:#795548;font-size:0.78rem;margin:0;line-height:1.6;">
              © 2026 Buenos Mexican Cuisine · All rights reserved<br>
              <span style="opacity:0.7;">This email was sent to ${email} because you made a booking with us.</span>
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: `✅ Booking Confirmed — ${formattedDate} at ${formattedTime} | Buenos Mexican Cuisine`,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend API error:', data);
      return new Response(JSON.stringify({ error: data }), { status: res.status });
    }

    console.log('Email sent successfully:', data.id);
    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
