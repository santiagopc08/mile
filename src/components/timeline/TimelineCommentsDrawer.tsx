import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/components/ui/Toast';
import { TimelineEvent } from './types';

interface TimelineCommentsDrawerProps {
    activeEvent: TimelineEvent | null;
    setActiveEventId: (id: string | null) => void;
}

export function TimelineCommentsDrawer({ activeEvent, setActiveEventId }: TimelineCommentsDrawerProps) {
    const { profile } = useProfile();
    const { error: notifyError, success, confirm } = useToast();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const handlePostComment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!activeEvent || !profile) return;
        const form = e.currentTarget;
        const textarea = form.elements.namedItem('newComment') as HTMLTextAreaElement;
        const text = textarea?.value?.trim();
        if (!text) return;

        try {
            await fetch('/api/timeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'comment',
                    eventId: activeEvent.id,
                    author: profile,
                    text
                })
            });
            form.reset();
        } catch (err) {
            notifyError(`No se pudo publicar el comentario: ${err instanceof Error ? err.message : 'error desconocido'}`);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        const ok = await confirm({
            title: 'Eliminar comentario',
            message: 'Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar',
            tone: 'danger',
        });
        if (!ok) return;

        try {
            await fetch(`/api/timeline?id=${commentId}&type=comment`, {
                method: 'DELETE'
            });
            success('Comentario eliminado.');
        } catch (err) {
            notifyError(`No se pudo eliminar el comentario: ${err instanceof Error ? err.message : 'error desconocido'}`);
        }
    };

    if (!mounted || typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {activeEvent && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveEventId(null)}
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xs"
                    />
                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-md border-l border-white/15 bg-[#120b15]/90 backdrop-blur-2xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] lg:pb-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-between rounded-none"
                    >
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Header */}
                            <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4 shrink-0">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#a88a7e] font-mono">Comentarios del Recuerdo</h4>
                                    <h3 className="text-lg font-bold text-white font-sans mt-1 line-clamp-1">{activeEvent.title}</h3>
                                    <p className="text-[9px] text-[#594137] font-mono uppercase mt-0.5">{activeEvent.date}</p>
                                </div>
                                <button onClick={() => setActiveEventId(null)} className="text-[#a88a7e] hover:text-white transition-colors p-1">
                                    <X className="w-5 h-5 stroke-[1.5]" />
                                </button>
                            </div>

                            {/* Comments List */}
                            <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 select-none">
                                {(!activeEvent.comments || activeEvent.comments.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#594137] font-mono">Sin comentarios</p>
                                        <p className="text-[9px] text-[#594137]/60 font-mono mt-1">Escribe la primera nota sobre este recuerdo.</p>
                                    </div>
                                ) : (
                                    activeEvent.comments.map(comment => {
                                        const isOwner = comment.author === profile;
                                        const authorName = comment.author === 'el' ? 'Santiago' : 'Milena';
                                        const accentColor = comment.author === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
                                        return (
                                            <div key={comment.id} className="relative border border-white/5 bg-black/60 p-3.5 pl-6 rounded-none overflow-hidden group">
                                                <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: accentColor }} />
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10.5px] font-bold uppercase tracking-wider font-mono" style={{ color: accentColor }}>{authorName}</span>
                                                    <span className="text-[8.5px] text-[#594137] font-mono">{new Date(comment.createdAt).toLocaleDateString('es-CO', { dateStyle: 'short' })}</span>
                                                </div>
                                                <p className="text-xs text-[#e1bfb2] font-sans leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                                                {isOwner && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="absolute right-3 bottom-3 text-[#594137] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Form */}
                            <form onSubmit={handlePostComment} className="border-t border-white/10 pt-4 mt-4 space-y-3 shrink-0">
                                <textarea
                                    required
                                    name="newComment"
                                    placeholder="Escribe algo sobre este momento..."
                                    className="w-full min-h-[70px] border border-white/10 bg-black px-3 py-2.5 text-xs text-white outline-none transition-colors placeholder:text-[#594137] focus:border-[#ff7020] rounded-none resize-none font-sans"
                                />
                                <button type="submit" className="w-full bg-[#ff7020] py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#ffb595] rounded-none font-mono">
                                    Agregar Comentario
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
