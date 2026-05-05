'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const pets = [
  { name: 'Kiaro', src: '/img/pets/Kiaro.png' },
  { name: 'Miel', src: '/img/pets/Miel.png' },
  { name: 'Sam', src: '/img/pets/Sam.png' },
  { name: 'Nika', src: '/img/pets/Nika.png' }
];

export const PetsGallery = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % pets.length);
    }, 4000); // 4 seconds per pet
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-[60vh] min-h-[420px] w-full items-center justify-center overflow-hidden border border-white/10 bg-[#0a0a0a]">
      <div className="pointer-events-none absolute inset-0 bg-mosaic opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-between border-b border-white/10 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.24em] text-[#a88a7e]">
        <span>COMPANION_GALLERY</span>
        <span className="text-[#00dbe9]">{String(activeIndex + 1).padStart(2, '0')} / {String(pets.length).padStart(2, '0')}</span>
      </div>
      
      {/* Background static arrangement or a subtle ambient effect */}
      <div className="absolute inset-0 opacity-20 blur-xl grayscale">
        <motion.img 
          key={`bg-${activeIndex}`}
          src={pets[activeIndex].src} 
          className="w-full h-full object-cover"
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 2 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, scale: 0.8, x: -50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 1.2, x: 50 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="relative h-64 w-64 overflow-hidden border border-[#ff7020]/70 bg-black p-2 md:h-80 md:w-80">
            <div className="pointer-events-none absolute inset-0 z-10 border border-white/10" />
            <motion.img
              src={pets[activeIndex].src}
              alt={pets[activeIndex].name}
              className="h-full w-full object-cover"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 4, ease: "linear" }}
            />
          </div>
          <motion.h3 
            className="mt-6 border border-white/10 bg-black px-6 py-3 text-2xl font-black uppercase tracking-normal text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {pets[activeIndex].name}
          </motion.h3>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute bottom-8 z-20 flex gap-3">
        {pets.map((_, i) => (
          <button 
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-2 transition-all ${i === activeIndex ? 'w-8 bg-[#ff7020]' : 'w-2 bg-white/25 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
};
