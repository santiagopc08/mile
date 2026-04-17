'use client';

import { motion } from 'framer-motion';
import { Calendar, Plus, Image as ImageIcon } from 'lucide-react';
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
            setIsUploading(false);
            setIsAdding(false);
        }
    };

    return (
        <div className="relative w-full pl-6 md:pl-0 flex flex-col items-center">
            
            {profile && (
                <div className="w-full max-w-2xl mb-16 pl-8 md:pl-0">
                    {!isAdding ? (
                        <button onClick={() => setIsAdding(true)} className="w-full py-4 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl text-stone-500 hover:text-earth-base hover:border-earth-base hover:bg-earth-50/50 dark:hover:bg-earth-900/10 transition-all flex items-center justify-center gap-2 font-medium">
                            <Plus className="w-5 h-5" /> Añadir Nuevo Recuerdo
                        </button>
                    ) : (
                        <form onSubmit={handleAddEvent} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 space-y-4">
                            <h3 className="text-lg font-medium text-stone-800 dark:text-stone-200 mb-4">Nuevo Recuerdo</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <input name="title" required placeholder="Título del recuerdo" className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-earth-base" />
                                <input name="date" type="date" required className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-earth-base text-stone-500" />
                            </div>
                            <textarea name="desc" required placeholder="Nuestra historia dice..." className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 min-h-[100px] outline-none focus:ring-1 focus:ring-earth-base" />

                            <div className="relative">
                                <input name="image" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="w-full px-4 py-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 flex items-center justify-center gap-2 text-stone-500">
                                    <ImageIcon className="w-5 h-5" />
                                    <span>Subir Foto (Opcional)</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl hover:opacity-80 transition-opacity">Cancelar</button>
                                <button type="submit" disabled={isUploading} className="flex-1 py-3 bg-earth-base text-white rounded-xl disabled:opacity-50 hover:bg-earth-dark transition-colors">
                                    {isUploading ? 'Subiendo...' : 'Guardar Recuerdo'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            <div className="relative w-full">
                {/* Central Line - Mobile: Left Aligned | Desktop: Centered */}
                <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-stone-200 dark:bg-stone-800 md:-translate-x-1/2" />

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
                            className={`relative flex items-center justify-between w-full md:flex-row flex-col ${isLeft ? 'md:flex-row-reverse' : ''
                                }`}
                        >
                            {/* Timeline dot - Mobile: Left Aligned | Desktop: Centered */}
                            <div className="absolute left-0 md:left-1/2 -ml-[2px] md:-translate-x-1/2 w-4 h-4 rounded-full bg-earth-base dark:bg-earth-soft border-4 border-stone-50 dark:border-stone-950 z-10 top-6 md:top-auto" />

                                {/* Empty space for opposite side (Desktop Only) */}
                                <div className="hidden md:block md:w-5/12" />

                                {/* Content Card */}
                                <div className={`w-full pl-8 md:pl-0 md:w-5/12 ${isLeft ? 'md:text-right text-left' : 'text-left'}`}>
                                    <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 mb-3 ${isLeft ? 'md:justify-end justify-start' : 'justify-start'}`}>
                                        <Calendar className="w-4 h-4" />
                                        <time>{event.date}</time>
                                    </div>
                                    <h3 className="text-xl font-medium text-stone-800 dark:text-stone-200 mb-2">
                                        {event.title}
                                    </h3>
                                    <p className="text-stone-600 dark:text-stone-400 font-light leading-relaxed">
                                        {event.description}
                                    </p>

                                    {event.imageUrl && (
                                        <div className="mt-4 rounded-xl overflow-hidden min-h-32 bg-stone-100 dark:bg-stone-800">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={event.imageUrl}
                                                alt={event.title}
                                                className="w-full h-auto object-cover"
                                            />
                                        </div>
                                    )}
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
