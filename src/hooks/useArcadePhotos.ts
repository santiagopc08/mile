'use client';

import { useState, useEffect } from 'react';
import { ArcadeMemory, fetchArcadeMemories, createHoloDuotoneCanvas } from '@/lib/arcadeMemories';
import { useProfile } from '@/context/ProfileContext';

export interface StylizedMemory {
    memory: ArcadeMemory;
    holoCanvas: HTMLCanvasElement | null;
    rawImage: HTMLImageElement | null;
}

export function useArcadePhotos(targetWidth = 540, targetHeight = 540) {
    const { profile } = useProfile();
    const [memories, setMemories] = useState<ArcadeMemory[]>([]);
    const [stylizedMemories, setStylizedMemories] = useState<StylizedMemory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const accentColor = profile === 'ella' ? '#ff4b89' : '#c3f400';
    const darkBg = profile === 'ella' ? '#18040d' : '#071500';

    useEffect(() => {
        let isMounted = true;

        async function load() {
            try {
                const memList = await fetchArcadeMemories();
                if (!isMounted) return;
                setMemories(memList);

                // Pre-render stylized canvases for the memories
                const loadedList: StylizedMemory[] = [];
                for (let i = 0; i < memList.length; i++) {
                    const mem = memList[i];
                    const img = new Image();
                    img.crossOrigin = 'anonymous';

                    const isLocal = mem.imageUrl.startsWith('/');
                    img.src = isLocal
                        ? mem.imageUrl
                        : `/api/proxy-image?url=${encodeURIComponent(mem.imageUrl)}`;

                    await new Promise<void>((resolve) => {
                        img.onload = () => {
                            if (!isMounted) {
                                resolve();
                                return;
                            }
                            const holoCanvas = createHoloDuotoneCanvas(
                                img,
                                targetWidth,
                                targetHeight,
                                accentColor,
                                darkBg,
                                true
                            );
                            loadedList.push({
                                memory: mem,
                                holoCanvas,
                                rawImage: img,
                            });
                            resolve();
                        };
                        img.onerror = () => {
                            resolve(); // Continue on error
                        };
                    });
                }

                if (isMounted) {
                    setStylizedMemories(loadedList);
                    setIsLoading(false);
                }
            } catch (err) {
                console.warn('Error loading arcade photos:', err);
                if (isMounted) setIsLoading(false);
            }
        }

        load();

        return () => {
            isMounted = false;
        };
    }, [profile, accentColor, darkBg, targetWidth, targetHeight]);

    return {
        memories,
        stylizedMemories,
        isLoading,
        accentColor,
    };
}
