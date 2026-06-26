'use client';

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import Image from 'next/image';
import { Autoplay } from 'swiper/modules';
import { Utensils } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { menuData } from '@/lib/menu-data';

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function useBurst() {
  const [burst, setBurst] = useState(null);
  const timer = useRef(null);
  const trigger = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (timer.current) clearTimeout(timer.current);
    setBurst({ x: e.clientX - r.left, y: e.clientY - r.top, id: Date.now() });
    timer.current = setTimeout(() => setBurst(null), 700);
  };
  return { burst, trigger };
}

function Burst({ burst, c1, c2 }) {
  return (
    <AnimatePresence>
      {burst && ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.span
            key={`${burst.id}-${i}`}
            initial={{ opacity: 1, x: burst.x - 4, y: burst.y - 4, scale: 1 }}
            animate={{ opacity: 0, x: burst.x + Math.cos(rad) * 65 - 4, y: burst.y + Math.sin(rad) * 65 - 4, scale: 0 }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.4, 1] }}
            style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: i % 2 === 0 ? c1 : c2, pointerEvents: 'none', zIndex: 50 }}
          />
        );
      })}
    </AnimatePresence>
  );
}

function useTilt() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rX = useSpring(useTransform(my, [-50, 50], [10, -10]), { stiffness: 360, damping: 28 });
  const rY = useSpring(useTransform(mx, [-50, 50], [-10, 10]), { stiffness: 360, damping: 28 });
  return {
    rX, rY,
    onMouseMove: (e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set(e.clientX - (r.left + r.width / 2)); my.set(e.clientY - (r.top + r.height / 2)); },
    onMouseLeave: () => { mx.set(0); my.set(0); },
  };
}

const ensureLoop = (arr, min = 12) => {
  if (arr.length >= min) return arr;
  const out = [];
  while (out.length < min) out.push(...arr);
  return out;
};

export default function MenuCategories() {
  const tilt = useTilt();
  const menuBurst = useBurst();
  const carouselRef = useRef(null);
  const loopedMenu = ensureLoop(menuData);

  useEffect(() => {
    const swiper = carouselRef.current;
    if (swiper?.autoplay) swiper.autoplay.start();
  }, []);

  /* ── Scroll entrance tracking ── */
  const btnRef = useRef(null);
  const inView = useInView(btnRef, { once: true, margin: '-80px' });

  return (
    <section className="py-24" style={{ borderTop: '2px dashed var(--secondary)', background: 'linear-gradient(to bottom, rgba(244, 236, 216, 0.5), transparent)' }}>
      <motion.div
        initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.6, ease: 'easeOut' }}
        className="container"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-6" style={{ marginBottom: '4rem' }}>
          <div>
            <h2 className="script-font neon-gold" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 'bold' }}>Our Quick Menu</h2>
            <p className="text-gray" style={{ fontSize: '1.1rem', marginTop: '0.5rem', fontWeight: '600', backgroundColor: 'rgba(255, 215, 0, 0.15)', padding: '4px 12px', borderRadius: '4px', display: 'inline-block' }}>
              Swipe to <span className="text-primary">explore</span> or click to jump to a section
            </p>
          </div>

          {/* ── View Full Menu — premium scroll entrance ── */}

          {/* Perspective container — gives depth to the rotateY */}
          <div ref={btnRef} style={{ perspective: '1200px', marginTop: '1rem' }}>

            {/* ① 3-D flip entrance — springs in from the right with overshoot */}
            <motion.div
              initial={{ opacity: 0, x: 120, rotateY: -55, scale: 0.72 }}
              animate={inView ? { opacity: 1, x: 0, rotateY: 0, scale: 1 } : {}}
              transition={{ type: 'spring', stiffness: 130, damping: 11, delay: 0.15 }}
              style={{ transformStyle: 'preserve-3d' }}
            >

              {/* ② Tilt wrapper — mouse-tracking 3-D tilt after landing */}
              <motion.div
                style={{ rotateX: tilt.rX, rotateY: tilt.rY, transformStyle: 'preserve-3d', position: 'relative' }}
                onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}
              >
                {/* Burst overlay */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 50 }}>
                  <Burst burst={menuBurst.burst} c1="#FFD700" c2="rgba(255,160,160,0.9)" />
                </div>

                <a href="/menu" style={{ display: 'block' }}>
                  <motion.button
                    whileHover={{ scale: 1.07, y: -6, boxShadow: '0 24px 55px rgba(139,28,28,0.75), 0 0 0 2px rgba(255,215,0,0.45)' }}
                    whileTap={{ scale: 0.92 }}
                    animate={{
                      boxShadow: ['0 4px 16px rgba(139,28,28,0.35)', '0 14px 38px rgba(139,28,28,0.65)', '0 4px 16px rgba(139,28,28,0.35)'],
                      borderColor: ['rgba(255,215,0,0.2)', 'rgba(255,215,0,0.6)', 'rgba(255,215,0,0.2)'],
                    }}
                    transition={{
                      boxShadow:   { repeat: Infinity, duration: 2.6, ease: 'easeInOut', delay: 0.5 },
                      borderColor: { repeat: Infinity, duration: 2.6, ease: 'easeInOut', delay: 0.5 },
                    }}
                    style={{
                      position: 'relative', overflow: 'hidden', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      background: 'linear-gradient(135deg, #8B1C1C 0%, #5C1111 100%)',
                      color: '#FDF8F0', border: '2px solid rgba(255,215,0,0.2)', borderRadius: '8px',
                      padding: '14px 28px', fontWeight: 700, fontSize: '0.875rem',
                      fontFamily: 'var(--font-montserrat)', letterSpacing: '0.1em',
                      textTransform: 'uppercase', transformStyle: 'preserve-3d',
                    }}
                    onClick={(e) => menuBurst.trigger(e)}
                  >
                    {/* Ambient blob */}
                    <motion.span
                      style={{ position: 'absolute', width: '80%', height: '80%', top: '10%', left: '10%', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}
                      animate={{ x: ['-15%', '15%', '-15%'], y: ['-10%', '10%', '-10%'] }}
                      transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                    />

                    {/* ③ One-time ignition sweep — gold wash that plays once on entry */}
                    {inView && (
                      <motion.span
                        initial={{ x: '-110%', opacity: 1 }}
                        animate={{ x: '220%', opacity: 0.9 }}
                        transition={{ duration: 0.85, delay: 0.55, ease: [0.2, 0.6, 0.35, 1] }}
                        style={{
                          position: 'absolute', top: '-10%', left: 0,
                          width: '65%', height: '120%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.55), rgba(255,255,255,0.2), transparent)',
                          transform: 'skewX(-15deg)', pointerEvents: 'none', zIndex: 10,
                        }}
                      />
                    )}

                    {/* Loop shimmer (slower, stays after ignition) */}
                    <motion.span
                      style={{ position: 'absolute', top: 0, left: '-80%', width: '55%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent)', transform: 'skewX(-18deg)', pointerEvents: 'none' }}
                      animate={{ left: ['-80%', '160%'] }}
                      transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', repeatDelay: 2.2 }}
                    />

                    {/* Icon */}
                    <motion.span
                      animate={{ rotate: [0, -12, 12, 0] }}
                      transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                      style={{ display: 'flex' }}
                    >
                      <Utensils size={18} />
                    </motion.span>
                    View Full Menu
                  </motion.button>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>

      </motion.div>

      {/* Swiper outside motion.div so it initialises with full dimensions */}
      <div style={{ padding: '20px 0', position: 'relative' }}>
        {/* Nav arrows */}
        <button className="qm-arrow qm-arrow-prev" aria-label="Previous" onClick={() => carouselRef.current?.slidePrev(700, true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button className="qm-arrow qm-arrow-next" aria-label="Next" onClick={() => carouselRef.current?.slideNext(700, true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <Swiper
          modules={[Autoplay]}
          onSwiper={(swiper) => { carouselRef.current = swiper; }}
          spaceBetween={24}
          slidesPerView={1.2}
          loop={true}
          speed={700}
          autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          grabCursor={true}
          breakpoints={{ 640: { slidesPerView: 2.2 }, 1024: { slidesPerView: 4 } }}
          className="quick-menu-swiper"
        >
          {loopedMenu.map((section, i) => (
            <SwiperSlide key={i}>
              <a href={`/menu#${section.slug}`} style={{ display: 'block' }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="menu-cat-card">
                  <div className="menu-cat-overlay"></div>
                  <div className="menu-cat-bg">
                    <Image src={section.image} alt={section.category} fill style={{ objectFit: 'cover', opacity: 0.9 }} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" />
                  </div>
                  <div className="menu-cat-info">
                    <h3 className="script-font" style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--neon-gold)', letterSpacing: '0.5px', textShadow: '2px 2px 4px rgba(0,0,0,0.4)', marginBottom: '0.5rem', lineHeight: '1.2' }}>{section.category}</h3>
                    <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--neon-gold)' }}>
                      <span>Explore Section</span>
                      <span style={{ fontSize: '1.1rem' }}>→</span>
                    </div>
                  </div>
                </motion.div>
              </a>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style>{`
        .qm-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid rgba(255, 215, 0, 0.5);
          background: rgba(30, 10, 5, 0.75);
          backdrop-filter: blur(8px);
          color: #FFD700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .qm-arrow:hover {
          background: rgba(62, 39, 35, 0.95);
          border-color: rgba(255, 215, 0, 0.9);
          transform: translateY(-50%) scale(1.1);
        }
        .qm-arrow-prev { left: 12px; }
        .qm-arrow-next { right: 12px; }
        .qm-arrow.swiper-button-disabled {
          opacity: 0.3;
          cursor: default;
        }
      `}</style>
    </section>
  );
}
