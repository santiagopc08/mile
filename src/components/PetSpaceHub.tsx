'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PawPrint, Plus, Calendar, Edit2, RefreshCw, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { StoreService } from '@/services/storeService';
import { supabase } from '@/lib/supabase';

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

function SpaceDecorations({ isWarping, direction }: { isWarping: boolean; direction: number }) {
  const stars = useMemo(() => Array.from({ length: 80 }).map(() => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
  })), []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {/* Background stars */}
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full mix-blend-screen"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            height: `${star.size}px`,
          }}
          initial={false}
          animate={isWarping ? {
            width: [star.size, 100, 300],
            x: [0, direction * -1000],
            opacity: [0.8, 1, 0]
          } : {
            width: star.size,
            x: 0,
            opacity: [0.1, 0.8, 0.1]
          }}
          transition={isWarping ? {
            duration: 0.6,
            ease: "easeIn",
          } : {
            x: { duration: 0 },
            width: { duration: 0 },
            opacity: {
              duration: star.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: star.delay,
            }
          }}
        />
      ))}

      {/* Nebula glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#a100f0]/10 rounded-full blur-[100px] mix-blend-screen opacity-50" />
    </div>
  );
}

function OrbitalViewport({ pet, isWarping, direction, onPrev, onNext }: { pet: Pet; isWarping: boolean; direction: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="relative flex flex-col items-center gap-0 w-full max-w-3xl py-10 overflow-hidden">

      {/* Deep Space Background behind the viewport */}
      <div className="absolute inset-0">
        <SpaceDecorations isWarping={isWarping} direction={direction} />
      </div>

      {/* Sliding Assembly: viewport + platform */}
      <div className="relative w-full h-[400px]">
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
            {/* Spinning rings + pet photo (with holo-float and moved up by 24px) */}
            <div
              className="relative w-52 h-52 sm:w-64 sm:h-64 flex-shrink-0 z-20 translate-y-6"
              style={{ animation: 'holo-float 4s ease-in-out infinite' }}
            >
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
              <div className="absolute inset-4 rounded-full overflow-hidden border border-white/20 backdrop-blur-md shadow-[inset_0_0_30px_rgba(0,0,0,1)]">
                <img
                  src={pet.src}
                  alt={pet.name}
                  className="w-full h-full object-cover object-center contrast-125 saturate-110 mix-blend-luminosity hover:mix-blend-normal transition-all duration-500"
                />

                {/* Holo scanning line effect from OrbitCarousel */}
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
              className="relative w-[340px] sm:w-[460px] -mt-16 z-10 pointer-events-none"
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
                  className="text-sm sm:text-base font-black uppercase tracking-[0.35em] font-mono"
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
      <div className="flex items-center gap-6 mt-8 z-20">
        <button onClick={onPrev} className="border border-white/10 bg-black/40 backdrop-blur-sm p-3 text-[#a88a7e] hover:text-white hover:border-white/30 hover:bg-white/5 transition-colors rounded-full">
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[8px] tracking-[0.4em] text-[#00dbe9] mt-1 opacity-70">ONLINE</span>
        </div>
        <button onClick={onNext} className="border border-white/10 bg-black/40 backdrop-blur-sm p-3 text-[#a88a7e] hover:text-white hover:border-white/30 hover:bg-white/5 transition-colors rounded-full">
          <ChevronRight size={20} />
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

function HabitatModule({
  pet,
  photos,
  currentIndex,
  direction,
  onPrev,
  onNext
}: {
  pet: Pet;
  photos: string[];
  currentIndex: number;
  direction: number;
  onPrev: () => void;
  onNext: () => void;
}) {

  const variants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 45 : -45,
      z: -100,
      x: dir > 0 ? 200 : -200,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      rotateY: 0,
      z: 0,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      rotateY: dir < 0 ? 45 : -45,
      z: -100,
      x: dir < 0 ? 200 : -200,
      opacity: 0,
      scale: 0.8
    })
  };

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

      {/* Pet Image Carousel */}
      <div className="relative w-full h-[350px] max-w-md mx-auto mb-6 overflow-hidden border border-white/10 bg-black group flex items-center justify-center" style={{ perspective: "1200px" }}>
        <div className="absolute inset-0 bg-mosaic opacity-30 pointer-events-none z-10" />
        
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={photos[currentIndex] || pet.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 200, damping: 25, mass: 1 }}
            className="absolute inset-0 p-4 flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}
          >
            <img 
              src={photos[currentIndex] || pet.src} 
              alt={pet.name} 
              className="w-full h-full object-contain contrast-110 drop-shadow-2xl" 
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 pointer-events-none z-10" style={{ boxShadow: `inset 0 0 80px ${pet.accent}15` }} />

        {/* Carousel Controls */}
        {photos.length > 1 && (
          <>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button onClick={onPrev} className="p-2 bg-black/60 border border-white/20 text-[#a88a7e] hover:text-white backdrop-blur-md rounded-sm transition-colors"><ChevronLeft size={18} /></button>
              <button onClick={onNext} className="p-2 bg-black/60 border border-white/20 text-[#a88a7e] hover:text-white backdrop-blur-md rounded-sm transition-colors"><ChevronRight size={18} /></button>
            </div>
            {/* Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm border border-white/5">
              {photos.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-[#00dbe9] scale-125' : 'bg-white/30'}`} />
              ))}
            </div>
          </>
        )}
      </div>

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

function GalleryStrip({ pet, photos, currentIndex, onSelect, onUploadComplete }: { pet: Pet; photos: string[]; currentIndex: number; onSelect: (index: number) => void; onUploadComplete: () => Promise<void> }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      console.log('Starting upload for pet:', pet.id);
      
      const url = await StoreService.uploadTimelineImage(file);
      console.log('File uploaded to storage, public URL:', url);

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

      console.log('Insert successful, reloading photos...');
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
    <div className="geometric-card relative p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a88a7e] font-mono">FOTOS</span>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff7020] hover:text-[#ffb595] transition-colors font-mono disabled:opacity-50"
        >
          {isUploading ? 'SUBIENDO...' : 'AGREGAR'} <Plus size={10} />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        {photos.map((src, i) => (
          <div
            key={src}
            onClick={() => onSelect(i)}
            className={`relative flex-shrink-0 w-20 h-20 border overflow-hidden bg-black transition-all duration-300 cursor-pointer ${i === currentIndex ? "border-[#ff7020] scale-105 z-10 shadow-[0_0_15px_rgba(255,112,32,0.3)]" : "border-white/10 hover:border-white/30"}`}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
            {i === currentIndex && <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#ff7020]" />}
          </div>
        ))}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`flex-shrink-0 w-20 h-20 border border-dashed border-[#ff7020]/30 flex flex-col items-center justify-center text-[#ff7020]/40 hover:text-[#ff7020] hover:border-[#ff7020]/60 transition-colors cursor-pointer gap-1 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Plus size={16} />
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
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoDirection, setPhotoDirection] = useState(0);
  const [activeId, setActiveId] = useState(PETS[0].id);
  const [direction, setDirection] = useState(1);
  const [isWarping, setIsWarping] = useState(false);
  const [supabasePhotos, setSupabasePhotos] = useState<string[]>([]);
  
  const activePet = PETS.find(p => p.id === activeId) || PETS[0];
  const activeIdx = PETS.findIndex(p => p.id === activeId);

  const warpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const allPhotos = [...activePet.gallery, ...supabasePhotos];

  const handlePhotoPrev = () => {
    setPhotoDirection(-1);
    setCurrentPhotoIndex(prev => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  const handlePhotoNext = () => {
    setPhotoDirection(1);
    setCurrentPhotoIndex(prev => (prev + 1) % allPhotos.length);
  };

  const handlePhotoSelect = (index: number) => {
    setPhotoDirection(index > currentPhotoIndex ? 1 : -1);
    setCurrentPhotoIndex(index);
  };

  const triggerWarp = (newId: string, dir: number) => {
    if (newId === activeId) return;

    // Clear any existing timeout
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

  const goPrev = () => triggerWarp(PETS[(activeIdx - 1 + PETS.length) % PETS.length].id, -1);
  const goNext = () => triggerWarp(PETS[(activeIdx + 1) % PETS.length].id, 1);
  const handleSelect = (id: string) => {
    const newIdx = PETS.findIndex(p => p.id === id);
    if (newIdx === activeIdx) return;
    triggerWarp(id, newIdx > activeIdx ? 1 : -1);
  };

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
      <PetSelector pets={PETS} activeId={activeId} onSelect={handleSelect} />

      {/* Orbital Viewport */}
      <div className="flex justify-center py-4 w-full">
        <OrbitalViewport pet={activePet} isWarping={isWarping} direction={direction} onPrev={goPrev} onNext={goNext} />
      </div>

      {/* Habitat Module */}
      <HabitatModule
        pet={activePet}
        photos={allPhotos}
        currentIndex={currentPhotoIndex}
        direction={photoDirection}
        onPrev={handlePhotoPrev}
        onNext={handlePhotoNext}
      />

      {/* Gallery */}
      <GalleryStrip
        pet={activePet}
        photos={allPhotos}
        currentIndex={currentPhotoIndex}
        onSelect={handlePhotoSelect}
        onUploadComplete={() => loadPhotos(activePet.id)}
      />
    </div>
  );
}
