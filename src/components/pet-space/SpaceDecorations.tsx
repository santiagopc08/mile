import { useMemo } from 'react';

/**
 * SpaceDecorations — entorno de espacio profundo inmersivo tras la cámara de
 * holo-proyección. Multicapa: nebulosas a la deriva, campo de estrellas con
 * paralaje por profundidad, cometas ocasionales, rejilla de cubierta en
 * perspectiva y viñeta. Todo con animaciones CSS (GPU) para mantener 60fps.
 */
export function SpaceDecorations({
  isWarping,
  direction,
  petAccent,
  profileAccent,
}: {
  isWarping: boolean;
  direction: number;
  petAccent: string;
  profileAccent: string;
}) {
  // 3 capas de estrellas por profundidad (lejos → cerca): tamaño, densidad y titileo distintos
  const layers = useMemo(() => {
    const make = (count: number, sizeBase: number, sizeVar: number, minOp: number, maxOp: number) =>
      Array.from({ length: count }).map(() => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * sizeVar + sizeBase,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2.5,
        min: minOp,
        max: maxOp,
      }));
    return {
      far: make(46, 0.6, 0.7, 0.08, 0.5),
      mid: make(26, 1.1, 1.1, 0.15, 0.85),
      near: make(12, 1.8, 1.6, 0.35, 1),
    };
  }, []);

  // Cometas ocasionales con trayectorias/tiempos distintos
  const comets = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, i) => ({
        top: 8 + Math.random() * 35,
        left: -10 + Math.random() * 30,
        dx: 340 + Math.random() * 220,
        dy: 120 + Math.random() * 160,
        delay: i * 6 + Math.random() * 5,
        duration: 2.6 + Math.random() * 1.6,
        rot: 18 + Math.random() * 14,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {/* Base de espacio profundo */}
      <div className="absolute inset-0 bg-[#04030a]" />

      {/* Nebulosas radiales a la deriva */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `
            radial-gradient(circle at 24% 32%, ${petAccent}40 0%, transparent 60%),
            radial-gradient(circle at 78% 68%, ${profileAccent}30 0%, transparent 66%),
            radial-gradient(circle at 60% 12%, #4b1f6e33 0%, transparent 55%)
          `,
          filter: 'blur(50px)',
          animation: 'ps-nebula-drift 26s ease-in-out infinite',
        }}
      />

      {/* Campo de estrellas — capa lejana (con leve paralaje según dirección de warp) */}
      <div
        className="absolute inset-0 transition-transform duration-700"
        style={{ transform: `translateX(${direction * (isWarping ? -8 : -2)}px)` }}
      >
        {layers.far.map((s, i) => (
          <span
            key={`f-${i}`}
            className="absolute rounded-full bg-white/90 mix-blend-screen"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              ['--ps-min' as string]: s.min,
              ['--ps-max' as string]: s.max,
              animation: `ps-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Capa media */}
      <div
        className="absolute inset-0 transition-transform duration-700"
        style={{ transform: `translateX(${direction * (isWarping ? -22 : -5)}px)` }}
      >
        {layers.mid.map((s, i) => (
          <span
            key={`m-${i}`}
            className="absolute rounded-full bg-white mix-blend-screen"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              boxShadow: `0 0 ${s.size * 2}px rgba(255,255,255,0.5)`,
              ['--ps-min' as string]: s.min,
              ['--ps-max' as string]: s.max,
              animation: `ps-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Capa cercana (warp = estelas hacia el borde) */}
      <div
        className="absolute inset-0 transition-transform duration-700"
        style={{ transform: `translateX(${direction * (isWarping ? -48 : -9)}px)` }}
      >
        {layers.near.map((s, i) => (
          <span
            key={`n-${i}`}
            className="absolute rounded-full bg-white mix-blend-screen"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: isWarping ? `${s.size * 9}px` : `${s.size}px`,
              height: `${s.size}px`,
              boxShadow: `0 0 ${s.size * 3}px rgba(255,255,255,0.7)`,
              transition: 'width 0.6s ease-in',
              ['--ps-min' as string]: s.min,
              ['--ps-max' as string]: s.max,
              animation: isWarping ? 'none' : `ps-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Cometas */}
      {comets.map((c, i) => (
        <span
          key={`c-${i}`}
          className="absolute h-px mix-blend-screen"
          style={{
            top: `${c.top}%`,
            left: `${c.left}%`,
            width: '120px',
            background: `linear-gradient(90deg, transparent, ${profileAccent}, #ffffff)`,
            boxShadow: `0 0 6px ${profileAccent}`,
            transform: `rotate(${c.rot}deg)`,
            ['--ps-comet-x' as string]: `${c.dx}px`,
            ['--ps-comet-y' as string]: `${c.dy}px`,
            animation: `ps-comet ${c.duration}s ease-in ${c.delay}s infinite`,
            transformOrigin: 'left center',
          }}
        />
      ))}

      {/* Rejilla de cubierta en perspectiva (piso de la estación) */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden"
        style={{ perspective: '340px', maskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 100%)' }}
      >
        <div
          className="ps-deck-grid absolute inset-x-[-50%] bottom-[-40%] h-[180%] w-[200%] origin-bottom"
          style={{
            transform: 'rotateX(74deg)',
            ['--ps-grid-color' as string]: `${petAccent}22`,
          }}
        />
      </div>

      {/* Resplandor de horizonte sobre la rejilla */}
      <div
        className="absolute inset-x-0 bottom-[42%] h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${petAccent}, transparent)`, boxShadow: `0 0 20px ${petAccent}` }}
      />

      {/* Viñeta */}
      <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 140px 30px rgba(0,0,0,0.9)' }} />
    </div>
  );
}
