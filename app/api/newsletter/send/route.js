import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ─── Universal Responsive Image Normaliser ──────────────────────────
// Targets every <img> in the composed body and forces email-safe styles.
// Also strips width/height HTML attributes — Outlook ignores CSS for these
// and would use the raw pixel values, breaking responsiveness.
function makeImagesResponsive(html) {
  return html.replace(/<img([^>]*?)(\s*\/)?>/gi, (_, attrs) => {
    // Strip explicit width/height attributes (pixel values or percentages)
    let a = attrs
      .replace(/\bwidth\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\bheight\s*=\s*["'][^"']*["']/gi, '');

    // Extract and remove any existing style so we can rewrite it cleanly
    const existingStyle = (a.match(/\bstyle\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    a = a.replace(/\bstyle\s*=\s*["'][^"']*["']/gi, '');

    // Append responsive overrides last — last declaration wins in the cascade
    const base = existingStyle ? existingStyle.replace(/;\s*$/, '') + ';' : '';
    const responsive = 'display:block;max-width:100%;height:auto;border:0;';

    return `<img${a} style="${base}${responsive}">`;
  });
}

// ─── Branded HTML Email Template ────────────────────────────────────
function buildEmailHtml(bodyContent, subscriberEmail, siteUrl) {
  // Normalise all images before injecting into the template
  const safeBody = makeImagesResponsive(bodyContent);
  const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Buenos Mexican Cuisine</title>
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
      .content-padding { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4ECD8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

  <!-- Preheader (hidden text for inbox preview) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Fresh news from Buenos Mexican Cuisine — authentic flavors, exclusive deals & more.
  </div>

  <!-- Full-width wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F4ECD8;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Email Container (600px) -->
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(62,39,35,0.12);">

          <!-- ═══ HEADER ═══ -->
          <tr>
            <td style="background: linear-gradient(135deg, #3E2723 0%, #5C2317 50%, #4A2A1F 100%); padding: 36px 40px 32px; text-align: center;">
              <!-- Decorative top border -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom: 8px;">
                    <div style="height: 3px; background: linear-gradient(90deg, transparent, #D4AF37, #B87333, #D4AF37, transparent); border-radius: 2px;"></div>
                  </td>
                </tr>
              </table>
              <!-- Restaurant Name -->
              <h1 style="margin: 16px 0 6px; font-size: 28px; font-weight: 900; color: #FDF6EE; letter-spacing: 1.5px; text-transform: uppercase; line-height: 1.2;">
                Buenos Mexican
              </h1>
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #D4AF37; letter-spacing: 3px; text-transform: uppercase;">
                ✦ &nbsp; Authentic Cuisine &nbsp; ✦
              </p>
              <!-- Decorative bottom border -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-top: 20px;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent);"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ BODY CONTENT ═══ -->
          <tr>
            <td class="content-padding" style="background-color: #FFFFFF; padding: 40px 40px 36px;">
              <div style="font-size: 15px; line-height: 1.7; color: #3E2723; word-wrap: break-word;">
                ${safeBody}
              </div>
            </td>
          </tr>

          <!-- ═══ DIVIDER ═══ -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, #EDE6DA, transparent);"></div>
            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 28px 40px 20px; text-align: center;">
              <!-- Social Icons Row -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 20px;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="https://www.facebook.com/profile.php?id=61571573732880" target="_blank" title="Facebook" style="text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="32" height="32" alt="Facebook" style="display: inline-block; border: 0;">
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="https://www.instagram.com/buenosmexican" target="_blank" title="Instagram" style="text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="32" height="32" alt="Instagram" style="display: inline-block; border: 0;">
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="https://www.tiktok.com/@buenosmexican" target="_blank" title="TikTok" style="text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" width="32" height="32" alt="TikTok" style="display: inline-block; border: 0;">
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Address -->
              <p style="margin: 0 0 6px; font-size: 12px; color: #8C7365; font-weight: 600;">
                Buenos Mexican Cuisine
              </p>
              <p style="margin: 0 0 20px; font-size: 11px; color: #B09080; line-height: 1.5;">
                Jomtien Complex, 413/9-10 Thappraya Rd, Pattaya City, Chon Buri 20150
              </p>
            </td>
          </tr>

          <!-- ═══ UNSUBSCRIBE BAR ═══ -->
          <tr>
            <td style="background-color: #FAF7F2; padding: 18px 40px; text-align: center; border-top: 1px solid #EDE6DA;">
              <p style="margin: 0; font-size: 11px; color: #9C8577; line-height: 1.5;">
                You are receiving this email because you subscribed to newsletters from Buenos Mexican Cuisine.
                <br>
                <a href="${unsubscribeUrl}" style="color: #B87333; text-decoration: underline; font-weight: 600;">Unsubscribe here</a>
              </p>
              <p style="margin: 10px 0 0; font-size: 10px; color: #C4B5A8;">
                © ${new Date().getFullYear()} Buenos Mexican Cuisine. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email Container -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Throttle helper: wait N ms ─────────────────────────────────────
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Main Handler ───────────────────────────────────────────────────
export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('CRITICAL: Supabase URL or Anon Key is missing from environment variables!');
      return NextResponse.json({ error: 'Database environment variables are not configured.' }, { status: 500 });
    }

    // Verify the caller is an authenticated admin
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, htmlContent } = await request.json();

    if (!subject || !htmlContent) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 });
    }

    // 1. Fetch all active subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select('email, name')
      .eq('is_active', true);

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json({ error: `Database error: ${fetchError.message || 'Unknown error'}` }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: 'No active subscribers found.' }, { status: 404 });
    }

    // 2. Create the Email Blast campaign record
    const { data: blast, error: blastError } = await supabase
      .from('email_blasts')
      .insert([{
        subject,
        html_content: htmlContent,
        total_sent: subscribers.length,
        sent_count: 0,
        delivered_count: 0,
        failed_count: 0,
        status: 'sending'
      }])
      .select()
      .single();

    if (blastError || !blast) {
      console.error('Failed to create email_blasts record:', blastError);
      return NextResponse.json({
        error: `Database error: Failed to initialize campaign tracking. Reason: ${blastError?.message || 'Unknown database error'}`
      }, { status: 500 });
    }

    // 3. Throttled Queue — send ~5 emails/sec (200ms between each)
    const THROTTLE_DELAY_MS = 200;    // 200ms = ~5 emails/sec
    const DB_UPDATE_INTERVAL = 5;     // Update blast progress in DB every 5 emails
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buenosmexicanrestaurant.com';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Buenos Mexican <onboarding@resend.dev>';

    let totalSentCount = 0;
    let totalFailedCount = 0;
    const emailLogsBatch = [];        // Buffer logs to batch-insert

    console.log(`[Newsletter] Starting throttled send: ${subscribers.length} subscribers @ ~5/sec`);

    for (let i = 0; i < subscribers.length; i++) {
      const sub = subscribers[i];

      // Build branded HTML for this subscriber
      const fullHtml = buildEmailHtml(htmlContent, sub.email, siteUrl);

      try {
        const { data: sendData, error: sendError } = await resend.emails.send({
          from: fromEmail,
          to: [sub.email],
          subject: subject,
          html: fullHtml,
        });

        if (sendError) {
          console.error(`[Newsletter] Failed to send to ${sub.email}:`, sendError);
          totalFailedCount++;
          emailLogsBatch.push({
            blast_id: blast.id,
            recipient_email: sub.email,
            resend_id: null,
            status: 'failed',
            error_message: sendError.message || 'Resend API rejection',
          });
        } else {
          totalSentCount++;
          emailLogsBatch.push({
            blast_id: blast.id,
            recipient_email: sub.email,
            resend_id: sendData?.id || null,
            status: 'sent',
          });
        }
      } catch (err) {
        console.error(`[Newsletter] Exception sending to ${sub.email}:`, err);
        totalFailedCount++;
        emailLogsBatch.push({
          blast_id: blast.id,
          recipient_email: sub.email,
          resend_id: null,
          status: 'failed',
          error_message: err?.message || 'Unexpected send error',
        });
      }

      // Batch-flush logs & update progress every DB_UPDATE_INTERVAL emails
      const processed = i + 1;
      if (processed % DB_UPDATE_INTERVAL === 0 || processed === subscribers.length) {
        // Insert accumulated logs
        if (emailLogsBatch.length > 0) {
          await supabase.from('email_logs').insert(emailLogsBatch);
          emailLogsBatch.length = 0; // clear buffer
        }

        // Update campaign progress counters
        await supabase
          .from('email_blasts')
          .update({
            sent_count: totalSentCount + totalFailedCount,
            failed_count: totalFailedCount,
          })
          .eq('id', blast.id);

        console.log(`[Newsletter] Progress: ${processed}/${subscribers.length} (sent: ${totalSentCount}, failed: ${totalFailedCount})`);
      }

      // Throttle — wait before sending the next email (skip delay on last email)
      if (i < subscribers.length - 1) {
        await delay(THROTTLE_DELAY_MS);
      }
    }

    // 4. Mark campaign as completed
    await supabase
      .from('email_blasts')
      .update({
        status: 'completed',
        sent_count: totalSentCount + totalFailedCount,
        failed_count: totalFailedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', blast.id);

    console.log(`[Newsletter] Campaign completed. Sent: ${totalSentCount}, Failed: ${totalFailedCount}`);

    return NextResponse.json({
      success: true,
      blastId: blast.id,
      sentCount: totalSentCount,
      failedCount: totalFailedCount
    });

  } catch (err) {
    console.error('Newsletter send error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
