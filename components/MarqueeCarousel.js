'use client';

import { useRef, useEffect, Children, isValidElement, cloneElement } from 'react';
import { motion, useMotionValue, useAnimationFrame, useReducedMotion, animate } from 'framer-motion';

/* ── Continuous draggable marquee carousel ──
   Same engine as the menu-page nav bar: a motion value drives the track,
   useAnimationFrame drifts it left like a ticker, drag="x" lets fingers or
   the mouse swipe the same value (with flick momentum), and the item list
   is rendered 3× so the value can wrap by one copy-width — visually
   seamless, infinite in both directions.

   Props:
   - children:  the carousel items (each should have a stable width)
   - speed:     ticker speed in px/second (default 50)
   - gap:       px gap between items (default 24)
   - prevClass / nextClass: extra class names for the paging arrows so each
     section can keep its own arrow styling                                  */
export default function MarqueeCarousel({ children, speed = 50, gap = 24, prevClass = '', nextClass = '' }) {
  const x = useMotionValue(0);
  const viewportRef = useRef(null);
  const groupRef = useRef(null);
  const periodRef = useRef(0);       // pixel width of one copy of the items
  const hoverPauseRef = useRef(false);
  const draggingRef = useRef(false);
  const lastDragEndRef = useRef(0);
  const prefersReduced = useReducedMotion();

  // measure one copy's width (re-measure after images/fonts settle & on resize)
  useEffect(() => {
    const measure = () => {
      const w = groupRef.current ? groupRef.current.offsetWidth : 0;
      if (w && Math.abs(w - periodRef.current) > 1) {
        periodRef.current = w;
        x.set(-w); // start on the middle copy so there's slack on both sides
      }
    };
    measure();
    const t = setTimeout(measure, 1000);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [x]);

  useAnimationFrame((_, delta) => {
    const p = periodRef.current;
    if (!p) return;
    // hands off while the user drags, momentum settles, or an arrow animates
    if (draggingRef.current || x.isAnimating()) return;
    let v = x.get();
    if (!prefersReduced && !hoverPauseRef.current) v -= speed * (delta / 1000);
    // wrap back into the middle copy → infinite loop in both directions
    if (v > -p * 0.5) v -= p;
    else if (v < -p * 1.5) v += p;
    x.set(v);
  });

  // a swipe must not fire the click that follows it
  const onClickCapture = (e) => {
    if (draggingRef.current || Date.now() - lastDragEndRef.current < 250) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // arrows glide the strip by ~60% of the viewport
  const nudge = (dir) => {
    const vw = viewportRef.current ? viewportRef.current.offsetWidth : 600;
    animate(x, x.get() + dir * vw * 0.6, { type: 'spring', stiffness: 120, damping: 22 });
  };

  const groupStyle = { display: 'flex', gap: `${gap}px`, paddingRight: `${gap}px` };
  // duplicates are hidden from screen readers and skipped by the keyboard
  const dupChildren = Children.map(children, c =>
    isValidElement(c) ? cloneElement(c, { tabIndex: -1 }) : c
  );

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => { hoverPauseRef.current = true; }}
      onMouseLeave={() => { hoverPauseRef.current = false; }}
    >
      <button className={prevClass} aria-label="Previous" onClick={() => nudge(1)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button className={nextClass} aria-label="Next" onClick={() => nudge(-1)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      <div ref={viewportRef} style={{ overflow: 'hidden' }}>
        <motion.div
          className="marquee-carousel-track"
          style={{ x, display: 'flex', width: 'max-content', cursor: 'grab' }}
          drag="x"
          dragTransition={{ power: 0.35, timeConstant: 220 }}
          onDragStart={() => { draggingRef.current = true; }}
          onDragEnd={() => { draggingRef.current = false; lastDragEndRef.current = Date.now(); }}
          onClickCapture={onClickCapture}
        >
          <div ref={groupRef} style={groupStyle}>{children}</div>
          <div style={groupStyle} aria-hidden="true">{dupChildren}</div>
          <div style={groupStyle} aria-hidden="true">{dupChildren}</div>
        </motion.div>
      </div>
    </div>
  );
}
