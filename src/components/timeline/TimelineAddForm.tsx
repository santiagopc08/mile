import React, { useState, memo } from 'react';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { TimelineService } from '@/services/timelineService';
import { NotificationService } from '@/services/notificationService';
import { useToast } from '@/components/ui/Toast';
import { PRESET_TAGS } from './constants';
import { TimelineEvent } from './types';

interface TimelineAddFormProps {
    events: TimelineEvent[];
    isAdding: boolean;
    setIsAdding: (adding: boolean) => void;
}

// ⚡ Bolt Optimization: Wrap with React.memo to prevent unnecessary re-renders when parent state changes.
export const TimelineAddForm = memo(function TimelineAddForm({ events, isAdding, setIsAdding }: TimelineAddFormProps) {
    const { updateData } = useStore();
    const { profile } = useProfile();
    const { error: notifyError } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [newTags, setNewTags] = useState<string[]>([]);

    if (!profile) return null;

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const title = (form.elements.namedItem('title') as HTMLInputElement).value;
        const date = (form.elements.namedItem('date') as HTMLInputElement).value;
        const desc = (form.elements.namedItem('desc') as HTMLTextAreaElement).value;
        const imageInput = form.elements.namedItem('image') as HTMLInputElement;
        const file = imageInput?.files?.[0];

        if (title && date && desc) {
            setIsUploading(true);
            let imageUrl = undefined;
            if (file) {
                try {
                    imageUrl = await TimelineService.uploadTimelineImage(file);
                } catch (err) {
                    notifyError(`No se pudo subir la imagen: ${err instanceof Error ? err.message : 'error desconocido'}`);
                    setIsUploading(false);
                    return;
                }
            }
            const newEvent: TimelineEvent = {
                id: Date.now().toString(),
                title,
                date,
                description: desc,
                imageUrl: imageUrl || undefined,
                author: profile || 'el',
                tags: newTags,
                reactions: {},
                comments: []
            };
            await updateData({ events: [newEvent, ...events] });

            // Send discrete notification to partner
            const target = profile === 'el' ? 'ella' : 'el';
            const authorName = profile === 'el' ? 'Santiago' : 'Milena';
            NotificationService.addNotification(target, 'history', `¡${authorName} agregó un nuevo recuerdo a nuestra Historia! ✨`).catch(e => console.error(e));

            setIsUploading(false);
            setIsAdding(false);
            setNewTags([]);
        }
    };

    if (!isAdding) {
        return (
            <button
                onClick={() => setIsAdding(true)}
                className="flex w-full items-center justify-center gap-2 border border-white/10 bg-white/[0.03] py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#a88a7e] transition-all hover:border-[#ff7020] hover:text-[#ffb595] rounded-none"
            >
                <Plus className="w-4 h-4 stroke-[1.5]" /> Añadir Nuevo Recuerdo
            </button>
        );
    }

    return (
        <form onSubmit={handleAddEvent} className="relative animate-in space-y-4 border border-white/10 bg-white/[0.03] p-6 pl-10 fade-in slide-in-from-top-4 rounded-none overflow-hidden">
            {/* Left lateral author stripe */}
            <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)' }} />

            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white font-mono">Nuevo Recuerdo</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <input name="title" required placeholder="Título del recuerdo" className="border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#594137] focus:border-[#ff7020] rounded-none font-sans" />
                <input name="date" type="date" required className="border border-white/10 bg-black px-4 py-3 text-sm text-[#a88a7e] outline-none transition-colors focus:border-[#ff7020] rounded-none font-mono" />
            </div>
            <textarea name="desc" required placeholder="Nuestra historia dice..." className="min-h-[100px] w-full border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#594137] focus:border-[#ff7020] rounded-none font-sans" />

            {/* Tags Selection Block */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#a88a7e] font-mono block">Etiquetas</label>
                <div className="flex flex-wrap gap-1.5">
                    {PRESET_TAGS.map(tag => {
                        const isSelected = newTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                    if (isSelected) {
                                        setNewTags(newTags.filter(t => t !== tag));
                                    } else {
                                        setNewTags([...newTags, tag]);
                                    }
                                }}
                                className={`border px-2 py-1 text-[10px] font-mono tracking-wider transition-all rounded-none ${isSelected ? 'border-[#ff7020] text-[#ff7020] bg-[#ff7020]/5' : 'border-white/10 text-[#a88a7e] hover:border-white/30'}`}
                            >
                                {tag}
                            </button>
                        );
                    })}
                </div>
                <input
                    placeholder="Agregar etiqueta personalizada y presiona Enter (e.g. #playa)"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                                const formatted = val.startsWith('#') ? val : `#${val}`;
                                if (!newTags.includes(formatted)) {
                                    setNewTags([...newTags, formatted]);
                                }
                                e.currentTarget.value = '';
                            }
                        }
                    }}
                    className="w-full border border-white/10 bg-black px-4 py-2 text-xs text-white outline-none transition-colors placeholder:text-[#594137] focus:border-[#ff7020] rounded-none font-sans"
                />
            </div>

            <div className="relative">
                <input name="image" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="flex w-full items-center justify-center gap-2 border border-dashed border-white/10 bg-black px-4 py-3 text-[#a88a7e] transition-colors hover:border-[#ff7020] rounded-none">
                    <ImageIcon className="w-4 h-4 stroke-[1.5]" />
                    <span className="text-xs uppercase tracking-wider font-mono">Subir Foto (Opcional)</span>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 border border-white/10 py-3 text-[10px] font-bold uppercase tracking-widest text-[#a88a7e] transition-colors hover:border-white/30 hover:text-white rounded-none font-mono">Cancelar</button>
                <button type="submit" disabled={isUploading} className="flex-1 bg-[#ff7020] py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#ffb595] disabled:opacity-50 rounded-none font-mono">
                    {isUploading ? 'Subiendo...' : 'Guardar Recuerdo'}
                </button>
            </div>
        </form>
    );
});
