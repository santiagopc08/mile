'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface PetGalleryThumbnailsProps {
  images: string[];
  accentColor?: string;
}

export const PetGalleryThumbnails = ({ images, accentColor = '#ff7020' }: PetGalleryThumbnailsProps) => {
  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a88a7e]">Misiones / Galería</h4>
        <span className="h-px flex-1 bg-white/10 mx-4" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {images.map((img, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05 }}
            className="group relative h-24 w-24 shrink-0 overflow-hidden border border-white/10 bg-black p-1"
          >
            <img src={img} alt="Gallery" className="h-full w-full object-cover grayscale transition-all group-hover:grayscale-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}

        <button
          className="flex h-24 w-24 shrink-0 flex-col items-center justify-center border-2 border-dashed border-[#ff7020]/40 bg-black/40 text-[#ff7020] transition-colors hover:bg-[#ff7020]/10 hover:border-[#ff7020]"
        >
          <Plus className="h-6 w-6" />
          <span className="mt-2 text-[8px] font-bold uppercase tracking-tighter">Añadir</span>
        </button>
      </div>
    </div>
  );
};
