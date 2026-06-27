import { useState, useEffect } from 'react';
import { Pet } from './types';

export function SystemLog({ pet, logs }: { pet: Pet; logs: { time: string; text: string; category: string }[] }) {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="relative border border-white/10 bg-[#0a0a0a] p-4 pl-10 font-mono text-[9px] leading-relaxed text-[#594137] max-h-44 overflow-y-auto custom-scrollbar rounded-none overflow-hidden flex-1">
      {/* Solid Left Accent Stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: pet.accent }} />

      <div className="mb-2 text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Diario de Cuidados</div>
      <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-2 custom-scrollbar">
        {logs.map((log, index) => (
          <div key={index}>
            <span className="text-profile-accent mr-1">●</span> {log.category}
            <div className="ml-3 text-[#a88a7e]">
              <span className="text-[#594137] mr-1.5">{log.time}</span>
              {log.text}
            </div>
          </div>
        ))}
        <div className="text-[#594137] mt-1">Esperando próxima acción{dots}</div>
      </div>
    </div>
  );
}