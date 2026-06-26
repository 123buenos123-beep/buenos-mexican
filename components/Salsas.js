'use client';

import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { useRef, useEffect } from 'react';
import Image from 'next/image';

const salsas = [
  {
    name: "Pico De Gallo",
    level: 1,
    desc: "Fresh tomatoes, onions, cilantro, lime & jalapeños. Crisp, bright, and zesty.",
    gradient: 'linear-gradient(145deg, #B83227 0%, #D94535 55%, #E8694F 100%)',
    num: '01',
    image: '/images/pico_final.webp',
  },
  {
    name: "Salsa Verde",
    level: 1,
    desc: "Tomatillos, chilies & fresh herbs — sharp, citrusy punch with just the right heat.",
    gradient: 'linear-gradient(145deg, #2D6A4F 0%, #40916C 55%, #52B788 100%)',
    num: '02',
    image: '/images/verde_final.webp',
  },
  {
    name: "Mango Salsa",
    level: 1,
    desc: "Juicy mangoes, red onion, lime & chili — sweet, spicy & vibrant.",
    gradient: 'linear-gradient(145deg, #C75C0A 0%, #E07818 55%, #F4A646 100%)',
    num: '03',
    image: '/images/mango_final.webp',
  },
  {
    name: "Pineapple Salsa",
    level: 1,
    desc: "Sweet meets heat — fresh pineapple, jalapeños, red onions & cilantro.",
    gradient: 'linear-gradient(145deg, #8A6A00 0%, #B99200 55%, #D4B030 100%)',
    num: '04',
    image: '/images/pineapple_final.webp',
  },
  {
    name: "Salsa Roja",
    level: 2,
    desc: "Roasted tomatoes, chilies, garlic & onions — smooth, savory & deeply flavorful.",
    gradient: 'linear-gradient(145deg, #7A1E1E 0%, #A02828 55%, #C04040 100%)',
    num: '05',
    image: '/images/roja_centered.webp',
  },
  {
    name: "Charred Tomato",
    level: 3,
    desc: "Flame-roasted tomatoes, garlic & jalapeños — smoky, rich and earthy.",
    gradient: 'linear-gradient(145deg, #1C1208 0%, #2E1E0E 55%, #4A3018 100%)',
    num: '06',
    image: '/images/charred_tomato_centered.webp',
  },
  {
    name: "Buenos Hotcha",
    level: 4,
    desc: "Our house hot sauce — bold chili flavor, tangy finish, and serious heat.",
    gradient: 'linear-gradient(145deg, #7C1A0A 0%, #A82010 55%, #CF3020 100%)',
    num: '07',
    image: '/images/hotcha_centered_v2.webp',
  },
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
            opacity: i <= level ? 1 : 0.25,
          }}
        >
          🌶️
        </span>
      ))}
    </div>
  );
}

const ensureLoop = (arr, min = 12) => {
  if (arr.length >= min) return arr;
  const out = [];
  while (out.length < min) out.push(...arr);
  return out;
};

const loopedSalsas = ensureLoop(salsas);

export default function Salsas() {
  const swiperRef = useRef(null);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (swiper?.autoplay) swiper.autoplay.start();
  }, []);

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

      <div style={{ padding: '20px 0', position: 'relative' }}>
        <button className="salsa-arrow salsa-arrow-prev" aria-label="Previous" onClick={() => swiperRef.current?.slidePrev(700, true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button className="salsa-arrow salsa-arrow-next" aria-label="Next" onClick={() => swiperRef.current?.slideNext(700, true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <Swiper
          modules={[Autoplay]}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          spaceBetween={18}
          slidesPerView={1.45}
          loop={true}
          speed={700}
          autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          grabCursor={true}
          breakpoints={{
            640:  { slidesPerView: 2.4, spaceBetween: 20 },
            1024: { slidesPerView: 4,   spaceBetween: 22 },
          }}
          className="salsa-swiper"
        >
          {loopedSalsas.map((salsa, i) => (
            <SwiperSlide key={`${salsa.name}-${i}`}>
              <div className="salsa-card">

                {/* Top — photo */}
                <div className="salsa-card-photo">
                  <Image
                    src={salsa.image}
                    alt={salsa.name}
                    fill
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 26vw"
                    style={{ objectFit: 'cover' }}
                  />
                  {/* Spice badge — top right of photo */}
                  <div className="salsa-card-spice">
                    <SpiceMeter level={salsa.level} />
                  </div>
                </div>

                {/* Bottom — colored info panel */}
                <div className="salsa-card-body" style={{ background: salsa.gradient }}>
                  <div className="salsa-card-num" aria-hidden="true">{salsa.num}</div>
                  <div className="salsa-card-noise" aria-hidden="true" />
                  <span className="salsa-card-heat">{SPICE_LABELS[salsa.level - 1]}</span>
                  <h3 className="salsa-card-name script-font">{salsa.name}</h3>
                  <p className="salsa-card-desc">{salsa.desc}</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style>{`
        .salsa-arrow {
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
        .salsa-arrow:hover {
          background: rgba(62, 39, 35, 0.95);
          border-color: rgba(255, 215, 0, 0.9);
          transform: translateY(-50%) scale(1.1);
        }
        .salsa-arrow-prev { left: 12px; }
        .salsa-arrow-next { right: 12px; }
        .salsa-card {
          border-radius: 22px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28);
        }
        @media (hover: hover) {
          .salsa-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .salsa-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 14px 40px rgba(0, 0, 0, 0.35);
          }
        }

        /* Top photo section — 55% of card */
        .salsa-card-photo {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          flex-shrink: 0;
        }
        .salsa-card-photo :global(img) {
          transition: transform 0.6s ease;
        }
        .salsa-card:hover .salsa-card-photo :global(img) {
          transform: scale(1.06);
        }

        /* Spice badge on the photo */
        .salsa-card-spice {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 10;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 5px 10px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* Bottom colored panel */
        .salsa-card-body {
          position: relative;
          overflow: hidden;
          padding: 1.1rem 1.2rem 1.25rem;
          flex: 1;
        }
        .salsa-card-num {
          position: absolute;
          bottom: -0.2em;
          right: -0.05em;
          font-size: 6rem;
          font-family: var(--font-alfa);
          font-weight: 900;
          color: rgba(255, 255, 255, 0.07);
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }
        .salsa-card-noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          background-size: 200px 200px;
          pointer-events: none;
          opacity: 0.4;
          mix-blend-mode: overlay;
        }
        .salsa-card-heat {
          display: block;
          position: relative;
          z-index: 2;
          font-size: 0.63rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.25rem;
        }
        .salsa-card-name {
          position: relative;
          z-index: 2;
          margin: 0 0 0.45rem;
          font-size: 1.4rem;
          font-weight: bold;
          color: #fff;
          line-height: 1.2;
          letter-spacing: 0.2px;
        }
        .salsa-card-desc {
          position: relative;
          z-index: 2;
          margin: 0;
          font-size: 0.76rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.75);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}
