'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function SubscribersAdmin() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  useEffect(() => {
    supabase.from('subscribers').select('*').order('subscribed_at', { ascending: false })
      .then(({ data, error }) => { if (!error) setSubscribers(data ?? []); setLoading(false); });

    const refetch = () =>
      supabase.from('subscribers').select('*').order('subscribed_at', { ascending: false })
        .then(({ data }) => { if (data) setSubscribers(data); });

    const ch = supabase.channel('admin-subscribers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscribers' }, ({ eventType, new: n, old: o }) => {
        if      (eventType === 'INSERT') setSubscribers(p => [n, ...p]);
        else if (eventType === 'UPDATE') setSubscribers(p => p.map(s => s.id === n.id ? n : s));
        else if (eventType === 'DELETE') setSubscribers(p => p.filter(s => s.id !== o.id));
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') refetch();
      });

    return () => supabase.removeChannel(ch);
  }, []);

  const toggleStatusFilter = (s) => setStatusFilter(prev => prev === s ? 'all' : s);

  const filtered = subscribers
    .filter(s => statusFilter === 'all' ? true : statusFilter === 'active' ? s.is_active : !s.is_active)
    .filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
    });

  const counts = {
    total:    subscribers.length,
    active:   subscribers.filter(s => s.is_active).length,
    inactive: subscribers.filter(s => !s.is_active).length,
  };

  const F = 'var(--font-montserrat)';

  const STATS = [
    { key: 'all',      label: 'Total',        value: counts.total,    accent: '#3E2723', ring: '#3E2723', light: '#F9FAFB' },
    { key: 'active',   label: 'Active',       value: counts.active,   accent: '#15803d', ring: '#16a34a', light: '#f0fdf4' },
    { key: 'inactive', label: 'Unsubscribed', value: counts.inactive, accent: '#b91c1c', ring: '#ef4444', light: '#fef2f2' },
  ];

  return (
    <div style={{ fontFamily: F, background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #E5E7EB', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      <style>{`
        @media (max-width: 768px) {
          .sub-stats-grid { gap: 8px !important; }
        }
        @media (max-width: 480px) {
          .sub-stats-grid button { padding: 12px 14px !important; }
          .sub-stats-grid button p:last-child { font-size: 22px !important; }
        }
      `}</style>

      {/* ── Stats (clickable filters) ── */}
      <div className="sub-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}>
        {STATS.map(s => {
          const active = statusFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => toggleStatusFilter(s.key)}
              style={{
                background: active ? s.light : '#fff',
                border: active ? `2px solid ${s.ring}` : '1.5px solid #E5E7EB',
                borderRadius: '14px',
                padding: '16px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: active ? `0 0 0 3px ${s.ring}22` : 'none',
                fontFamily: F,
              }}
            >
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
              <p style={{ margin: '6px 0 0', fontSize: '30px', fontWeight: 900, color: s.accent, lineHeight: 1 }}>{s.value}</p>
              {active && s.key !== 'all' && (
                <p style={{ margin: '4px 0 0', fontSize: '10px', fontWeight: 700, color: s.accent }}>● Filtering active</p>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none', opacity: 0.4 }}>🔍</span>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px 10px 38px', border: '1.5px solid #E5E7EB',
            borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#111827',
            fontFamily: F, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#6B7280' }}>
          <div style={{ width: '36px', height: '36px', borderTop: '3px solid #111827', borderRight: '3px solid #E5E7EB', borderBottom: '3px solid #E5E7EB', borderLeft: '3px solid #E5E7EB', borderRadius: '50%', animation: 'subspin 0.7s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ fontWeight: 700, fontSize: '13px', margin: 0 }}>Loading subscribers…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 40px', border: '2px dashed #E5E7EB', borderRadius: '16px', background: '#F9FAFB' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>No subscribers found</h3>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, fontWeight: 500 }}>
            {statusFilter !== 'all' ? `No ${statusFilter === 'active' ? 'active' : 'unsubscribed'} subscribers.` : search ? 'No results match your search.' : 'Waiting for the first newsletter signup!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #E5E7EB', background: '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
                  background: s.is_active ? '#f0fdf4' : '#fef2f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', fontWeight: 900, color: s.is_active ? '#15803d' : '#b91c1c',
                }}>
                  {(s.name || s.email)?.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.name || '—'}
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: '12px', color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.email}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </span>
                <span style={{
                  padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: s.is_active ? '#f0fdf4' : '#fef2f2',
                  color: s.is_active ? '#15803d' : '#b91c1c',
                  border: `1px solid ${s.is_active ? '#bbf7d0' : '#fecaca'}`,
                }}>
                  {s.is_active ? 'Active' : 'Unsubscribed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes subspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
