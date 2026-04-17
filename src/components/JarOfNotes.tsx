'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, MessageCircleHeart } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { GuardianCatSVG } from '@/components/ui/GuardianCatSVG';

export function JarOfNotes() {
    const { data, updateData } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState('');
    const [isHovered, setIsHovered] = useState(false);
    const [newNoteText, setNewNoteText] = useState('');
    const [isAddingMode, setIsAddingMode] = useState(false);

    const notes = data?.notes || [];

    const handleOpenJar = () => {
        if (!isOpen && notes.length > 0) {
            const randomNote = notes[Math.floor(Math.random() * notes.length)];
            setCurrentNote(randomNote);
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newNoteText.trim()) {
            await updateData({ notes: [newNoteText.trim(), ...notes] });
            setNewNoteText('');
            setIsAddingMode(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-20 relative">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-light text-earth-base dark:text-earth-soft mb-3">
                    El Tarro de Notas
                </h2>
                <p className="text-stone-500 dark:text-stone-400 font-light">
                    Un guardián de pensamientos. Haz clic para leer la nota de hoy.
                </p>
            </div>

            <div className="relative group focus:outline-none flex flex-col items-center mt-4 mb-4">
                <motion.button
                    onClick={handleOpenJar}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative z-10 flex flex-col items-center focus:outline-none"
                    aria-label="Abrir nota diaria"
                >
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        {/* Interactive hint ring */}
                        <motion.div
                            className="absolute inset-0 rounded-full border-4 border-earth-base/0"
                            animate={{
                                borderColor: isHovered ? "rgba(198, 178, 160, 0.3)" : "rgba(198, 178, 160, 0)",
                                scale: isHovered ? 1.05 : 1
                            }}
                            transition={{ duration: 0.3 }}
                        />

                        <GuardianCatSVG isAwake={isHovered || isOpen} />
                    </div>
                </motion.button>
            </div>

            {/* the Note popup */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 md:w-96 shadow-2xl"
                    >
                        <div className="bg-amber-50 dark:bg-stone-800 p-8 md:p-10 rounded-2xl shadow-2xl rotate-1 border-2 border-amber-100 dark:border-stone-700">
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-earth-base font-semibold text-sm tracking-widest uppercase">Nota Diaria</span>
                                <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors p-2 -mr-2 -mt-2">&times;</button>
                            </div>
                            <p className="text-stone-700 dark:text-stone-300 font-light text-xl md:text-2xl italic text-center leading-relaxed">
                                &quot;{currentNote}&quot;
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Note Section */}
            <div className="mt-16 w-full max-w-sm">
                {!isAddingMode ? (
                    <button 
                        onClick={() => setIsAddingMode(true)}
                        className="w-full py-4 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-earth-base hover:border-earth-base transition-colors flex items-center justify-center gap-2"
                    >
                        <MessageCircleHeart className="w-5 h-5" />
                        <span>Añadir Nueva Nota</span>
                    </button>
                ) : (
                    <form onSubmit={handleAddNote} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-4">
                        <textarea
                            value={newNoteText}
                            onChange={(e) => setNewNoteText(e.target.value)}
                            placeholder="Escribe un pensamiento para el futuro..."
                            className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 min-h-[100px] outline-none focus:ring-1 focus:ring-earth-base mb-4"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsAddingMode(false)} className="flex-1 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium hover:opacity-80 transition-opacity">Cancelar</button>
                            <button type="submit" disabled={!newNoteText.trim()} className="flex-1 py-3 rounded-xl bg-earth-base text-white font-medium disabled:opacity-50 hover:bg-earth-dark transition-colors">Guardar</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
