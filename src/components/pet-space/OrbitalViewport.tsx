import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Pet } from './types';
import { SpaceDecorations } from './SpaceDecorations';

export function OrbitalViewport({
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