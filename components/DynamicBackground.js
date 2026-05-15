'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';

const dayBackgrounds = {
  Monday: '/images/rustic_hero.png',
  Tuesday: '/images/tacos_hero.png',
  Wednesday: '/images/nachos.webp',
  Thursday: '/images/margarita_hero.png',
  Friday: '/images/fajitas.webp',
  Saturday: '/images/burritos.webp',
  Sunday: '/images/quesadillas.webp'
};

export default function DynamicBackground() {
  const [currentDay, setCurrentDay] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const { scrollYProgress } = useScroll();
  
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', isMobile ? '0%' : '20%']);

  useEffect(() => {
    const today = new Date();
    const options = { timeZone: 'Asia/Bangkok', weekday: 'long' };
    const dayName = new Intl.DateTimeFormat('en-US', options).format(today);
    setCurrentDay(dayName);
    
    if (!window.matchMedia('(pointer: fine)').matches) {
      setIsMobile(true);
    }
  }, []);

  // Default to a dark generic background before hydration finishes
  const bgImage = currentDay ? dayBackgrounds[currentDay] : '/images/rustic_hero.png';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, backgroundColor: '#111', overflow: 'hidden' }}>
      <motion.div 
        animate={{ scale: [1.1, 1.15] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        style={{ width: '100%', height: '120%', position: 'absolute', top: '-10%', y: yBg }}
      >
        <Image 
          src={bgImage} 
          alt="Daily Special Background" 
          fill 
          priority
          style={{ objectFit: 'cover' }} 
        />
        {/* Dark Overlay for Readability */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))' }}></div>
      </motion.div>
    </div>
  );
}
