'use client';

import { useState, useMemo } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { TimelineEvent } from './timeline/types';
import { TimelineAddForm } from './timeline/TimelineAddForm';
import { TimelineItem } from './timeline/TimelineItem';
import { TimelineCommentsDrawer } from './timeline/TimelineCommentsDrawer';

interface TimelineProps {
    events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
    const { profile } = useProfile();
    const [isAdding, setIsAdding] = useState(false);
    const [activeEventId, setActiveEventId] = useState<string | null>(null);

    const activeEvent = useMemo(() => {
        if (!activeEventId) return null;
        // ⚡ Bolt Optimization: Replace O(N) loop with single-pass .find() lookup
        return events.find(e => e.id === activeEventId) || null;
    }, [events, activeEventId]);

    return (
        <div className="relative flex w-full flex-col items-center bg-mosaic py-8">
            <div className="mb-10 w-full max-w-4xl border border-white/10 bg-white/[0.03] p-6 text-center rounded-none">
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#a88a7e] font-mono">Nuestros Momentos</p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-normal text-white font-sans">Historia Compartida</h2>
            </div>
            
            {profile && (
                <div className="z-10 mb-16 w-full max-w-2xl">
                    <TimelineAddForm events={events} isAdding={isAdding} setIsAdding={setIsAdding} />
                </div>
            )}

            {/* Empty State */}
            {events.length === 0 && !isAdding && (
                <div className="flex w-full max-w-4xl flex-col items-center gap-4 border border-dashed border-white/10 bg-black/40 px-6 py-14 text-center">
                    <Calendar className="h-8 w-8 stroke-[1.2] text-[#ff7020]/70" aria-hidden="true" />
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#a88a7e]">
                        Vuestra historia empieza aquí
                    </p>
                    <p className="max-w-xs text-[12px] leading-relaxed text-white/35">
                        Todavía no hay ningún recuerdo guardado. Añade el primero y quedará en la línea
                        de tiempo para los dos.
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        className="mt-2 flex items-center gap-2 border border-[#ff7020] bg-[#ff7020]/20 px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white transition-all active:scale-95"
                    >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        Añadir el primer recuerdo
                    </button>
                </div>
            )}

            <div className="relative w-full pl-6 md:pl-0">
                {/* Central Line - Mobile: Left Aligned | Desktop: Centered */}
                {events.length > 0 && (
                    <div className="absolute bottom-0 left-0 top-0 w-px bg-white/10 md:left-1/2 md:-translate-x-1/2" />
                )}

                <div className="space-y-16 md:space-y-24">
                    {events.map((event, index) => (
                        <TimelineItem
                            key={event.id}
                            event={event}
                            events={events}
                            isLeft={index % 2 === 0}
                            setActiveEventId={setActiveEventId}
                        />
                    ))}
                </div>
            </div>

            <TimelineCommentsDrawer
                activeEvent={activeEvent}
                setActiveEventId={setActiveEventId}
            />
        </div>
    );
}

// Re-export type for compatibility with components importing it from here
export type { TimelineEvent } from './timeline/types';
