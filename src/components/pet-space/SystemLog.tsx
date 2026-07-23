import { useState, useEffect } from 'react';
import { Pet } from './types';

const CATEGORY_META: Record<string, { color: string; tag: string }> = {
  Vida: { color: '#ff4b89', tag: 'VITAL' },
  Hogar: { color: '#ff7020', tag: 'HÁBITAT' },
  Sistema: { color: '#00dbe9', tag: 'SISTEMA' },
};

/**
 * SystemLog — Bitácora de misión: consola terminal con codificación por categoría,
 * cursor parpadeante y línea de escaneo.
 */
export function SystemLog({ pet, logs }: { pet: Pet; logs: { time: string; text: string; category: string }[] }) {
  const [cursor, setCursor] = useState(true);
  useEffect(() => {
    const i = setInterval(() => setCursor((c) => !c), 550);
    return () => clearInterval(i);
  }, []);

  return (
    <div
      className="relative flex-1 overflow-hidden border border-white/10 bg-[#060409] p-4 pl-9 font-mono"
      style={{
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
      }}
    >
      {/* Franja de acento */}
      <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: pet.accent, boxShadow: `0 0 12px ${pet.accent}` }} />

      {/* Línea de escaneo tenue */}
      <div
        className="pointer-events-none absolute inset-x-0 h-16 opacity-[0.06]"
        style={{ background: `linear-gradient(180deg, transparent, ${pet.accent}, transparent)`, animation: 'ps-scan-y 5s linear infinite' }}
      />

      {/* Cabecera */}
      <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-[8px] font-black uppercase tracking-[0.24em] text-[#a88a7e]">Bitácora de Misión</span>
        <span className="text-[7px] uppercase tracking-[0.2em]" style={{ color: pet.accent }}>REG_{pet.id.slice(0, 4).toUpperCase()}</span>
      </div>

      {/* Entradas */}
      <div className="max-h-[118px] space-y-1.5 overflow-y-auto pr-2 text-[9px] leading-relaxed custom-scrollbar">
        {logs.map((log, index) => {
          const meta = CATEGORY_META[log.category] || { color: pet.accent, tag: log.category.toUpperCase() };
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-[1px] flex-shrink-0 text-[6px] uppercase tracking-widest" style={{ color: meta.color }}>▚</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="border px-1 py-[1px] text-[6px] font-black uppercase tracking-[0.15em]"
                    style={{ color: meta.color, borderColor: `${meta.color}55` }}
                  >
                    {meta.tag}
                  </span>
                  <span className="text-[7px] text-[#594137]">{log.time}</span>
                </div>
                <p className="mt-0.5 text-[#c9b3a9]">{log.text}</p>
              </div>
            </div>
          );
        })}
        <div className="pt-0.5 text-[#594137]">
          <span style={{ color: pet.accent }}>&gt;</span> esperando entrada
          <span style={{ opacity: cursor ? 1 : 0, color: pet.accent }}>▊</span>
        </div>
      </div>
    </div>
  );
}
