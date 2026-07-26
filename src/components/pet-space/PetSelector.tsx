import { Pet } from './types';

/**
 * PetSelector — Manifiesto de tripulación: roster horizontal de compañeros como
 * tarjetas biseladas con avatar holográfico, ID de tripulante y LED de estado.
 */
export function PetSelector({
  pets,
  activeId,
  onSelect,
}: {
  pets: Pet[];
  activeId: string;
  onSelect: (id: string, index: number) => void;
}) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
      {pets.map((p, i) => {
        const active = p.id === activeId;
        const crewId = String(i + 1).padStart(2, '0');
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id, i)}
            className="group relative flex flex-shrink-0 items-center gap-3 border bg-black/50 px-3.5 py-2.5 font-mono transition-all"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
              borderColor: active ? p.accent : 'rgba(255,255,255,0.1)',
              boxShadow: active ? `0 0 18px ${p.accent}30, inset 0 0 12px ${p.accent}15` : 'none',
            }}
          >
            {/* Barrido de escaneo en la tarjeta activa */}
            {active && (
              <span
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background: `linear-gradient(120deg, transparent 40%, ${p.accent}25 50%, transparent 60%)`,
                }}
              />
            )}

            {/* Avatar holográfico */}
            <div
              className="force-circle relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border"
              style={{ borderColor: active ? p.accent : 'rgba(255,255,255,0.15)' }}
            >
              <img
                src={p.src}
                alt={p.name}
                className={`h-full w-full rounded-full object-cover transition-all duration-500 ${
                  active ? '' : 'grayscale group-hover:grayscale-0'
                }`}
              />
              <div className="absolute inset-0 rounded-full mix-blend-color" style={{ backgroundColor: active ? `${p.accent}25` : 'transparent' }} />
            </div>

            {/* Datos del tripulante */}
            <div className="flex flex-col items-start leading-tight">
              <span className={`text-[11px] font-black uppercase tracking-[0.12em] ${active ? 'text-white' : 'text-[#a88a7e] group-hover:text-white'}`}>
                {p.name}
              </span>
              <span className="text-[7px] uppercase tracking-[0.2em] text-white/30">
                TRIP_{crewId} · {p.role}
              </span>
            </div>

            {/* LED de estado */}
            <span
              className="ml-1 h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{
                backgroundColor: active ? p.accent : 'rgba(255,255,255,0.2)',
                boxShadow: active ? `0 0 8px ${p.accent}` : 'none',
                animation: active ? 'ps-vital-pulse 1.6s ease-in-out infinite' : 'none',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
