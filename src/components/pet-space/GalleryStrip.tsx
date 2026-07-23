import { useState, useRef } from 'react';
import { TimelineService } from '@/services/timelineService';
import { Plus, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Pet } from './types';

/**
 * GalleryStrip — Archivo visual: capturas del tripulante como marcos-sensor
 * biselados. La lógica de subida (TimelineService + pet_gallery) se conserva.
 */
export function GalleryStrip({
  pet,
  photos,
  currentIndex,
  onSelect,
  onUploadComplete,
}: {
  pet: Pet;
  photos: string[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onUploadComplete: () => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);

      const url = await TimelineService.uploadTimelineImage(file);

      const { error: insertError } = await supabase.from('pet_gallery').insert({
        pet_id: pet.id,
        image_url: url,
        created_at: new Date().toISOString(),
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

  const chamfer = 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))';

  return (
    <div
      className="relative overflow-hidden border border-white/10 bg-[#060409] p-5 pl-9 sm:p-6 sm:pl-10"
      style={{ clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))' }}
    >
      {/* Franja de acento */}
      <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: pet.accent, boxShadow: `0 0 12px ${pet.accent}` }} />

      <div className="mb-4 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <Camera size={12} style={{ color: pet.accent }} className="stroke-[1.5]" />
          <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#a88a7e]">Archivo Visual</span>
          <span className="text-[7px] uppercase tracking-[0.2em] text-white/25">{String(photos.length).padStart(2, '0')} REG</span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="!min-h-0 flex items-center gap-1 border px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] transition-colors disabled:opacity-50"
          style={{ color: pet.accent, borderColor: `${pet.accent}50`, clipPath: chamfer }}
        >
          {isUploading ? 'SUBIENDO...' : 'CAPTURAR'} <Plus size={10} className="stroke-[1.5]" />
        </button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
        {photos.map((src, i) => {
          const active = i === currentIndex;
          return (
            <button
              key={src}
              onClick={() => onSelect(i)}
              className="group relative h-[70px] w-[70px] flex-shrink-0 overflow-hidden border bg-black transition-all duration-300"
              style={{
                clipPath: chamfer,
                borderColor: active ? pet.accent : 'rgba(255,255,255,0.1)',
                boxShadow: active ? `0 0 16px ${pet.accent}40` : 'none',
                transform: active ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <img
                src={src}
                alt=""
                className={`h-full w-full object-cover transition-all duration-300 ${active ? '' : 'brightness-75 group-hover:brightness-100'}`}
              />
              {active && (
                <>
                  <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: `${pet.accent}18` }} />
                  <span className="absolute left-1 top-1 font-mono text-[6px] font-black tracking-widest" style={{ color: pet.accent }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pet.accent, boxShadow: `0 0 6px ${pet.accent}` }} />
                </>
              )}
            </button>
          );
        })}

        {/* Ranura de captura nueva */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex h-[70px] w-[70px] flex-shrink-0 flex-col items-center justify-center gap-1 border border-dashed text-[#a88a7e] transition-colors hover:text-white disabled:opacity-50"
          style={{ borderColor: `${pet.accent}40`, clipPath: chamfer }}
        >
          <Plus size={16} className="stroke-[1.5]" style={{ color: pet.accent }} />
          <span className="font-mono text-[6px] font-bold uppercase tracking-wider">{isUploading ? '...' : 'NUEVO'}</span>
        </button>
      </div>

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
    </div>
  );
}
