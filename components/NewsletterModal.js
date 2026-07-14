'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, User, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export default function NewsletterModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg] = useState('');

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset after close
      setTimeout(() => {
        setStatus('idle');
        setFormData({ name: '', email: '' });
      }, 500);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setMsg(data.status === 'already'
          ? "You're already subscribed!"
          : "Welcome to the Fiesta! You're subscribed.");
        setStatus('success');
      } else {
        setMsg(data.error || 'Something went wrong. Please try again later.');
        setStatus('error');
      }
    } catch (err) {
      console.error('Newsletter Subscription Error:', err?.message || err);
      setMsg('Something went wrong. Please try again later.');
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="newsletter-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(20, 12, 8, 0.75)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />

          {/* Modal Card */}
          <motion.div
            key="newsletter-modal-card"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '440px',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 40px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05)',
              zIndex: 1,
            }}
          >
            {/* ── Top Banner ── */}
            <div
              style={{
                background: 'linear-gradient(135deg, #3E2723 0%, #5C2317 50%, #8B1C1C 100%)',
                padding: '36px 28px 32px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative glows */}
              <div style={{
                position: 'absolute', top: '-40px', right: '-20px', width: '180px', height: '180px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)', pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', bottom: '-30px', left: '-10px', width: '140px', height: '140px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(211,47,47,0.1) 0%, transparent 70%)', pointerEvents: 'none',
              }} />

              {/* Close Button */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: '14px', right: '14px',
                  width: '34px', height: '34px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                <X size={16} />
              </button>

              {/* Icon */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                background: 'rgba(255,215,0,0.15)', border: '1.5px solid rgba(255,215,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: '#FFD700',
              }}>
                <Sparkles size={24} />
              </div>

              <h2 style={{
                fontFamily: 'var(--font-alfa)', fontSize: 'clamp(1.5rem, 5vw, 1.9rem)',
                color: '#FDF6EE', textTransform: 'uppercase', letterSpacing: '0.04em',
                lineHeight: 1.2, marginBottom: '10px', textShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}>
                Subscribe to Newsletter
              </h2>
              <p style={{
                color: 'rgba(253,246,238,0.6)', fontSize: '13px', fontWeight: 500,
                fontFamily: 'var(--font-montserrat)', maxWidth: '320px', margin: '0 auto', lineHeight: 1.5,
              }}>
                Get exclusive deals, secret menu items & priority booking straight to your inbox
              </p>
            </div>

            {/* ── Form Body ── */}
            <div style={{ background: '#FAF7F2', padding: '28px' }}>
              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', padding: '20px 0', gap: '14px',
                  }}
                >
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'rgba(45,90,39,0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#2D5A27',
                  }}>
                    <CheckCircle size={30} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '18px', fontWeight: 800, color: '#3E2723',
                      marginBottom: '6px', fontFamily: 'var(--font-montserrat)',
                      textTransform: 'none', textShadow: 'none',
                    }}>
                      {msg}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#8C7365', fontWeight: 500 }}>
                      Keep an eye on your inbox for something special.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    style={{
                      marginTop: '6px', padding: '10px 28px', borderRadius: '12px',
                      background: '#3E2723', color: '#FDF6EE', fontSize: '13px', fontWeight: 700,
                      fontFamily: 'var(--font-montserrat)', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#5D3A2E'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#3E2723'; }}
                  >
                    Close
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Name */}
                  <div style={{ position: 'relative' }}>
                    <User size={17} style={{
                      position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                      color: '#B09080', pointerEvents: 'none',
                    }} />
                    <input
                      type="text" placeholder="Your Name (Optional)" aria-label="Your name" autoComplete="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%', padding: '13px 16px 13px 44px', borderRadius: '14px',
                        border: '1.5px solid #E4D9CB', background: '#fff', fontSize: '14px',
                        fontWeight: 600, color: '#3E2723', fontFamily: 'var(--font-montserrat)',
                        outline: 'none', transition: 'all 0.2s',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#B87333'; e.target.style.boxShadow = '0 0 0 3px rgba(184,115,51,0.08)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#E4D9CB'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Email */}
                  <div style={{ position: 'relative' }}>
                    <Mail size={17} style={{
                      position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                      color: '#B09080', pointerEvents: 'none',
                    }} />
                    <input
                      required type="email" placeholder="Email Address *" aria-label="Email address" autoComplete="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%', padding: '13px 16px 13px 44px', borderRadius: '14px',
                        border: '1.5px solid #E4D9CB', background: '#fff', fontSize: '14px',
                        fontWeight: 600, color: '#3E2723', fontFamily: 'var(--font-montserrat)',
                        outline: 'none', transition: 'all 0.2s',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#B87333'; e.target.style.boxShadow = '0 0 0 3px rgba(184,115,51,0.08)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#E4D9CB'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Error */}
                  {status === 'error' && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px',
                      borderRadius: '12px', background: 'rgba(202,91,67,0.06)',
                      border: '1.5px solid rgba(202,91,67,0.15)', color: '#A0432E', fontSize: '13px', fontWeight: 600,
                    }}>
                      <AlertCircle size={17} style={{ flexShrink: 0 }} />
                      <span>{msg}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <motion.button
                    whileHover={{ scale: 1.01, boxShadow: '0 8px 24px rgba(139,28,28,0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={status === 'loading'}
                    style={{
                      width: '100%', padding: '14px 24px', borderRadius: '14px', border: 'none',
                      cursor: status === 'loading' ? 'wait' : 'pointer',
                      background: 'linear-gradient(135deg, #8B1C1C 0%, #A52A2A 100%)', color: '#FDF8F0',
                      fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-montserrat)',
                      letterSpacing: '0.03em', boxShadow: '0 6px 20px rgba(139,28,28,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      opacity: status === 'loading' ? 0.7 : 1, transition: 'all 0.25s ease', marginTop: '2px',
                    }}
                  >
                    {status === 'loading' ? (
                      <>
                        <div style={{
                          width: '18px', height: '18px', border: '2.5px solid rgba(255,255,255,0.2)',
                          borderTopColor: '#fff', borderRadius: '50%', animation: 'modalSpin 0.8s linear infinite',
                        }} />
                        Subscribing...
                      </>
                    ) : (
                      <>
                        <Mail size={17} />
                        Subscribe Now
                      </>
                    )}
                  </motion.button>

                  <p style={{
                    textAlign: 'center', fontSize: '11px', fontWeight: 500, color: '#9C8577', lineHeight: 1.4,
                  }}>
                    We respect your privacy. Unsubscribe at any time.
                  </p>
                </form>
              )}
            </div>

            {/* Spin animation */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes modalSpin {
                to { transform: rotate(360deg); }
              }
            `}} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
