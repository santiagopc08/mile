import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pet } from './types';

export function PetSelector({ pets, activeId, onSelect }: { pets: Pet[]; activeId: string; onSelect: (id: string, index: number) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
      {pets.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id, i)}
          className={`relative flex-shrink-0 flex items-center gap-3 border px-4 py-3 transition-all font-mono text-[10px] uppercase tracking-[0.2em] rounded-none ${p.id === activeId
            ? 'border-profile-accent bg-profile-accent/10 text-white'
            : 'border-white/10 bg-black/40 text-[#a88a7e] hover:border-white/20 hover:text-white'
            }`}
        >
          <div className={`w-8 h-8 overflow-hidden border rounded-full ${p.id === activeId ? 'border-profile-accent' : 'border-white/10'}`}>
            <img src={p.src} alt={p.name} className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-black">{p.name}</span>
            <span className="text-[8px] opacity-50">BEBÉ_{String(i + 1).padStart(2, '0')}</span>
          </div>
          {p.id === activeId && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-profile-accent" />}
        </button>
      ))}
    </div>
  );
}