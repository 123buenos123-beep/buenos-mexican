'use client';

import { motion } from 'framer-motion';

export default function Location() {
  return (
    <section id="location" className="py-24 relative perspective-container">
      <div className="container relative z-10">
        <div className="rustic-section-box" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="script-font text-secondary" 
            style={{ fontSize: 'clamp(3rem, 5vw, 4rem)', marginBottom: '0.5rem' }}
          >
            Visit Us
          </motion.h2>
          <motion.h3 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="anton-font text-foreground" 
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Location & <span className="text-primary">Hours</span>
          </motion.h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Map Embed */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="rustic-section-box"
            style={{ padding: '1rem', marginBottom: 0, transformStyle: 'preserve-3d' }}
          >
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3889.0886836105647!2d100.8666238!3d12.9020188!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31029769d015d659%3A0x381edfb27c52a564!2sBuenos%20Mexican%20Restaurant!5e0!3m2!1sen!2sth!4v1778769428267!5m2!1sen!2sth" 
              width="100%" 
              height="400" 
              style={{ border: 0, borderRadius: '8px' }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Restaurant Location"
            ></iframe>
          </motion.div>

          {/* Location Info */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="flex flex-col gap-6"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="rustic-section-box" style={{ marginBottom: 0, padding: '2rem' }}>
              <h4 className="anton-font text-primary" style={{ fontSize: '1.25rem', letterSpacing: '1px', marginBottom: '0.75rem' }}>ADDRESS</h4>
              <p className="text-foreground" style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                Jomtien Complex, 413/9-10 Thappraya Rd,<br/>
                Pattaya City, Chon Buri 20150
              </p>
            </div>

            <div className="rustic-section-box" style={{ marginBottom: 0, padding: '2rem' }}>
              <h4 className="anton-font text-secondary" style={{ fontSize: '1.25rem', letterSpacing: '1px', marginBottom: '0.75rem' }}>HOURS</h4>
              <ul className="text-foreground" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                <li className="flex justify-between"><span>Tue - Sun</span> <span className="font-bold">12:00 PM - 1:30 AM</span></li>
                <li className="flex justify-between"><span>Monday</span> <span className="font-bold text-primary">CLOSED</span></li>
              </ul>
            </div>
            
            <div className="rustic-section-box" style={{ marginBottom: 0, padding: '2rem' }}>
              <h4 className="anton-font text-primary" style={{ fontSize: '1.25rem', letterSpacing: '1px', marginBottom: '0.75rem' }}>CONTACT</h4>
              <p className="text-foreground" style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                Phone: <span className="font-bold">065 236 2316</span><br/>
                Email: hola@buenosmexicanrestaurant.com
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
