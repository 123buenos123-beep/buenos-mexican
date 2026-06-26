'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function DynamicBackground() {
  const [isMobile, setIsMobile] = useState(false);
  const { scrollYProgress } = useScroll();

  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', isMobile ? '0%' : '20%']);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!window.matchMedia('(pointer: fine)').matches) {
        setIsMobile(true);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, backgroundColor: '#111', overflow: 'hidden' }}>
      <motion.div
        animate={{ scale: [1.1, 1.15] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        style={{ width: '100%', height: '120%', position: 'absolute', top: '-10%', y: yBg }}
      >
        <Image
          src="/images/rustic_hero.png"
          alt="Restaurant background"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))' }} />
      </motion.div>
    </div>
  );
}
