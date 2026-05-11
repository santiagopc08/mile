'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PawPrint, Plus, Calendar, Edit2, RefreshCw, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

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
    designation: 'MACHO',
    birthDate: '08 JUN 2020',
    gender: '♂',
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

function OrbitalViewport({ pet, onPrev, onNext }: { pet: Pet; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-0">
      {/* Floating assembly: viewport + platform */}
      <div
        className="relative flex flex-col items-center"
        style={{ animation: 'holo-float 4s ease-in-out infinite' }}
      >
        {/* Spinning rings + pet photo */}
        <div className="relative w-52 h-52 sm:w-64 sm:h-64 flex-shrink-0 z-10">
          {/* Outer spinning ring */}
          <div
            className="absolute inset-0 border-2 border-white/5 rounded-full"
            style={{ animation: 'spin 10s linear infinite', borderTopColor: pet.accent }}
          />
          {/* Inner spinning ring */}
          <div
            className="absolute inset-2 border border-white/5 rounded-full"
            style={{ animation: 'spin 15s linear infinite reverse', borderBottomColor: '#a100f0' }}
          />
          {/* Viewport */}
          <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-white/10 bg-[#0a0a0a]">
            <AnimatePresence mode="wait">
              <motion.img
                key={pet.id}
                src={pet.src}
                alt={pet.name}
                className="w-full h-full object-cover object-center contrast-125 saturate-110"
                initial={{ opacity: 0, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
              />
            </AnimatePresence>
          </div>
          {/* Glow */}
          <div
            className="absolute inset-4 rounded-full pointer-events-none"
            style={{ boxShadow: `0 0 40px ${pet.accent}22, inset 0 0 20px ${pet.accent}11` }}
          />
        </div>

        {/* Platform image below the orbital rings */}
        <div
          className="relative w-[340px] sm:w-[420px] -mt-6 z-0"
          style={{ animation: 'holo-glow 3s ease-in-out infinite' }}
        >
          <img
            src="/img/pets/platform2.png"
            alt="Presentation Platform"
            className="w-full h-auto"
          />
          {/* Pet name overlaid on the "NOMBRE" position */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.4 }}
              className="absolute bottom-[22%] left-1/2 -translate-x-1/2 text-center"
            >
              <span
                className="text-sm sm:text-base font-black uppercase tracking-[0.35em] font-mono"
                style={{ color: pet.accent, textShadow: `0 0 12px ${pet.accent}88` }}
              >
                {pet.name}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Nav arrows */}
      <div className="flex items-center gap-6 mt-4">
        <button onClick={onPrev} className="border border-white/10 p-2 text-[#a88a7e] hover:text-white hover:border-white/30 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-white font-mono">{pet.name}</span>
        <button onClick={onNext} className="border border-white/10 p-2 text-[#a88a7e] hover:text-white hover:border-white/30 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function PetSelector({ pets, activeId, onSelect }: { pets: Pet[]; activeId: string; onSelect: (id: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
      {pets.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`relative flex-shrink-0 flex items-center gap-3 border px-4 py-3 transition-all font-mono text-[10px] uppercase tracking-[0.2em] ${p.id === activeId
            ? 'border-[#ff7020] bg-[#ff7020]/10 text-white'
            : 'border-white/10 bg-black/40 text-[#a88a7e] hover:border-white/20 hover:text-white'
            }`}
        >
          <div className={`w-8 h-8 overflow-hidden border ${p.id === activeId ? 'border-[#ff7020]' : 'border-white/10'}`}>
            <img src={p.src} alt={p.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-black">{p.name}</span>
            <span className="text-[8px] opacity-50">MOD_{String(i + 1).padStart(2, '0')}</span>
          </div>
          {p.id === activeId && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff7020]" />}
        </button>
      ))}
      <button className="flex-shrink-0 flex items-center justify-center w-14 border border-dashed border-[#ff7020]/30 text-[#ff7020]/60 hover:text-[#ff7020] hover:border-[#ff7020]/60 transition-colors">
        <Plus size={16} />
      </button>
    </div>
  );
}

function HabitatModule({ pet }: { pet: Pet }) {
  return (
    <div className="geometric-card relative p-5 sm:p-6">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: pet.accent }} />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: pet.accent }} />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2" style={{ borderColor: pet.accent }} />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: pet.accent }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.15em] text-white font-sans">HAB_MODULE_A</h3>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#a88a7e] font-mono mt-1">SUBJECT: {pet.name}</p>
        </div>
        <span className="border border-[#00dbe9]/40 bg-[#00dbe9]/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-[#00dbe9]">
          ● STABLE
        </span>
      </div>

      {/* Pet Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pet.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative w-full aspect-square max-w-xs mx-auto mb-6 overflow-hidden border border-white/10 bg-black"
        >
          <div className="absolute inset-0 bg-mosaic opacity-30 pointer-events-none z-10" />
          <img src={pet.src} alt={pet.name} className="w-full h-full object-cover contrast-110" />
          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `inset 0 0 60px ${pet.accent}15` }} />
        </motion.div>
      </AnimatePresence>

      {/* Vitals */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="border border-white/10 bg-black/40 p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] font-mono">O2_LEVEL</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-white font-sans">{pet.o2}</span>
            <span className="text-xs text-[#00dbe9] font-mono">%</span>
          </div>
          <div className="h-1 w-full bg-white/5 mt-2">
            <div className="h-full bg-[#00dbe9]" style={{ width: `${pet.o2}%` }} />
          </div>
        </div>
        <div className="border border-white/10 bg-black/40 p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] font-mono">TEMP_CORE</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-white font-sans">{pet.temp}</span>
            <span className="text-xs text-[#ff7020] font-mono">°C</span>
          </div>
          <div className="h-1 w-full bg-white/5 mt-2">
            <div className="h-full bg-[#ff7020]" style={{ width: `${(pet.temp / 40) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 border border-white/10 px-3 py-2 flex-1">
          <Calendar size={12} className="text-[#a88a7e]" />
          <div>
            <span className="text-[7px] uppercase tracking-[0.2em] text-[#594137] font-mono block">LOG_ENTRY_DATE</span>
            <span className="text-[10px] font-bold text-white font-mono">{pet.birthDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 border border-white/10 px-3 py-2 flex-1">
          <span className="text-sm">{pet.gender}</span>
          <div>
            <span className="text-[7px] uppercase tracking-[0.2em] text-[#594137] font-mono block">DESIGNATION</span>
            <span className="text-[10px] font-bold text-white font-mono">{pet.designation}</span>
          </div>
          <button className="ml-auto text-[#a88a7e] hover:text-[#ff7020] transition-colors"><Edit2 size={12} /></button>
        </div>
      </div>
    </div>
  );
}

function StasisChamber({ pet }: { pet: Pet | undefined }) {
  if (!pet) return null;
  return (
    <div className="geometric-card relative p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white font-sans">STASIS_CHAMBER_B</h3>
        <RefreshCw size={14} className="text-[#a88a7e] animate-spin" style={{ animationDuration: '8s' }} />
      </div>
      <div className="relative w-28 h-28 mx-auto mb-4 overflow-hidden border border-white/10 bg-black rounded-full">
        <img src={pet.src} alt={pet.name} className="w-full h-full object-cover grayscale-[60%] opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <p className="text-center text-[8px] font-bold uppercase tracking-[0.3em] text-[#594137] font-mono mb-4">RESTING</p>
      <div className="flex gap-2">
        <button className="flex-1 border border-white/10 bg-black/40 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] hover:text-white hover:border-white/20 transition-colors font-mono">
          WAKE
        </button>
        <button className="flex-1 border border-white/10 bg-black/40 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] hover:text-white hover:border-white/20 transition-colors font-mono">
          DIAGNOSTIC
        </button>
      </div>
    </div>
  );
}

function GalleryStrip({ pet }: { pet: Pet }) {
  return (
    <div className="geometric-card relative p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a88a7e] font-mono">FOTOS</span>
        <button className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff7020] hover:text-[#ffb595] transition-colors font-mono">
          AGREGAR <Plus size={10} />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        {pet.gallery.map((src, i) => (
          <div key={i} className="relative flex-shrink-0 w-20 h-20 border border-white/10 overflow-hidden bg-black hover:border-[#ff7020]/50 transition-colors cursor-pointer">
            <img src={src} alt="" className="w-full h-full object-cover" />
            {i === 0 && <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#ff7020]" />}
          </div>
        ))}
        <div className="flex-shrink-0 w-20 h-20 border border-dashed border-[#ff7020]/30 flex flex-col items-center justify-center text-[#ff7020]/40 hover:text-[#ff7020] hover:border-[#ff7020]/60 transition-colors cursor-pointer gap-1">
          <Plus size={16} />
          <span className="text-[7px] font-bold uppercase tracking-wider font-mono">AGREGAR</span>
        </div>
      </div>
    </div>
  );
}

function SystemLog({ pet }: { pet: Pet }) {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="geometric-card relative p-4 font-mono text-[9px] leading-relaxed text-[#594137] max-h-44 overflow-y-auto custom-scrollbar">
      <div className="mb-2 text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">SYS_LOG</div>
      <div><span className="text-[#ff7020]">&gt;&gt;</span> HAB_MODULE_A</div>
      <div className="ml-4 text-[#a88a7e]"><span className="text-[#594137]">14:02:45</span> routine check completed. Optimal conditions.</div>
      <div className="mt-2"><span className="text-[#00dbe9]">&gt;&gt;</span> STASIS_CHAMBER_B</div>
      <div className="ml-4 text-[#a88a7e]"><span className="text-[#594137]">12:15:00</span> auto-regulation engaged.</div>
      <div className="mt-2 text-[#594137]">&gt;&gt; Awaiting input{dots}</div>
    </div>
  );
}

// --- Main Component ---

export function PetSpaceHub() {
  const [activeId, setActiveId] = useState(PETS[0].id);
  const activePet = PETS.find(p => p.id === activeId) || PETS[0];
  const activeIdx = PETS.findIndex(p => p.id === activeId);
  const stasisPet = PETS[(activeIdx + 1) % PETS.length];

  const goPrev = () => setActiveId(PETS[(activeIdx - 1 + PETS.length) % PETS.length].id);
  const goNext = () => setActiveId(PETS[(activeIdx + 1) % PETS.length].id);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">
        <span className="text-[#594137]">SYS_DIR // 04</span>
        <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white font-sans">BIO_MODULES</h2>
        <span className="ml-auto flex items-center gap-2">
          STATUS: <span className="text-[#00dbe9]">ONLINE</span>
        </span>
        <span className="text-[#594137]">UNITS: {String(PETS.length).padStart(2, '0')}</span>
      </div>

      {/* Pet Selector */}
      <PetSelector pets={PETS} activeId={activeId} onSelect={setActiveId} />

      {/* Orbital Viewport */}
      <div className="flex justify-center py-4">
        <OrbitalViewport pet={activePet} onPrev={goPrev} onNext={goNext} />
      </div>

      {/* Habitat Module */}
      <HabitatModule pet={activePet} />

      {/* Grid: Stasis + Sys Log */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StasisChamber pet={stasisPet} />
        <div className="flex flex-col gap-4">
          {/* Init Module Button */}
          <div className="geometric-card relative p-5 flex flex-col items-center justify-center gap-3 min-h-[120px]">
            <Plus size={24} className="text-[#ff7020]/40" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff7020]/60 font-mono">INITIALIZE_MODULE</span>
          </div>
          <SystemLog pet={activePet} />
        </div>
      </div>

      {/* Gallery */}
      <GalleryStrip pet={activePet} />
    </div>
  );
}
