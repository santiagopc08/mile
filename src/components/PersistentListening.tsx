'use client';

import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { Ear, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ListeningNote {
    id: string;
    topic: string;
    reflection: string;
    date: string;
    author?: string;
}

export function PersistentListening() {
    const { data, updateData } = useStore();
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
    const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
    const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';
    const [isAdding, setIsAdding] = useState(false);
    const [topic, setTopic] = useState('');
    const [reflection, setReflection] = useState('');
    const [date, setDate] = useState('');
    const listeningNotes = data?.persistentListening || [];

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (topic && reflection && date) {
            const newItem = {
                id: Date.now().toString(),
                topic,
                reflection,
                date,
                author: profile || 'el'
            };
            await updateData({ persistentListening: [newItem, ...listeningNotes] });
            setIsAdding(false);
            setTopic('');
            setReflection('');
            setDate('');
        }
    };

    return (
        <div className="mx-auto w-full max-w-5xl space-y-10 font-mono">
            {/* Geometric Header Block */}
            <div className="relative overflow-hidden border border-white/10 bg-[#0a0a0a] bg-mosaic p-8 text-center md:p-12 rounded-none">
                <div className={`absolute right-0 top-0 h-16 w-16 border-b border-l border-${accentClass}/40 bg-${accentClass}/10`} style={{ borderColor: `${accentColor}66`, backgroundColor: `${accentColor}1a` }} />
                <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center border border-${secondaryClass}/40 bg-${secondaryClass}/10 text-${secondaryClass} rounded-none`} style={{ borderColor: `${secondaryColor}66`, backgroundColor: `${secondaryColor}1a`, color: secondaryColor }}>
                    <Ear className="w-5 h-5 stroke-[1.5]" />
                </div>
                <h2 className="mb-4 text-3xl font-black uppercase tracking-normal text-white md:text-4xl font-sans">Registro de Escucha</h2>
                <p className="mx-auto max-w-md text-[10px] font-bold uppercase tracking-[0.32em] text-[#a88a7e]">
                    Protocolo de Preservación de Sentimientos y Reflexión Activa.
                </p>
            </div>

            {profile === 'el' && (
                <div className="flex justify-center mb-8">
                    {!isAdding ? (
                        <button onClick={() => setIsAdding(true)} className={`border border-${accentClass} bg-${accentClass}/10 px-10 py-4 text-xs font-bold uppercase tracking-[0.3em] text-${accentClass} transition-all hover:bg-${accentClass} hover:text-black rounded-none`} style={{ borderColor: accentColor, color: accentColor }}>
                            INICIAR NUEVA ENTRADA
                        </button>
                    ) : (
                        <form onSubmit={handleAdd} className="origin-top w-full max-w-3xl animate-in border border-white/10 bg-[#0a0a0a] p-8 fade-in slide-in-from-top-4 rounded-none">
                            <h3 className="mb-8 border-b border-white/10 pb-4 text-xs font-bold uppercase tracking-[0.3em] text-white">Especificación de Reflexión</h3>
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-[#a88a7e]">Ref. Tema</label>
                                    <input required value={topic} onChange={e => setTopic(e.target.value)} placeholder="TEMA DE ENFOQUE..." className={`w-full border border-white/10 bg-black px-4 py-3 text-xs uppercase tracking-widest text-white outline-none placeholder:text-[#594137] focus:border-${accentClass} rounded-none`} style={{ '--tw-ring-color': accentColor } as any} />
                                </div>
                                <div className="space-y-2">
                                    <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-[#a88a7e]">Sello de Fecha</label>
                                    <input required type="date" value={date} onChange={e => setDate(e.target.value)} className={`w-full border border-white/10 bg-black px-4 py-3 text-xs uppercase tracking-widest text-white outline-none focus:border-${accentClass} rounded-none`} style={{ '--tw-ring-color': accentColor } as any} />
                                </div>
                            </div>
                            <div className="space-y-2 mb-8">
                                <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-[#a88a7e]">Análisis Reflexivo</label>
                                <textarea required value={reflection} onChange={e => setReflection(e.target.value)} placeholder="CONTENIDO DE LA REFLEXIÓN..." className={`min-h-[140px] w-full resize-none border border-white/10 bg-black px-4 py-4 text-xs uppercase tracking-widest text-white outline-none placeholder:text-[#594137] focus:border-${accentClass} rounded-none`} style={{ '--tw-ring-color': accentColor } as any} />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 border border-white/10 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] transition-all hover:border-white/30 hover:text-white rounded-none">Abortar</button>
                                <button type="submit" disabled={!topic || !reflection || !date} className={`flex-1 bg-${accentClass} py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition-all hover:opacity-80 disabled:opacity-30 rounded-none`} style={{ backgroundColor: accentColor }}>Publicar Entrada</button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {listeningNotes.length === 0 && !isAdding ? (
                <div className="flex w-full flex-col items-center justify-center border border-dashed border-white/10 py-20 rounded-none">
                    <Ear className="mb-4 h-6 w-6 text-[#594137] stroke-[1.5]" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#594137]">Archivo en Espera</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {listeningNotes.map((note: ListeningNote, idx: number) => {
                    const isElla = note.author === 'ella';
                    const noteAccent = isElla ? 'var(--color-user-a)' : 'var(--color-user-b)';
                    const noteAccentClass = isElla ? 'user-a' : 'user-b';
                    return (
                        <motion.div
                            key={note.id}
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative overflow-hidden border border-white/10 bg-[#0a0a0a] bg-mosaic p-8 pl-10 rounded-none"
                        >
                            {/* Solid Left Author Stripe */}
                            <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: noteAccent }} />
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
                                        {note.topic}
                                    </h3>
                                    <div className={`flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-${secondaryClass}`} style={{ color: secondaryColor }}>
                                        <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                                        <span>{new Intl.DateTimeFormat('es-CO', { dateStyle: 'short' }).format(new Date(note.date))}</span>
                                    </div>
                                </div>

                                <div className="flex-1 border-t border-dashed border-white/10 pt-6">
                                    <p className="text-sm leading-relaxed tracking-normal text-[#e1bfb2]">
                                        &quot;{note.reflection}&quot;
                                    </p>
                                </div>
                                
                                <div className="mt-8 flex justify-end border-t border-white/10 pt-4">
                                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">
                                        Verificado por Él // {isElla ? 'Ella' : 'Él'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            )}
        </div>
    );
}
