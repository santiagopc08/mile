'use client';

import { motion } from 'framer-motion';
import { Calendar, Plus, Image as ImageIcon, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { StoreService } from '@/services/storeService';

export interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    imageUrl?: string;
    author?: string;
}

interface TimelineProps {
    events: TimelineEvent[];
}

const renderTextWithHashtags = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#[\w\dÀ-ÿ\u00f1\u00d1]+)/g);
    return parts.map((part, index) => {
        if (part.startsWith('#')) {
            return (
                <span key={index} className="font-mono text-user-c font-bold tracking-wider mx-0.5">
                    {part}
                </span>
            );
        }
        return part;
    });
};

export function Timeline({ events }: TimelineProps) {
    const { updateData } = useStore();
    const { profile } = useProfile();
    const [isAdding, setIsAdding] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editImageUrl, setEditImageUrl] = useState<string | undefined>(undefined);
    const [isEditUploading, setIsEditUploading] = useState(false);

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
                    imageUrl = await StoreService.uploadTimelineImage(file);
                } catch (err) {
                    console.error("Upload failed", err);
                    alert("Error al subir la imagen.");
                    setIsUploading(false);
                    return;
                }
            }
            const newEvent = {
                id: Date.now().toString(),
                title,
                date,
                description: desc,
                imageUrl: imageUrl || undefined,
                author: profile || 'el'
            };
            await updateData({ events: [newEvent, ...events] });
            
            // Enviar notificación a la pareja (discreta)
            const target = profile === 'el' ? 'ella' : 'el';
            const authorName = profile === 'el' ? 'Santiago' : 'Milena';
            StoreService.addNotification(target, 'history', `¡${authorName} agregó un nuevo recuerdo a nuestra Historia! ✨`).catch(e => console.error(e));

            setIsUploading(false);
            setIsAdding(false);
        }
    };

    const handleEditStart = (event: TimelineEvent) => {
        setEditingId(event.id);
        setEditTitle(event.title);
        setEditDate(event.date);
        setEditDesc(event.description);
        setEditImageUrl(event.imageUrl);
        setIsAdding(false);
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
                finalImageUrl = await StoreService.uploadTimelineImage(file);
            } catch (err) {
                console.error("Upload failed", err);
                alert("Error al subir la imagen.");
                setIsEditUploading(false);
                return;
            }
            setIsEditUploading(false);
        }

        const updated = events.map(ev => ev.id === editingId ? {
            ...ev,
            title: editTitle.trim(),
            date: editDate,
            description: editDesc.trim(),
            imageUrl: finalImageUrl
        } : ev);

        await updateData({ events: updated });
        setEditingId(null);
    };

    return (
        <div className="relative flex w-full flex-col items-center bg-mosaic py-8">
            <div className="mb-10 w-full max-w-4xl border border-white/10 bg-[#0a0a0a] p-6 text-center rounded-none">
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#a88a7e] font-mono">Nuestros Momentos</p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-normal text-white font-sans">Historia Compartida</h2>
            </div>
            
            {profile && (
                <div className="z-10 mb-16 w-full max-w-2xl">
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex w-full items-center justify-center gap-2 border border-white/10 bg-[#0a0a0a] py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#a88a7e] transition-all hover:border-[#ff7020] hover:text-[#ffb595] rounded-none"
                        >
                            <Plus className="w-4 h-4 stroke-[1.5]" /> Añadir Nuevo Recuerdo
                        </button>
                    ) : (
                        <form onSubmit={handleAddEvent} className="relative animate-in space-y-4 border border-white/10 bg-[#0a0a0a] p-6 pl-10 fade-in slide-in-from-top-4 rounded-none overflow-hidden">
                            {/* Left lateral author stripe */}
                            <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)' }} />

                            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white font-mono">Nuevo Recuerdo</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <input name="title" required placeholder="Título del recuerdo" className="border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#594137] focus:border-[#ff7020] rounded-none" />
                                <input name="date" type="date" required className="border border-white/10 bg-black px-4 py-3 text-sm text-[#a88a7e] outline-none transition-colors focus:border-[#ff7020] rounded-none" />
                            </div>
                            <textarea name="desc" required placeholder="Nuestra historia dice..." className="min-h-[100px] w-full border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#594137] focus:border-[#ff7020] rounded-none" />

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
                    )}
                </div>
            )}

            <div className="relative w-full pl-6 md:pl-0">
                {/* Central Line - Mobile: Left Aligned | Desktop: Centered */}
                <div className="absolute bottom-0 left-0 top-0 w-px bg-white/10 md:left-1/2 md:-translate-x-1/2" />

                <div className="space-y-16 md:space-y-24">
                    {events.map((event, index) => {
                    const isLeft = index % 2 === 0;
                    const eventAccent = event.author === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';

                    return (
                        <motion.div
                            key={event.id}
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
                                <div className={`relative overflow-hidden border p-5 pl-10 md:p-6 md:pl-10 transition-all rounded-none bg-[#0a0a0a] ${editingId === event.id ? 'border-[#ff7020]' : 'border-white/10'}`}>
                                    
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
                                                    className="border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-[#594137] focus:border-[#ff7020] rounded-none"
                                                />
                                                <input
                                                    type="date"
                                                    value={editDate}
                                                    onChange={e => setEditDate(e.target.value)}
                                                    className="border border-white/10 bg-black px-3 py-2 text-sm text-[#a88a7e] outline-none focus:border-[#ff7020] rounded-none"
                                                />
                                            </div>
                                            <textarea
                                                value={editDesc}
                                                onChange={e => setEditDesc(e.target.value)}
                                                placeholder="Descripción"
                                                className="min-h-[80px] w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-[#594137] focus:border-[#ff7020] rounded-none"
                                            />

                                            {editImageUrl && (
                                                <div className="overflow-hidden border border-white/10 rounded-none">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={editImageUrl} alt="Current" className="w-full h-auto max-h-32 object-cover opacity-60" />
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
                                    <div className={`mb-3 flex items-center gap-2 text-sm text-[#a88a7e] ${isLeft ? 'justify-start md:justify-end' : 'justify-start'}`}>
                                        <Calendar className="h-4 w-4 text-[#00dbe9] stroke-[1.5]" />
                                        <time className="font-mono tracking-tighter text-xs">{event.date}</time>
                                        {profile && (
                                            <button onClick={() => handleEditStart(event)} className="ml-auto text-[#a88a7e] transition-all hover:text-[#ffb595]">
                                                <Pencil className="w-3.5 h-3.5 stroke-[1.5]" />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className="mb-2 text-xl font-bold uppercase tracking-normal text-white transition-colors hover:text-[#ffb595] font-sans">
                                        {event.title}
                                    </h3>
                                    <p className="font-light leading-relaxed tracking-normal text-[#e1bfb2] font-sans">
                                        {renderTextWithHashtags(event.description)}
                                    </p>

                                    {event.imageUrl && (
                                        <div className="mt-4 min-h-32 overflow-hidden border border-white/10 bg-black rounded-none">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={event.imageUrl}
                                                alt={event.title}
                                                className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-500"
                                            />
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
                })}
            </div>
        </div>
        </div>
    );
}
