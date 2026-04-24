'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, MessageCircleHeart, X, Circle, Triangle, Square } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';

type AnimState = 'idle' | 'img1' | 'img2' | 'video' | 'popup' | 'reverse-video' | 'reverse-img2' | 'reverse-img1';

export function JarOfNotes() {
    const { data, updateData } = useStore();
    const { profile } = useProfile();
    
    const [animState, setAnimState] = useState<AnimState>('idle');
    const [currentNote, setCurrentNote] = useState('');
    const [newNoteText, setNewNoteText] = useState('');
    const [isAddingMode, setIsAddingMode] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const reverseAnimRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);

    const notes = data?.notes || [];

    const startSequence = () => {
        if (animState !== 'idle') return;
        if (notes.length === 0) return;
        
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        setCurrentNote(randomNote.text);
        
        setAnimState('img1');
        
        setTimeout(() => {
            setAnimState('img2');
            setTimeout(() => {
                setAnimState('video');
            }, 500);
        }, 500);
    };

    useEffect(() => {
        if (animState === 'video' && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(e => console.error("Video play failed:", e));
        }
    }, [animState]);

    const handleVideoEnded = () => {
        if (animState === 'video') {
            setAnimState('popup');
        }
    };

    const closeSequence = () => {
        setAnimState('reverse-video');
    };

    useEffect(() => {
        if (animState === 'reverse-video' && videoRef.current) {
            videoRef.current.pause();
            lastTimeRef.current = performance.now();
            
            const rewind = (time: number) => {
                if (!videoRef.current || !lastTimeRef.current) return;
                const delta = (time - lastTimeRef.current) / 1000;
                lastTimeRef.current = time;
                
                // Rewind at 2x speed
                videoRef.current.currentTime -= delta * 2.0;
                
                if (videoRef.current.currentTime <= 0) {
                    videoRef.current.currentTime = 0;
                    setAnimState('reverse-img2');
                } else {
                    reverseAnimRef.current = requestAnimationFrame(rewind);
                }
            };
            reverseAnimRef.current = requestAnimationFrame(rewind);
            
            return () => {
                if (reverseAnimRef.current) cancelAnimationFrame(reverseAnimRef.current);
            };
        }
    }, [animState]);

    useEffect(() => {
        if (animState === 'reverse-img2') {
            setTimeout(() => {
                setAnimState('reverse-img1');
                setTimeout(() => {
                    setAnimState('idle');
                }, 250); // half time
            }, 250); // half time
        }
    }, [animState]);

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

    const isVideoVisible = ['video', 'popup', 'reverse-video'].includes(animState);
    const showImg2 = ['img2', 'reverse-img2'].includes(animState);
    const showImg1 = ['idle', 'img1', 'reverse-img1'].includes(animState);

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[70vh] relative bg-dot-matrix overflow-hidden border border-stone-200 dark:border-stone-800">
            {/* Header info - fades out when animation starts */}
            <AnimatePresence>
                {animState === 'idle' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-8 left-0 right-0 text-center z-20 pointer-events-none"
                    >
                        <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-3 uppercase tracking-tighter">
                            El Tarro de Notas
                        </h2>
                        <div className="h-1 w-20 bg-geometric-accent mx-auto mb-4" />
                        <p className="text-stone-500 dark:text-stone-400 font-light max-w-xs mx-auto">
                            Un guardián de pensamientos. Haz clic en el tarro para leer la nota de hoy.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Animation Container */}
            <div 
                className="relative w-full max-w-3xl aspect-[4/3] flex items-center justify-center cursor-pointer overflow-hidden z-10"
                onClick={startSequence}
            >
                {/* IMG 1 */}
                <AnimatePresence>
                    {showImg1 && (
                        <motion.img 
                            src="/jar/jar1.png" 
                            alt="Jar 1"
                            className="absolute w-64 h-64 md:w-96 md:h-96 object-contain z-10"
                            initial={{ scale: animState === 'reverse-img1' ? 1.5 : 1, opacity: 1 }}
                            animate={{ scale: animState === 'img1' ? 1.5 : 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: animState === 'reverse-img1' ? 0.25 : 0.5 }}
                        />
                    )}
                </AnimatePresence>

                {/* IMG 2 */}
                <AnimatePresence>
                    {showImg2 && (
                        <motion.img 
                            src="/jar/jar2.png" 
                            alt="Jar 2"
                            className="absolute w-64 h-64 md:w-96 md:h-96 object-contain z-20"
                            initial={{ scale: animState === 'img2' ? 1.5 : 2, opacity: 0 }}
                            animate={{ scale: animState === 'img2' ? 2 : 1.5, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: animState === 'reverse-img2' ? 0.25 : 0.5 }}
                        />
                    )}
                </AnimatePresence>

                {/* VIDEO */}
                <video 
                    ref={videoRef}
                    src="/jar/jarVid.mp4"
                    className={`absolute inset-0 w-full h-full object-cover z-30 transition-opacity duration-300 ${isVideoVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    playsInline
                    muted
                    onEnded={handleVideoEnded}
                />

                {/* Popup Note */}
                <AnimatePresence>
                    {animState === 'popup' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()} // prevent clicking through
                        >
                            {/* Decorative Shapes */}
                            <motion.div 
                                className="absolute top-1/4 left-1/4 text-geometric-accent opacity-50"
                                animate={{ rotate: 360, y: [0, -20, 0] }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            >
                                <Circle className="w-16 h-16" strokeWidth={1} />
                            </motion.div>
                            <motion.div 
                                className="absolute bottom-1/4 right-1/4 text-user-a opacity-50"
                                animate={{ rotate: -360, x: [0, 20, 0] }}
                                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            >
                                <Triangle className="w-20 h-20" strokeWidth={1} />
                            </motion.div>
                            <motion.div 
                                className="absolute top-1/3 right-1/3 text-user-b opacity-50"
                                animate={{ rotate: 180, scale: [1, 1.2, 1] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            >
                                <Square className="w-12 h-12" strokeWidth={1} />
                            </motion.div>

                            <div className="geometric-card bg-white/90 dark:bg-stone-900/90 p-8 md:p-12 shadow-2xl relative max-w-lg w-full mx-4 border border-geometric-accent/30 backdrop-blur-md">
                                <div className="absolute inset-0 bg-grid-mosaic opacity-5 pointer-events-none" />

                                <div className="flex justify-between items-start mb-8 relative z-10 border-b border-stone-200 dark:border-stone-800 pb-4">
                                    <span className="text-geometric-accent font-black text-xs tracking-[0.3em] uppercase flex items-center gap-2">
                                        <div className="w-2 h-2 bg-geometric-accent" />
                                        Nota Diaria
                                    </span>
                                    <button 
                                        onClick={closeSequence} 
                                        className="text-stone-400 hover:text-geometric-accent transition-colors p-2 -mr-4 -mt-4"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <p className="text-stone-800 dark:text-stone-100 font-medium text-2xl md:text-3xl italic text-center leading-relaxed relative z-10 py-4 px-2">
                                    &quot;{currentNote}&quot;
                                </p>

                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-user-a via-geometric-accent to-user-b opacity-50" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Add Note Section - Restricted to 'el' */}
            {profile === 'el' && animState === 'idle' && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="absolute bottom-8 w-full max-w-sm z-20 px-4"
                >
                    {!isAddingMode ? (
                        <button
                            onClick={() => setIsAddingMode(true)}
                            className="w-full py-4 border border-geometric-border bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm text-stone-500 hover:text-geometric-accent hover:border-geometric-accent transition-all flex items-center justify-center gap-2 rounded-none"
                        >
                            <MessageCircleHeart className="w-5 h-5" />
                            <span className="uppercase text-xs font-bold tracking-widest">Añadir Nueva Nota</span>
                        </button>
                    ) : (
                        <form onSubmit={handleAddNote} className="geometric-card bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-6 border border-geometric-accent/30 shadow-2xl">
                            <textarea
                                value={newNoteText}
                                onChange={(e) => setNewNoteText(e.target.value)}
                                placeholder="Escribe un pensamiento para el futuro..."
                                className="w-full bg-stone-50 dark:bg-stone-950 border border-geometric-border rounded-none p-4 min-h-[100px] outline-none focus:border-geometric-accent transition-colors mb-4 resize-none"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsAddingMode(false)} className="flex-1 py-3 border border-geometric-border text-stone-600 dark:text-stone-300 font-bold text-[10px] uppercase tracking-widest hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors rounded-none">Cancelar</button>
                                <button type="submit" disabled={!newNoteText.trim()} className="flex-1 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 hover:bg-geometric-accent dark:hover:bg-geometric-accent hover:text-white transition-colors rounded-none">Guardar</button>
                            </div>
                        </form>
                    )}
                </motion.div>
            )}
        </div>
    );
}
