'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import WheelPicker from './WheelPicker';
import { User, Mail, Phone, CalendarDays, CheckCircle } from 'lucide-react';

export default function Booking() {
  const getBangkokDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());

  // Timezone-safe date arithmetic — avoids toISOString() UTC shift
  const addDays = (dateStr, n) => {
    const [y, m, day] = dateStr.split('-').map(Number);
    const d = new Date(y, m - 1, day + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getBangkokNowMinutes = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Bangkok', hour: 'numeric', minute: 'numeric', hour12: false,
    }).formatToParts(new Date());
    const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0');
    const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0');
    return (h === 24 ? 0 : h) * 60 + m;
  };

  const getSmartDefault = () => {
    const todayStr = getBangkokDate();
    const nowMinutes = getBangkokNowMinutes();
    // Last slot is 00:30 = 1470 min. If nothing is 60+ min away, use tomorrow.
    const hasSlots = 1470 > nowMinutes + 60;
    if (hasSlots) return { date: todayStr, time: '18:00' };
    return { date: addDays(todayStr, 1), time: '18:00' };
  };

  const smartDefault = getSmartDefault();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: smartDefault.date,
    time: smartDefault.time,
    partySize: '2',
    website: '' // Honeypot field
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileWidgetId = useRef(null);

  useEffect(() => {
    const removePreviousWidget = () => {
      if (turnstileWidgetId.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
        } catch (e) {
          console.warn('[Turnstile] Could not remove previous widget:', e.message);
        }
        turnstileWidgetId.current = null;
      }
    };

    const renderWidget = () => {
      if (!window.turnstile) return;
      const container = document.getElementById('turnstile-container');
      if (!container) return;

      // Always clean up previous widget before rendering a new one
      removePreviousWidget();
      container.innerHTML = '';

      try {
        turnstileWidgetId.current = window.turnstile.render('#turnstile-container', {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
          callback: (token) => {
            setTurnstileToken(token);
          },
          'expired-callback': () => {
            setTurnstileToken('');
          },
          'error-callback': () => {
            setTurnstileToken('');
            console.warn('[Turnstile] Challenge error — will retry on next interaction.');
          },
        });
      } catch (e) {
        console.error('[Turnstile] Render error:', e);
      }
    };

    if (typeof window !== 'undefined') {
      if (!document.getElementById('turnstile-script')) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.id = 'turnstile-script';
        script.async = true;
        script.defer = true;
        script.onload = renderWidget;
        document.body.appendChild(script);
      } else if (window.turnstile) {
        renderWidget();
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            renderWidget();
            clearInterval(interval);
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }

    return () => {
      removePreviousWidget();
    };
  }, []);

  // Generate Date Options (Next 30 days, anchored to Bangkok timezone — Mondays excluded, closed day)
  const dateOptions = useMemo(() => {
    const dates = [];
    const todayStr = getBangkokDate();
    const [y, m, day] = todayStr.split('-').map(Number);
    for (let i = 0; dates.length < 30; i++) {
      // new Date(y, m-1, day+i) uses local constructor — getFullYear/Month/Date
      // return the same local values, so no UTC shift occurs.
      const d = new Date(y, m - 1, day + i);
      if (d.getDay() === 1) continue; // 1 = Monday
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yy}-${mm}-${dd}`);
    }
    return dates;
  }, []);

  // Generate Time Options (17:00 to 00:30)
  const timeOptions = useMemo(() => {
    const times = [];
    for (let h = 17; h <= 23; h++) {
      times.push(`${h}:00`);
      times.push(`${h}:30`);
    }
    times.push('00:00');
    times.push('00:30');
    return times;
  }, []);

  // Filter out past times when today is selected (Bangkok timezone, 1-hour buffer)
  const availableTimeOptions = useMemo(() => {
    const todayStr = getBangkokDate();
    if (formData.date !== todayStr) return timeOptions;

    const nowMinutes = getBangkokNowMinutes();
    return timeOptions.filter(t => {
      const [th, tm] = t.split(':').map(Number);
      const slotMinutes = (th === 0 ? 24 : th) * 60 + tm;
      return slotMinutes > nowMinutes + 60;
    });
  }, [formData.date, timeOptions]);

  // If today has no slots left, auto-advance to tomorrow
  useEffect(() => {
    const todayStr = getBangkokDate();
    if (formData.date === todayStr && availableTimeOptions.length === 0) {
      setFormData(prev => ({ ...prev, date: addDays(todayStr, 1), time: '18:00' }));
    } else if (availableTimeOptions.length > 0 && !availableTimeOptions.includes(formData.time)) {
      setFormData(prev => ({ ...prev, time: availableTimeOptions[0] }));
    }
  }, [availableTimeOptions]);

  const partyOptions = useMemo(() => ['1', '2', '3', '4', '5', '6', '7', '8', '9+'], []);

  const formattedConfirmDate = useMemo(() => {
    if (!formData.date) return '';
    try {
      const d = new Date(formData.date + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return formData.date;
    }
  }, [formData.date]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const todayStr = getBangkokDate();
    if (formData.date < todayStr) {
      setErrorMsg('Please select today or a future date.');
      setStatus('error');
      return;
    }
    if (!turnstileToken) {
      setErrorMsg('Please complete the security check.');
      setStatus('error');
      return;
    }
    setShowConfirmModal(true);
  };

  // Sanitise any error string so raw HTML / huge blobs never render in the UI.
  const sanitizeErrorMsg = (msg) => {
    if (!msg || typeof msg !== 'string') return '';
    // If it looks like an HTML page (starts with < or contains DOCTYPE), replace entirely
    if (msg.trimStart().startsWith('<') || msg.includes('<!DOCTYPE')) {
      return 'Something went wrong. Please try again or call us directly.';
    }
    // Strip any remaining HTML tags and limit length
    const cleaned = msg.replace(/<[^>]*>/g, '').trim();
    return cleaned.length > 300 ? cleaned.slice(0, 300) + '…' : cleaned;
  };

  const handleConfirmBooking = async () => {
    setShowConfirmModal(false);
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          date: formData.date,
          time: formData.time,
          partySize: formData.partySize,
          website: formData.website,
          turnstileToken: turnstileToken,
        }),
      });

      // If the response isn't JSON (e.g. Vercel returned an HTML error page), bail early
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('Booking API returned non-JSON response:', res.status, contentType);
        setErrorMsg('Something went wrong. Please try again or call us directly.');
        setSuggestedSlots([]);
        setStatus('error');
        if (window.turnstile) window.turnstile.reset();
        return;
      }

      if (res.status === 409) {
        throw new Error('409_CONFLICT');
      }

      if (res.status !== 200 && res.status !== 201) {
        let errMsg = 'Something went wrong.';
        let isSlotFull = false;
        let suggested = [];
        let result = {};
        try {
          result = await res.json();
          errMsg = sanitizeErrorMsg(result.message || result.error) || errMsg;
          isSlotFull = result.error === 'TIME_SLOT_FULL' || errMsg.includes('No tables available');
          const rawSlots = result.suggested_slots || [];
          const rawTimes = (result.suggested_times || []).map(t => ({ date: formData.date, time: t }));
          const allSlots = rawSlots.length > 0 ? rawSlots : rawTimes;
          // Filter out Mondays (closed day) from suggestions
          suggested = allSlots.filter(s => new Date(s.date + 'T00:00:00').getDay() !== 1);
        } catch (e) {
          // JSON parsing failed — response was likely HTML, not JSON
          console.error('Failed to parse booking error response:', e);
        }

        if (isSlotFull) {
          console.warn('Booking info: Selected slot is full.');
          setErrorMsg(errMsg || 'Ay caramba! This slot is fully packed — our tacos must be too good. Pick another time below!');
          setSuggestedSlots(suggested);
        } else {
          console.error('Booking unexpected error:', errMsg);
          setErrorMsg(errMsg || 'Something went wrong. Please try again or call us directly.');
          setSuggestedSlots([]);
        }
        setStatus('error');
        if (window.turnstile) {
          window.turnstile.reset();
        }
        return;
      }

      const result = await res.json();
      if (result.error) {
        throw new Error(result.error);
      }

      setSuggestedSlots([]);
      setStatus('success');
      // Reset Turnstile for potential future bookings
      setTurnstileToken('');
      if (window.turnstile) {
        try { window.turnstile.reset(); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.error('Booking unexpected error:', err);
      if (err.message === '409_CONFLICT') {
        setErrorMsg('This slot was just taken by another customer. Please select a different time.');
      } else {
        setErrorMsg('An unexpected error occurred. Please try again or call us directly.');
      }
      setSuggestedSlots([]);
      setStatus('error');
      if (window.turnstile) {
        window.turnstile.reset();
      }
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const inputBase = {
    width: '100%',
    background: 'var(--background)',
    border: '1.5px solid var(--border)',
    borderRadius: '12px',
    padding: '13px 16px 13px 44px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--foreground)',
    fontFamily: 'var(--font-montserrat)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const iconStyle = {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(139,28,28,0.45)',
    pointerEvents: 'none',
  };

  const sectionLabel = (text) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.1rem' }}>
      <span style={{ display: 'inline-block', width: '18px', height: '1.5px', background: '#8B1C1C', flexShrink: 0 }} />
      <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8B1C1C', whiteSpace: 'nowrap' }}>{text}</span>
      <span style={{ display: 'block', flex: 1, height: '1px', background: 'rgba(139,28,28,0.15)' }} />
    </div>
  );

  return (
    <>
    <section id="booking" className="py-24 relative perspective-container">
      <div className="container" style={{ maxWidth: '860px' }}>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            background: 'var(--surface)',
            border: '2px dashed var(--border)',
            borderRadius: '24px',
            padding: 'clamp(2rem, 5vw, 3.5rem)',
            boxShadow: '0 25px 50px -12px rgba(62,39,35,0.2)',
            overflow: 'visible',
          }}
        >
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '2.5rem' }}
          >
            <div style={{ width: 56, height: 56, background: 'rgba(139,28,28,0.08)', border: '1.5px solid rgba(139,28,28,0.18)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#8B1C1C' }}>
              <CalendarDays size={26} />
            </div>
            <h2 className="script-font" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>
              Reserve A Table
            </h2>
            <p style={{ color: 'var(--text-muted, #888)', fontSize: '0.95rem', fontWeight: 500, fontFamily: 'var(--font-montserrat)' }}>
              Join us for an unforgettable dining experience.
            </p>
          </motion.div>

          {status === 'success' ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              style={{ textAlign: 'center', padding: '2.5rem 0' }}
            >
              <div style={{ width: 80, height: 80, background: 'rgba(51,105,30,0.1)', border: '1.5px solid rgba(51,105,30,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#33691E' }}>
                <CheckCircle size={38} />
              </div>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.5rem', fontFamily: 'var(--font-montserrat)' }}>Booking Confirmed!</h3>
              <p style={{ color: 'var(--text-muted, #888)', fontFamily: 'var(--font-montserrat)' }}>We look forward to hosting you.</p>
              <button onClick={() => setStatus('idle')} style={{ marginTop: '2rem', color: 'var(--primary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>
                Make another booking
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Honeypot */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                <input type="text" name="website" value={formData.website || ''} onChange={handleChange} tabIndex="-1" autoComplete="off" />
              </div>

              {/* ── Personal Details ── */}
              <div style={{ marginBottom: '2rem' }}>
                {sectionLabel('Personal Details')}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px', fontFamily: 'var(--font-montserrat)', letterSpacing: '0.04em' }}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconStyle}><User size={16} /></span>
                      <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name"
                        style={inputBase}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,28,28,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px', fontFamily: 'var(--font-montserrat)', letterSpacing: '0.04em' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconStyle}><Mail size={16} /></span>
                      <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Your email address"
                        style={inputBase}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,28,28,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  <div style={{ position: 'relative' }} className="md:col-span-2">
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px', fontFamily: 'var(--font-montserrat)', letterSpacing: '0.04em' }}>Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconStyle}><Phone size={16} /></span>
                      <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Your phone number"
                        style={inputBase}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,28,28,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Reservation Details ── */}
              <div style={{ marginBottom: '2rem' }}>
                {sectionLabel('Reservation Details')}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: 'var(--background)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <WheelPicker label="Select Date" options={dateOptions} value={formData.date} onChange={(val) => setFormData(prev => ({ ...prev, date: val }))} />
                  <WheelPicker key={`time-${availableTimeOptions.length}-${formData.date}`} label="Time" options={availableTimeOptions} value={formData.time} onChange={(val) => setFormData(prev => ({ ...prev, time: val }))} />
                  <WheelPicker label="Party"       options={partyOptions} value={formData.partySize} onChange={(val) => setFormData(prev => ({ ...prev, partySize: val }))} />
                </div>
              </div>

              {/* ── Error ── */}
              {status === 'error' && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ padding: '12px 16px', background: '#FFF0F0', border: '1px solid #E53935', borderRadius: '10px', color: '#C62828', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-montserrat)' }}>
                    ⚠️ {errorMsg}
                  </div>
                  {suggestedSlots.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <p style={{ width: '100%', fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-montserrat)' }}>Available alternatives:</p>
                      {suggestedSlots.map((slot) => {
                        const isSameDay = slot.date === formData.date;
                        const label = isSameDay
                          ? slot.time
                          : `${new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${slot.time}`;
                        return (
                          <button key={`${slot.date}-${slot.time}`} type="button"
                            onClick={() => { setFormData(prev => ({ ...prev, date: slot.date, time: slot.time })); setStatus('idle'); setErrorMsg(''); setSuggestedSlots([]); }}
                            style={{ background: 'rgba(139,28,28,0.08)', color: '#8B1C1C', border: '1px solid rgba(139,28,28,0.25)', borderRadius: '50px', padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat)' }}
                          >{label}</button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── CAPTCHA ── */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <div id="turnstile-container" />
              </div>

              {/* ── Submit ── */}
              <motion.button
                suppressHydrationWarning
                whileHover={{ scale: 1.02, boxShadow: '0 12px 35px rgba(139,28,28,0.6)' }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #8B1C1C 0%, #5C1111 100%)',
                  color: '#FDF8F0',
                  border: '1px solid rgba(255,215,0,0.2)',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-montserrat)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                  opacity: status === 'loading' ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 24px rgba(139,28,28,0.4)',
                }}
              >
                {status === 'loading' && (
                  <svg style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </svg>
                )}
                {status === 'loading' ? 'Sending your booking…' : 'Confirm Reservation'}
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>

    </section>

    <AnimatePresence>
      {showConfirmModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowConfirmModal(false)}
          style={{
            position: 'fixed',
              inset: 0,
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              background: 'rgba(20, 12, 8, 0.65)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: '2.5rem',
                width: '100%',
                maxWidth: '440px',
                background: 'var(--surface)',
                border: '2px dashed var(--border)',
                borderRadius: '24px',
                boxShadow: '0 30px 60px rgba(62,39,35,0.25)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 className="script-font" style={{ fontSize: '2.4rem', color: 'var(--foreground)', marginBottom: '0.3rem' }}>Confirm Booking</h3>
                <p style={{ color: 'var(--text-muted, #888)', fontSize: '0.875rem', fontFamily: 'var(--font-montserrat)', fontWeight: 500 }}>
                  Please review your reservation details
                </p>
              </div>

              <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                {[
                  { label: 'Date', value: formattedConfirmDate },
                  { label: 'Time', value: formData.time },
                  { label: 'Party Size', value: `${formData.partySize} guests` },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', paddingBottom: i < arr.length - 1 ? '0.75rem' : 0, marginBottom: i < arr.length - 1 ? '0.75rem' : 0, borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ color: '#888', fontFamily: 'var(--font-montserrat)', fontWeight: 500 }}>{row.label}</span>
                    <span style={{ color: 'var(--foreground)', fontFamily: 'var(--font-montserrat)', fontWeight: 700 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.875rem' }}>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  style={{ flex: 1, padding: '13px 16px', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-montserrat)', letterSpacing: '0.05em', background: 'var(--background)', color: 'var(--foreground)', border: '1.5px solid var(--border)', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Cancel / Edit
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  style={{ flex: 1, padding: '13px 16px', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-montserrat)', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'linear-gradient(135deg, #8B1C1C 0%, #5C1111 100%)', color: '#FDF8F0', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 18px rgba(139,28,28,0.35)' }}
                >
                  Confirm Booking
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
    </AnimatePresence>
    </>
  );
}
