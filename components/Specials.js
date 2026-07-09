'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// dayNum matches JS Date.getDay(): 0=Sunday, 2=Tuesday ... 6=Saturday (Monday closed — no poster)
const specials = [
  { day: 'Tuesday',   dayNum: 2, rotate: -2.4, image: '/images/specials/taco-tuesday.webp',       alt: 'Taco Tuesdays — 10% off all taco plates and margaritas every Tuesday' },
  { day: 'Wednesday', dayNum: 3, rotate: 1.8,  image: '/images/specials/nacho-wednesday.webp',    alt: 'Nacho Wednesdays — 10% off nachos platter and all beers every Wednesday' },
  { day: 'Thursday',  dayNum: 4, rotate: -1.4, image: '/images/specials/margarita-thursday.webp', alt: 'Thirsty Thursday — buy one get one free margaritas every Thursday' },
  { day: 'Friday',    dayNum: 5, rotate: 2.2,  image: '/images/specials/fajita-friday.webp',      alt: 'Fajita Fridays — 10% off all fajita platters every Friday' },
  { day: 'Saturday',  dayNum: 6, rotate: -2.0, image: '/images/specials/burrito-saturday.webp',   alt: 'Burrito Bash — 10% off all burritos every Saturday' },
  { day: 'Sunday',    dayNum: 0, rotate: 1.6,  image: '/images/specials/quesadilla-sunday.webp',  alt: 'Quesadilla Sundays — 10% off all quesadillas every Sunday' },
];

const FLAG_COLORS = ['#8B1C1C', '#FFD700', '#33691E', '#E6752F', '#4A90D9', '#C2185B'];

// Papel picado bunting strung above the poster wall — sways gently like a breeze
function Bunting() {
  const flags = Array.from({ length: 16 });
  return (
    <motion.div
      animate={{ rotate: [-0.6, 0.6, -0.6] }}
      transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
      style={{ transformOrigin: 'top center', marginBottom: '2.5rem' }}
    >
      <svg viewBox="0 0 1280 64" style={{ width: '100%', height: 'auto', display: 'block' }} aria-hidden="true">
        <path d="M0,14 Q640,34 1280,14" fill="none" stroke="#3E2723" strokeWidth="2" opacity="0.55" />
        {flags.map((_, i) => {
          const x = i * 80 + 8;
          // approximate the string curve for flag tops
          const t = (x + 32) / 1280;
          const yTop = 14 + 20 * (4 * t * (1 - t));
          return (
            <polygon
              key={i}
              points={`${x},${yTop} ${x + 64},${yTop} ${x + 32},${yTop + 38}`}
              fill={FLAG_COLORS[i % FLAG_COLORS.length]}
              opacity="0.9"
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

// Masking-tape corner
const Tape = ({ side }) => (
  <div
    aria-hidden="true"
    style={{
      position: 'absolute',
      top: '-9px',
      [side]: '-24px',
      width: '76px',
      height: '26px',
      background: 'rgba(235, 224, 189, 0.85)',
      transform: side === 'left' ? 'rotate(-42deg)' : 'rotate(42deg)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
      zIndex: 3,
      borderLeft: '1px dashed rgba(120,100,60,0.25)',
      borderRight: '1px dashed rgba(120,100,60,0.25)',
    }}
  />
);

const PosterCard = ({ special, index, isToday }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: special.rotate }}
      whileInView={{ opacity: 1, y: 0, rotate: special.rotate }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: 0.15 + index * 0.1, duration: 0.6, ease: 'easeOut' }}
      whileHover={{ rotate: 0, scale: 1.05, zIndex: 5, transition: { type: 'spring', stiffness: 260, damping: 12 } }}
      style={{ position: 'relative', transformOrigin: 'top center' }}
    >
      <Tape side="left" />
      <Tape side="right" />

      {isToday && (
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '14px', right: '-12px', zIndex: 4,
            background: 'linear-gradient(135deg, #FFD700 0%, #FFB300 100%)',
            color: '#7A1010', fontWeight: 900, fontSize: '0.95rem',
            fontFamily: 'var(--font-montserrat)', letterSpacing: '0.08em',
            padding: '7px 18px', borderRadius: '6px', rotate: '5deg',
            boxShadow: '0 6px 20px rgba(255, 170, 0, 0.55)',
          }}
        >
          🔥 TODAY!
        </motion.div>
      )}

      <motion.div
        animate={isToday ? {
          boxShadow: [
            '0 0 0 3px #FFD700, 0 14px 42px rgba(255, 170, 0, 0.28)',
            '0 0 0 3px #FFD700, 0 14px 56px rgba(255, 170, 0, 0.60)',
            '0 0 0 3px #FFD700, 0 14px 42px rgba(255, 170, 0, 0.28)',
          ],
        } : {}}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        style={{
          position: 'relative', aspectRatio: '2 / 3', borderRadius: '8px', overflow: 'hidden',
          border: '6px solid #F8F3E8',
          boxShadow: isToday
            ? '0 0 0 3px #FFD700, 0 14px 42px rgba(255, 170, 0, 0.35)'
            : '0 10px 28px rgba(62, 39, 35, 0.25)',
        }}
      >
        <Image
          src={special.image}
          alt={special.alt}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </motion.div>
    </motion.div>
  );
};

export default function Specials() {
  // set after mount so server & first client render match (avoids hydration mismatch)
  const [todayNum, setTodayNum] = useState(null);
  useEffect(() => setTodayNum(new Date().getDay()), []);

  return (
    <section id="specials" className="py-24 relative perspective-container">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="container relative z-10 solid-content-card"
      >

        <motion.div
          initial={{ opacity: 0, rotateY: -30, z: -100 }}
          whileInView={{ opacity: 1, rotateY: 0, z: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center"
          style={{ marginBottom: '2.5rem', transformStyle: 'preserve-3d' }}
        >
          <h2
            className="script-font text-primary"
            style={{
              fontSize: 'clamp(3.2rem, 5.5vw, 4.5rem)',
              marginBottom: '0.5rem',
              letterSpacing: '0.03em',
              textShadow: '1px 2px 2px rgba(62, 39, 35, 0.15)',
            }}
          >
            Daily Specials
          </h2>

          {/* Chili divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '1.25rem' }} aria-hidden="true">
            <span style={{ width: '90px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg, transparent, #8B1C1C)' }} />
            <motion.span
              animate={{ rotate: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
              style={{ fontSize: '1.6rem', display: 'inline-block' }}
            >
              🌶️
            </motion.span>
            <span style={{ width: '90px', height: '3px', borderRadius: '2px', background: 'linear-gradient(270deg, transparent, #8B1C1C)' }} />
          </div>

          <p className="text-gray" style={{ maxWidth: '600px', margin: '0 auto' }}>Every day is a fiesta at Buenos Mexican Cuisine. Check out what we&apos;re serving up today!</p>
          <p className="text-gray" style={{ marginTop: '0.75rem', fontStyle: 'italic', opacity: 0.75 }}>Closed on Mondays — resting up for the week ahead!</p>
        </motion.div>

        <Bunting />

        <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3" style={{ gap: '2.5rem 2rem', padding: '0 0.5rem' }}>
          {specials.map((special, index) => (
            <PosterCard key={special.day} special={special} index={index} isToday={todayNum === special.dayNum} />
          ))}
        </div>

      </motion.div>
    </section>
  );
}
