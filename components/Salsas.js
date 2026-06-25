'use client';

import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import Image from 'next/image';

const salsas = [
  { name: "Pico De Gallo",       level: 1, desc: "Fresh and chunky—tomatoes, onions, cilantro, lime & jalapeños for a zesty, crisp bite.",        image: "/images/pico_final.webp" },
  { name: "Salsa Verde",          level: 1, desc: "Green tomatoes, chilies & fresh herbs deliver a sharp, citrusy punch with just the right heat.", image: "/images/verde_final.webp" },
  { name: "Mango Salsa",          level: 1, desc: "Juicy mangoes, red onion, lime & chili—sweet, spicy & vibrant. Perfect with grilled meats.",   image: "/images/mango_final.webp" },
  { name: "Pineapple Salsa",      level: 1, desc: "Sweet meets heat—fresh pineapple, jalapeños, red onions & cilantro. Bright and refreshing.",    image: "/images/pineapple_final.webp" },
  { name: "Salsa Roja",           level: 2, desc: "Roasted tomatoes, chilies, garlic & onions—smooth, savory & deeply flavorful with a kick.",      image: "/images/roja_centered.webp" },
  { name: "Charred Tomato Salsa", level: 3, desc: "Smoky & rich—flame-roasted tomatoes, garlic & jalapeños deliver a deep, earthy heat.",          image: "/images/charred_tomato_centered.webp" },
  { name: "Buenos Hotcha",        level: 4, desc: "Our fiery house hot sauce—bold chili flavor with a tangy finish. Buenos Hotcha brings the heat!", image: "/images/hotcha_centered_v2.webp" },
];

const SPICE_LABELS = ['Mild', 'Medium', 'Hot', 'Extra Hot'];

function SpiceMeter({ level }) {
  return (
    <div
      style={{ display: 'flex', gap: '3px', alignItems: 'center' }}
      role="img"
      aria-label={`Spice level: ${SPICE_LABELS[level - 1]}`}
    >
      {[1, 2, 3, 4].map(i => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            fontSize: '0.85rem',
            lineHeight: 1,
            filter: i <= level ? 'none' : 'grayscale(1)',
            opacity: i <= level ? 1 : 0.3,
          }}
        >
          🌶️
        </span>
      ))}
    </div>
  );
}

export default function Salsas() {
  return (
    <section
      id="salsas"
      className="py-24"
      style={{
        borderTop: '2px dashed var(--secondary)',
        background: 'linear-gradient(to bottom, rgba(244, 236, 216, 0.5), transparent)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="container"
      >
        {/* ── Header (matches "Our Quick Menu") ── */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 className="script-font neon-gold" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 'bold', lineHeight: 1.1 }}>
            Our Salsas
          </h2>
          <p
            className="text-gray"
            style={{
              fontSize: '1.1rem', marginTop: '0.75rem', fontWeight: 600,
              backgroundColor: 'rgba(255, 215, 0, 0.15)', padding: '4px 12px',
              borderRadius: '4px', display: 'inline-block',
            }}
          >
            House-made fresh daily · <span className="text-primary">ranked by spice</span>
          </p>
        </div>
      </motion.div>

      {/* ── Salsa marquee (auto-scrolls right → left, opposite the Quick Menu) ── */}
      <div className="salsa-swiper-container" style={{ padding: '20px 0' }}>
        <Swiper
          modules={[Autoplay, FreeMode]}
          spaceBetween={28}
          slidesPerView={1.15}
          loop={true}
          freeMode={true}
          speed={4000}
          autoplay={{ delay: 0, disableOnInteraction: false, pauseOnMouseEnter: false, reverseDirection: true }}
          grabCursor={true}
          breakpoints={{ 640: { slidesPerView: 2.2 }, 1024: { slidesPerView: 4 } }}
          className="salsa-swiper"
        >
          {salsas.map((salsa) => (
            <SwiperSlide key={salsa.name}>
              <div className="salsa-card">
                {/* Photo band (top) */}
                <div className="salsa-card-photo">
                  <Image
                    src={salsa.image}
                    alt={salsa.name}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                    style={{ objectFit: 'cover' }}
                  />
                  {/* soft fade into the panel below */}
                  <div className="salsa-card-photo-fade" />
                  {/* Spice badge — top right */}
                  <div className="salsa-card-spice">
                    <SpiceMeter level={salsa.level} />
                  </div>
                </div>

                {/* Info panel (bottom) */}
                <div className="salsa-card-info">
                  <h3
                    className="script-font"
                    style={{
                      fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--neon-gold)',
                      letterSpacing: '0.5px', textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                      marginBottom: '0.45rem', lineHeight: 1.15,
                    }}
                  >
                    {salsa.name}
                  </h3>
                  <p style={{ color: '#F3E9D8', fontSize: '0.82rem', lineHeight: 1.55, opacity: 0.92 }}>
                    {salsa.desc}
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style>{`
        .salsa-card {
          position: relative;
          display: flex;
          flex-direction: column;
          border-radius: 24px;
          overflow: hidden;
          border: 2px dashed var(--secondary);
          box-shadow: 0 8px 24px rgba(62, 39, 35, 0.12);
          background: rgba(62, 39, 35, 0.96);
        }
        .salsa-card-photo {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          flex-shrink: 0;
          overflow: hidden;
        }
        .salsa-card-photo :global(img) { transition: transform 0.7s ease; }
        .salsa-card:hover .salsa-card-photo :global(img) { transform: scale(1.08); }
        .salsa-card-photo-fade {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 25%;
          background: linear-gradient(to top, rgba(62, 39, 35, 0.18), transparent);
          z-index: 5;
          pointer-events: none;
        }
        .salsa-card-spice {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 20;
          background: rgba(62, 39, 35, 0.72);
          backdrop-filter: blur(6px);
          padding: 5px 10px;
          border-radius: 20px;
          border: 1px solid rgba(255, 215, 0, 0.35);
        }
        .salsa-card-info {
          height: 138px;
          z-index: 20;
          padding: 1.05rem 1.25rem 1.25rem;
          border-top: 2px dashed var(--secondary);
        }
        .salsa-card-info p {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}
