'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PawPrint, Calendar, Edit2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { TimelineService } from '@/services/timelineService';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/context/ProfileContext';

interface Pet {
  id: string;
  name: string;
  src: string;
  designation: string;
  birthDate: string;
  gender: string;
  role: string;
  description: string;
  accent: string;
  o2: number;
  temp: number;
  gallery: string[];
}

const PETS: Pet[] = [
  {
    id: 'kiaro',
    name: 'Kiaro',
    src: '/img/pets/Kiaro.png',
    designation: 'MACHO',
    birthDate: '15 MAR 2019',
    gender: '♂',
    role: 'Guardián Principal',
    description: 'Protector del perímetro y líder de manada.',
    accent: '#ff7020',
    o2: 99.1,
    temp: 22.8,
    gallery: ['/img/pets/Kiaro.png'],
  },
  {
    id: 'nika',
    name: 'Nika',
    src: '/img/pets/Nika.png',
    designation: 'HEMBRA',
    birthDate: '22 OCT 2021',
    gender: '♀',
    role: 'Exploradora',
    description: 'Exploradora del cosmos y guardiana de sueños.',
    accent: '#00dbe9',
    o2: 98.5,
    temp: 22.4,
    gallery: ['/img/pets/Nika.png'],
  },
  {
    id: 'sam',
    name: 'Sam',
    src: '/img/pets/Sam.png',
    designation: 'HEMBRA',
    birthDate: '08 JUN 2020',
    gender: '♀',
    role: 'Navegante',
    description: 'Navegante estelar y compañero de misiones.',
    accent: '#a100f0',
    o2: 97.8,
    temp: 23.1,
    gallery: ['/img/pets/Sam.png'],
  },
  {
    id: 'miel',
    name: 'Miel',
    src: '/img/pets/Miel.png',
    designation: 'HEMBRA',
    birthDate: '30 DEC 2018',
    gender: '♀',
    role: 'Oficial Médico',
    description: 'Oficial médico y especialista en confort.',
    accent: '#ffb595',
    o2: 98.9,
    temp: 22.6,
    gallery: ['/img/pets/Miel.png'],
  },
];

// --- Sub-components ---

function SpaceDecorations({ isWarping, direction, petAccent, profileAccent }: { isWarping: boolean; direction: number; petAccent: string; profileAccent: string }) {
  const stars = useMemo(() => Array.from({ length: 40 }).map(() => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 1.5 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
  })), []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      <style>{`
        @keyframes pulse-star {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.8; }
        }
        @keyframes warp-star {
          0% { transform: scale(1) translateX(0); opacity: 0.8; }
          100% { transform: scale(10) translateX(var(--warp-dir)); opacity: 0; }
        }
      `}</style>

      {/* Dynamic performance-friendly radial gradient nebulas */}
      <div 
        className="absolute inset-0 opacity-65 transition-all duration-1000"
        style={{
          background: `
            radial-gradient(circle at 25% 35%, ${petAccent}44 0%, transparent 70%),
            radial-gradient(circle at 75% 65%, ${profileAccent}33 0%, transparent 75%)
          `,
          filter: 'blur(45px)'
        }}
      />

      {/* Background stars using pure CSS animations for high performance */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full mix-blend-screen"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: isWarping
              ? `warp-star 0.6s ease-in forwards`
              : `pulse-star ${star.duration}s ease-in-out infinite`,
            animationDelay: isWarping ? '0s' : `${star.delay}s`,
            ['--warp-dir' as any]: `${direction * -300}px`
          }}
        />
      ))}

      {/* Nebula glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[100px] mix-blend-screen opacity-40" style={{ backgroundColor: profileAccent }} />
    </div>
  );
}

function OrbitalViewport({ 
  pet, 
  isWarping, 
  direction, 
  onPrev, 
  onNext, 
  hearts,
  profileAccent
}: { 
  pet: Pet; 
  isWarping: boolean; 
  direction: number; 
  onPrev: () => void; 
  onNext: () => void; 
  hearts: { id: number; x: number; y: number }[];
  profileAccent: string;
}) {
  return (
    <div className="relative flex flex-col items-center gap-0 w-full max-w-3xl py-10 overflow-hidden">

      {/* Deep Space Background behind the viewport */}
      <div className="absolute inset-0">
        <SpaceDecorations isWarping={isWarping} direction={direction} petAccent={pet.accent} profileAccent={profileAccent} />
      </div>

      {/* Floating hearts particles overlay */}
      <AnimatePresence>
        {hearts.map(h => (
          <motion.span
            key={h.id}
            initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 1.6, x: h.x, y: h.y }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute z-30 text-2xl pointer-events-none"
            style={{ left: '50%', top: '40%', translate: '-50% -50%' }}
          >
            ❤️
          </motion.span>
        ))}
      </AnimatePresence>

      {/* Sliding Assembly: viewport + platform */}
      <div className="relative w-full h-[360px] sm:h-[400px]">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={pet.id}
            custom={direction}
            initial={{ x: direction * 200, opacity: 0, filter: 'blur(10px)' }}
            animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ x: direction * -200, opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-0 flex flex-col items-center z-10 w-full"
          >
            {/* Spinning rings + pet photo */}
            <div
              className="relative w-48 h-48 sm:w-64 sm:h-64 flex-shrink-0 z-20 translate-y-[-1px]"
              style={{ animation: 'holo-float 4s ease-in-out infinite' }}
            >
              {/* Outer spinning circle */}
              <div
                className="absolute inset-0 border-2 border-white/5 rounded-full"
                style={{ animation: 'spin 10s linear infinite', borderTopColor: pet.accent }}
              />
              {/* Inner spinning circle */}
              <div
                className="absolute inset-2 border border-white/5 rounded-full"
                style={{ animation: 'spin 15s linear infinite reverse', borderBottomColor: 'var(--color-profile-accent)' }}
              />
              {/* Viewport */}
              <div className="absolute inset-4 rounded-full overflow-hidden border border-white/20 backdrop-blur-md shadow-[inset_0_0_30px_rgba(0,0,0,1)]">
                <img
                  src={pet.src}
                  alt={pet.name}
                  className="w-full h-full object-cover contrast-125 saturate-110 mix-blend-luminosity hover:mix-blend-normal transition-all duration-500 rounded-full"
                />

                {/* Holo scanning line effect */}
                <motion.div
                  className="absolute inset-x-0 h-px opacity-60 z-30"
                  style={{ backgroundColor: pet.accent, boxShadow: `0 0 15px ${pet.accent}` }}
                  animate={{ top: ['-10%', '110%', '-10%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
              {/* Glow */}
              <div
                className="absolute inset-4 rounded-full pointer-events-none"
                style={{ boxShadow: `0 0 50px ${pet.accent}33, inset 0 0 20px ${pet.accent}22` }}
              />
            </div>

            {/* Platform image below the orbital rings */}
            <div
              className="relative w-[300px] sm:w-[460px] -mt-16 z-10 pointer-events-none"
              style={{ animation: 'holo-glow 4s ease-in-out infinite' }}
            >
              <img
                src="/img/pets/platform2.png"
                alt="Presentation Platform"
                className="w-full h-auto drop-shadow-2xl"
              />
              {/* Pet name overlaid on the "NOMBRE" position */}
              <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 text-center">
                <span
                  className="text-xs sm:text-base font-black uppercase tracking-[0.35em] font-mono"
                  style={{ color: pet.accent, textShadow: `0 0 15px ${pet.accent}` }}
                >
                  {pet.name}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav arrows */}
      <div className="flex items-center gap-6 mt-4 z-20">
        <button onClick={onPrev} className="!min-h-0 border border-white/10 bg-black/40 backdrop-blur-sm p-3 text-[#a88a7e] hover:text-white hover:border-white/30 hover:bg-white/5 transition-colors rounded-full">
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[8px] tracking-[0.4em] mt-1 opacity-70" style={{ color: 'var(--color-profile-accent)' }}>ONLINE</span>
        </div>
        <button onClick={onNext} className="!min-h-0 border border-white/10 bg-black/40 backdrop-blur-sm p-3 text-[#a88a7e] hover:text-white hover:border-white/30 hover:bg-white/5 transition-colors rounded-full">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function PetSelector({ pets, activeId, onSelect }: { pets: Pet[]; activeId: string; onSelect: (id: string, index: number) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
      {pets.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id, i)}
          className={`relative flex-shrink-0 flex items-center gap-3 border px-4 py-3 transition-all font-mono text-[10px] uppercase tracking-[0.2em] rounded-none ${p.id === activeId
            ? 'border-profile-accent bg-profile-accent/10 text-white'
            : 'border-white/10 bg-black/40 text-[#a88a7e] hover:border-white/20 hover:text-white'
            }`}
        >
          <div className={`w-8 h-8 overflow-hidden border rounded-full ${p.id === activeId ? 'border-profile-accent' : 'border-white/10'}`}>
            <img src={p.src} alt={p.name} className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-black">{p.name}</span>
            <span className="text-[8px] opacity-50">BEBÉ_{String(i + 1).padStart(2, '0')}</span>
          </div>
          {p.id === activeId && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-profile-accent" />}
        </button>
      ))}
    </div>
  );
}

function HabitatModule({
  pet,
  photos,
  currentIndex,
  direction,
  onPrev,
  onNext,
  onSelect,
  joy,
  warmth,
  onGiveCuddles,
  onGiveWarmth,
  onSaveDetails,
  onMouseEnter,
  onMouseLeave
}: {
  pet: Pet;
  photos: string[];
  currentIndex: number;
  direction: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  joy: number;
  warmth: number;
  onGiveCuddles: () => void;
  onGiveWarmth: () => void;
  onSaveDetails: (updatedPet: Pet) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editRole, setEditRole] = useState(pet.role);
  const [editDesc, setEditDesc] = useState(pet.description);
  const [editBirthDate, setEditBirthDate] = useState(pet.birthDate);
  const [editDesignation, setEditDesignation] = useState(pet.designation);

  // Sync state with active pet
  useEffect(() => {
    setEditRole(pet.role);
    setEditDesc(pet.description);
    setEditBirthDate(pet.birthDate);
    setEditDesignation(pet.designation);
    setIsEditing(false);
  }, [pet]);

  const handleStartEdit = () => {
    setEditRole(pet.role);
    setEditDesc(pet.description);
    setEditBirthDate(pet.birthDate);
    setEditDesignation(pet.designation);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSaveDetails({
      ...pet,
      role: editRole,
      description: editDesc,
      birthDate: editBirthDate,
      designation: editDesignation,
      gender: editDesignation === 'MACHO' ? '♂' : '♀'
    });
    setIsEditing(false);
  };

  const variants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 90 : -90,
      z: -300,
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      filter: "blur(10px) brightness(0.5)"
    }),
    center: {
      zIndex: 1,
      rotateY: 0,
      z: 0,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px) brightness(1)"
    },
    exit: (dir: number) => ({
      zIndex: 0,
      rotateY: dir < 0 ? 90 : -90,
      z: -300,
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      filter: "blur(10px) brightness(0.5)"
    })
  };

  return (
    <div className="relative border border-white/10 bg-[#0a0a0a] p-5 sm:p-6 pl-10 sm:pl-12 rounded-none overflow-hidden h-full flex flex-col justify-between">
      {/* Solid Left Accent Stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: pet.accent }} />

      <div className="flex flex-col h-full justify-between">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-white font-sans">Espacio de Vida</h3>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#a88a7e] font-mono mt-1">BEBÉ: {pet.name}</p>
          </div>
          <span className="border border-profile-accent/40 bg-profile-accent/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-profile-accent rounded-none">
            ● ESTABLE
          </span>
        </div>

        {/* Pet Image Carousel */}
        <div 
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="relative w-full min-h-[320px] sm:min-h-[350px] max-w-md mx-auto mb-6 overflow-hidden border border-white/10 bg-black group flex items-center justify-center rounded-none" 
          style={{ perspective: "2000px" }}
        >
          <div className="absolute inset-0 bg-mosaic opacity-30 pointer-events-none z-10" />

          {/* Ghost image to drive dynamic height */}
          <img
            src={photos[currentIndex] || pet.src}
            alt=""
            className="w-full h-auto opacity-0 pointer-events-none invisible"
          />
          
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={photos[currentIndex] || pet.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                rotateY: { type: "spring", stiffness: 200, damping: 20 },
                default: { duration: 0.4 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                const swipe = info.offset.x;
                if (swipe < -50) onNext();
                else if (swipe > 50) onPrev();
              }}
              className="absolute inset-0 p-4 flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
            >
              <img 
                src={photos[currentIndex] || pet.src} 
                alt={pet.name} 
                className="max-w-full max-h-full w-auto h-auto object-contain contrast-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-transform duration-500 hover:scale-[1.02]"
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 pointer-events-none z-10" style={{ boxShadow: `inset 0 0 80px ${pet.accent}15` }} />

          {/* Carousel Controls */}
          {photos.length > 1 && (
            <>
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button onClick={onPrev} className="!min-h-0 p-1.5 bg-[#050505] border border-white/20 text-stone-500 hover:text-white hover:border-profile-accent transition-colors rounded-full">
                  <ChevronLeft size={16} className="stroke-[1.5]" />
                </button>
                <button onClick={onNext} className="!min-h-0 p-1.5 bg-[#050505] border border-white/20 text-stone-500 hover:text-white hover:border-profile-accent transition-colors rounded-full">
                  <ChevronRight size={16} className="stroke-[1.5]" />
                </button>
              </div>
              {/* Indicators */}
              <div className="absolute bottom-0 right-0 z-20 bg-[#050505] border-l border-t border-white/20 px-2 py-1.5 flex gap-1.5 items-center">
                <span className="text-[6px] font-mono text-stone-500 uppercase tracking-widest">IMG</span>
                <div className="flex gap-1">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => onSelect(i)}
                      className={`!min-h-0 w-2 h-2 border transition-colors duration-300 rounded-full ${i === currentIndex ? "bg-profile-accent border-profile-accent" : "border-stone-700 bg-transparent hover:border-stone-400"}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {isEditing ? (
          <div className="mb-5 border border-white/10 bg-black/40 p-4 space-y-3 font-mono">
            <div className="text-[8px] font-bold text-profile-accent uppercase tracking-widest mb-1">EDITAR DATOS DE {pet.name}</div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[6px] text-stone-500 uppercase tracking-widest">Rol / Designación</label>
              <input 
                value={editRole}
                onChange={e => setEditRole(e.target.value)}
                placeholder="Guardián Principal" 
                className="w-full bg-black border border-white/10 px-2 py-1 text-[10px] text-white uppercase outline-none focus:border-profile-accent font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[6px] text-stone-500 uppercase tracking-widest">Descripción</label>
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Descripción de su personalidad..." 
                className="w-full bg-black border border-white/10 px-2 py-1 text-[10px] text-white outline-none focus:border-profile-accent min-h-[48px] font-mono resize-none leading-normal"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[6px] text-stone-500 uppercase tracking-widest">Fecha Especial</label>
                <input 
                  value={editBirthDate}
                  onChange={e => setEditBirthDate(e.target.value)}
                  placeholder="15 MAR 2019" 
                  className="w-full bg-black border border-white/10 px-2 py-1 text-[10px] text-white uppercase outline-none focus:border-profile-accent font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[6px] text-stone-500 uppercase tracking-widest">Identidad</label>
                <select
                  value={editDesignation}
                  onChange={e => setEditDesignation(e.target.value)}
                  className="bg-black border border-white/10 h-[26px] px-1 text-[9px] text-white outline-none font-mono"
                >
                  <option value="MACHO">MACHO</option>
                  <option value="HEMBRA">HEMBRA</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setIsEditing(false)} className="!min-h-0 px-3 py-1 border border-white/10 text-[8px] hover:text-white uppercase font-mono">Cancelar</button>
              <button onClick={handleSave} className="!min-h-0 px-3 py-1 border border-profile-accent bg-profile-accent/15 text-white text-[8px] hover:bg-profile-accent hover:text-black uppercase font-mono">Guardar</button>
            </div>
          </div>
        ) : (
          <>
            {/* Role & Description */}
            <div className="mb-4 border border-white/5 bg-black/20 p-3 font-mono">
              <div className="text-[8px] font-bold uppercase tracking-[0.18em] flex justify-between items-center" style={{ color: pet.accent }}>
                <span>Rol: {pet.role}</span>
                <button 
                  onClick={handleStartEdit}
                  className="text-[#a88a7e] hover:text-profile-accent transition-colors"
                  style={{ '--tw-hover-text-opacity': 1 } as any}
                >
                  <Edit2 size={10} className="stroke-[1.5]" />
                </button>
              </div>
              <p className="text-[10px] text-[#e5e2e1] mt-1.5 leading-normal font-sans">
                {pet.description}
              </p>
            </div>

            {/* Vitals */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="border border-white/10 bg-black/40 p-3 rounded-none relative">
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] font-mono">Nivel de Alegría</span>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-2xl font-black text-white">{joy}</span>
                    <span className="text-xs" style={{ color: 'var(--color-profile-accent)' }}>%</span>
                  </div>
                  <button 
                    onClick={onGiveCuddles}
                    className="!min-h-0 border border-profile-accent/40 bg-profile-accent/5 hover:bg-profile-accent hover:text-black transition-colors px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider font-mono"
                  >
                    Mimar
                  </button>
                </div>
                <div className="h-1 w-full bg-white/5 mt-2 rounded-none">
                  <div className="h-full rounded-none transition-all duration-500" style={{ width: `${joy}%`, backgroundColor: 'var(--color-profile-accent)' }} />
                </div>
              </div>
              <div className="border border-white/10 bg-black/40 p-3 rounded-none relative">
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] font-mono">Calor de Hogar</span>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-2xl font-black text-white">{warmth}</span>
                    <span className="text-xs" style={{ color: 'var(--color-profile-accent)' }}>°C</span>
                  </div>
                  <button 
                    onClick={onGiveWarmth}
                    className="!min-h-0 border border-profile-accent/40 bg-profile-accent/5 hover:bg-profile-accent hover:text-black transition-colors px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider font-mono"
                  >
                    Cobijar
                  </button>
                </div>
                <div className="h-1 w-full bg-white/5 mt-2 rounded-none">
                  <div className="h-full rounded-none transition-all duration-500" style={{ width: `${(warmth / 40) * 100}%`, backgroundColor: 'var(--color-profile-accent)' }} />
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 border border-white/10 px-3 py-2 flex-1 rounded-none">
                <Calendar size={12} className="text-[#a88a7e] stroke-[1.5]" />
                <div>
                  <span className="text-[7px] uppercase tracking-[0.2em] text-[#594137] font-mono block">Fecha Especial</span>
                  <span className="text-[10px] font-bold text-white font-mono">{pet.birthDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 border border-white/10 px-3 py-2 flex-1 rounded-none">
                <span className="text-sm font-mono">{pet.gender}</span>
                <div>
                  <span className="text-[7px] uppercase tracking-[0.2em] text-[#594137] font-mono block">Identidad</span>
                  <span className="text-[10px] font-bold text-white font-mono">{pet.designation}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function GalleryStrip({ 
  pet, 
  photos, 
  currentIndex, 
  onSelect, 
  onUploadComplete 
}: { 
  pet: Pet; 
  photos: string[]; 
  currentIndex: number; 
  onSelect: (index: number) => void; 
  onUploadComplete: () => Promise<void> 
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      
      const url = await TimelineService.uploadTimelineImage(file);

      const { error: insertError } = await supabase
        .from('pet_gallery')
        .insert({ 
          pet_id: pet.id, 
          image_url: url,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`DB Error: ${insertError.message}`);
      }

      await onUploadComplete();
    } catch (err: any) {
      console.error('Upload process failed:', err);
      alert(`Error al subir la foto: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative border border-white/10 bg-[#0a0a0a] p-5 sm:p-6 pl-10 sm:pl-12 rounded-none overflow-hidden">
      {/* Solid Left Accent Stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: pet.accent }} />

      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a88a7e] font-mono">FOTOS</span>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="!min-h-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] text-profile-accent hover:opacity-80 transition-colors font-mono disabled:opacity-50"
        >
          {isUploading ? 'SUBIENDO...' : 'AGREGAR'} <Plus size={10} className="stroke-[1.5]" />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        {photos.map((src, i) => (
          <div
            key={src}
            onClick={() => onSelect(i)}
            className={`relative flex-shrink-0 w-20 h-20 border overflow-hidden bg-black transition-all duration-300 cursor-pointer rounded-full ${i === currentIndex ? "border-profile-accent scale-105 z-10 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "border-white/10 hover:border-white/30"}`}
          >
            <img src={src} alt="" className="w-full h-full object-cover rounded-full" />
            {i === currentIndex && <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 bg-profile-accent rounded-full border border-black shadow" />}
          </div>
        ))}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`flex-shrink-0 w-20 h-20 border border-dashed border-profile-accent/30 flex flex-col items-center justify-center text-profile-accent/40 hover:text-profile-accent hover:border-profile-accent/60 transition-colors cursor-pointer gap-1 rounded-full ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Plus size={16} className="stroke-[1.5]" />
          <span className="text-[7px] font-bold uppercase tracking-wider font-mono">{isUploading ? '...' : 'AGREGAR'}</span>
        </div>
      </div>
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
    </div>
  );
}

function SystemLog({ pet, logs }: { pet: Pet; logs: { time: string; text: string; category: string }[] }) {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="relative border border-white/10 bg-[#0a0a0a] p-4 pl-10 font-mono text-[9px] leading-relaxed text-[#594137] max-h-44 overflow-y-auto custom-scrollbar rounded-none overflow-hidden flex-1">
      {/* Solid Left Accent Stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: pet.accent }} />

      <div className="mb-2 text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Diario de Cuidados</div>
      <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-2 custom-scrollbar">
        {logs.map((log, index) => (
          <div key={index}>
            <span className="text-profile-accent mr-1">●</span> {log.category}
            <div className="ml-3 text-[#a88a7e]">
              <span className="text-[#594137] mr-1.5">{log.time}</span>
              {log.text}
            </div>
          </div>
        ))}
        <div className="text-[#594137] mt-1">Esperando próxima acción{dots}</div>
      </div>
    </div>
  );
}

// --- Main Component ---

export function PetSpaceHub() {
  const { profile } = useProfile();
  const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoDirection, setPhotoDirection] = useState(0);
  const [activeId, setActiveId] = useState(PETS[0].id);
  const [direction, setDirection] = useState(1);
  const [isWarping, setIsWarping] = useState(false);
  const [supabasePhotos, setSupabasePhotos] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);

  // Overrides list state
  const [petData, setPetData] = useState<Pet[]>(PETS);
  
  // Vitals tracking state
  const [vitals, setVitals] = useState<Record<string, { joy: number; warmth: number }>>(() => {
    const initial: Record<string, { joy: number; warmth: number }> = {};
    PETS.forEach(p => {
      initial[p.id] = { joy: p.o2, warmth: p.temp };
    });
    return initial;
  });

  // Daily log state
  const [logs, setLogs] = useState<Record<string, { time: string; text: string; category: string }[]>>(() => {
    const initialLogs: Record<string, { time: string; text: string; category: string }[]> = {};
    PETS.forEach(p => {
      initialLogs[p.id] = [
        { time: '12:15:00', text: 'Descansando plácidamente en su espacio.', category: 'Hogar' },
        { time: '14:02:45', text: 'Dosis de mimos completada. ¡Mucha felicidad!', category: 'Vida' }
      ];
    });
    return initialLogs;
  });

  // Heart animation overlay particles
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  
  const activeIdx = petData.findIndex(p => p.id === activeId);
  const activePet = activeIdx !== -1 ? petData[activeIdx] : petData[0];
  const activeVitals = vitals[activeId] || { joy: activePet.o2, warmth: activePet.temp };

  const warpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load customizations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mile_pets_overrides');
      if (stored) {
        try {
          const overrides = JSON.parse(stored);
          setPetData(PETS.map(p => overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const savePetOverrides = (updatedPet: Pet) => {
    const updatedList = petData.map(p => p.id === updatedPet.id ? updatedPet : p);
    setPetData(updatedList);
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mile_pets_overrides') || '{}';
      try {
        const overrides = JSON.parse(stored);
        overrides[updatedPet.id] = {
          role: updatedPet.role,
          description: updatedPet.description,
          birthDate: updatedPet.birthDate,
          designation: updatedPet.designation,
          gender: updatedPet.gender
        };
        localStorage.setItem('mile_pets_overrides', JSON.stringify(overrides));
        addLog(updatedPet.id, `Actualizaste los detalles de personalidad y rol.`, 'Sistema');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const addLog = (petId: string, text: string, category: string) => {
    const time = new Date().toLocaleTimeString('es-CO', { hour12: false });
    setLogs(prev => ({
      ...prev,
      [petId]: [
        { time, text, category },
        ...(prev[petId] || [])
      ].slice(0, 10)
    }));
  };

  const triggerHearts = () => {
    const newHearts = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 140,
      y: -60 - Math.random() * 100
    }));
    setHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      const newHeartIds = new Set(newHearts.map(nh => nh.id));
      setHearts(prev => prev.filter(h => !newHeartIds.has(h.id)));
    }, 1500);
  };

  const handleGiveCuddles = () => {
    setVitals(prev => ({
      ...prev,
      [activeId]: { ...prev[activeId], joy: 100 }
    }));
    triggerHearts();
    addLog(activeId, `Le diste mimos a ${activePet.name}. ¡Su nivel de alegría está al máximo! ❤️`, 'Vida');
  };

  const handleGiveWarmth = () => {
    setVitals(prev => {
      const current = prev[activeId] || { joy: activePet.o2, warmth: activePet.temp };
      const nextWarmth = Math.min(Number((current.warmth + 0.3).toFixed(1)), 26.0);
      return {
        ...prev,
        [activeId]: { ...prev[activeId], warmth: nextWarmth }
      };
    });
    addLog(activeId, `Abrigaste a ${activePet.name}. Aumentó su calor de hogar. 🍖`, 'Hogar');
  };

  const loadPhotos = async (petId: string) => {
    try {
      const { data, error } = await supabase
        .from('pet_gallery')
        .select('image_url')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setSupabasePhotos(data.map(d => d.image_url));
      }
    } catch (e) {
      console.error('Unexpected error loading photos:', e);
    }
  };

  useEffect(() => {
    loadPhotos(activePet.id);
    setCurrentPhotoIndex(0);
  }, [activePet.id]);

  const carouselPhotos = supabasePhotos.length > 0 ? supabasePhotos : [activePet.src];

  // Autoplay control
  useEffect(() => {
    if (carouselPhotos.length <= 1 || !isPlaying) return;
    const interval = setInterval(() => {
      setPhotoDirection(1);
      setCurrentPhotoIndex(prev => (prev + 1) % carouselPhotos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselPhotos.length, isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePhotoPrev();
      if (e.key === "ArrowRight") handlePhotoNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [carouselPhotos.length]);

  const handlePhotoPrev = () => {
    setPhotoDirection(-1);
    setCurrentPhotoIndex(prev => (prev - 1 + carouselPhotos.length) % carouselPhotos.length);
  };

  const handlePhotoNext = () => {
    setPhotoDirection(1);
    setCurrentPhotoIndex(prev => (prev + 1) % carouselPhotos.length);
  };

  const handlePhotoSelect = (index: number) => {
    setPhotoDirection(index > currentPhotoIndex ? 1 : -1);
    setCurrentPhotoIndex(index);
  };

  const triggerWarp = (newId: string, dir: number) => {
    if (newId === activeId) return;

    if (warpTimeoutRef.current) {
      clearTimeout(warpTimeoutRef.current);
    }

    setDirection(dir);
    setIsWarping(true);
    setActiveId(newId);

    warpTimeoutRef.current = setTimeout(() => {
      setIsWarping(false);
      warpTimeoutRef.current = null;
    }, 600);
  };

  const goPrev = () => triggerWarp(petData[(activeIdx - 1 + petData.length) % petData.length].id, -1);
  const goNext = () => triggerWarp(petData[(activeIdx + 1) % petData.length].id, 1);
  const handleSelect = (id: string, newIdx: number) => {
    if (newIdx === activeIdx) return;
    triggerWarp(id, newIdx > activeIdx ? 1 : -1);
  };

  return (
    <div className="space-y-6">
      <style>{`
        .force-circle,
        .rounded-full {
          border-radius: 50% !important;
        }
        .force-circle *,
        .rounded-full * {
          border-radius: inherit !important;
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] font-mono">
        <span className="text-[#594137]">Nuestro Refugio</span>
        <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white font-sans">Los Consentidos</h2>
        <span className="ml-auto flex items-center gap-2 font-mono">
          STATUS: <span style={{ color: accentColor }}>ONLINE</span>
        </span>
        <span className="text-[#594137] font-mono">Bebés: {String(petData.length).padStart(2, '0')}</span>
      </div>

      {/* Pet Selector */}
      <PetSelector pets={petData} activeId={activeId} onSelect={handleSelect} />

      {/* Orbital Viewport */}
      <div className="flex justify-center py-2 w-full">
        <OrbitalViewport pet={activePet} isWarping={isWarping} direction={direction} onPrev={goPrev} onNext={goNext} hearts={hearts} profileAccent={accentColor === 'var(--color-user-a)' ? '#ff4b89' : '#c3f400'} />
      </div>

      {/* Grid container for Habitat Module & Gallery/SystemLog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 h-full">
          <HabitatModule
            pet={activePet}
            photos={carouselPhotos}
            currentIndex={currentPhotoIndex}
            direction={photoDirection}
            onPrev={handlePhotoPrev}
            onNext={handlePhotoNext}
            onSelect={handlePhotoSelect}
            joy={activeVitals.joy}
            warmth={activeVitals.warmth}
            onGiveCuddles={handleGiveCuddles}
            onGiveWarmth={handleGiveWarmth}
            onSaveDetails={savePetOverrides}
            onMouseEnter={() => setIsPlaying(false)}
            onMouseLeave={() => setIsPlaying(true)}
          />
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6 justify-between h-full">
          <GalleryStrip
            pet={activePet}
            photos={carouselPhotos}
            currentIndex={currentPhotoIndex}
            onSelect={handlePhotoSelect}
            onUploadComplete={async () => {
              await loadPhotos(activePet.id);
              setCurrentPhotoIndex(0);
            }}
          />
          <SystemLog pet={activePet} logs={logs[activeId] || []} />
        </div>
      </div>
    </div>
  );
}
