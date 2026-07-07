import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Trusted server-to-server endpoint (called by Resend). It deactivates bounced
// subscribers — a write anon RLS no longer permits — so it must use the
// service_role key. Falls back to the anon key for local dev where it may be unset.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ─── Bounce Classification Helper ───────────────────────────────────
// Returns 'hard' or 'soft' based on Resend webhook bounce payload.
// Hard = permanent (invalid email, domain doesn't exist, rejected)
// Soft = transient (mailbox full, temp server issue, greylisting)
function classifyBounce(bounceData) {
  if (!bounceData) return 'soft'; // Default to soft if no data — protect subscriber

  const bounceType = (bounceData.type || '').toLowerCase();
  const bounceMessage = (bounceData.message || '').toLowerCase();

  // Hard bounce indicators
  const hardIndicators = [
    'hard', 'permanent', 'invalid', 'not_found', 'no_such_user',
    'does_not_exist', 'rejected', 'unknown_user', 'bad_destination',
    'account_disabled', 'not_active', 'mailbox_not_found',
  ];

  // Check bounce type field first (primary classifier from Resend)
  for (const indicator of hardIndicators) {
    if (bounceType.includes(indicator)) {
      return 'hard';
    }
  }

  // Fallback: check the message text for hard bounce signals
  for (const indicator of hardIndicators) {
    if (bounceMessage.includes(indicator)) {
      return 'hard';
    }
  }

  // Explicit soft bounce indicators (for clarity in logs)
  const softIndicators = [
    'soft', 'transient', 'temporary', 'mailbox_full', 'quota',
    'throttled', 'greylisted', 'try_again', 'rate_limit',
  ];

  for (const indicator of softIndicators) {
    if (bounceType.includes(indicator) || bounceMessage.includes(indicator)) {
      return 'soft';
    }
  }

  // Default to soft — protect subscriber from accidental deactivation
  return 'soft';
}

// ─── Main Webhook Handler ───────────────────────────────────────────
export async function POST(request) {
  try {
    const payload = await request.json();

    const eventType = payload.type;
    const eventData = payload.data;

    if (!eventData || !eventData.email_id) {
      console.warn('Webhook payload lacks email_id. Acknowledging anyway.');
      return NextResponse.json({ success: true, message: 'No email_id found' });
    }

    const resendId = eventData.email_id;
    const recipientEmail = Array.isArray(eventData.to) ? eventData.to[0] : eventData.to;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Database environment variables are missing in webhook route!');
      return NextResponse.json({ error: 'Database environment variables are not configured.' }, { status: 500 });
    }

    // Initialize Supabase client (service role — bypasses RLS for trusted writes)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Find matching email log in the database
    const { data: logEntry, error: logFindError } = await supabase
      .from('email_logs')
      .select('id, blast_id, status')
      .eq('resend_id', resendId)
      .maybeSingle();

    if (logFindError) {
      console.error('Failed to query email_logs table:', logFindError);
      return NextResponse.json({ error: 'Database select error' }, { status: 500 });
    }

    if (!logEntry) {
      console.warn(`No email_logs entry found matching Resend ID: ${resendId}. Event type: ${eventType}`);
      // Return 200 OK so Resend does not retry
      return NextResponse.json({ success: true, message: 'Message not tracked in local database' });
    }

    // 2. Map Resend event type to local statuses + classify bounces
    let newStatus = 'sent';
    let errorMessage = null;
    let bounceClassification = null;

    if (eventType === 'email.delivered') {
      newStatus = 'delivered';

    } else if (eventType === 'email.bounced') {
      // Smart bounce classification
      bounceClassification = classifyBounce(eventData.bounce);
      newStatus = 'bounced';
      errorMessage = `[${bounceClassification.toUpperCase()} BOUNCE] ${eventData.bounce?.message || 'Email Bounced'}`;

    } else if (eventType === 'email.failed') {
      newStatus = 'failed';
      errorMessage = eventData.error?.message || 'Email Delivery Failed';

    } else {
      // Return early for other events we don't track in log statuses (e.g. email.sent, email.opened)
      return NextResponse.json({ success: true, message: `Ignoring event type: ${eventType}` });
    }

    // 3. Prevent duplicate processing
    if (logEntry.status === newStatus) {
      return NextResponse.json({ success: true, message: 'Status already up-to-date' });
    }

    // 4. Update the email log status
    const { error: logUpdateError } = await supabase
      .from('email_logs')
      .update({
        status: newStatus,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', logEntry.id);

    if (logUpdateError) {
      console.error('Failed to update email_logs entry:', logUpdateError);
      return NextResponse.json({ error: 'Database update error' }, { status: 500 });
    }

    // 5. Update the campaign (email_blasts) statistics
    const { data: blastData, error: blastSelectError } = await supabase
      .from('email_blasts')
      .select('delivered_count, failed_count')
      .eq('id', logEntry.blast_id)
      .maybeSingle();

    if (!blastSelectError && blastData) {
      const updates = {};
      
      if (newStatus === 'delivered') {
        updates.delivered_count = (blastData.delivered_count || 0) + 1;
      } else if (newStatus === 'bounced' || newStatus === 'failed') {
        updates.failed_count = (blastData.failed_count || 0) + 1;
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('email_blasts')
          .update(updates)
          .eq('id', logEntry.blast_id);
      }
    }

    // 6. Smart subscriber deactivation — only on HARD bounces or permanent failures
    if (recipientEmail) {
      let shouldDeactivate = false;

      if (newStatus === 'failed') {
        // Delivery failures are typically permanent (invalid domain, DMARC rejection, etc.)
        shouldDeactivate = true;
        console.log(`[HARD FAIL] Deactivating subscriber: ${recipientEmail} (delivery failure)`);
      } else if (newStatus === 'bounced') {
        if (bounceClassification === 'hard') {
          // Hard bounce — permanent issue, deactivate
          shouldDeactivate = true;
          console.log(`[HARD BOUNCE] Deactivating subscriber: ${recipientEmail}`);
        } else {
          // Soft bounce — transient issue, keep subscriber active
          console.log(`[SOFT BOUNCE] Keeping subscriber active: ${recipientEmail} — Reason: ${errorMessage}`);
        }
      }

      if (shouldDeactivate) {
        const { error: subscriberUpdateError } = await supabase
          .from('subscribers')
          .update({
            is_active: false,
            status: newStatus,
          })
          .eq('email', recipientEmail);

        if (subscriberUpdateError) {
          console.error(`Failed to update status for subscriber ${recipientEmail}:`, subscriberUpdateError);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
