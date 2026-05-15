'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';

const specials = [
  { day: 'Monday', title: 'Restaurant Closed', desc: 'Resting up for the week ahead!', active: false },
  { day: 'Tuesday', title: 'Margarita Madness', desc: 'Half-price on all house margaritas.', active: true },
  { day: 'Wednesday', title: 'Nacho Night', desc: 'Loaded nachos for the table, 30% off.', active: true },
  { day: 'Thursday', title: 'Taco Discount', desc: 'Buy 2 get 1 free on all street tacos.', active: true },
  { day: 'Friday', title: 'Fajita Fiesta', desc: 'Sizzling fajitas with a complimentary side.', active: true },
  { day: 'Saturday', title: 'Burrito Bash', desc: 'Our massive California burritos on special.', active: true },
  { day: 'Sunday', title: 'Quesadilla Chill', desc: 'Relax with our signature stuffed quesadillas.', active: true },
];

const SpecialCard = ({ special, index }) => {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useTransform(y, [0, 1], [10, -10]);
  const rotateY = useTransform(x, [0, 1], [-10, 10]);

  function handleMouseMove(event) {
    if (!special.active) return;
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: 0.2 + (index * 0.15), duration: 0.6, ease: "easeOut" }}
      style={{ transformStyle: 'preserve-3d' }}
      whileHover={special.active ? { scale: 1.05, boxShadow: "0 20px 40px rgba(62,39,35,0.15)" } : {}}
      className={`specials-card ${special.active ? 'active' : 'inactive'}`}
    >
      <h3 className="script-font" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: special.day === 'Monday' ? '#888' : 'var(--primary)', transform: 'translateZ(40px)' }}>{special.day}</h3>
      <h4 className="text-foreground" style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', transform: 'translateZ(30px)' }}>{special.title}</h4>
      <p className="text-gray" style={{ transform: 'translateZ(20px)' }}>{special.desc}</p>
      
      {special.active && (
         <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--secondary)', borderRadius: '8px', transform: 'translateZ(-20px)', pointerEvents: 'none', opacity: 0.2 }}></div>
      )}
    </motion.div>
  );
}

export default function Specials() {
  return (
    <section id="specials" className="py-24 relative perspective-container">
      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="container relative z-10 solid-content-card"
      >
        
        <motion.div 
          initial={{ opacity: 0, rotateY: -30, z: -100 }}
          whileInView={{ opacity: 1, rotateY: 0, z: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center"
          style={{ marginBottom: '4rem', transformStyle: 'preserve-3d' }}
        >
          <h2 className="script-font" style={{ fontSize: 'clamp(3.5rem, 6vw, 5rem)', marginBottom: '1rem', transform: 'translateZ(50px)' }}>Daily Specials</h2>
          <p className="text-gray" style={{ maxWidth: '600px', margin: '0 auto', transform: 'translateZ(20px)' }}>Every day is a fiesta at Buenos Mexican Cuisine. Check out what we're serving up today!</p>
        </motion.div>

        <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-6" style={{ perspective: 1500 }}>
          {specials.map((special, index) => (
            <SpecialCard key={index} special={special} index={index} />
          ))}
        </div>

      </motion.div>
    </section>
  );
}
