import { Pet } from './types';

/**
 * OrbitalRadar — mini-mapa de radar de la estación. Muestra a toda la tripulación
 * como blips distribuidos en órbita; el tripulante activo se ilumina y late.
 * Cada blip es clicable para seleccionar a ese compañero.
 */
export function OrbitalRadar({
  pets,
  activeId,
  onSelect,
  accentColor,
  size = 64,
}: {
  pets: Pet[];
  activeId: string;
  onSelect: (id: string, index: number) => void;
  accentColor: string;
  size?: number;
}) {
  const c = size / 2;
  const orbit = size * 0.34; // radio de la órbita de los blips

  return (
    <div
      className="relative flex-shrink-0 rounded-full border"
      style={{ width: size, height: size, borderColor: `${accentColor}40`, boxShadow: `inset 0 0 12px ${accentColor}18` }}
      role="group"
      aria-label="Radar de tripulación"
    >
      {/* Anillos concéntricos */}
      <div className="absolute rounded-full border" style={{ inset: size * 0.16, borderColor: 'rgba(255,255,255,0.08)' }} />
      <div className="absolute rounded-full border" style={{ inset: size * 0.32, borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Cruz */}
      <div className="absolute left-1/2 top-1 bottom-1 w-px -translate-x-1/2" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
      <div className="absolute top-1/2 left-1 right-1 h-px -translate-y-1/2" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

      {/* Barrido de radar */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${accentColor}55 30deg, transparent 55deg)`,
          animation: 'ps-radar-sweep 4s linear infinite',
        }}
      />

      {/* Blips de la tripulación */}
      {pets.map((p, i) => {
        const angle = (i / pets.length) * Math.PI * 2 - Math.PI / 2;
        const x = c + Math.cos(angle) * orbit;
        const y = c + Math.sin(angle) * orbit;
        const active = p.id === activeId;
        const dot = active ? 8 : 5;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id, i)}
            title={p.name}
            aria-label={p.name}
            className="!min-h-0 absolute rounded-full transition-transform hover:scale-125"
            style={{
              left: x,
              top: y,
              width: dot,
              height: dot,
              transform: 'translate(-50%, -50%)',
              backgroundColor: active ? p.accent : `${p.accent}99`,
              boxShadow: active ? `0 0 10px ${p.accent}` : `0 0 4px ${p.accent}88`,
              border: active ? '1px solid rgba(255,255,255,0.9)' : 'none',
              animation: active ? 'ps-vital-pulse 1.6s ease-in-out infinite' : 'none',
              zIndex: active ? 2 : 1,
            }}
          />
        );
      })}

      {/* Núcleo de la estación */}
      <div
        className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
      />
    </div>
  );
}
