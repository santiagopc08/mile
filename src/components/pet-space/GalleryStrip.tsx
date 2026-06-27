import { useState, useRef } from 'react';
import { TimelineService } from '@/services/timelineService';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Pet } from './types';

export function GalleryStrip({
  pet,
  photos,
  currentIndex,
  onSelect,
  onUploadComplete
}: {
  pet: Pet;
  photos: string[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onUploadComplete: () => Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);

      const url = await TimelineService.uploadTimelineImage(file);

      const { error: insertError } = await supabase
        .from('pet_gallery')
        .insert({
          pet_id: pet.id,
          image_url: url,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`DB Error: ${insertError.message}`);
      }

      await onUploadComplete();
    } catch (err: any) {
      console.error('Upload process failed:', err);
      alert(`Error al subir la foto: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative border border-white/10 bg-[#0a0a0a] p-5 sm:p-6 pl-10 sm:pl-12 rounded-none overflow-hidden">
      {/* Solid Left Accent Stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: pet.accent }} />

      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a88a7e] font-mono">FOTOS</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="!min-h-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] text-profile-accent hover:opacity-80 transition-colors font-mono disabled:opacity-50"
        >
          {isUploading ? 'SUBIENDO...' : 'AGREGAR'} <Plus size={10} className="stroke-[1.5]" />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        {photos.map((src, i) => (
          <div
            key={src}
            onClick={() => onSelect(i)}
            className={`relative flex-shrink-0 w-20 h-20 border overflow-hidden bg-black transition-all duration-300 cursor-pointer rounded-full ${i === currentIndex ? "border-profile-accent scale-105 z-10 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "border-white/10 hover:border-white/30"}`}
          >
            <img src={src} alt="" className="w-full h-full object-cover rounded-full" />
            {i === currentIndex && <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 bg-profile-accent rounded-full border border-black shadow" />}
          </div>
        ))}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`flex-shrink-0 w-20 h-20 border border-dashed border-profile-accent/30 flex flex-col items-center justify-center text-profile-accent/40 hover:text-profile-accent hover:border-profile-accent/60 transition-colors cursor-pointer gap-1 rounded-full ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Plus size={16} className="stroke-[1.5]" />
          <span className="text-[7px] font-bold uppercase tracking-wider font-mono">{isUploading ? '...' : 'AGREGAR'}</span>
        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}