'use client';

import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import Image from 'next/image';
import { Autoplay, Navigation, Pagination, FreeMode } from 'swiper/modules';

import { menuData } from '@/lib/menu-data';

export default function MenuCategories() {
  return (
    <section className="py-24" style={{ borderTop: '2px dashed var(--secondary)', background: 'linear-gradient(to bottom, rgba(244, 236, 216, 0.5), transparent)' }}>
      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="container"
      >
        <div className="flex flex-col md-flex-row justify-between items-center" style={{ marginBottom: '4rem' }}>
          <div>
            <h2 className="script-font" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)' }}>Our Quick Menu</h2>
            <p className="text-gray" style={{ fontSize: '1.1rem', marginTop: '0.5rem', fontWeight: '600', backgroundColor: 'rgba(255, 215, 0, 0.15)', padding: '4px 12px', borderRadius: '4px', display: 'inline-block' }}>
              Swipe to <span className="text-primary">explore</span> or click to jump to a section
            </p>
          </div>
          <a href="/menu" style={{ marginTop: '1rem' }}><button className="uppercase tracking-widest font-bold view-menu-btn">View Full Menu</button></a>
        </div>
        
        <div className="quick-menu-swiper-container" style={{ padding: '20px 0' }}>
          <Swiper
            modules={[Autoplay, Navigation, Pagination, FreeMode]}
            spaceBetween={30}
            slidesPerView={1}
            loop={true}
            freeMode={true}
            speed={4000}
            autoplay={{
              delay: 0,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            grabCursor={true}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 4 },
            }}
            style={{ paddingBottom: '50px' }}
            className="quick-menu-swiper"
          >
            {menuData.map((section, i) => (
              <SwiperSlide key={i}>
                <a href={`/menu#${section.slug}`} style={{ display: 'block' }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="menu-cat-card"
                    style={{ height: '350px', cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: '24px', border: '2px dashed var(--secondary)' }}
                  >
                    <div className="menu-cat-overlay" style={{ background: 'linear-gradient(to top, rgba(62, 39, 35, 0.8), transparent)', position: 'absolute', inset: 0, zIndex: 10 }}></div>
                    <div className="menu-cat-bg" style={{ position: 'absolute', inset: 0, backgroundColor: '#fff' }}>
                      <Image 
                        src={section.image} 
                        alt={section.category} 
                        fill
                        style={{ objectFit: 'cover', opacity: 0.9 }} 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>
                    <div style={{ position: 'absolute', bottom: '2rem', left: '1.5rem', zIndex: 20 }}>
                      <h3 className="anton-font" style={{ fontSize: '2rem', color: '#fff', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{section.category}</h3>
                      <div className="flex items-center gap-2" style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', backgroundColor: 'rgba(255, 215, 0, 0.9)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '4px', display: 'inline-flex' }}>
                        <span>Explore</span>
                        <span style={{ fontSize: '1rem' }}>→</span>
                      </div>
                    </div>
                  </motion.div>
                </a>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </motion.div>
    </section>
  );
}

