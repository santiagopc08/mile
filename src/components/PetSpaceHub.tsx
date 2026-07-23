'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/context/ProfileContext';

import { Pet, PETS } from './pet-space/types';
import { PetSelector } from './pet-space/PetSelector';
import { OrbitalViewport } from './pet-space/OrbitalViewport';
import { HabitatModule } from './pet-space/HabitatModule';
import { GalleryStrip } from './pet-space/GalleryStrip';
import { SystemLog } from './pet-space/SystemLog';

// Reloj de estación aislado: gestiona su propio estado para no re-renderizar
// el hub (pesado por las animaciones del viewport) cada segundo.
function StationClock({ accentColor }: { accentColor: string }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('es-CO', { hour12: false }));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <span className="font-mono tabular-nums" style={{ color: accentColor }}>
      {time}
    </span>
  );
}

export function PetSpaceHub() {
  const { profile } = useProfile();
  const accentColorHex = profile === 'ella' ? '#ff4b89' : '#c3f400';
  
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
    <div className="space-y-6" style={{ ['--color-profile-accent' as string]: accentColorHex }}>
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
      {/* Cabecera de control de misión */}
      <div
        className="relative overflow-hidden border border-white/10 bg-[#060409] p-4 pl-9"
        style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: accentColorHex, boxShadow: `0 0 12px ${accentColorHex}` }} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="font-mono text-xs animate-spin-slow" style={{ color: accentColorHex }}>◆</span>
          <div className="flex flex-col">
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#594137]">Estación Orbital · Refugio</span>
            <h2 className="text-lg sm:text-2xl font-black uppercase tracking-[0.08em] text-white leading-none font-sans">Los Consentidos</h2>
          </div>
          <div className="ml-auto flex items-center gap-3 font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
            <span className="hidden sm:flex items-center gap-1.5 text-[#a88a7e]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'ps-vital-pulse 1.6s ease-in-out infinite' }} />
              SISTEMAS <span style={{ color: accentColorHex }}>ONLINE</span>
            </span>
            <span className="text-[#594137]">TRIP: <span className="text-white">{String(petData.length).padStart(2, '0')}</span></span>
            <StationClock accentColor={accentColorHex} />
          </div>
        </div>
      </div>

      {/* Manifiesto de tripulación */}
      <PetSelector pets={petData} activeId={activeId} onSelect={handleSelect} />

      {/* Cámara de holo-proyección */}
      <div className="flex justify-center py-2 w-full">
        <OrbitalViewport
          pet={activePet}
          isWarping={isWarping}
          direction={direction}
          crewIndex={activeIdx === -1 ? 0 : activeIdx}
          crewTotal={petData.length}
          onPrev={goPrev}
          onNext={goNext}
          hearts={hearts}
          profileAccent={accentColorHex}
        />
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
