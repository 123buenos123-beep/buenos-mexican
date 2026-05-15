'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';

export default function Hero() {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end start'],
  });

  const rotateXText = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const scaleText = useTransform(scrollYProgress, [0, 1], [1, 0.5]);
  const opacityText = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const yText = useTransform(scrollYProgress, [0, 1], ['0vh', '-20vh']);

  return (
    <section id="home" ref={container} className="relative min-h-screen flex flex-col items-center justify-center pb-32 pt-40" style={{ position: 'relative', perspective: '1200px', transformStyle: 'preserve-3d', overflow: 'hidden' }}>

      <motion.div 
        className="z-10 flex flex-col items-center text-center container" 
        style={{ 
          zIndex: 10, 
          rotateX: rotateXText, 
          scale: scaleText, 
          opacity: opacityText,
          y: yText,
          transformOrigin: 'bottom center',
          transformStyle: 'preserve-3d'
        }}
      >
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.8, type: "spring" }}
          style={{ marginBottom: '2rem', transform: 'translateZ(100px)' }}
        >
          <Image 
            src="/mexican_hat.svg" 
            alt="Buenos Mexican Sombrero Icon" 
            width={120} 
            height={120}
            priority
          />
        </motion.div>

        <motion.h1 
          className="hero-title font-bold uppercase"
          style={{ 
            fontSize: 'clamp(2.2rem, 10vw, 9rem)',
            marginBottom: '1.5rem', 
            transform: 'translateZ(50px)',
            width: '100%',
            lineHeight: 1
          }}
        >
          TASTE THE <br /> <span className="neon-red">DIFFERENCE</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.5, duration: 1, type: "spring" }}
          className="text-white text-xl"
          style={{ maxWidth: '600px', marginBottom: '2.5rem', transform: 'translateZ(30px)', textShadow: '0px 4px 15px rgba(0,0,0,0.9)', fontWeight: '500' }}
        >
          Enjoy the best authentic Mexican food in Pattaya. We serve delicious tacos, burritos, and margaritas in the heart of Chon Buri. Visit us today!
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20, z: -50 }}
          animate={{ opacity: 1, y: 0, z: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-col md-flex-row gap-4 justify-center items-center w-full"
          style={{ transform: 'translateZ(60px)' }}
        >
          <button className="primary-btn" style={{ width: '90%', maxWidth: '320px' }} onClick={() => document.getElementById('booking').scrollIntoView()}>
            Reserve A Table
          </button>
          <a href="https://r.grab.com/o/Zn6bI3Ar" target="_blank" rel="noopener noreferrer" style={{ width: '90%', maxWidth: '320px' }}>
            <button className="outline-btn" style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff', borderColor: 'var(--primary)', cursor: 'pointer' }}>
              Order on Grab
            </button>
          </a>
        </motion.div>

      </motion.div>
      
      <motion.div 
        animate={{ y: [0, 15, 0], scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute text-center"
        style={{ bottom: '2.5rem', zIndex: 20 }}
      >
        <span style={{ display: 'block', width: '3px', height: '50px', backgroundColor: 'var(--primary)', margin: '0 auto 8px auto', boxShadow: '0px 0px 10px rgba(0,0,0,0.5)' }}></span>
        <p className="text-xs text-white font-bold uppercase tracking-widest" style={{ textShadow: '0px 2px 5px rgba(0,0,0,0.8)' }}>Scroll</p>
      </motion.div>
    </section>
  );
}
