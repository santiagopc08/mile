import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import { Pet } from './types';
import { SpaceDecorations } from './SpaceDecorations';

export function OrbitalViewport({
  pet,
  isWarping,
  direction,
  crewIndex,
  crewTotal,
  onPrev,
  onNext,
  hearts,
  profileAccent,
}: {
  pet: Pet;
  isWarping: boolean;
  direction: number;
  crewIndex: number;
  crewTotal: number;
  onPrev: () => void;
  onNext: () => void;
  hearts: { id: number; x: number; y: number }[];
  profileAccent: string;
}) {
  const crewId = String(crewIndex + 1).padStart(2, '0');

  return (
    <div
      className="relative flex w-full max-w-3xl flex-col items-center overflow-hidden border border-white/10 bg-[#04030a]"
      style={{
        clipPath:
          'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px))',
        // Alimenta holo-glow (usado por la plataforma) con el acento del perfil
        ['--color-profile-accent-alpha' as string]: `${profileAccent}66`,
      }}
    >
      {/* Entorno de espacio profundo */}
      <div className="absolute inset-0">
        <SpaceDecorations isWarping={isWarping} direction={direction} petAccent={pet.accent} profileAccent={profileAccent} />
      </div>

      {/* Corchetes HUD de esquina */}
      {[
        'left-2 top-2 border-l-2 border-t-2',
        'right-2 top-2 border-r-2 border-t-2',
        'left-2 bottom-2 border-l-2 border-b-2',
        'right-2 bottom-2 border-r-2 border-b-2',
      ].map((cls) => (
        <span key={cls} className={`pointer-events-none absolute z-30 h-4 w-4 ${cls}`} style={{ borderColor: pet.accent }} />
      ))}

      {/* Barra HUD superior */}
      <div className="relative z-30 flex w-full items-center justify-between px-4 pt-3 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: pet.accent }}>
            TRIPULANTE_{crewId}
          </span>
          <span className="hidden text-[7px] uppercase tracking-[0.2em] text-white/30 sm:inline">
            // {pet.designation}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[7px] uppercase tracking-[0.2em] text-emerald-400/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'ps-vital-pulse 1.6s ease-in-out infinite' }} />
          HOLO-LINK ESTABLE
        </div>
      </div>

      {/* Partículas de corazones */}
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.span
            key={h.id}
            initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 1.6, x: h.x, y: h.y }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="pointer-events-none absolute z-40 text-2xl"
            style={{ left: '50%', top: '42%', translate: '-50% -50%' }}
          >
            ❤️
          </motion.span>
        ))}
      </AnimatePresence>

      {/* Lecturas de telemetría flotantes */}
      <div className="pointer-events-none absolute left-3 top-1/3 z-20 hidden font-mono text-[7px] leading-relaxed uppercase tracking-[0.15em] text-white/35 sm:block">
        <div style={{ color: pet.accent }}>ÓRBITA</div>
        <div>402.6 KM</div>
        <div className="mt-2" style={{ color: pet.accent }}>O₂</div>
        <div>{pet.o2.toFixed(1)}%</div>
      </div>
      <div className="pointer-events-none absolute right-3 top-1/3 z-20 hidden text-right font-mono text-[7px] leading-relaxed uppercase tracking-[0.15em] text-white/35 sm:block">
        <div style={{ color: pet.accent }}>TEMP</div>
        <div>{pet.temp.toFixed(1)}°C</div>
        <div className="mt-2" style={{ color: pet.accent }}>VECTOR</div>
        <div>+{crewId}.4</div>
      </div>

      {/* Ensamblaje deslizante: cámara holo + plataforma */}
      <div className="relative z-10 h-[360px] w-full sm:h-[420px]">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={pet.id}
            custom={direction}
            initial={{ x: direction * 220, opacity: 0, filter: 'blur(12px)' }}
            animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ x: direction * -220, opacity: 0, filter: 'blur(12px)' }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-0 flex flex-col items-center"
          >
            {/* Cámara de holo-proyección */}
            <div
              className="relative z-20 mt-6 h-52 w-52 flex-shrink-0 sm:h-64 sm:w-64"
              style={{ animation: 'holo-float 4s ease-in-out infinite' }}
            >
              {/* Barrido de radar detrás del sujeto */}
              <div
                className="absolute inset-2 rounded-full opacity-40"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, ${pet.accent}55 40deg, transparent 70deg)`,
                  maskImage: 'radial-gradient(closest-side, black 60%, transparent 100%)',
                  WebkitMaskImage: 'radial-gradient(closest-side, black 60%, transparent 100%)',
                  animation: 'ps-radar-sweep 6s linear infinite',
                }}
              />

              {/* Anillo de marcas de telemetría */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `repeating-conic-gradient(from 0deg, ${pet.accent}cc 0deg 1.2deg, transparent 1.2deg 9deg)`,
                  maskImage:
                    'radial-gradient(closest-side, transparent 90%, black 92%, black 97%, transparent 99%)',
                  WebkitMaskImage:
                    'radial-gradient(closest-side, transparent 90%, black 92%, black 97%, transparent 99%)',
                  animation: 'ps-radar-sweep 40s linear infinite',
                }}
              />

              {/* Anillo exterior girando */}
              <div
                className="absolute inset-0 rounded-full border-2 border-white/5"
                style={{ animation: 'spin 10s linear infinite', borderTopColor: pet.accent }}
              />
              {/* Anillo interior contra-girando */}
              <div
                className="absolute inset-3 rounded-full border border-white/5"
                style={{ animation: 'spin 15s linear infinite reverse', borderBottomColor: 'var(--color-profile-accent)' }}
              />

              {/* Satélite orbitando */}
              <div className="absolute inset-0 rounded-full" style={{ animation: 'spin 7s linear infinite' }}>
                <span
                  className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: pet.accent, boxShadow: `0 0 10px ${pet.accent}` }}
                />
              </div>

              {/* Ventana holográfica */}
              <div className="ps-holo-flicker absolute inset-5 overflow-hidden rounded-full border border-white/20 shadow-[inset_0_0_30px_rgba(0,0,0,1)] backdrop-blur-md">
                <img
                  src={pet.src}
                  alt={pet.name}
                  className="h-full w-full rounded-full object-cover contrast-125 saturate-110 mix-blend-luminosity transition-all duration-500 hover:mix-blend-normal"
                />
                {/* Tinte holográfico */}
                <div className="absolute inset-0 rounded-full mix-blend-color" style={{ backgroundColor: `${pet.accent}22` }} />
                {/* Línea de escaneo */}
                <motion.div
                  className="absolute inset-x-0 z-30 h-px opacity-70"
                  style={{ backgroundColor: pet.accent, boxShadow: `0 0 15px ${pet.accent}` }}
                  animate={{ top: ['-10%', '110%', '-10%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              {/* Resplandor */}
              <div
                className="pointer-events-none absolute inset-5 rounded-full"
                style={{ boxShadow: `0 0 55px ${pet.accent}44, inset 0 0 22px ${pet.accent}22` }}
              />
            </div>

            {/* Plataforma de proyección */}
            <div
              className="pointer-events-none relative z-10 -mt-16 w-[300px] sm:w-[460px]"
              style={{ animation: 'holo-glow 4s ease-in-out infinite' }}
            >
              <img src="/img/pets/platform2.png" alt="Plataforma de proyección" className="h-auto w-full drop-shadow-2xl" />
              <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 text-center">
                <span
                  className="font-mono text-xs font-black uppercase tracking-[0.35em] sm:text-base"
                  style={{ color: pet.accent, textShadow: `0 0 15px ${pet.accent}` }}
                >
                  {pet.name}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controles de navegación de tripulación */}
      <div className="relative z-30 mb-4 flex items-center gap-5">
        <button
          onClick={onPrev}
          className="!min-h-0 border border-white/15 bg-black/50 p-3 text-[#a88a7e] backdrop-blur-sm transition-colors hover:border-white/40 hover:text-white"
          style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex flex-col items-center gap-0.5 font-mono">
          <div className="flex items-center gap-1.5 text-[9px] font-black tracking-[0.25em] text-white">
            <Radio size={10} style={{ color: profileAccent }} />
            <span style={{ color: profileAccent }}>{crewId}</span>
            <span className="text-white/25">/ {String(crewTotal).padStart(2, '0')}</span>
          </div>
          <span className="text-[7px] tracking-[0.4em]" style={{ color: 'var(--color-profile-accent)' }}>
            EN LÍNEA
          </span>
        </div>

        <button
          onClick={onNext}
          className="!min-h-0 border border-white/15 bg-black/50 p-3 text-[#a88a7e] backdrop-blur-sm transition-colors hover:border-white/40 hover:text-white"
          style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
