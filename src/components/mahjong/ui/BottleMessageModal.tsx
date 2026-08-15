import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { BrutalistPanel, BrutalistCorners } from '@/components/ui/BrutalistPanel';

interface BottleMessageModalProps {
    bottleNoteModal: boolean;
    bottleNoteText: string;
    setBottleNoteText: (text: string) => void;
    handleCloseWriteModal: () => void;
    onSend: () => void;
    revealedBottleMessage: any;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    hasPausedForMessage: boolean;
    setHasPausedForMessage: (paused: boolean) => void;
    showMessageText: boolean;
    setShowMessageText: (show: boolean | ((prev: boolean) => boolean)) => void;
    onRevealComplete: () => void;
    profile: string | null;
}

export function BottleMessageModal({
    bottleNoteModal,
    bottleNoteText,
    setBottleNoteText,
    handleCloseWriteModal,
    onSend,
    revealedBottleMessage,
    videoRef,
    hasPausedForMessage,
    setHasPausedForMessage,
    showMessageText,
    setShowMessageText,
    onRevealComplete,
    profile
}: BottleMessageModalProps) {
    if (typeof window === 'undefined') return null;

    return createPortal(
        <>
            {/* Modal para Escribir Mensaje en la Botella */}
            {bottleNoteModal && (
                <div className="fixed inset-0 z-[100099] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
                    <BrutalistPanel
                        accentColor="#2dd4bf"
                        cornerSize={12}
                        className="w-full max-w-md !bg-[#0c1616] p-6 shadow-[0_0_40px_rgba(0,128,128,0.25)] md:p-8"
                    >
                        <h3 className="mb-2 text-xl font-bold uppercase tracking-wider text-[#00ffcc] font-mono">
                            Mensaje en la Botella 🍾
                        </h3>
                        <p className="mb-4 text-xs leading-relaxed text-slate-400 font-mono">
                            Escribe una nota de amor, un mensajito dulce o una frase especial. Tu pareja verá una botella en la parte superior de su pantalla para revelarlo.
                        </p>

                        <textarea
                            value={bottleNoteText}
                            onChange={(e) => setBottleNoteText(e.target.value)}
                            placeholder="Te amo mucho, ten un día increíble..."
                            className="w-full h-28 border border-teal-500/20 bg-black/50 p-3 font-mono text-xs text-white focus:border-teal-500 focus:outline-none placeholder:text-teal-900/60"
                        />

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={onSend}
                                className="flex-1 bg-[#008080] py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#009999] active:scale-95 transition-all"
                            >
                                Lanzar al mar
                            </button>
                            <button
                                onClick={handleCloseWriteModal}
                                className="border border-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:bg-white/5 active:scale-95 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </BrutalistPanel>
                </div>
            )}

            {/* Modal para Revelar Mensaje de Amor de la Botella */}
            <AnimatePresence>
                {revealedBottleMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100099] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-hidden"
                    >
                        {/* Cyber scanlines */}
                        <div className="absolute inset-0 scanlines-overlay opacity-35 pointer-events-none z-0" />

                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                            className="relative z-10 w-full max-w-sm border border-[#00ffcc]/40 bg-[#0c1616] p-6 text-center shadow-[0_0_40px_rgba(0,255,204,0.2)] md:p-8"
                        >
                            <BrutalistCorners color="#00ffcc" size={16} />

                            <div className="mb-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#00ffcc]">
                                🍾 Mensaje de Amor Encontrado
                            </div>

                            {/* Recipient-specific video loop - Tall 9:16 aspect */}
                            <div className="relative mx-auto mb-6 aspect-[9/16] h-[380px] max-h-[50vh] overflow-hidden border border-[#00ffcc]/20 bg-black/60 p-[3px]">
                                <div className="absolute top-0 left-0 h-2 w-2 border-t border-l border-[#00ffcc] z-10" />
                                <div className="absolute top-0 right-0 h-2 w-2 border-t border-r border-[#00ffcc] z-10" />
                                <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-[#00ffcc] z-10" />
                                <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-[#00ffcc] z-10" />

                                <video
                                    ref={videoRef}
                                    src="/vid/mahjong_Sam.mp4"
                                    autoPlay
                                    loop={false}
                                    muted
                                    playsInline
                                    onTimeUpdate={(e) => {
                                        const video = e.currentTarget;
                                        // Start fade in message at 3.2s
                                        if (video.currentTime >= 3.2 && video.currentTime < 4.0) {
                                            setShowMessageText((prev) => {
                                                if (!prev) return true;
                                                return prev;
                                            });
                                        }
                                        // Pause at 4.0s when the scroll opens and is fully open
                                        if (video.currentTime >= 4.0 && !hasPausedForMessage) {
                                            video.pause();
                                            setHasPausedForMessage(true);
                                        }
                                    }}
                                    onEnded={onRevealComplete}
                                    className="h-full w-full object-cover"
                                />

                                {/* Message text overlaid inside the video box */}
                                <AnimatePresence>
                                    {showMessageText && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0 }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            className="absolute inset-0 flex flex-col justify-center items-center bg-black/55 p-3 select-none font-serif text-teal-100 italic text-center z-20"
                                        >
                                            <div className="max-w-[90%] break-words bg-black/75 border border-[#00ffcc]/30 px-3 py-4 rounded shadow-2xl text-[11px] leading-relaxed font-mono">
                                                "{revealedBottleMessage.text}"
                                                <span className="block mt-3 text-[8px] uppercase tracking-wider font-mono text-[#a88a7e] not-italic">
                                                    De: {revealedBottleMessage.sender}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {!hasPausedForMessage || showMessageText ? (
                                <button
                                    disabled={!showMessageText}
                                    onClick={() => {
                                        if (!showMessageText) return;
                                        setShowMessageText(false);
                                        if (videoRef.current) {
                                            // Seek to 4.2s (the start of the retreat animation) and play immediately
                                            videoRef.current.currentTime = 4.2;
                                            videoRef.current.play().catch(e => console.error("Error playing video:", e));
                                        }
                                    }}
                                    className="w-full bg-[#00ffcc] py-3 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-teal-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ¡Qué tierno! Continuar
                                </button>
                            ) : (
                                <div className="w-full py-3 text-xs font-mono uppercase tracking-[0.18em] text-teal-400 bg-teal-950/20 border border-teal-500/20">
                                    Guardando en la memoria...
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
}
