'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import AdminDashboard from '@/components/AdminDashboard';
import NewsletterAdmin from '@/components/NewsletterAdmin';
import SubscribersAdmin from '@/components/SubscribersAdmin';
import IntegrityMonitor from '@/components/IntegrityMonitor';

const TABS = [
  { id: 'bookings',     label: 'Live Bookings',  icon: '📋' },
  { id: 'newsletter',   label: 'Newsletter',      icon: '📧' },
  { id: 'subscribers',  label: 'Subscribers',     icon: '👥' },
  { id: 'monitor',      label: 'System Monitor',  icon: '🔧' },
];

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [session, setSession]     = useState(null);
  const [tab, setTab]             = useState('bookings');
  const [isOnline, setIsOnline]   = useState(false);
  const [syncing, setSyncing]     = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const prevOnline                = useRef(false);
  const syncTimer                 = useRef(null);

  // ── Auth — session is kept in sync for the header (email display + sign out)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // ── Online/Offline ──
  const goOnline = () => {
    setIsOnline(true);
    if (!prevOnline.current) {
      setSyncing(true);
      clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => setSyncing(false), 2500);
    }
    prevOnline.current = true;
  };

  const goOffline = () => {
    setIsOnline(false);
    prevOnline.current = false;
  };

  useEffect(() => {
    window.addEventListener('offline', goOffline);
    const ch = supabase.channel('admin-ping').subscribe(status => {
      if (status === 'SUBSCRIBED') goOnline();
      else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') goOffline();
    });
    if (!navigator.onLine) goOffline();
    return () => {
      window.removeEventListener('offline', goOffline);
      supabase.removeChannel(ch);
      clearTimeout(syncTimer.current);
    };
  }, []);

  const F = 'var(--font-montserrat)';

  // Logged in — show dashboard (middleware guarantees authentication before this renders)
  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: F }}>

      {/* ── Top Header Bar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#ffffff',
        borderBottom: '1px solid #EDEAE4',
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
      }}>
        {/* Row 1: Brand + user email + Live indicator + Sign out */}
        <div className="admin-header-row1" style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#3E2723', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
              🌮
            </div>
            <div className="admin-brand-text">
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#3E2723', lineHeight: 1.2 }}>Buenos Mexican</div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#8C7365', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.2 }}>Admin Panel</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                background: isOnline ? '#16a34a' : '#dc2626',
                animation: isOnline ? 'livepulse 2s infinite' : 'none',
              }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: isOnline ? '#16a34a' : '#dc2626' }}>
                {isOnline ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Signed-in user + sign out */}
            <div className="admin-user" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '14px', borderLeft: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session?.user?.email}
              </span>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '5px 12px', borderRadius: '7px', border: '1.5px solid #E5E7EB',
                  background: '#fff', color: '#374151', fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.target.style.background = '#fef2f2'; e.target.style.borderColor = '#fecaca'; e.target.style.color = '#b91c1c'; }}
                onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#E5E7EB'; e.target.style.color = '#374151'; }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Tab Navigation */}
        <div style={{ borderTop: '1px solid #F3F4F6', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <nav style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '4px', height: '52px', minWidth: 'max-content' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '9px 20px', borderRadius: '10px', border: 'none',
                  cursor: 'pointer', fontFamily: F, fontSize: '15px', fontWeight: 800,
                  transition: 'all 0.15s', whiteSpace: 'nowrap', letterSpacing: '0.01em',
                  background: tab === t.id ? '#3E2723' : 'transparent',
                  color:      tab === t.id ? '#ffffff' : '#6B7280',
                  boxShadow:  tab === t.id ? '0 2px 8px rgba(62,39,35,0.2)' : 'none',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {t.icon} {t.label}
                {t.id === 'bookings' && pendingCount > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 4px',
                    background: tab === t.id ? '#ef4444' : '#ef4444',
                    color: '#fff', fontSize: '10px', fontWeight: 900, lineHeight: 1,
                  }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Page Content ── */}
      <div style={{ position: 'relative' }}>
        <main className="admin-main" style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px 20px' }}>
          {tab === 'bookings'    && <AdminDashboard onPendingCount={setPendingCount} />}
          {tab === 'newsletter'  && <NewsletterAdmin isSystemOnline={isOnline} />}
          {tab === 'subscribers' && <SubscribersAdmin />}
          {tab === 'monitor'     && <IntegrityMonitor isSystemOnline={isOnline} />}
        </main>

        {/* ── Offline Overlay ── */}
        {!isOnline && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 40,
            background: 'rgba(243,244,246,0.85)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: '#fff', borderRadius: '20px', padding: '40px 48px', textAlign: 'center',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1.5px solid #E5E7EB',
              maxWidth: '380px', width: '90%',
            }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px' }}>
                📡
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 900, color: '#111827', fontFamily: F }}>Connection Lost</h2>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6B7280', fontWeight: 500, lineHeight: 1.6 }}>
                The dashboard is paused. All actions are disabled until the connection is restored.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626', animation: 'offlinepulse 1.2s ease-in-out infinite' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>Attempting to reconnect…</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Back Online Banner ── */}
        {syncing && isOnline && (
          <div style={{
            position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', zIndex: 60,
            background: '#15803d', color: '#fff', padding: '12px 24px', borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(21,128,61,0.35)', display: 'flex', alignItems: 'center',
            gap: '10px', fontSize: '13px', fontWeight: 700, fontFamily: F, animation: 'slidein 0.3s ease',
          }}>
            <span>✓</span> Back online — data synced
          </div>
        )}
      </div>

      <style>{`
        @keyframes livepulse { 0%,100% { box-shadow: 0 0 0 3px rgba(22,163,74,0.2); } 50% { box-shadow: 0 0 0 6px rgba(22,163,74,0.05); } }
        @keyframes offlinepulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.85); } }
        @keyframes slidein { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes adminspin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) {
          .admin-main { padding: 14px 12px !important; }
          .admin-brand-text { display: none; }
          .admin-user span { display: none; }
        }
      `}</style>
    </div>
  );
}
