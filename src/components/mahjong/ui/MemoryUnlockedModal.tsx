import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';
import { BrutalistCorners } from '@/components/ui/BrutalistPanel';

interface MemoryUnlockedModalProps {
    memoryModalData: {
        imageUrl: string;
        title: string;
        description: string;
        date: string;
    } | null;
    setMemoryModalData: (data: null) => void;
    setTimerActive: (active: boolean) => void;
}

export function MemoryUnlockedModal({
    memoryModalData,
    setMemoryModalData,
    setTimerActive
}: MemoryUnlockedModalProps) {
    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {memoryModalData && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100099] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-hidden"
                >
                    {/* Cyber scanlines */}
                    <div className="absolute inset-0 scanlines-overlay opacity-35 pointer-events-none z-0" />

                    {/* Figuras desenfocadas de fondo (Glow dorado) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                        <div className="absolute top-[15%] left-[10%] w-80 h-80 rounded-full bg-[#ffd700]/12 blur-[100px] animate-bg-glow-float-1" />
                        <div className="absolute bottom-[15%] right-[10%] w-80 h-80 rounded-full bg-[#ff00ff]/8 blur-[100px] animate-bg-glow-float-2" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#ffd700]/5 blur-[90px] animate-bg-glow-rotate" />
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                        className="relative z-10 w-full max-w-lg border border-[#ffd700]/40 bg-[#0a0a0a] p-6 text-center shadow-[0_0_50px_rgba(255,215,0,0.25)] md:p-8 animate-glitch-container"
                    >
                        <BrutalistCorners color="#ffd700" size={16} />

                        <div className="mb-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#ffd700] animate-glitch-text">
                            <Sparkles className="h-4 w-4 text-[#ffd700] animate-pulse" />
                            Recuerdo Desbloqueado
                        </div>

                        {/* Foto grande con bordes dorados */}
                        <div className="relative mx-auto mb-6 aspect-video max-h-64 overflow-hidden border border-[#ffd700]/30 bg-black/60 p-[3px]">
                            <img
                                src={memoryModalData.imageUrl}
                                alt={memoryModalData.title}
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <h3 className="mb-1 text-2xl font-black uppercase tracking-tight text-white font-mono">
                            {memoryModalData.title}
                        </h3>

                        <span className="mb-4 block text-[10px] font-mono uppercase text-[#a88a7e]">
                            {memoryModalData.date}
                        </span>

                        <p className="mb-8 border-y border-white/5 py-4 font-mono text-xs italic leading-relaxed text-[#e5e2e1]">
                            "{memoryModalData.description}"
                        </p>

                        <button
                            onClick={() => {
                                setMemoryModalData(null);
                                setTimerActive(true); // Reanudar temporizador
                            }}
                            className="w-full bg-[#ffd700] py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#ffe57f] active:scale-95"
                        >
                            Continuar
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
