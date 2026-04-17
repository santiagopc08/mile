'use client';

import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { Ear, Quote, Calendar, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function PersistentListening() {
    const { data, updateData } = useStore();
    const { profile } = useProfile();
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
        <div className="w-full max-w-5xl mx-auto space-y-16">
            {/* Geometric Header Block */}
            <div className="relative p-12 overflow-hidden bg-grid-mosaic border border-stone-200 dark:border-stone-800 rounded-none text-center">
                <div className="absolute top-0 right-0 w-16 h-16 border-b border-l border-geometric-accent/20 bg-geometric-accent/5" />
                <div className="inline-flex items-center justify-center w-12 h-12 border border-geometric-accent/30 bg-geometric-accent/10 mb-6 text-geometric-accent">
                    <Ear className="w-5 h-5" />
                </div>
                <h2 className="text-4xl uppercase font-bold tracking-[0.2em] text-white mb-4">Registro de Escucha</h2>
                <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-stone-500 max-w-md mx-auto">
                    Protocolo de Preservación de Sentimientos y Reflexión Activa.
                </p>
            </div>

            {profile === 'el' && (
                <div className="flex justify-center mb-8">
                    {!isAdding ? (
                        <button onClick={() => setIsAdding(true)} className="px-10 py-4 border border-geometric-accent bg-geometric-accent/10 text-white uppercase text-xs font-bold tracking-[0.3em] hover:bg-geometric-accent transition-all">
                            INICIAR NUEVA ENTRADA
                        </button>
                    ) : (
                        <form onSubmit={handleAdd} className="w-full max-w-3xl border border-stone-800 bg-white/5 p-8 origin-top animate-in fade-in slide-in-from-top-4">
                            <h3 className="text-xs uppercase font-bold tracking-[0.3em] text-white mb-8 border-b border-stone-800 pb-4">Especificación de Reflexión</h3>
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 ml-1">Ref. Tema</label>
                                    <input required value={topic} onChange={e => setTopic(e.target.value)} placeholder="TEMA DE ENFOQUE..." className="w-full bg-black/40 border border-stone-800 px-4 py-3 text-xs uppercase tracking-widest text-white outline-none focus:border-geometric-accent" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 ml-1">Sello de Fecha</label>
                                    <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black/40 border border-stone-800 px-4 py-3 text-xs uppercase tracking-widest text-white outline-none focus:border-geometric-accent" />
                                </div>
                            </div>
                            <div className="space-y-2 mb-8">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 ml-1">Análisis Reflexivo</label>
                                <textarea required value={reflection} onChange={e => setReflection(e.target.value)} placeholder="CONTENIDO DE LA REFLEXIÓN..." className="w-full bg-black/40 border border-stone-800 px-4 py-4 min-h-[140px] text-xs uppercase tracking-widest text-white outline-none focus:border-geometric-accent resize-none" />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 border border-stone-800 text-stone-500 uppercase text-[10px] font-bold tracking-[0.2em] hover:border-stone-600 transition-all">Abortar</button>
                                <button type="submit" disabled={!topic || !reflection || !date} className="flex-1 py-4 bg-white text-black uppercase text-[10px] font-bold tracking-[0.2em] hover:bg-geometric-accent hover:text-white disabled:opacity-30 transition-all">Publicar Entrada</button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {listeningNotes.length === 0 && !isAdding ? (
                <div className="w-full flex flex-col items-center justify-center py-20 border border-stone-800 border-dashed">
                    <Ear className="w-6 h-6 text-stone-700 mb-4" />
                    <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-stone-600">Archivo en Espera</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {listeningNotes.map((note: any, idx: number) => (
                    <motion.div
                        key={note.id}
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: idx * 0.1 }}
                        className="geometric-card p-8 group border-stone-800 bg-grid-mosaic"
                    >
                        <div className="absolute top-0 left-0 w-2 h-2 bg-stone-800" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-sm uppercase font-bold tracking-[0.2em] text-white">
                                    {note.topic}
                                </h3>
                                <div className="flex items-center gap-2 text-[9px] font-mono tracking-widest text-geometric-accent/60 uppercase">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Intl.DateTimeFormat('es-CO', { dateStyle: 'short' }).format(new Date(note.date))}</span>
                                </div>
                            </div>

                            <div className="flex-1 pt-6 border-t border-stone-800 border-dashed">
                                <p className="text-stone-400 text-sm leading-relaxed tracking-wide italic">
                                    "{note.reflection}"
                                </p>
                            </div>
                            
                            <div className="mt-8 pt-4 flex justify-end border-t border-stone-800/50">
                                <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-stone-600">
                                    Verificado por Él // {note.author === 'ella' ? 'Ella' : 'Él'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
            )}
        </div>
    );
}
