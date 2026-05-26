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
            <div className="mb-10 w-full max-w-4xl border border-white/10 bg-[#0a0a0a] p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#a88a7e]">Temporal Archive</p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-normal text-white">Historia Compartida</h2>
            </div>
            
            {profile && (
                <div className="z-10 mb-16 w-full max-w-2xl">
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex w-full items-center justify-center gap-2 border border-white/10 bg-[#0a0a0a] py-4 font-medium text-[#a88a7e] transition-all hover:border-[#ff7020] hover:text-[#ffb595]"
                        >
                            <Plus className="w-5 h-5" /> Añadir Nuevo Recuerdo
                        </button>
                    ) : (
                        <form onSubmit={handleAddEvent} className="geometric-card animate-in space-y-4 border-white/10 bg-[#0a0a0a] p-6 fade-in slide-in-from-top-4">
                            <h3 className="mb-4 border-l-4 border-[#ff7020] pl-3 text-lg font-medium uppercase tracking-normal text-white">Nuevo Recuerdo</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <input name="title" required placeholder="Título del recuerdo" className="border border-white/10 bg-black px-4 py-3 text-white outline-none transition-colors placeholder:text-[#594137] focus:border-[#ff7020]" />
                                <input name="date" type="date" required className="border border-white/10 bg-black px-4 py-3 text-[#a88a7e] outline-none transition-colors focus:border-[#ff7020]" />
                            </div>
                            <textarea name="desc" required placeholder="Nuestra historia dice..." className="min-h-[100px] w-full border border-white/10 bg-black px-4 py-3 text-white outline-none transition-colors placeholder:text-[#594137] focus:border-[#ff7020]" />

                            <div className="relative">
                                <input name="image" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="flex w-full items-center justify-center gap-2 border border-dashed border-white/10 bg-black px-4 py-3 text-[#a88a7e] transition-colors hover:border-[#ff7020]">
                                    <ImageIcon className="w-5 h-5" />
                                    <span>Subir Foto (Opcional)</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 border border-white/10 py-3 text-[#a88a7e] transition-colors hover:border-white/30 hover:text-white">Cancelar</button>
                                <button type="submit" disabled={isUploading} className="flex-1 bg-[#ff7020] py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#ffb595] disabled:opacity-50">
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

                    return (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`relative flex items-center justify-between w-full md:flex-row flex-col ${isLeft ? 'md:flex-row-reverse' : ''}`}
                        >
                            {/* Timeline dot - Square instead of circle */}
                            <div className="absolute left-0 top-6 z-10 -ml-[8px] h-4 w-4 rotate-45 border-2 border-black bg-[#ff7020] md:left-1/2 md:top-auto md:-translate-x-1/2" />

                                {/* Empty space for opposite side (Desktop Only) */}
                                <div className="hidden md:block md:w-5/12" />

                                {/* Content Card */}
                                <div className={`w-full pl-8 md:pl-0 md:w-5/12 ${isLeft ? 'md:text-right text-left' : 'text-left'}`}>
                                    <div className={`geometric-card group bg-[#0a0a0a] p-5 transition-all hover:border-[#ff7020] md:p-6 ${editingId === event.id ? 'border-[#ff7020] ring-1 ring-[#ff7020]/30' : 'border-white/10'}`}>

                                    {editingId === event.id ? (
                                        <form onSubmit={handleEditSave} className="space-y-3 text-left">
                                            <div className="grid md:grid-cols-2 gap-3">
                                                <input
                                                    autoFocus
                                                    value={editTitle}
                                                    onChange={e => setEditTitle(e.target.value)}
                                                    placeholder="Título"
                                                    className="border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-[#594137] focus:border-[#ff7020]"
                                                />
                                                <input
                                                    type="date"
                                                    value={editDate}
                                                    onChange={e => setEditDate(e.target.value)}
                                                    className="border border-white/10 bg-black px-3 py-2 text-sm text-[#a88a7e] outline-none focus:border-[#ff7020]"
                                                />
                                            </div>
                                            <textarea
                                                value={editDesc}
                                                onChange={e => setEditDesc(e.target.value)}
                                                placeholder="Descripción"
                                                className="min-h-[80px] w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-[#594137] focus:border-[#ff7020]"
                                            />

                                            {editImageUrl && (
                                                <div className="overflow-hidden border border-white/10">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={editImageUrl} alt="Current" className="w-full h-auto max-h-32 object-cover opacity-60" />
                                                </div>
                                            )}

                                            <div className="relative">
                                                <input name="editImage" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                <div className="flex w-full items-center justify-center gap-2 border border-dashed border-white/10 bg-black px-3 py-2 text-xs text-[#a88a7e] transition-colors hover:border-[#ff7020]">
                                                    <ImageIcon className="w-4 h-4" />
                                                    <span>{editImageUrl ? 'Reemplazar Foto' : 'Subir Foto'}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-1">
                                                <button type="button" onClick={() => setEditingId(null)} className="flex-1 border border-white/10 py-2 text-xs font-bold uppercase tracking-widest text-[#a88a7e] transition-colors hover:border-white/30 hover:text-white">
                                                    Cancelar
                                                </button>
                                                <button type="submit" disabled={isEditUploading} className="flex-1 bg-[#ff7020] py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#ffb595] disabled:opacity-50">
                                                    {isEditUploading ? 'Subiendo...' : 'Guardar'}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                    <>
                                    <div className={`mb-3 flex items-center gap-2 text-sm text-[#a88a7e] ${isLeft ? 'justify-start md:justify-end' : 'justify-start'}`}>
                                        <Calendar className="h-4 w-4 text-[#00dbe9]" />
                                        <time className="font-mono tracking-tighter">{event.date}</time>
                                        {profile && (
                                            <button onClick={() => handleEditStart(event)} className="ml-auto text-[#a88a7e] transition-all hover:text-[#ffb595]">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className="mb-2 text-xl font-bold uppercase tracking-normal text-white transition-colors group-hover:text-[#ffb595]">
                                        {event.title}
                                    </h3>
                                    <p className="font-light leading-relaxed tracking-normal text-[#e1bfb2]">
                                        {event.description}
                                    </p>

                                    {event.imageUrl && (
                                        <div className="mt-4 min-h-32 overflow-hidden border border-white/10 bg-black">
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
                                        <div className="absolute right-0 top-0 h-[1px] w-[140%] origin-top-right rotate-45 bg-[#ff7020]/30" />
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
