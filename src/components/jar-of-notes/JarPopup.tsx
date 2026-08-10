import { motion } from 'framer-motion';
import { X, Circle, Triangle, Square } from 'lucide-react';
import { renderTextWithHashtags } from '@/utils/textFormatting';

interface JarPopupProps {
    accentClass: string;
    accentColor: string;
    secondaryClass: string;
    secondaryColor: string;
    closeSequence: () => void;
    currentNote: string;
}

export function JarPopup({
    accentClass,
    accentColor,
    secondaryClass,
    secondaryColor,
    closeSequence,
    currentNote
}: JarPopupProps) {
    return (
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

            <div className={`geometric-card relative mx-4 w-full max-w-lg border-${accentClass}/50 bg-[#0a070c]/75 p-8 backdrop-blur-xl backdrop-saturate-150 md:p-12`} style={{ borderColor: `${accentColor}80` }}>
                <div className="pointer-events-none absolute inset-0 bg-mosaic opacity-40" />

                <div className="relative z-10 mb-8 flex items-start justify-between border-b border-white/10 pb-4">
                    <span className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-${accentClass} font-mono`}>
                        <div className={`h-2 w-2 bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
                        Nota Diaria
                    </span>
                    <button
                        onClick={closeSequence}
                        className={`-mr-4 -mt-4 p-2 text-[#a88a7e] transition-colors hover:text-${accentClass}`}
                        style={{ '--tw-hover-text-opacity': 1 } as React.CSSProperties}
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
    );
}
