'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';

import { AnimState } from './jar-of-notes/types';
import { JarHeader } from './jar-of-notes/JarHeader';
import { JarMedia } from './jar-of-notes/JarMedia';
import { JarPopup } from './jar-of-notes/JarPopup';
import { AddNoteForm } from './jar-of-notes/AddNoteForm';

export function JarOfNotes() {
    const { data } = useStore();
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
    const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
    const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';

    const [animState, setAnimState] = useState<AnimState>('idle');
    const [currentNote, setCurrentNote] = useState('');

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
                    <JarHeader
                        accentClass={accentClass}
                        accentColor={accentColor}
                    />
                )}
            </AnimatePresence>

            {/* Animation Container */}
            <div
                className="relative w-full max-w-3xl aspect-[4/3] flex items-center justify-center cursor-pointer overflow-hidden z-10"
                onClick={startSequence}
            >
                <JarMedia
                    animState={animState}
                    showImg1={showImg1}
                    showImg2={showImg2}
                    isVideoVisible={isVideoVisible}
                    videoRef={videoRef}
                    handleVideoEnded={handleVideoEnded}
                />

                {/* Popup Note */}
                <AnimatePresence>
                    {animState === 'popup' && (
                        <JarPopup
                            accentClass={accentClass}
                            accentColor={accentColor}
                            secondaryClass={secondaryClass}
                            secondaryColor={secondaryColor}
                            closeSequence={closeSequence}
                            currentNote={currentNote}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Add Note Section - Restricted to 'el' */}
            {profile === 'el' && animState === 'idle' && (
                <AddNoteForm
                    profile={profile}
                    accentClass={accentClass}
                    accentColor={accentColor}
                />
            )}
        </div>
    );
}
