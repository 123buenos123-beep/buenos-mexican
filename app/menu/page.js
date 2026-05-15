'use client';

import SmoothScroll from '@/components/SmoothScroll';
import Navbar from '@/components/Navbar';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';

import { menuData } from '@/lib/menu-data';

const ItemCard = ({ item, idx }) => {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useTransform(y, [0, 1], [10, -10]);
  const rotateY = useTransform(x, [0, 1], [-10, 10]);

  // Spring animation for smooth tilt recovery
  const springX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 50, rotateX: 15 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: (idx % 6) * 0.1, duration: 0.6, type: 'spring' }}
      style={{ 
        rotateX: springX,
        rotateY: springY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        backgroundColor: 'var(--background)', 
        padding: '1.5rem', 
        borderRadius: '16px', 
        borderLeft: `8px solid var(--primary)`, 
        boxShadow: '0 10px 30px rgba(62,39,35,0.08)',
        display: 'flex',
        flexDirection: 'row',
        gap: '1.5rem',
        alignItems: 'center',
        cursor: 'pointer',
        minHeight: '120px'
      }}
    >
      {item.image && (
        <div style={{ 
          flexShrink: 0, 
          width: 'clamp(60px, 15vw, 100px)', 
          height: 'clamp(60px, 15vw, 100px)', 
          borderRadius: '50%', 
          overflow: 'hidden', 
          border: `3px solid var(--border)`, 
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)', 
          transform: 'translateZ(30px)' 
        }}>
          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      
      <div style={{ flex: 1, width: '100%', transform: 'translateZ(20px)' }}>
        <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 className="text-foreground" style={{ fontSize: '1.25rem', fontWeight: '800' }}>{item.name}</h3>
          <span className="text-primary font-bold" style={{ fontSize: '1.15rem', whiteSpace: 'nowrap', transform: 'translateZ(40px)' }}>{item.price}</span>
        </div>
        {item.desc && <p className="text-gray" style={{ lineHeight: '1.5', fontSize: '0.9rem', transform: 'translateZ(10px)', fontWeight: '500' }}>{item.desc}</p>}
      </div>
    </motion.div>
  );
};

export default function MenuPage() {
  const { scrollYProgress } = useScroll();
  const yHeader = useTransform(scrollYProgress, [0, 0.2], [0, 150]);
  const opacityHeader = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <SmoothScroll>
      <main className="min-h-screen relative" style={{ paddingTop: '100px', overflowX: 'hidden' }}>
        
        {/* Navigation */}
        <Navbar />

        <header className="container text-center py-24 relative perspective-container" style={{ perspective: 1000, zIndex: 10 }}>
          <motion.div
            style={{ y: yHeader, opacity: opacityHeader, transformStyle: 'preserve-3d' }}
            className="rustic-section-box"
          >
             <motion.h1 
               initial={{ opacity: 0, rotateX: 45, y: -50 }}
               animate={{ opacity: 1, rotateX: 0, y: 0 }}
               transition={{ duration: 1, type: "spring", bounce: 0.4 }}
               className="script-font" 
               style={{ fontSize: 'clamp(4rem, 8vw, 6rem)', transform: 'translateZ(50px)' }}
             >
               Full Menu
             </motion.h1>
             <motion.p 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.5 }}
               className="text-gray text-xl" 
               style={{ marginTop: '1rem', transform: 'translateZ(20px)', fontWeight: '500' }}
             >
               Explore our authentic Mexican dishes.
             </motion.p>
          </motion.div>
        </header>

        <div className="container relative" style={{ paddingBottom: '100px', maxWidth: '1100px', zIndex: 20 }}>
          {menuData.map((section, idx) => (
            <motion.div 
              key={idx} 
              id={section.slug}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              style={{ marginBottom: '6rem', scrollMarginTop: '120px' }}
            >
              
              {/* Category Header */}
              <div className="rustic-section-box" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 className="rustic-section-title" style={{ fontSize: '3.5rem', margin: 0, display: 'inline-block', borderBottom: '3px dashed var(--secondary)', paddingBottom: '0.5rem' }}>{section.category}</h2>
                {section.description && <p className="text-gray" style={{ marginTop: '1.5rem', fontSize: '1.2rem', fontWeight: '500', maxWidth: '800px', margin: '1.5rem auto 0 auto', lineHeight: '1.6' }}>{section.description}</p>}
              </div>

              {/* Section Items Grid */}
              {section.items && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))', gap: '2rem', perspective: 1200 }}>
                   {section.items.map((item, i) => <ItemCard key={i} item={item} idx={i} />)}
                </div>
              )}

              {/* Subcategories */}
              {section.subcategories && section.subcategories.map((sub, sIdx) => (
                <div key={sIdx} style={{ marginTop: section.items ? '4rem' : '1rem' }}>
                  <div className="rustic-section-box" style={{ textAlign: 'center', marginBottom: '2.5rem', padding: '1.5rem' }}>
                    <h3 className="script-font neon-red" style={{ fontSize: '2.5rem', margin: 0 }}>{sub.title}</h3>
                    {sub.description && <p className="text-gray" style={{ marginTop: '0.75rem', fontSize: '1.1rem', fontWeight: '500', fontStyle: 'italic' }}>{sub.description}</p>}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))', gap: '2rem', perspective: 1200 }}>
                     {sub.items.map((item, i) => <ItemCard key={i} item={item} idx={i} />)}
                  </div>
                </div>
              ))}

            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center relative" style={{ padding: '4rem 0', backgroundColor: 'var(--background)', borderTop: '2px dashed var(--border)', zIndex: 50 }}>
          <div className="container flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="anton-font text-foreground" style={{ fontSize: '1.875rem' }}>Buenos Mexican <span className="text-primary">Restaurant</span></div>
            
            <p className="text-gray" style={{ fontSize: '0.875rem', fontWeight: '500' }}>© 2026 Buenos Mexican Cuisine. All rights reserved.</p>
            
            <div className="flex gap-6 items-center">
              <a href="https://www.facebook.com/profile.php?id=61571573732880" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/buenosmexican?fbclid=IwY2xjawRznhRleHRuA2FlbQIxMABicmlkETFQbkZOR1hqazAxSEpCNEFNc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHs0VzzJDWjePzxFG9a_AWF5tmBH8bmLqkP2YgFiBI6ZEGTjRA7RrfVC56QOx_aem_BKVr468BcDo4txoIxBuIcg" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="https://www.tiktok.com/@buenosmexican?fbclid=IwY2xjawRznfpleHRuA2FlbQIxMABicmlkETFQbkZOR1hqazAxSEpCNEFNc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHop9ctZCrvyq4KyxuTUuHMc5wQqZKr04ypQpB8h8X0Wib7fpCS3LT8LtW9vr_aem_13NfEpKva0QHSvE7Kwt_QQ" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.81-.6-4.03-1.42-.88-.65-1.59-1.47-2.11-2.42v10.17c.03 2.1-.39 4.26-1.89 5.81-1.5 1.55-3.67 2.39-5.87 2.39-2.2 0-4.37-.84-5.87-2.39-1.5-1.55-1.92-3.71-1.89-5.81.03-2.1.45-4.26 1.95-5.81 1.5-1.55 3.67-2.39 5.87-2.39.2 0 .4 0 .6.02v4.03c-.2-.02-.4-.02-.6-.02-1.1 0-2.19.42-2.94 1.19-.75.77-.96 1.85-.98 2.9-.02 1.05.19 2.13.94 2.9.75.77 1.84 1.19 2.94 1.19 1.1 0 2.19-.42 2.94-1.19.75-.77.96-1.85.98-2.9V0h.06z"/></svg>
              </a>
              <a href="https://r.grab.com/o/Zn6bI3Ar" target="_blank" rel="noopener noreferrer" className="footer-social-link" style={{ backgroundColor: '#00B14F', color: '#fff', borderRadius: '50px', padding: '0.4rem 1.2rem', fontSize: '0.75rem', fontWeight: '800', border: 'none', marginLeft: '0.5rem' }}>
                ORDER ON GRAB
              </a>
            </div>
          </div>
        </footer>

      </main>
    </SmoothScroll>
  );
}
