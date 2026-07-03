import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ─── Helpers ────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function formatDate(d) {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return d;
  }
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

const bangkokToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());

// ─── Shared Styles ──────────────────────────────────────────────────
const baseStyles = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Montserrat', system-ui, sans-serif;
    background-color: #FAF7F2;
    color: #3E2723;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    padding: 20px;
    text-align: center;
    background-image: radial-gradient(circle at 1px 1px, rgba(62,39,35,0.04) 1px, transparent 0);
    background-size: 32px 32px;
  }
  .container {
    max-width: 480px;
    width: 100%;
    padding: 48px 40px;
    background: #fff;
    border-radius: 24px;
    border: 1.5px solid #EDE6DA;
    box-shadow: 0 20px 60px rgba(62,39,35,0.1);
  }
  .icon {
    width: 72px; height: 72px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
  }
  .icon svg { width: 32px; height: 32px; }
  .brand {
    font-size: 11px; font-weight: 700; color: #B87333;
    letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px;
  }
  h1 { color: #3E2723; font-size: 24px; margin: 0 0 12px; font-weight: 800; line-height: 1.3; }
  p { color: #8C7365; line-height: 1.6; margin: 0 0 8px; font-weight: 500; font-size: 14px; }
  .details {
    background: #FAF7F2; border: 1px solid #EDE6DA; border-radius: 14px;
    padding: 18px 20px; margin: 24px 0 8px; text-align: left;
  }
  .details .row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; font-size: 13px; }
  .details .row + .row { border-top: 1px solid #EDE6DA; }
  .details .label { color: #8C7365; font-weight: 600; }
  .details .value { color: #3E2723; font-weight: 700; }
  .btn-primary {
    background: linear-gradient(135deg, #8B1C1C, #A52A2A);
    color: #FDF6EE; text-decoration: none; margin-top: 24px;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 32px; border-radius: 14px; font-weight: 700; font-size: 14px;
    border: none; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(139,28,28,0.25);
    font-family: 'Montserrat', system-ui, sans-serif;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(139,28,28,0.35); }
  .btn-secondary {
    background: transparent; color: #8C7365; text-decoration: none;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 13px;
    border: 1.5px solid #EDE6DA; cursor: pointer; transition: all 0.2s; margin-top: 12px;
    font-family: 'Montserrat', system-ui, sans-serif;
  }
  .btn-secondary:hover { background: #FAF7F2; border-color: #D4C9BB; color: #3E2723; }
  .btn-home {
    background: linear-gradient(135deg, #3E2723, #5C2317);
    color: #FDF6EE; text-decoration: none; margin-top: 24px;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 14px 28px; border-radius: 14px; font-weight: 700; font-size: 14px;
    transition: all 0.2s; box-shadow: 0 4px 12px rgba(62,39,35,0.2);
  }
  .btn-home:hover { transform: translateY(-2px); }
  .spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff;
    border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .hidden { display: none; }
  .fade-in { animation: fadeIn 0.4s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

const fontLink = `<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">`;

// ─── Simple single-message page (not found / already cancelled / past) ─────
function renderInfoPage({ iconBg, iconColor, iconSvg, title, message }) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} - Buenos Mexican</title>
    <style>${baseStyles}</style>
    ${fontLink}
  </head>
  <body>
    <div class="container">
      <div class="brand">Buenos Mexican Cuisine</div>
      <div class="icon fade-in" style="background: ${iconBg}; color: ${iconColor};">${iconSvg}</div>
      <h1 class="fade-in">${title}</h1>
      <p class="fade-in">${message}</p>
      <a href="/" class="btn-home fade-in">Return to Homepage</a>
    </div>
  </body>
</html>`;
}

const ICON_CALENDAR = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;
const ICON_INFO = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

// ─── GET: Show cancellation confirmation page ───────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Invalid request: booking reference missing', { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, name, date, time, party_size, status')
      .eq('id', id)
      .maybeSingle();

    if (error || !booking) {
      return new NextResponse(
        renderInfoPage({
          iconBg: 'rgba(140,115,101,0.1)', iconColor: '#8C7365', iconSvg: ICON_INFO,
          title: "Reservation Not Found",
          message: "We couldn't find a reservation matching this link. It may have already been removed. If you need help, please call us directly.",
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (booking.status === 'cancelled') {
      return new NextResponse(
        renderInfoPage({
          iconBg: 'rgba(45,90,39,0.1)', iconColor: '#2D5A27', iconSvg: ICON_CHECK,
          title: "Already Cancelled",
          message: "This reservation has already been cancelled. No further action is needed.",
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (booking.date < bangkokToday()) {
      return new NextResponse(
        renderInfoPage({
          iconBg: 'rgba(140,115,101,0.1)', iconColor: '#8C7365', iconSvg: ICON_INFO,
          title: "Reservation Has Passed",
          message: "This reservation date has already passed, so it can no longer be cancelled online. Please call us if you have any questions.",
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Cancel Reservation - Buenos Mexican</title>
          <style>${baseStyles}</style>
          ${fontLink}
        </head>
        <body>
          <div class="container">
            <!-- Confirmation View (default) -->
            <div id="confirm-view">
              <div class="brand">Buenos Mexican Cuisine</div>
              <div class="icon" style="background: rgba(139,28,28,0.08); color: #8B1C1C;">
                ${ICON_CALENDAR}
              </div>
              <h1>Cancel Your Reservation?</h1>
              <p>Hi <strong style="color:#3E2723;">${escapeHtml(booking.name)}</strong>, you're about to cancel the following reservation:</p>

              <div class="details">
                <div class="row"><span class="label">📅 Date</span><span class="value">${escapeHtml(formatDate(booking.date))}</span></div>
                <div class="row"><span class="label">🕐 Time</span><span class="value">${escapeHtml(formatTime(booking.time))}</span></div>
                <div class="row"><span class="label">👥 Guests</span><span class="value">${escapeHtml(booking.party_size)}</span></div>
              </div>

              <p style="color:#B09080; font-size:13px; margin-top:12px;">This cannot be undone. You'll need to make a new booking if you change your mind.</p>

              <div style="display:flex; flex-direction:column; align-items:center; margin-top:20px;">
                <button class="btn-primary" id="confirm-btn" onclick="handleCancel()">Confirm Cancellation</button>
                <a href="/" class="btn-secondary">← Keep My Reservation</a>
              </div>
            </div>

            <!-- Loading View -->
            <div id="loading-view" class="hidden">
              <div class="icon" style="background: rgba(139,28,28,0.08); color: #8B1C1C;">
                <div class="spinner" style="border-color: rgba(139,28,28,0.2); border-top-color: #8B1C1C; width: 28px; height: 28px;"></div>
              </div>
              <p style="font-weight: 600; color: #3E2723;">Cancelling your reservation...</p>
            </div>

            <!-- Success View -->
            <div id="success-view" class="hidden">
              <div class="brand">Buenos Mexican Cuisine</div>
              <div class="icon fade-in" style="background: rgba(45,90,39,0.1); color: #2D5A27;">
                ${ICON_CHECK}
              </div>
              <h1 class="fade-in">Reservation Cancelled</h1>
              <p class="fade-in">Your reservation has been cancelled. A confirmation email is on its way.</p>
              <p class="fade-in" style="color: #B09080; font-size: 13px;">We hope to welcome you another time!</p>
              <a href="/" class="btn-home fade-in">Return to Homepage</a>
            </div>

            <!-- Error View -->
            <div id="error-view" class="hidden">
              <div class="brand">Buenos Mexican Cuisine</div>
              <div class="icon fade-in" style="background: rgba(202,91,67,0.1); color: #CA5B43;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 class="fade-in">Something went wrong</h1>
              <p class="fade-in" id="error-msg">We couldn't cancel your reservation. Please try again or call us directly.</p>
              <button class="btn-primary fade-in" onclick="handleCancel()" style="background: linear-gradient(135deg, #3E2723, #5C2317);">Try Again</button>
            </div>
          </div>

          <script>
            var bookingId = ${JSON.stringify(id)};

            function showView(viewId) {
              ['confirm-view', 'loading-view', 'success-view', 'error-view'].forEach(function(v) {
                document.getElementById(v).classList.add('hidden');
              });
              document.getElementById(viewId).classList.remove('hidden');
            }

            function handleCancel() {
              showView('loading-view');
              fetch('/api/cancel-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: bookingId })
              })
              .then(function(res) {
                if (!res.ok) throw new Error('Server returned status ' + res.status);
                return res.json();
              })
              .then(function(data) {
                if (data.success) { showView('success-view'); }
                else { throw new Error(data.error || 'Unknown error'); }
              })
              .catch(function(err) {
                document.getElementById('error-msg').textContent = err.message || 'Please try again later.';
                showView('error-view');
              });
            }
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });

  } catch (err) {
    console.error('Cancel-booking page error:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// ─── POST: Perform the cancellation ─────────────────────────────────
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const id = body?.id;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Booking reference is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Only cancel bookings that aren't already cancelled — prevents duplicate
    // cancellation emails from the status-change DB trigger.
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .neq('status', 'cancelled')
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Cancel-booking error:', error);
      return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 });
    }

    // No row updated → already cancelled or doesn't exist. Treat as success
    // so the customer isn't shown a confusing error for a no-op.
    console.log(`[Cancel Booking] Cancelled: ${id}`);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Cancel-booking POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
