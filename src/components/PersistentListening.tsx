'use client';

import { useStore } from '@/context/StoreContext';
import { Ear, Quote, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export function PersistentListening() {
    const { data } = useStore();
    const listeningNotes = data?.persistentListening || [];

    if (listeningNotes.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-10 opacity-60">
                <Ear className="w-8 h-8 text-stone-300 mb-2" />
                <p className="text-stone-400 font-light italic">Aún no hay reflexiones guardadas.</p>
            </div>
        );
    }

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
        </div>
    );
}
