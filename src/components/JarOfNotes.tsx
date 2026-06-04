'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleHeart, X, Circle, Triangle, Square } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';

type AnimState = 'idle' | 'img1' | 'img2' | 'video' | 'popup' | 'reverse-video' | 'reverse-img2' | 'reverse-img1';

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

export function JarOfNotes() {
    const { data, updateData } = useStore();
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
    const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
    const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';

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
                // eslint-disable-next-line react-hooks/purity
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
        <div className="relative flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden border border-white/10 bg-[#0a0a0a] bg-dot-matrix">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between border-b border-white/10 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.24em] text-[#a88a7e] font-mono">
                <span>BAÚL DE RECUERDOS</span>
                <span className={`text-${accentClass}`} style={{ color: accentColor }}>{notes.length.toString().padStart(2, '0')} RECUERDOS</span>
            </div>
            {/* Header info - fades out when animation starts */}
            <AnimatePresence>
                {animState === 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="pointer-events-none absolute left-0 right-0 top-16 z-20 px-4 text-center"
                    >
                        <h2 className="mb-3 text-3xl font-black uppercase tracking-normal text-white md:text-4xl font-mono">
                            El Tarro de Notas
                        </h2>
                        <div className={`mx-auto mb-4 h-1 w-20 bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
                        <p className="mx-auto max-w-xs text-sm leading-6 tracking-normal text-[#e1bfb2] font-sans">
                            La nave de Kiaro, llena de pensamientos y amor.
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
                            className="absolute w-full h-full md:w-full md:h-full object-contain z-10"
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
                            className="absolute w-full h-full md:w-full md:h-full object-contain z-20"
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
                    webkit-playsinline="true"
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
                            className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()} // prevent clicking through
                        >
                            {/* Decorative Shapes */}
                             <motion.div
                                className={`absolute left-1/4 top-1/4 text-${accentClass} opacity-50`}
                                style={{ color: accentColor }}
                                animate={{ rotate: 360, y: [0, -20, 0] }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            >
                                <Circle className="w-16 h-16" strokeWidth={1} />
                            </motion.div>
                            <motion.div
                                className={`absolute bottom-1/4 right-1/4 text-${secondaryClass} opacity-50`}
                                style={{ color: secondaryColor }}
                                animate={{ rotate: -360, x: [0, 20, 0] }}
                                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            >
                                <Triangle className="w-20 h-20" strokeWidth={1} />
                            </motion.div>
                            <motion.div
                                className={`absolute right-1/3 top-1/3 text-${accentClass} opacity-50`}
                                style={{ color: accentColor }}
                                animate={{ rotate: 180, scale: [1, 1.2, 1] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            >
                                <Square className="w-12 h-12" strokeWidth={1} />
                            </motion.div>

                            <div className={`geometric-card relative mx-4 w-full max-w-lg border-${accentClass}/50 bg-[#0a0a0a]/95 p-8 backdrop-blur-md md:p-12`} style={{ borderColor: `${accentColor}80` }}>
                                <div className="pointer-events-none absolute inset-0 bg-mosaic opacity-40" />
 
                                <div className="relative z-10 mb-8 flex items-start justify-between border-b border-white/10 pb-4">
                                    <span className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-${accentClass} font-mono`}>
                                        <div className={`h-2 w-2 bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
                                        Nota Diaria
                                    </span>
                                    <button
                                        onClick={closeSequence}
                                        className={`-mr-4 -mt-4 p-2 text-[#a88a7e] transition-colors hover:text-${accentClass}`}
                                        style={{ '--tw-hover-text-opacity': 1 } as any}
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <p className="relative z-10 px-2 py-4 text-center text-2xl font-medium leading-relaxed tracking-normal text-white md:text-3xl font-sans">
                                    &quot;{renderTextWithHashtags(currentNote)}&quot;
                                </p>

                                <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-80`} style={{ background: `linear-gradient(90deg, ${secondaryColor}, ${accentColor}, ${secondaryColor})` }} />
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
                    className="absolute bottom-8 z-20 w-full max-w-sm px-4"
                >
                    {!isAddingMode ? (
                        <button
                            onClick={() => setIsAddingMode(true)}
                            className={`flex w-full items-center justify-center gap-2 border border-white/10 bg-black/80 py-4 text-[#a88a7e] backdrop-blur-sm transition-all hover:border-${accentClass} hover:text-${accentClass}`}
                            style={{ '--tw-hover-text-opacity': 1, '--tw-hover-border-opacity': 1 } as any}
                        >
                            <MessageCircleHeart className="w-5 h-5" />
                            <span className="uppercase text-xs font-bold tracking-widest font-mono">Añadir Nueva Nota</span>
                        </button>
                    ) : (
                        <form onSubmit={handleAddNote} className={`geometric-card border-${accentClass}/50 bg-[#0a0a0a]/95 p-6 backdrop-blur-md`} style={{ borderColor: `${accentColor}80` }}>
                            <textarea
                                value={newNoteText}
                                onChange={(e) => setNewNoteText(e.target.value)}
                                placeholder="Escribe un pensamiento para el futuro..."
                                className={`mb-4 min-h-[100px] w-full resize-none border border-white/10 bg-black p-4 text-sm tracking-normal text-white outline-none transition-colors placeholder:text-[#594137] focus:border-${accentClass}`}
                                style={{ '--tw-ring-color': accentColor } as any}
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsAddingMode(false)} className="flex-1 border border-white/10 py-3 text-[10px] font-bold uppercase tracking-widest text-[#a88a7e] transition-colors hover:border-white/30 hover:text-white font-mono">Cancelar</button>
                                <button type="submit" disabled={!newNoteText.trim()} className={`flex-1 bg-${accentClass} py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:opacity-80 disabled:opacity-50 font-mono`} style={{ backgroundColor: accentColor }}>Guardar</button>
                            </div>
                        </form>
                    )}
                </motion.div>
            )}
        </div>
    );
}
