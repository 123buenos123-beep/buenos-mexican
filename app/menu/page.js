'use client';

import SmoothScroll from '@/components/SmoothScroll';
import Navbar from '@/components/Navbar';
import MenuItemModal from '@/components/MenuItemModal';
import GrabFooterButton from '@/components/GrabFooterButton';
import Image from 'next/image';
import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, useAnimationFrame, useReducedMotion } from 'framer-motion';

import { menuData } from '@/lib/menu-data';

/* ── Shared animation variants ── */
const sectionVariants = {
  hidden: { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Animated stagger grid wrapper ── */
function AnimatedGrid({ children, style, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      variants={gridVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Sticky section nav — draggable infinite marquee (Framer Motion) ──
   A motion value drives the track: useAnimationFrame drifts it left like a
   ticker, and drag="x" lets fingers/mouse swipe the same value. The pill
   list is rendered 3× and the value is wrapped back into the middle copy
   whenever it strays one full copy-width, which is visually seamless. */
const MARQUEE_SPEED = 45; // px per second

function SectionNavBar({ activeSection }) {
  const x = useMotionValue(0);
  const groupRef = useRef(null);
  const periodRef = useRef(0);       // pixel width of one copy of the pill list
  const hoverPauseRef = useRef(false);
  const draggingRef = useRef(false);
  const lastDragEndRef = useRef(0);
  const prefersReduced = useReducedMotion();

  // measure one copy's width (re-measure after fonts settle & on resize)
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
    // hands off while the user is dragging or momentum is settling
    if (draggingRef.current || x.isAnimating()) return;
    let v = x.get();
    if (!prefersReduced && !hoverPauseRef.current) v -= MARQUEE_SPEED * (delta / 1000);
    // wrap back into the middle copy → infinite loop in both directions
    if (v > -p * 0.5) v -= p;
    else if (v < -p * 1.5) v += p;
    x.set(v);
  });

  // a swipe must not fire the link click that follows it
  const onClickCapture = (e) => {
    if (draggingRef.current || Date.now() - lastDragEndRef.current < 250) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const renderPills = (copy) => menuData.map(section => (
    <a
      key={`${copy}-${section.slug}`}
      href={`#${section.slug}`}
      className={`menu-nav-pill${activeSection === section.slug ? ' active' : ''}`}
      draggable={false}
      tabIndex={copy > 0 ? -1 : undefined}
    >
      {section.isSpecial && <span style={{ marginRight: 4 }}>🔥</span>}
      {section.category}
    </a>
  ));

  return (
    <div className="menu-nav-bar">
      <div className="menu-nav-marquee">
        <motion.div
          className="menu-nav-track"
          style={{ x }}
          drag="x"
          dragTransition={{ power: 0.35, timeConstant: 200 }}
          onDragStart={() => { draggingRef.current = true; }}
          onDragEnd={() => { draggingRef.current = false; lastDragEndRef.current = Date.now(); }}
          onHoverStart={() => { hoverPauseRef.current = true; }}
          onHoverEnd={() => { hoverPauseRef.current = false; }}
          onClickCapture={onClickCapture}
        >
          <div className="menu-nav-group" ref={groupRef}>{renderPills(0)}</div>
          <div className="menu-nav-group" aria-hidden="true">{renderPills(1)}</div>
          <div className="menu-nav-group" aria-hidden="true">{renderPills(2)}</div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Back to top button ── */
function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          className="back-to-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.15, y: -4 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          aria-label="Back to top"
        >
          ↑
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ── Regular item card ── */
const ItemCard = memo(({ item, onItemClick, sectionNotes, sectionMeta }) => (
  <motion.div
    variants={cardVariants}
    onClick={() => onItemClick({ ...item, notes: item.notes || sectionNotes, ...sectionMeta })}
    className="menu-item-card"
    whileHover={{ y: -5, scale: 1.02, boxShadow: '0 18px 40px rgba(62,39,35,0.14)' }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: 'spring', stiffness: 340, damping: 22 }}
  >
    {item.image && (
      <div className="menu-item-card-img" style={{ position: 'relative' }}>
        <Image src={item.image} alt={item.name} fill sizes="100px" style={{ objectFit: 'cover' }} />
      </div>
    )}
    <div style={{ flex: 1, width: '100%' }}>
      <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 className="text-foreground" style={{ fontSize: '1.25rem', fontWeight: '800' }}>{item.name}</h3>
        <motion.span
          className="text-primary font-bold"
          style={{ fontSize: '1.15rem', whiteSpace: 'nowrap' }}
          whileHover={{ scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          ฿{item.price}
        </motion.span>
      </div>
      {item.desc && <p className="text-gray" style={{ lineHeight: '1.5', fontSize: '0.9rem', fontWeight: '500' }}>{item.desc}</p>}
    </div>
  </motion.div>
));
ItemCard.displayName = 'ItemCard';

/* ── Special item card ── */
const SpecialItemCard = memo(({ item, onItemClick, sectionNotes, sectionMeta }) => (
  <motion.div
    variants={cardVariants}
    onClick={() => onItemClick({ ...item, notes: item.notes || sectionNotes, ...sectionMeta })}
    className="special-item-card"
    whileHover={{ y: -5, scale: 1.02, borderColor: 'var(--primary)', boxShadow: '0 18px 40px rgba(62,39,35,0.14)' }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: 'spring', stiffness: 340, damping: 22 }}
  >
    <div className="special-item-accent" />
    {item.image && (
      <div className="special-item-img" style={{ position: 'relative' }}>
        <Image src={item.image} alt={item.name} fill sizes="90px" style={{ objectFit: 'cover' }} />
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <h3 className="special-item-name">{item.name}</h3>
      {item.desc && <p className="special-item-desc">{item.desc}</p>}
    </div>
    <motion.div
      className="special-item-price"
      whileHover={{ scale: 1.08 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <span className="special-item-currency">฿</span>
      <span>{item.price}</span>
    </motion.div>
  </motion.div>
));
SpecialItemCard.displayName = 'SpecialItemCard';

/* ── Fire icon SVG ── */
const FireIcon = () => (
  <motion.svg
    width="22" height="22" viewBox="0 0 24 24" fill="none"
    animate={{ rotate: [-3, 3, -3], scale: [1, 1.08, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path d="M12 23C16.5 23 20 19.5 20 15.5C20 11.5 17 8.5 15 6.5C14.5 6 13.5 6.5 13.7 7.2C14.3 9.5 13.5 11 12 12C12 12 12.5 9 11 6C9.5 3 7 1.5 7 1.5C6.5 1.2 5.8 1.7 6 2.3C6.8 5 6 7.5 5 9.5C3.5 12 2 14 2 16.5C2 20 5.5 23 12 23Z" fill="url(#fireGrad)" />
    <path d="M12 23C14.5 23 16.5 21 16.5 18.5C16.5 16 15 14.5 14 13.5C13.5 13 12.5 13.5 12.7 14.2C13 15.5 12.5 16.5 11.5 17C11.5 17 12 15 11 13C10 11.5 9 10.5 9 10.5C8.5 10.2 7.8 10.7 8 11.3C8.5 12.5 8 14 7.5 15C6.8 16.5 6.5 17.5 6.5 18.5C6.5 21 9 23 12 23Z" fill="url(#fireInner)" />
    <defs>
      <linearGradient id="fireGrad" x1="12" y1="1" x2="12" y2="23" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFD700" /><stop offset="0.5" stopColor="#FF8C00" /><stop offset="1" stopColor="#DC2626" />
      </linearGradient>
      <linearGradient id="fireInner" x1="12" y1="10" x2="12" y2="23" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF176" /><stop offset="0.6" stopColor="#FFB300" /><stop offset="1" stopColor="#FF6F00" />
      </linearGradient>
    </defs>
  </motion.svg>
);

/* ── Chef's Specials section ── */
const SpecialSection = memo(({ section, onItemClick }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      id={section.slug}
      style={{ marginBottom: '4rem', scrollMarginTop: '160px' }}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={sectionVariants}
    >
      <div className="special-section-card">
        <div className="special-shimmer" />

        <div className="special-section-header">
          <motion.div
            className="special-badge"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.25, type: 'spring', stiffness: 280, damping: 18 }}
          >
            <FireIcon />
            <span>Chef&apos;s Special</span>
            <FireIcon />
          </motion.div>

          <motion.h2
            className="special-section-title"
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {section.category}
          </motion.h2>

          {section.description && (
            <motion.p
              className="special-section-desc"
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              {section.description}
            </motion.p>
          )}
        </div>

        {section.subcategories && section.subcategories.map((sub, sIdx) => (
          <div key={sIdx} className="special-subcategory">
            <motion.div
              className="special-sub-header"
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5 + sIdx * 0.1, duration: 0.4 }}
            >
              <div className="special-sub-line" />
              <h3 className="special-sub-title">{sub.title}</h3>
              <div className="special-sub-line" />
            </motion.div>
            {sub.description && <p className="special-sub-desc">{sub.description}</p>}
            <AnimatedGrid className="special-items-grid">
              {sub.items.map((item, i) => (
                <SpecialItemCard key={i} item={item} onItemClick={onItemClick} sectionNotes={section.notes} sectionMeta={{ isTaco: section.isTaco, tacoStyles: section.tacoStyles, grandePrice: section.grandePrice, grandeNote: section.grandeNote, subcategoryDesc: sub.description }} />
              ))}
            </AnimatedGrid>
          </div>
        ))}

        {section.items && (
          <AnimatedGrid className="special-items-grid">
            {section.items.map((item, i) => (
              <SpecialItemCard key={i} item={item} onItemClick={onItemClick} sectionNotes={section.notes} sectionMeta={{ isTaco: section.isTaco, tacoStyles: section.tacoStyles, grandePrice: section.grandePrice, grandeNote: section.grandeNote }} />
            ))}
          </AnimatedGrid>
        )}
      </div>
    </motion.div>
  );
});
SpecialSection.displayName = 'SpecialSection';

/* ── Regular section ── */
function RegularSection({ section, onItemClick }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      id={section.slug}
      style={{ marginBottom: '4rem', scrollMarginTop: '160px' }}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={sectionVariants}
    >
      <div className="menu-section-card">
        <div className="menu-section-header">
          <motion.h2
            className="rustic-section-title"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: 0, display: 'inline-block', borderBottom: '2px solid var(--primary)', paddingBottom: '0.25rem', color: 'var(--primary)', textShadow: 'none' }}
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {section.category}
          </motion.h2>
          {section.description && (
            <motion.p
              className="text-gray"
              style={{ marginTop: '1.25rem', fontSize: '1rem', fontWeight: '500', maxWidth: '800px', margin: '1.25rem auto 0 auto', lineHeight: '1.6', opacity: 0.9 }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 0.9 } : {}}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              {section.description}
            </motion.p>
          )}
        </div>

        {section.items && (
          <AnimatedGrid style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}>
            {section.items.map((item, i) => (
              <ItemCard key={i} item={item} onItemClick={onItemClick} sectionNotes={section.notes} sectionMeta={{ isTaco: section.isTaco, tacoStyles: section.tacoStyles, grandePrice: section.grandePrice, grandeNote: section.grandeNote }} />
            ))}
          </AnimatedGrid>
        )}

        {section.subcategories && section.subcategories.map((sub, sIdx) => (
          <div key={sIdx} className="menu-subcategory">
            <div className="menu-subcategory-header">
              <h3 className="script-font" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', margin: 0, color: 'var(--secondary)', textShadow: 'none', fontWeight: 'bold' }}>{sub.title}</h3>
              {sub.description && <p className="text-gray" style={{ marginTop: '0.5rem', fontSize: '1rem', fontWeight: '500', fontStyle: 'italic' }}>{sub.description}</p>}
            </div>
            <AnimatedGrid style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}>
              {sub.items.map((item, i) => (
                <ItemCard key={i} item={item} onItemClick={onItemClick} sectionNotes={section.notes} sectionMeta={{ isTaco: section.isTaco, tacoStyles: section.tacoStyles, grandePrice: section.grandePrice, grandeNote: section.grandeNote, subcategoryDesc: sub.description }} />
              ))}
            </AnimatedGrid>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Page ── */
export default function MenuPage() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const handleItemClick = useCallback((item) => setSelectedItem(item), []);
  const handleCloseModal = useCallback(() => setSelectedItem(null), []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const timer = setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const observers = [];
    menuData.forEach(section => {
      const el = document.getElementById(section.slug);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(section.slug); },
        { rootMargin: '-25% 0px -65% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  return (
    <SmoothScroll>
      <main className="min-h-screen relative" style={{ paddingTop: '100px', overflowX: 'hidden' }}>
        <Navbar />
        <SectionNavBar activeSection={activeSection} />

        <header className="container text-center py-24 relative perspective-container" style={{ perspective: 1000, zIndex: 10 }}>
          <motion.div
            className="rustic-section-box"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.h1
              className="script-font"
              style={{ fontSize: 'clamp(4rem, 8vw, 6rem)', transform: 'translateZ(50px)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Full Menu
            </motion.h1>
            <motion.p
              className="text-gray text-xl"
              style={{ marginTop: '1rem', transform: 'translateZ(20px)', fontWeight: '500' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              Explore our authentic Mexican dishes.
            </motion.p>
          </motion.div>
        </header>

        <div className="container relative" style={{ paddingBottom: '100px', maxWidth: '1100px', zIndex: 20 }}>
          {menuData.map((section, idx) =>
            section.isSpecial
              ? <SpecialSection key={idx} section={section} onItemClick={handleItemClick} />
              : <RegularSection key={idx} section={section} onItemClick={handleItemClick} />
          )}
        </div>

        <footer className="text-center relative" style={{ padding: '4rem 0', backgroundColor: 'var(--background)', borderTop: '2px dashed var(--border)', zIndex: 50 }}>
          <div className="container flex flex-col md-flex-row justify-between items-center gap-8">
            <div className="anton-font text-foreground" style={{ fontSize: '1.875rem' }}>Buenos Mexican <span className="text-primary">Restaurant</span></div>
            <p className="text-gray" style={{ fontSize: '0.875rem', fontWeight: '500' }}>© 2026 Buenos Mexican Cuisine. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <a href="https://www.facebook.com/profile.php?id=61571573732880" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/buenosmexican" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="https://www.tiktok.com/@buenosmexican" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.81-.6-4.03-1.42-.88-.65-1.59-1.47-2.11-2.42v10.17c.03 2.1-.39 4.26-1.89 5.81-1.5 1.55-3.67 2.39-5.87 2.39-2.2 0-4.37-.84-5.87-2.39-1.5-1.55-1.92-3.71-1.89-5.81.03-2.1.45-4.26 1.95-5.81 1.5-1.55 3.67-2.39 5.87-2.39.2 0 .4 0 .6.02v4.03c-.2-.02-.4-.02-.6-.02-1.1 0-2.19.42-2.94 1.19-.75.77-.96 1.85-.98 2.9-.02 1.05.19 2.13.94 2.9.75.77 1.84 1.19 2.94 1.19 1.1 0 2.19-.42 2.94-1.19.75-.77.96-1.85.98-2.9V0h.06z"/></svg>
              </a>
              <GrabFooterButton />
            </div>
          </div>
        </footer>

        <MenuItemModal item={selectedItem} onClose={handleCloseModal} />
        <BackToTopButton />
      </main>
    </SmoothScroll>
  );
}
