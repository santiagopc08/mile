'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, MessageCircleHeart } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { GuardianCatSVG } from '@/components/ui/GuardianCatSVG';

export function JarOfNotes() {
    const { data, updateData } = useStore();
    const { profile } = useProfile();
    const [isOpen, setIsOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState('');
    const [isHovered, setIsHovered] = useState(false);
    const [newNoteText, setNewNoteText] = useState('');
    const [isAddingMode, setIsAddingMode] = useState(false);

    const notes = data?.notes || [];

    const handleOpenJar = () => {
        if (!isOpen && notes.length > 0) {
            const randomNote = notes[Math.floor(Math.random() * notes.length)];
            setCurrentNote(randomNote.text);
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newNoteText.trim()) {
            const newNote = {
                id: Date.now().toString(),
                text: newNoteText.trim(),
                author: profile || 'el'
            };
            await updateData({ notes: [newNote, ...notes] });
            setNewNoteText('');
            setIsAddingMode(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-20 relative bg-dot-matrix">
            <div className="text-center mb-12 z-10">
                <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-3 uppercase tracking-tighter">
                    El Tarro de Notas
                </h2>
                <div className="h-1 w-20 bg-geometric-accent mx-auto mb-4" />
                <p className="text-stone-500 dark:text-stone-400 font-light max-w-xs mx-auto">
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
                        {/* Interactive hint ring - Geometric style */}
                        <motion.div
                            className="absolute inset-0 border border-geometric-accent/0"
                            animate={{
                                borderColor: isHovered ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0)",
                                rotate: isHovered ? 45 : 0,
                                scale: isHovered ? 1.1 : 1
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
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 md:w-96"
                    >
                        <div className="geometric-card bg-white dark:bg-stone-900 p-8 md:p-10 shadow-2xl relative">
                            {/* Geometric Pattern Background for Note */}
                            <div className="absolute inset-0 bg-grid-mosaic opacity-[0.03] pointer-events-none" />

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <span className="text-geometric-accent font-bold text-xs tracking-[0.2em] uppercase">Nota Diaria</span>
                                <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-geometric-accent transition-colors p-2 -mr-2 -mt-2">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                            </div>
                            <p className="text-stone-800 dark:text-stone-100 font-light text-xl md:text-2xl italic text-center leading-relaxed relative z-10">
                                &quot;{currentNote}&quot;
                            </p>

                            {/* Accent geometric mark */}
                            <div className="absolute bottom-0 left-0 w-12 h-1 bg-geometric-accent" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Note Section - Restricted to 'el' */}
            {profile === 'el' && (
                <div className="mt-16 w-full max-w-sm z-10">
                    {!isAddingMode ? (
                        <button
                            onClick={() => setIsAddingMode(true)}
                            className="w-full py-4 border border-geometric-border bg-white dark:bg-stone-900 text-stone-500 hover:text-geometric-accent hover:border-geometric-accent transition-all flex items-center justify-center gap-2 rounded-none"
                        >
                            <MessageCircleHeart className="w-5 h-5" />
                            <span className="uppercase text-xs font-bold tracking-widest">Añadir Nueva Nota</span>
                        </button>
                    ) : (
                        <form onSubmit={handleAddNote} className="geometric-card bg-white dark:bg-stone-900 p-6 animate-in fade-in slide-in-from-bottom-4">
                            <textarea
                                value={newNoteText}
                                onChange={(e) => setNewNoteText(e.target.value)}
                                placeholder="Escribe un pensamiento para el futuro..."
                                className="w-full bg-stone-50 dark:bg-stone-950 border border-geometric-border rounded-none p-4 min-h-[100px] outline-none focus:border-geometric-accent transition-colors mb-4"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsAddingMode(false)} className="flex-1 py-3 border border-geometric-border text-stone-600 dark:text-stone-300 font-bold text-xs uppercase tracking-widest hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors rounded-none">Cancelar</button>
                                <button type="submit" disabled={!newNoteText.trim()} className="flex-1 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-geometric-accent dark:hover:bg-geometric-accent hover:text-white transition-colors rounded-none">Guardar</button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
