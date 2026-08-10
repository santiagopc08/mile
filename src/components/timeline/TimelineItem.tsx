import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, Image as ImageIcon, Pencil, MessageSquare } from 'lucide-react';
import { renderTextWithHashtags } from '@/utils/textFormatting';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { TimelineService } from '@/services/timelineService';
import { useToast } from '@/components/ui/Toast';
import { PRESET_TAGS, EMOJI_OPTIONS } from './constants';
import { TimelineEvent } from './types';

interface TimelineItemProps {
    event: TimelineEvent;
    events: TimelineEvent[];
    isLeft: boolean;
    setActiveEventId: (id: string) => void;
}

export function TimelineItem({ event, events, isLeft, setActiveEventId }: TimelineItemProps) {
    const { updateData } = useStore();
    const { profile } = useProfile();
    const { error: notifyError } = useToast();

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editImageUrl, setEditImageUrl] = useState<string | undefined>(undefined);
    const [editTags, setEditTags] = useState<string[]>([]);
    const [isEditUploading, setIsEditUploading] = useState(false);

    const eventAccent = event.author === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';

    const handleEditStart = (event: TimelineEvent) => {
        setEditingId(event.id);
        setEditTitle(event.title);
        setEditDate(event.date);
        setEditDesc(event.description);
        setEditImageUrl(event.imageUrl);
        setEditTags(event.tags || []);
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId || !editTitle.trim() || !editDate || !editDesc.trim()) return;

        const form = e.currentTarget as HTMLFormElement;
        const imageInput = form.elements.namedItem('editImage') as HTMLInputElement;
        const file = imageInput?.files?.[0];

        let finalImageUrl = editImageUrl;
        if (file) {
            setIsEditUploading(true);
            try {
                finalImageUrl = await TimelineService.uploadTimelineImage(file);
            } catch (err) {
                notifyError(`No se pudo subir la imagen: ${err instanceof Error ? err.message : 'error desconocido'}`);
                setIsEditUploading(false);
                return;
            }
            setIsEditUploading(false);
        }

        // ⚡ Bolt Optimization: Replace O(N) map with single pass findIndex + mutation
        const updated = [...events];
        const editIdx = updated.findIndex(ev => ev.id === editingId);
        if (editIdx !== -1) {
            updated[editIdx] = {
                ...updated[editIdx],
                title: editTitle.trim(),
                date: editDate,
                description: editDesc.trim(),
                imageUrl: finalImageUrl,
                tags: editTags
            };
        }

        await updateData({ events: updated });
        setEditingId(null);
        setEditTags([]);
    };

    const handleReact = async (event: TimelineEvent, emoji: string) => {
        if (!profile || !event) return;

        const reactions = { ...(event.reactions || {}) };
        const currentReactors = reactions[emoji] || [];
        let updatedReactors;
        if (currentReactors.includes(profile)) {
            updatedReactors = currentReactors.filter(p => p !== profile);
        } else {
            updatedReactors = [...currentReactors, profile];
        }

        if (updatedReactors.length === 0) {
            delete reactions[emoji];
        } else {
            reactions[emoji] = updatedReactors;
        }

        // Optimistic update
        // ⚡ Bolt Optimization: Replace O(N) map with single pass findIndex + mutation
        const updatedEvents = [...events];
        const eventIdx = updatedEvents.findIndex(e => e.id === event.id);
        if (eventIdx !== -1) {
            updatedEvents[eventIdx] = { ...updatedEvents[eventIdx], reactions };
        }
        await updateData({ events: updatedEvents });

        try {
            await fetch('/api/timeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'react', id: event.id, reactions })
            });
        } catch (err) {
            notifyError(`No se pudo guardar tu reacción: ${err instanceof Error ? err.message : 'error desconocido'}`);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`relative flex items-center justify-between w-full md:flex-row flex-col ${isLeft ? 'md:flex-row-reverse' : ''}`}
        >
            {/* Timeline dot - Square instead of circle, colored by author accent */}
            <div className="absolute left-0 top-6 z-10 -ml-[8px] h-4 w-4 rotate-45 border-2 border-black md:left-1/2 md:top-auto md:-translate-x-1/2" style={{ backgroundColor: eventAccent }} />

            {/* Empty space for opposite side (Desktop Only) */}
            <div className="hidden md:block md:w-5/12" />

            {/* Content Card */}
            <div className={`w-full pl-8 md:pl-0 md:w-5/12 ${isLeft ? 'md:text-right text-left' : 'text-left'}`}>
                <div className={`relative overflow-hidden border p-5 pl-10 md:p-6 md:pl-10 transition-all rounded-none bg-white/[0.03] ${editingId === event.id ? 'border-[#ff7020]' : 'border-white/10'}`}>

                    {/* Left lateral author stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: eventAccent }} />

                    {editingId === event.id ? (
                        <form onSubmit={handleEditSave} className="space-y-3 text-left">
                            <div className="grid md:grid-cols-2 gap-3">
                                <input
                                    autoFocus
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    placeholder="Título"
                                    className="border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-[#594137] focus:border-[#ff7020] rounded-none font-sans"
                                />
                                <input
                                    type="date"
                                    value={editDate}
                                    onChange={e => setEditDate(e.target.value)}
                                    className="border border-white/10 bg-black px-3 py-2 text-sm text-[#a88a7e] outline-none focus:border-[#ff7020] rounded-none font-mono"
                                />
                            </div>
                            <textarea
                                value={editDesc}
                                onChange={e => setEditDesc(e.target.value)}
                                placeholder="Descripción"
                                className="min-h-[80px] w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-[#594137] focus:border-[#ff7020] rounded-none font-sans"
                            />

                            {/* Edit Tags Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#a88a7e] font-mono block">Etiquetas</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {PRESET_TAGS.map(tag => {
                                        const isSelected = editTags.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setEditTags(editTags.filter(t => t !== tag));
                                                    } else {
                                                        setEditTags([...editTags, tag]);
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
                                                if (!editTags.includes(formatted)) {
                                                    setEditTags([...editTags, formatted]);
                                                }
                                                e.currentTarget.value = '';
                                            }
                                        }
                                    }}
                                    className="w-full border border-white/10 bg-black px-4 py-2 text-xs text-white outline-none transition-colors placeholder:text-[#594137] focus:border-[#ff7020] rounded-none font-sans"
                                />
                            </div>

                            {editImageUrl && (
                                <div className="overflow-hidden border border-white/10 rounded-none">
                                    <Image src={editImageUrl} alt="Current" width={500} height={300} className="w-full h-auto max-h-32 object-cover opacity-60" unoptimized />
                                </div>
                            )}

                            <div className="relative">
                                <input name="editImage" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="flex w-full items-center justify-center gap-2 border border-dashed border-white/10 bg-black px-3 py-2 text-xs text-[#a88a7e] transition-colors hover:border-[#ff7020] rounded-none">
                                    <ImageIcon className="w-4 h-4 stroke-[1.5]" />
                                    <span className="uppercase text-[10px] tracking-wider font-mono">{editImageUrl ? 'Reemplazar Foto' : 'Subir Foto'}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => setEditingId(null)} className="flex-1 border border-white/10 py-2 text-xs font-bold uppercase tracking-widest text-[#a88a7e] transition-colors hover:border-white/30 hover:text-white rounded-none font-mono">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isEditUploading} className="flex-1 bg-[#ff7020] py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#ffb595] disabled:opacity-50 rounded-none font-mono">
                                    {isEditUploading ? 'Subiendo...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    ) : (
                    <>
                    <div className={`mb-2 flex items-center gap-2 text-sm text-[#a88a7e] ${isLeft ? 'justify-start md:justify-end' : 'justify-start'}`}>
                        <Calendar className="h-4 w-4 text-[#00dbe9] stroke-[1.5]" />
                        <time className="font-mono tracking-tighter text-xs">{event.date}</time>
                        {profile && (
                            <button onClick={() => handleEditStart(event)} className="ml-auto text-[#a88a7e] transition-all hover:text-[#ffb595]">
                                <Pencil className="w-3.5 h-3.5 stroke-[1.5]" />
                            </button>
                        )}
                    </div>

                    {/* Render Tags */}
                    {event.tags && event.tags.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mb-2 ${isLeft ? 'justify-start md:justify-end' : 'justify-start'}`}>
                            {event.tags.map(tag => (
                                <span key={tag} className="border border-white/5 bg-white/5 px-1.5 py-0.5 text-[8.5px] font-mono text-user-c tracking-wider font-bold rounded-none">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <h3 className="mb-2 text-xl font-bold uppercase tracking-normal text-white transition-colors hover:text-[#ffb595] font-sans">
                        {event.title}
                    </h3>
                    <p className="font-light leading-relaxed tracking-normal text-[#e1bfb2] font-sans">
                        {renderTextWithHashtags(event.description)}
                    </p>

                    {event.imageUrl && (
                        <div className="mt-4 min-h-32 overflow-hidden border border-white/10 bg-black rounded-none">
                            <Image src={event.imageUrl} alt={event.title} width={500} height={300} className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-500" unoptimized />
                        </div>
                    )}

                    {/* Reactions and Comments Action Section */}
                    {profile && (
                        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3 w-full">
                            <div className="flex flex-wrap items-center gap-1">
                                {EMOJI_OPTIONS.map(emoji => {
                                    const reactors = event.reactions?.[emoji] || [];
                                    const hasReacted = reactors.includes(profile);
                                    const count = reactors.length;
                                    return (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReact(event, emoji)}
                                            className={`flex items-center gap-1 border px-2 py-1 text-xs transition-colors rounded-none font-mono ${hasReacted ? 'border-[#ff7020] text-[#ff7020] bg-[#ff7020]/5' : 'border-white/5 bg-black/40 text-white/60 hover:border-white/20'}`}
                                        >
                                            <span>{emoji}</span>
                                            {count > 0 && <span className="text-[10px] font-bold">{count}</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className={`${isLeft ? 'md:ml-0 md:mr-auto ml-auto' : 'ml-auto'} flex items-center`}>
                                <button onClick={() => setActiveEventId(event.id)} className="flex items-center gap-1.5 text-xs text-[#a88a7e] hover:text-[#ffb595] transition-colors font-mono">
                                    <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
                                    <span>({event.comments?.length || 0}) Comentarios</span>
                                </button>
                            </div>
                        </div>
                    )}
                    </>)}

                    {/* Geometric accent corner */}
                    <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden">
                        <div className="absolute right-0 top-0 h-[1px] w-[140%] origin-top-right rotate-45 bg-white/10" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
