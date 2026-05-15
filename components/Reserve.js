'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import WheelPicker from './WheelPicker';

export default function Booking() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    date: new Date().toISOString().split('T')[0], 
    time: '18:00', 
    partySize: '2' 
  });
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  // Generate Date Options (Next 30 days)
  const dateOptions = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  // Generate Time Options (11:00 to 22:00)
  const timeOptions = useMemo(() => {
    const times = [];
    for (let h = 11; h <= 22; h++) {
      times.push(`${h}:00`);
      times.push(`${h}:30`);
    }
    return times;
  }, []);

  const partyOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9+'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const { error } = await supabase.from('bookings').insert([{
      name: formData.name,
      email: formData.email,
      date: formData.date,
      time: formData.time,
      party_size: formData.partySize,
    }]);

    if (error) {
      console.error('Booking error:', error);
      setErrorMsg('Something went wrong. Please try again or call us directly.');
      setStatus('error');
      return;
    }

    setStatus('success');
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <section id="booking" className="py-24 relative perspective-container">
      <div className="container" style={{ maxWidth: '896px' }}>
        
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="booking-box"
          style={{ overflow: 'visible' }}
        >

          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
            style={{ marginBottom: '2.5rem' }}
          >
            <h2 className="script-font" style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', marginBottom: '1rem' }}>Reserve A Table</h2>
            <p className="text-gray">Join us for an unforgettable dining experience.</p>
          </motion.div>

          {status === 'success' ? (
            <motion.div 
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="text-center"
              style={{ padding: '2.5rem 0' }}
            >
              <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <svg style={{ width: '40px', height: '40px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-foreground" style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Booking Confirmed!</h3>
              <p className="text-gray">We look forward to hosting you.</p>
              <button onClick={() => setStatus('idle')} className="text-primary" style={{ marginTop: '2rem', textDecoration: 'underline' }}>Make another booking</button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md-grid-cols-2 gap-6" style={{ marginBottom: '2rem' }}>
                <div className="relative">
                  <label className="input-label">Full Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="John Doe" />
                </div>
                <div className="relative">
                  <label className="input-label">Email Address</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="john@example.com" />
                </div>
              </div>

              {/* iOS Style Wheel Pickers */}
              <div className="wheel-pickers-wrapper" style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '1rem', 
                background: 'rgba(0,0,0,0.2)', 
                padding: '1.5rem', 
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '2rem'
              }}>
                <WheelPicker 
                  label="Select Date" 
                  options={dateOptions} 
                  value={formData.date} 
                  onChange={(val) => setFormData(prev => ({ ...prev, date: val }))} 
                />
                <WheelPicker 
                  label="Time" 
                  options={timeOptions} 
                  value={formData.time} 
                  onChange={(val) => setFormData(prev => ({ ...prev, time: val }))} 
                />
                <WheelPicker 
                  label="Party" 
                  options={partyOptions} 
                  value={formData.partySize} 
                  onChange={(val) => setFormData(prev => ({ ...prev, partySize: val }))} 
                />
              </div>

              {/* Error Message */}
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginBottom: '1.5rem', padding: '12px 16px', backgroundColor: '#FFF0F0', border: '1px solid #e53935', borderRadius: '8px', color: '#C62828', fontSize: '0.9rem', fontWeight: '600' }}
                >
                  ⚠️ {errorMsg}
                </motion.div>
              )}

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={status === 'loading'} 
                className="primary-btn" 
                style={{ width: '100%', opacity: status === 'loading' ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {status === 'loading' && (
                  <svg style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </svg>
                )}
                <span>
                   {status === 'loading' ? 'Sending your booking...' : 'Confirm Reservation'}
                </span>
              </motion.button>
            </form>
          )}

        </motion.div>
      </div>
    </section>
  );
}
