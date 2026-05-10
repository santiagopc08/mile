'use client';

import { Pet } from './types';
import { motion } from 'framer-motion';

interface PetMetadataPanelProps {
  pet: Pet;
}

export const PetMetadataPanel = ({ pet }: PetMetadataPanelProps) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-[#ff7020] pl-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white sm:text-4xl">
          {pet.name}
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#ffb595]">
          {pet.role}
        </p>
      </div>

      <p className="text-sm leading-relaxed text-[#e1bfb2] md:text-base">
        {pet.description}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-white/10 bg-[#0a0a0a] p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#a88a7e]">Fecha Nacimiento</p>
          <p className="mt-1 font-mono text-sm text-white">{pet.birthDate}</p>
        </div>
        <div className="border border-white/10 bg-[#0a0a0a] p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#a88a7e]">Género</p>
          <p className="mt-1 font-mono text-sm text-white uppercase">{pet.gender}</p>
        </div>
      </div>
    </div>
  );
};
