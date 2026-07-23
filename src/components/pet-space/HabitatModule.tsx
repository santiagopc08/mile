import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Edit2, ChevronLeft, ChevronRight, Heart, Flame } from 'lucide-react';
import { Pet } from './types';

// Abreviaturas de mes (ES + EN) → índice, para "15 MAR 2019" / "30 DEC 2018"
const MONTHS: Record<string, number> = {
  ENE: 0, JAN: 0, FEB: 1, MAR: 2, ABR: 3, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AGO: 7, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DIC: 11, DEC: 11,
};

// Días transcurridos desde la fecha de origen; null si no se puede parsear.
function daysSinceOrigin(birthDate: string): number | null {
  const m = birthDate.trim().toUpperCase().match(/(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = MONTHS[m[2]];
  const year = parseInt(m[3], 10);
  if (month === undefined || Number.isNaN(day) || Number.isNaN(year)) return null;
  const then = new Date(year, month, day).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86400000);
  return days >= 0 ? days : null;
}

export function HabitatModule({
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
  onMouseLeave,
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
      gender: editDesignation === 'MACHO' ? '♂' : '♀',
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
      filter: 'blur(10px) brightness(0.5)',
    }),
    center: {
      zIndex: 1,
      rotateY: 0,
      z: 0,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px) brightness(1)',
    },
    exit: (dir: number) => ({
      zIndex: 0,
      rotateY: dir < 0 ? 90 : -90,
      z: -300,
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      filter: 'blur(10px) brightness(0.5)',
    }),
  };

  const orbitDays = useMemo(() => daysSinceOrigin(pet.birthDate), [pet.birthDate]);

  // Telemetría segmentada
  const SEGMENTS = 16;
  const joyFilled = Math.round((joy / 100) * SEGMENTS);
  const warmthPct = Math.min(Math.max((warmth - 20) / 6, 0), 1); // 20-26°C
  const warmthFilled = Math.round(warmthPct * SEGMENTS);

  const chamfer = 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))';

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden border border-white/10 bg-[#060409] p-5 pl-9 sm:p-6 sm:pl-11"
      style={{ clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))' }}
    >
      {/* Franja de acento */}
      <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: pet.accent, boxShadow: `0 0 12px ${pet.accent}` }} />

      {/* Corchetes HUD */}
      <span className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2" style={{ borderColor: `${pet.accent}88` }} />
      <span className="pointer-events-none absolute bottom-2 left-8 h-3 w-3 border-b-2 border-l-2" style={{ borderColor: `${pet.accent}88` }} />

      {/* Cabecera */}
      <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-3 font-mono">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.15em] text-white">Cápsula de Vida</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[9px] uppercase tracking-[0.2em] text-[#a88a7e]">
            <span>TRIPULANTE: {pet.name}</span>
            {orbitDays !== null && (
              <span className="text-[#594137]">
                · <span style={{ color: pet.accent }}>T+{orbitDays.toLocaleString('es-CO')}d</span> EN ÓRBITA
              </span>
            )}
          </p>
        </div>
        <span
          className="flex items-center gap-1.5 border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.2em]"
          style={{ color: '#34d399', borderColor: '#34d39955', clipPath: chamfer }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'ps-vital-pulse 1.6s ease-in-out infinite' }} />
          SOPORTE ACTIVO
        </span>
      </div>

      {/* Ventana de bio-monitoreo (carrusel) */}
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="group relative mx-auto mb-6 flex min-h-[300px] w-full max-w-md items-center justify-center overflow-hidden border border-white/10 bg-black"
        style={{ perspective: '2000px', clipPath: chamfer }}
      >
        <div className="pointer-events-none absolute inset-0 z-10 bg-mosaic opacity-30" />

        {/* Corchetes de la ventana */}
        <span className="pointer-events-none absolute left-1.5 top-1.5 z-20 h-3 w-3 border-l border-t" style={{ borderColor: pet.accent }} />
        <span className="pointer-events-none absolute right-1.5 top-1.5 z-20 h-3 w-3 border-r border-t" style={{ borderColor: pet.accent }} />
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 z-20 h-3 w-3 border-b border-l" style={{ borderColor: pet.accent }} />
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 z-20 h-3 w-3 border-b border-r" style={{ borderColor: pet.accent }} />

        {/* Ghost para altura dinámica */}
        <img src={photos[currentIndex] || pet.src} alt="" className="invisible h-auto w-full opacity-0" />

        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={photos[currentIndex] || pet.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              rotateY: { type: 'spring', stiffness: 200, damping: 20 },
              default: { duration: 0.4 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(_, info) => {
              const swipe = info.offset.x;
              if (swipe < -50) onNext();
              else if (swipe > 50) onPrev();
            }}
            className="absolute inset-0 flex cursor-grab items-center justify-center p-4 active:cursor-grabbing"
            style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
          >
            <img
              src={photos[currentIndex] || pet.src}
              alt={pet.name}
              className="h-auto max-h-full w-auto max-w-full object-contain contrast-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-transform duration-500 hover:scale-[1.02]"
            />
          </motion.div>
        </AnimatePresence>

        {/* Línea de escaneo del bio-monitor */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 z-10 h-px opacity-40"
          style={{ backgroundColor: pet.accent, boxShadow: `0 0 12px ${pet.accent}` }}
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        <div className="pointer-events-none absolute inset-0 z-10" style={{ boxShadow: `inset 0 0 80px ${pet.accent}15` }} />

        {/* Controles del carrusel */}
        {photos.length > 1 && (
          <>
            <div className="absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-between px-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button onClick={onPrev} className="!min-h-0 border border-white/20 bg-[#050505] p-1.5 text-stone-500 transition-colors hover:text-white" style={{ borderColor: `${pet.accent}55` }}>
                <ChevronLeft size={16} className="stroke-[1.5]" />
              </button>
              <button onClick={onNext} className="!min-h-0 border border-white/20 bg-[#050505] p-1.5 text-stone-500 transition-colors hover:text-white" style={{ borderColor: `${pet.accent}55` }}>
                <ChevronRight size={16} className="stroke-[1.5]" />
              </button>
            </div>
            <div className="absolute bottom-0 right-0 z-20 flex items-center gap-1.5 border-l border-t border-white/20 bg-[#050505] px-2 py-1.5">
              <span className="font-mono text-[6px] uppercase tracking-widest text-stone-500">REG</span>
              <div className="flex gap-1">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(i)}
                    className="!min-h-0 h-1.5 w-1.5 border transition-colors duration-300"
                    style={{
                      borderColor: i === currentIndex ? pet.accent : 'rgba(120,113,108,0.6)',
                      backgroundColor: i === currentIndex ? pet.accent : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {isEditing ? (
        <div className="mb-5 space-y-3 border border-white/10 bg-black/40 p-4 font-mono" style={{ clipPath: chamfer }}>
          <div className="mb-1 text-[8px] font-black uppercase tracking-widest" style={{ color: pet.accent }}>EDITAR REGISTRO DE {pet.name}</div>

          <div className="flex flex-col gap-1">
            <label className="text-[6px] uppercase tracking-widest text-stone-500">Rol / Designación</label>
            <input
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              placeholder="Guardián Principal"
              className="w-full border border-white/10 bg-black px-2 py-1 text-[10px] uppercase text-white outline-none focus:border-[color:var(--pet-accent)]"
              style={{ ['--pet-accent' as string]: pet.accent }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[6px] uppercase tracking-widest text-stone-500">Perfil</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Descripción de su personalidad..."
              className="min-h-[48px] w-full resize-none border border-white/10 bg-black px-2 py-1 text-[10px] leading-normal text-white outline-none focus:border-[color:var(--pet-accent)]"
              style={{ ['--pet-accent' as string]: pet.accent }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[6px] uppercase tracking-widest text-stone-500">Origen</label>
              <input
                value={editBirthDate}
                onChange={(e) => setEditBirthDate(e.target.value)}
                placeholder="15 MAR 2019"
                className="w-full border border-white/10 bg-black px-2 py-1 text-[10px] uppercase text-white outline-none focus:border-[color:var(--pet-accent)]"
                style={{ ['--pet-accent' as string]: pet.accent }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[6px] uppercase tracking-widest text-stone-500">Identidad</label>
              <select
                value={editDesignation}
                onChange={(e) => setEditDesignation(e.target.value)}
                className="h-[26px] border border-white/10 bg-black px-1 text-[9px] text-white outline-none"
              >
                <option value="MACHO">MACHO</option>
                <option value="HEMBRA">HEMBRA</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setIsEditing(false)} className="!min-h-0 border border-white/10 px-3 py-1 text-[8px] uppercase hover:text-white">Cancelar</button>
            <button onClick={handleSave} className="!min-h-0 border px-3 py-1 text-[8px] uppercase text-white hover:text-black" style={{ borderColor: pet.accent, backgroundColor: `${pet.accent}25` }}>Guardar</button>
          </div>
        </div>
      ) : (
        <>
          {/* Perfil psicológico */}
          <div className="mb-4 border border-white/5 bg-black/20 p-3 font-mono" style={{ clipPath: chamfer }}>
            <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: pet.accent }}>
              <span>Rol: {pet.role}</span>
              <button onClick={handleStartEdit} className="text-[#a88a7e] transition-colors hover:text-white">
                <Edit2 size={10} className="stroke-[1.5]" />
              </button>
            </div>
            <p className="mt-1.5 font-sans text-[10px] leading-normal text-[#e5e2e1]">{pet.description}</p>
          </div>

          {/* Telemetría de soporte vital */}
          <div className="mb-5 grid grid-cols-2 gap-4">
            {/* Moral */}
            <div className="relative border border-white/10 bg-black/40 p-3 font-mono" style={{ clipPath: chamfer }}>
              <div className="flex items-center gap-1.5">
                <Heart size={9} style={{ color: pet.accent }} className="fill-current" />
                <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#a88a7e]">Moral</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-black text-white">{Math.round(joy)}</span>
                  <span className="text-xs" style={{ color: pet.accent }}>%</span>
                </div>
                <button
                  onClick={onGiveCuddles}
                  className="!min-h-0 border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider transition-colors hover:text-black"
                  style={{ borderColor: `${pet.accent}66`, color: pet.accent, backgroundColor: `${pet.accent}12` }}
                >
                  Mimar
                </button>
              </div>
              {/* Barra segmentada */}
              <div className="mt-2 flex gap-[2px]">
                {Array.from({ length: SEGMENTS }).map((_, i) => (
                  <div
                    key={i}
                    className="h-2 flex-1"
                    style={{
                      backgroundColor: i < joyFilled ? pet.accent : 'rgba(255,255,255,0.06)',
                      boxShadow: i < joyFilled ? `0 0 6px ${pet.accent}66` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Soporte vital (calor) */}
            <div className="relative border border-white/10 bg-black/40 p-3 font-mono" style={{ clipPath: chamfer }}>
              <div className="flex items-center gap-1.5">
                <Flame size={9} style={{ color: pet.accent }} className="fill-current" />
                <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#a88a7e]">Soporte Vital</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-black text-white">{warmth}</span>
                  <span className="text-xs" style={{ color: pet.accent }}>°C</span>
                </div>
                <button
                  onClick={onGiveWarmth}
                  className="!min-h-0 border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider transition-colors hover:text-black"
                  style={{ borderColor: `${pet.accent}66`, color: pet.accent, backgroundColor: `${pet.accent}12` }}
                >
                  Cobijar
                </button>
              </div>
              <div className="mt-2 flex gap-[2px]">
                {Array.from({ length: SEGMENTS }).map((_, i) => (
                  <div
                    key={i}
                    className="h-2 flex-1"
                    style={{
                      backgroundColor: i < warmthFilled ? pet.accent : 'rgba(255,255,255,0.06)',
                      boxShadow: i < warmthFilled ? `0 0 6px ${pet.accent}66` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bio-datos */}
          <div className="mt-auto flex items-center gap-4 border-t border-white/10 pt-4">
            <div className="flex flex-1 items-center gap-2 border border-white/10 px-3 py-2 font-mono">
              <Calendar size={12} className="stroke-[1.5] text-[#a88a7e]" />
              <div>
                <span className="block text-[7px] uppercase tracking-[0.2em] text-[#594137]">Origen</span>
                <span className="text-[10px] font-bold text-white">{pet.birthDate}</span>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2 border border-white/10 px-3 py-2 font-mono">
              <span className="text-sm">{pet.gender}</span>
              <div>
                <span className="block text-[7px] uppercase tracking-[0.2em] text-[#594137]">Identidad</span>
                <span className="text-[10px] font-bold text-white">{pet.designation}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
