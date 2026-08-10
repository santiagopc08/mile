import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircleHeart } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

interface AddNoteFormProps {
    profile: string | null;
    accentClass: string;
    accentColor: string;
}

export function AddNoteForm({
    profile,
    accentClass,
    accentColor
}: AddNoteFormProps) {
    const { data, updateData } = useStore();
    const [newNoteText, setNewNoteText] = useState('');
    const [isAddingMode, setIsAddingMode] = useState(false);

    const notes = data?.notes || [];

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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-8 z-20 w-full max-w-sm px-4"
        >
            {!isAddingMode ? (
                <button
                    onClick={() => setIsAddingMode(true)}
                    className={`flex w-full items-center justify-center gap-2 border border-white/10 bg-black/80 py-4 text-[#a88a7e] backdrop-blur-sm transition-all hover:border-${accentClass} hover:text-${accentClass}`}
                    style={{ '--tw-hover-text-opacity': 1, '--tw-hover-border-opacity': 1 } as React.CSSProperties}
                >
                    <MessageCircleHeart className="w-5 h-5" />
                    <span className="uppercase text-xs font-bold tracking-widest font-mono">Añadir Nueva Nota</span>
                </button>
            ) : (
                <form onSubmit={handleAddNote} className={`geometric-card border-${accentClass}/50 bg-[#0a070c]/75 p-6 backdrop-blur-xl backdrop-saturate-150`} style={{ borderColor: `${accentColor}80` }}>
                    <textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Escribe un pensamiento para el futuro..."
                        className={`mb-4 min-h-[100px] w-full resize-none border border-white/10 bg-black p-4 text-sm tracking-normal text-white outline-none transition-colors placeholder:text-[#594137] focus:border-${accentClass}`}
                        style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                        autoFocus
                    />
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsAddingMode(false)} className="flex-1 border border-white/10 py-3 text-[10px] font-bold uppercase tracking-widest text-[#a88a7e] transition-colors hover:border-white/30 hover:text-white font-mono">Cancelar</button>
                        <button type="submit" disabled={!newNoteText.trim()} className={`flex-1 bg-${accentClass} py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:opacity-80 disabled:opacity-50 font-mono`} style={{ backgroundColor: accentColor }}>Guardar</button>
                    </div>
                </form>
            )}
        </motion.div>
    );
}
