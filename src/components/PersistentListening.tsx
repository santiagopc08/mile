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
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <div className="text-center w-full mb-12">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center justify-center p-4 bg-earth-50 dark:bg-earth-900/20 rounded-full mb-4"
                >
                    <Ear className="w-8 h-8 text-earth-base" />
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-light text-stone-800 dark:text-stone-200 mb-3">Escucha Persistente</h2>
                <p className="text-stone-500 font-light max-w-xl mx-auto">
                    Porque tus sentimientos importan. Lo que me dices no se pierde; lo escucho, lo reflexiono y lo guardo aquí, para recordarlo siempre.
                </p>
            </div>


            {profile === 'el' && (
                <div className="flex justify-center mb-8">
                    {!isAdding ? (
                        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-earth-base text-white px-6 py-3 rounded-full hover:bg-earth-dark transition-colors shadow-sm">
                            <Plus className="w-5 h-5" /> Añadir Reflexión
                        </button>
                    ) : (
                        <form onSubmit={handleAdd} className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-earth-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4">
                            <h3 className="text-lg font-medium text-stone-800 dark:text-stone-200 mb-4">Nueva Reflexión</h3>
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <input required value={topic} onChange={e => setTopic(e.target.value)} placeholder="Tema (Ej. Visita de amigas)" className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-earth-base" />
                                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-earth-base" />
                            </div>
                            <textarea required value={reflection} onChange={e => setReflection(e.target.value)} placeholder="Tu reflexión..." className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 min-h-[100px] outline-none focus:ring-1 focus:ring-earth-base mb-4" />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl">Cancelar</button>
                                <button type="submit" disabled={!topic || !reflection || !date} className="flex-1 py-3 bg-earth-base text-white rounded-xl disabled:opacity-50">Guardar</button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {listeningNotes.length === 0 && !isAdding ? (
                <div className="w-full flex flex-col items-center justify-center py-10 opacity-60">
                    <Ear className="w-8 h-8 text-stone-300 mb-2" />
                    <p className="text-stone-400 font-light italic">Aún no hay reflexiones guardadas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listeningNotes.map((note: any, idx: number) => (
                    <motion.div
                        key={note.id}
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                        {/* Decorative Quote Mark */}
                        <Quote className="absolute -top-4 -right-4 w-24 h-24 text-stone-50 dark:text-stone-800/50 rotate-12 group-hover:rotate-6 transition-transform opacity-50" />

                        <div className="relative z-10 flex flex-col h-full">
                            <h3 className="text-xl font-medium text-stone-800 dark:text-stone-200 mb-2 flex items-start gap-2">
                                {note.topic}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-earth-base font-medium mb-4">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(note.date))}</span>
                            </div>

                            <div className="mt-a pt-4 border-t border-stone-100 dark:border-stone-800">
                                <p className="text-stone-600 dark:text-stone-400 font-light leading-relaxed italic text-sm md:text-base">
                                    "{note.reflection}"
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
            )}
        </div>
    );
}
