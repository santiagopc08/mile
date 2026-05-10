'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Settings, Plus } from 'lucide-react';
import { PETS_DATA } from './types';
import { SpaceDecorations } from './SpaceDecorations';
import { PresentationPlatform } from './PresentationPlatform';
import { OrbitCarousel } from './OrbitCarousel';
import { PetMetadataPanel } from './PetMetadataPanel';
import { PetGalleryThumbnails } from './PetGalleryThumbnails';

export const PetSpaceHub = () => {
  const [activePetId, setActivePetId] = useState(PETS_DATA[0].id);
  const [radius, setRadius] = useState(300);

  useEffect(() => {
    const handleResize = () => {
      setRadius(window.innerWidth < 640 ? 160 : 280);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activePet = useMemo(() =>
    PETS_DATA.find(p => p.id === activePetId) || PETS_DATA[0]
  , [activePetId]);

  const orbitItems = useMemo(() =>
    PETS_DATA.map(p => ({
      id: p.id,
      image: p.image,
      label: p.name
    }))
  , []);

  return (
    <div className="relative min-h-[900px] w-full overflow-hidden bg-black text-[#e5e2e1] md:min-h-[750px]">
      <div className="pointer-events-none absolute inset-0 bg-mosaic opacity-20" />
      <SpaceDecorations />

      {/* Header */}
      <div className="relative z-50 flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-md">
        <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" />
          VOLVER
        </button>
        <h1 className="text-xs font-black uppercase tracking-[0.4em] text-white">MASCOTAS</h1>
        <button className="text-[#a88a7e] hover:text-white transition-colors">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Pet Selector Rail */}
      <div className="relative z-50 flex justify-center py-6">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/60 p-2 backdrop-blur-2xl sm:gap-4">
          {PETS_DATA.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setActivePetId(pet.id)}
              className="group relative h-10 w-10 overflow-hidden rounded-full transition-all sm:h-12 sm:w-12"
            >
              <img
                src={pet.image}
                alt={pet.name}
                className={`h-full w-full object-cover transition-all duration-500 ${activePetId === pet.id ? 'scale-110 grayscale-0' : 'scale-100 grayscale hover:grayscale-0'}`}
              />
              {activePetId === pet.id && (
                <motion.div
                  layoutId="activeGlow"
                  className="absolute inset-0 rounded-full border-2 border-[#ff7020] shadow-[0_0_15px_#ff7020]"
                />
              )}
            </button>
          ))}
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/20 bg-white/5 text-[#a88a7e] hover:bg-white/10 hover:text-white transition-all sm:h-12 sm:w-12">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="relative z-10 grid grid-cols-1 gap-12 px-6 pt-4 lg:grid-cols-2 lg:px-12 lg:pt-8">

        {/* Left: Content */}
        <div className="order-2 lg:order-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePet.id}
              initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5 }}
            >
              <PetMetadataPanel pet={activePet} />
              <PetGalleryThumbnails images={activePet.gallery} accentColor={activePet.colorAccent} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Visual Stage */}
        <div className="relative order-1 flex min-h-[400px] flex-col items-center justify-center lg:order-2 lg:min-h-[500px]">
          <div className="absolute top-1/2 -translate-y-1/2 w-full">
            <PresentationPlatform accentColor={activePet.colorAccent} />
          </div>

          {/* Centered Holographic Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePet.id}
              initial={{ opacity: 0, scale: 0.8, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: -30 }}
              exit={{ opacity: 0, scale: 1.2, y: -60 }}
              transition={{
                opacity: { duration: 0.4 },
                scale: { duration: 0.4 },
                y: {
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }
              }}
              className="relative z-30 h-64 w-48 overflow-hidden rounded-[32px] border border-white/20 bg-black/20 backdrop-blur-md sm:h-80 sm:w-64"
              style={{
                boxShadow: `0 0 50px ${activePet.colorAccent}22`
              }}
            >
              <motion.img
                src={activePet.image}
                alt={activePet.name}
                className="h-full w-full object-cover"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              {/* Subtle Scanlines on the main card */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%]" />
            </motion.div>
          </AnimatePresence>

          {/* 3D Orbit Carousel */}
          <div className="absolute inset-0 z-40 pointer-events-none">
             <div className="pointer-events-auto h-full w-full flex items-center justify-center">
                <OrbitCarousel
                  items={orbitItems}
                  onSelect={setActivePetId}
                  radius={radius}
                />
             </div>
          </div>
        </div>
      </div>

      {/* Ambient Telemetry */}
      <div className="absolute bottom-6 left-6 z-20 hidden flex-col gap-2 sm:flex">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#00dbe9]" />
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Link_Established: {activePet.name.toUpperCase()}_UNIT</span>
        </div>
        <div className="h-[px] w-32 bg-white/10" />
        <div className="flex items-center gap-3">
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">ROOM_AMBIENCE: SHIP_CABIN_04</span>
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#ff7020]">SYNC_READY</span>
        </div>
      </div>
    </div>
  );
};
