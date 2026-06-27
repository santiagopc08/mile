import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PawPrint, Calendar, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pet } from './types';

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