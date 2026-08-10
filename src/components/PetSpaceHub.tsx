'use client';

import { useState, useRef } from 'react';
import { useProfile } from '@/context/ProfileContext';

import { PETS } from './pet-space/types';
import { PetSelector } from './pet-space/PetSelector';
import { OrbitalViewport } from './pet-space/OrbitalViewport';
import { HabitatModule } from './pet-space/HabitatModule';
import { GalleryStrip } from './pet-space/GalleryStrip';
import { SystemLog } from './pet-space/SystemLog';
import { OrbitalRadar } from './pet-space/OrbitalRadar';
import { Volume2, VolumeX } from 'lucide-react';
import * as PetAudio from '@/lib/petSpaceAudio';

import { StationClock } from './pet-space/StationClock';
import {
  usePetData,
  usePetVitals,
  usePetLogs,
  usePetAudio,
  usePetPhotos
} from './pet-space/usePetSpace';

export function PetSpaceHub() {
  const { profile } = useProfile();
  const accentColorHex = profile === 'ella' ? '#ff4b89' : '#c3f400';
  
  const [activeId, setActiveId] = useState(PETS[0].id);
  const [direction, setDirection] = useState(1);
  const [isWarping, setIsWarping] = useState(false);
  const warpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Heart animation overlay particles
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  const { logs, addLog } = usePetLogs();
  const { petData, savePetOverrides } = usePetData(addLog);
  const { vitals, updateVitals } = usePetVitals();
  const { audioOn, toggleAudio } = usePetAudio();

  const activeIdx = petData.findIndex(p => p.id === activeId);
  const activePet = activeIdx !== -1 ? petData[activeIdx] : petData[0];
  const activeVitals = vitals[activeId] || { joy: activePet.o2, warmth: activePet.temp };

  const {
    carouselPhotos,
    currentPhotoIndex,
    photoDirection,
    handlePhotoPrev,
    handlePhotoNext,
    handlePhotoSelect,
    setIsPlaying,
    loadPhotos,
    setCurrentPhotoIndex
  } = usePetPhotos(activePet);

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
    updateVitals(activeId, { joy: 100 });
    triggerHearts();
    PetAudio.playCuddle();
    addLog(activeId, `Le diste mimos a ${activePet.name}. ¡Su nivel de alegría está al máximo! ❤️`, 'Vida');
  };

  const handleGiveWarmth = () => {
    updateVitals(activeId, { warmth: 0.3 });
    PetAudio.playWarmth();
    addLog(activeId, `Abrigaste a ${activePet.name}. Aumentó su calor de hogar. 🍖`, 'Hogar');
  };

  const triggerWarp = (newId: string, dir: number) => {
    if (newId === activeId) return;

    if (warpTimeoutRef.current) {
      clearTimeout(warpTimeoutRef.current);
    }

    setDirection(dir);
    setIsWarping(true);
    setActiveId(newId);
    PetAudio.playWarp();

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
    <div className="space-y-6 ps-env" style={{ ['--color-profile-accent' as string]: accentColorHex }}>
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
            <div className="flex flex-col items-end gap-1.5">
              <span className="hidden sm:flex items-center gap-1.5 text-[#a88a7e]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'ps-vital-pulse 1.6s ease-in-out infinite' }} />
                SISTEMAS <span style={{ color: accentColorHex }}>ONLINE</span>
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[#594137]">TRIP: <span className="text-white">{String(petData.length).padStart(2, '0')}</span></span>
                <StationClock accentColor={accentColorHex} />
              </div>
            </div>
            <button
              onClick={toggleAudio}
              title={audioOn ? 'Silenciar estación' : 'Activar ambiente de la estación'}
              aria-label={audioOn ? 'Silenciar estación' : 'Activar ambiente de la estación'}
              aria-pressed={audioOn}
              className="!min-h-0 border p-2 transition-colors"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px))',
                borderColor: audioOn ? accentColorHex : 'rgba(255,255,255,0.15)',
                color: audioOn ? accentColorHex : '#a88a7e',
                backgroundColor: audioOn ? `${accentColorHex}18` : 'transparent',
                boxShadow: audioOn ? `0 0 12px ${accentColorHex}30` : 'none',
              }}
            >
              {audioOn ? <Volume2 size={13} className="stroke-[1.5]" /> : <VolumeX size={13} className="stroke-[1.5]" />}
            </button>
            <OrbitalRadar pets={petData} activeId={activeId} onSelect={handleSelect} accentColor={accentColorHex} />
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

      {/* Grid de módulos — se re-revela (boot) al cambiar de tripulante */}
      <div key={activePet.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch ps-hud-boot">
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
