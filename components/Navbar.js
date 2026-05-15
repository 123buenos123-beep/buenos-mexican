'use client';

import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="navbar" style={{ 
      zIndex: 100, 
      backgroundColor: scrolled ? 'rgba(26, 26, 26, 0.98)' : 'rgba(0, 0, 0, 0.6)',
      borderBottom: scrolled ? '2px dashed var(--primary)' : '1px solid rgba(255,255,255,0.1)',
      padding: scrolled ? '16px 0' : '32px 0',
      color: '#fff',
      transition: 'all 0.4s ease',
      backdropFilter: 'blur(8px)'
    }}>
      <div className="flex justify-between items-center" style={{ width: '100%', padding: '0 5%' }}>
        <a href="/" className="anton-font flex items-center gap-4 lg:gap-10" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', color: '#fff', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.5)', lineHeight: 1 }}>
          <span className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
            <span>Buenos Mexican</span>
            <span className="text-primary" style={{ textShadow: '0 2px 8px rgba(139, 28, 28, 0.4)' }}>Restaurant</span>
          </span>
        </a>
        
        {/* Desktop Menu */}
        <ul className="desktop-menu gap-8 uppercase tracking-widest items-center" style={{ fontSize: '0.8rem', fontWeight: '500', margin: 0 }}>
          <li><a href="/#home" className="nav-link" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Home</a></li>
          <li><a href="/menu" className="nav-link" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Menu</a></li>
          <li><a href="/#booking" className="nav-link" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Booking</a></li>
          <li><a href="/#specials" className="nav-link" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Specials</a></li>
          <li><a href="/#location" className="nav-link" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Location</a></li>
        </ul>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn flex flex-col gap-1.5 z-50 relative ml-auto" onClick={() => setIsOpen(!isOpen)} style={{ padding: '0.75rem', minWidth: '44px', minHeight: '44px', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ display: 'block', width: '28px', height: '3px', backgroundColor: '#fff', transition: '0.3s', transform: isOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none' }}></span>
          <span style={{ display: 'block', width: '28px', height: '3px', backgroundColor: '#fff', transition: '0.3s', opacity: isOpen ? 0 : 1 }}></span>
          <span style={{ display: 'block', width: '28px', height: '3px', backgroundColor: '#fff', transition: '0.3s', transform: isOpen ? 'rotate(-45deg) translate(7px, -7px)' : 'none' }}></span>
        </button>
      </div>

      {/* Mobile Menu Overlay (Drawer Style) */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        width: '100%', 
        height: '100vh', 
        backgroundColor: 'rgba(26, 26, 26, 0.98)', 
        zIndex: 40,
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2rem', 
        alignItems: 'center', 
        justifyContent: 'center',
        transition: 'transform 0.4s ease-in-out',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        backdropFilter: 'blur(10px)'
      }}>
        <a href="/#home" className="nav-link uppercase tracking-widest font-bold text-2xl" onClick={() => setIsOpen(false)} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Home</a>
        <a href="/menu" className="nav-link uppercase tracking-widest font-bold text-2xl" onClick={() => setIsOpen(false)} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Menu</a>
        <a href="/#booking" className="nav-link uppercase tracking-widest font-bold text-2xl" onClick={() => setIsOpen(false)} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Booking</a>
        <a href="/#specials" className="nav-link uppercase tracking-widest font-bold text-2xl" onClick={() => setIsOpen(false)} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Daily Specials</a>
        <a href="/#location" className="nav-link uppercase tracking-widest font-bold text-2xl" onClick={() => setIsOpen(false)} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Location</a>
      </div>
    </nav>
  );
}
