'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError('Incorrect email or password.');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div style={s.root}>
      {/* ── Left brand panel ── */}
      <div className="login-brand" style={s.brand}>
        <div style={s.brandInner}>
          <div style={s.logoMark}>🌮</div>
          <div>
            <div style={s.brandName}>Buenos Mexican</div>
            <div style={s.brandSub}>Restaurant</div>
          </div>
        </div>

        <div style={s.brandBody}>
          <h2 style={s.brandHeadline}>Manage your restaurant<br />from one place.</h2>
          <p style={s.brandDesc}>
            Live bookings, newsletter campaigns, and system health — all in your admin dashboard.
          </p>
          <div style={s.featureList}>
            {['Live reservation dashboard', 'Newsletter & VIP campaigns', 'System integrity monitor'].map((f, i) => (
              <div key={i} style={s.featureItem}>
                <span style={s.featureDot} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Decorative dots */}
        <div style={s.dots} aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={s.dot} />
          ))}
        </div>

        <div style={s.brandFooter}>© 2026 Buenos Mexican Restaurant</div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-form-panel" style={s.formPanel}>
        <div style={s.formCard}>
          {/* Header */}
          <div style={s.formHeader}>
            <div style={s.brandMark}>
              <div style={s.brandMarkIcon}>🌮</div>
              <div>
                <div style={s.brandMarkName}>Buenos Mexican</div>
                <div style={s.brandMarkSub}>Admin Panel</div>
              </div>
            </div>
            <div style={s.formDivider} />
            <div style={s.formLabel}>Sign in to continue</div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={s.form}>
            {/* Email */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@buenosmexicanrestaurant.com" required autoComplete="email" autoFocus
                style={s.input}
                onFocus={e => Object.assign(e.target.style, { borderColor: '#3E2723', boxShadow: '0 0 0 3px rgba(62,39,35,0.08)', background: '#fff' })}
                onBlur={e => Object.assign(e.target.style, { borderColor: '#E2D9D1', boxShadow: 'none', background: '#FAFAF9' })}
              />
            </div>

            {/* Password */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••" required autoComplete="current-password"
                  style={{ ...s.input, paddingRight: '48px', boxSizing: 'border-box' }}
                  onFocus={e => Object.assign(e.target.style, { borderColor: '#3E2723', boxShadow: '0 0 0 3px rgba(62,39,35,0.08)', background: '#fff' })}
                  onBlur={e => Object.assign(e.target.style, { borderColor: '#E2D9D1', boxShadow: 'none', background: '#FAFAF9' })}
                />
                <button
                  type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  style={s.eyeBtn}
                >
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={s.errorBox}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{ ...s.submitBtn, ...(loading ? s.submitBtnLoading : {}) }}>
              {loading
                ? <><span style={s.spinner} />Signing in…</>
                : 'Sign In →'
              }
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 760px) {
          .login-brand { display: none !important; }
          .login-form-panel { justify-content: flex-start !important; padding-top: 48px !important; }
        }
      `}</style>
    </div>
  );
}

const F = "'Inter', 'Helvetica Neue', Arial, sans-serif";

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    fontFamily: F,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    background: '#F7F5F3',
  },

  /* ── Left brand panel ── */
  brand: {
    display: 'flex',
    flexDirection: 'column',
    width: '42%',
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #2C1810 0%, #1a0a05 60%, #0f0603 100%)',
    padding: '40px 48px',
    position: 'relative',
    overflow: 'hidden',
  },
  brandInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: 'auto',
  },
  logoMark: {
    width: '40px',
    height: '40px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    border: '1px solid rgba(255,255,255,0.12)',
    flexShrink: 0,
  },
  brandName: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.2,
    letterSpacing: '0.01em',
  },
  brandSub: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  brandBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingBottom: '48px',
  },
  brandHeadline: {
    margin: '0 0 16px',
    fontSize: '32px',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.3,
    letterSpacing: '-0.02em',
  },
  brandDesc: {
    margin: '0 0 28px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.7,
    fontWeight: 400,
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 500,
  },
  featureDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#C0845A',
    flexShrink: 0,
  },
  dots: {
    position: 'absolute',
    bottom: '80px',
    right: '40px',
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '8px',
    opacity: 0.18,
  },
  dot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: '#fff',
  },
  brandFooter: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.25)',
    fontWeight: 400,
  },

  /* ── Right form panel ── */
  formPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 32px',
    background: '#F7F5F3',
  },
  formCard: {
    width: '100%',
    maxWidth: '400px',
  },

  /* Form header */
  formHeader: {
    marginBottom: '32px',
  },
  brandMark: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
  },
  brandMarkIcon: {
    width: '36px',
    height: '36px',
    background: '#3E2723',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  },
  brandMarkName: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#1a1210',
    lineHeight: 1.2,
    letterSpacing: '0.01em',
  },
  brandMarkSub: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#A08070',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginTop: '2px',
  },
  formDivider: {
    height: '1px',
    background: '#EAE3DC',
    marginBottom: '20px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#8C7365',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },

  /* Form body */
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#3E2723',
    letterSpacing: '0.01em',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #E2D9D1',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1210',
    fontFamily: F,
    outline: 'none',
    background: '#FAFAF9',
    transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#A08070',
    padding: '4px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '10px',
    background: '#fff5f5',
    border: '1px solid #fecaca',
    fontSize: '13px',
    fontWeight: 600,
    color: '#b91c1c',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '4px',
    padding: '13px 20px',
    borderRadius: '10px',
    border: 'none',
    background: '#3E2723',
    color: '#FDF6EE',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: F,
    letterSpacing: '0.01em',
    boxShadow: '0 2px 12px rgba(62,39,35,0.25)',
    transition: 'background 0.15s, box-shadow 0.15s, transform 0.1s',
  },
  submitBtnLoading: {
    background: '#8C7365',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(253,246,238,0.3)',
    borderTopColor: '#FDF6EE',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  },
};
