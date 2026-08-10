import { useState, useEffect, useRef } from 'react';
import { Pet, PETS } from './types';
import { supabase } from '@/lib/supabase';
import * as PetAudio from '@/lib/petSpaceAudio';

const VITALS_KEY = 'mile_pets_vitals';
const LOGS_KEY = 'mile_pets_logs';
const JOY_FLOOR = 78;

export function driftJoy(joy: number, ts: number): number {
  if (!ts) return Math.round(joy);
  const hours = (Date.now() - ts) / 3600000;
  return Math.max(JOY_FLOOR, Math.round(Math.min(100, joy - hours * 1.2)));
}

export function usePetData(addLog: (petId: string, text: string, category: string) => void) {
  const [petData, setPetData] = useState<Pet[]>(PETS);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('mile_pets_overrides');
      if (stored) {
        const overrides = JSON.parse(stored);
        setPetData(PETS.map(p => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p)));
      }
    } catch (e) {
      console.error(e);
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

  return { petData, savePetOverrides };
}

export function usePetVitals() {
  const [vitals, setVitals] = useState<Record<string, { joy: number; warmth: number }>>(() => {
    const initial: Record<string, { joy: number; warmth: number }> = {};
    PETS.forEach(p => {
      initial[p.id] = { joy: p.o2, warmth: p.temp };
    });
    return initial;
  });

  const vitalsTsRef = useRef<Record<string, number>>({});

  const persistVitals = (map: Record<string, { joy: number; warmth: number }>) => {
    if (typeof window === 'undefined') return;
    try {
      const out: Record<string, { joy: number; warmth: number; ts: number }> = {};
      for (const id in map) {
        out[id] = { ...map[id], ts: vitalsTsRef.current[id] || Date.now() };
      }
      localStorage.setItem(VITALS_KEY, JSON.stringify(out));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedV = localStorage.getItem(VITALS_KEY);
      if (storedV) {
        const parsed = JSON.parse(storedV) as Record<string, { joy: number; warmth: number; ts?: number }>;
        const loaded: Record<string, { joy: number; warmth: number }> = {};
        PETS.forEach(p => {
          const rec = parsed[p.id];
          if (rec) {
            vitalsTsRef.current[p.id] = rec.ts || Date.now();
            loaded[p.id] = { joy: driftJoy(rec.joy, rec.ts || 0), warmth: rec.warmth };
          } else {
            loaded[p.id] = { joy: p.o2, warmth: p.temp };
          }
        });
        setVitals(loaded);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateVitals = (activeId: string, updates: { joy?: number; warmth?: number }) => {
    vitalsTsRef.current[activeId] = Date.now();
    setVitals(prev => {
      const current = prev[activeId] || { joy: 0, warmth: 0 };
      const nextWarmth = updates.warmth !== undefined
          ? Math.min(Number((current.warmth + updates.warmth).toFixed(1)), 26.0)
          : current.warmth;

      const nextJoy = updates.joy !== undefined ? updates.joy : current.joy;

      const next = {
        ...prev,
        [activeId]: { joy: nextJoy, warmth: nextWarmth },
      };
      persistVitals(next);
      return next;
    });
  };

  return { vitals, updateVitals, vitalsTsRef };
}

export function usePetLogs() {
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedL = localStorage.getItem(LOGS_KEY);
      if (storedL) setLogs(JSON.parse(storedL));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const addLog = (petId: string, text: string, category: string) => {
    const time = new Date().toLocaleTimeString('es-CO', { hour12: false });
    setLogs(prev => {
      const next = {
        ...prev,
        [petId]: [{ time, text, category }, ...(prev[petId] || [])].slice(0, 10),
      };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOGS_KEY, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  return { logs, addLog };
}

export function usePetAudio() {
  const [audioOn, setAudioOn] = useState(false);

  useEffect(() => {
    const pref = PetAudio.loadAudioPreference();
    setAudioOn(pref);
    PetAudio.resumeAmbientIfEnabled();
    return () => PetAudio.suspendAmbient();
  }, []);

  const toggleAudio = () => {
    const next = !audioOn;
    PetAudio.setAudioEnabled(next);
    setAudioOn(next);
    if (next) PetAudio.playSelect();
  };

  return { audioOn, toggleAudio };
}

export function usePetPhotos(activePet: Pet) {
  const [supabasePhotos, setSupabasePhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoDirection, setPhotoDirection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

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

  return {
    carouselPhotos,
    currentPhotoIndex,
    photoDirection,
    handlePhotoPrev,
    handlePhotoNext,
    handlePhotoSelect,
    setIsPlaying,
    loadPhotos,
    setCurrentPhotoIndex
  };
}
