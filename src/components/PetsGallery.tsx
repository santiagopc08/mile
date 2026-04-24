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
    <div className="w-full h-[60vh] min-h-[400px] flex items-center justify-center bg-stone-100 dark:bg-stone-900 overflow-hidden relative rounded-xl border border-stone-200 dark:border-stone-800">
      
      {/* Background static arrangement or a subtle ambient effect */}
      <div className="absolute inset-0 opacity-10 blur-xl">
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
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white dark:border-stone-800 shadow-2xl">
            <motion.img
              src={pets[activeIndex].src}
              alt={pets[activeIndex].name}
              className="w-full h-full object-cover"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 4, ease: "linear" }}
            />
          </div>
          <motion.h3 
            className="mt-6 text-2xl font-black tracking-widest uppercase text-stone-800 dark:text-stone-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {pets[activeIndex].name}
          </motion.h3>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute bottom-8 flex gap-3 z-20">
        {pets.map((_, i) => (
          <button 
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-geometric-accent w-6' : 'bg-stone-400 dark:bg-stone-600'}`}
          />
        ))}
      </div>
    </div>
  );
};
