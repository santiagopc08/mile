import { AnimatePresence, motion } from 'framer-motion';

interface BackgroundDecorationsProps {
    accentColor: string;
    selectedProfile: 'el' | 'ella' | null;
    clickCoords: { x: number; y: number };
}

export function BackgroundDecorations({ accentColor, selectedProfile, clickCoords }: BackgroundDecorationsProps) {
    return (
        <>
            {/* Layer 02: Blueprint Grid Lines Overlay */}
            <div className="absolute inset-0 z-[1] pointer-events-none opacity-5">
                <div className="absolute left-1/4 top-0 h-full w-px bg-white" />
                <div className="absolute right-1/4 top-0 h-full w-px bg-white" />
                <div className="absolute left-0 right-0 top-1/3 h-px bg-white" />
                <div className="absolute left-0 right-0 top-2/3 h-px bg-white" />
            </div>

            {/* Layer 04: GPU-Accelerated Dynamic Color Reveal Overlay */}
            <AnimatePresence>
                {selectedProfile && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 6, opacity: 0.12 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute rounded-full pointer-events-none blur-3xl z-10"
                        style={{
                            left: clickCoords.x - 100,
                            top: clickCoords.y - 100,
                            width: 200,
                            height: 200,
                            backgroundColor: accentColor
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Layer 06: Tactical HUD Overlay (Esquinas y Coordenadas) */}
            <div className="absolute inset-6 z-20 pointer-events-none border border-white/5">
                {/* L-Shape Corners (Se colorean al seleccionar perfil) */}
                <div
                    className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 transition-colors duration-700"
                    style={{ borderColor: accentColor }}
                />
                <div
                    className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 transition-colors duration-700"
                    style={{ borderColor: accentColor }}
                />
                <div
                    className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 transition-colors duration-700"
                    style={{ borderColor: accentColor }}
                />
                <div
                    className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 transition-colors duration-700"
                    style={{ borderColor: accentColor }}
                />

                {/* HUD technical tags */}
                <div className="absolute top-2 left-3 font-mono text-[7px] text-white/20 uppercase tracking-[0.3em]">
                    CONEXIÓN SEGURA // EN LÍNEA
                </div>
                <div className="absolute top-2 right-3 font-mono text-[7px] text-white/20 tracking-widest">
                    COORD: 04°35&apos;56&quot;N 74°04&apos;51&quot;W
                </div>
                <div className="absolute bottom-2 left-3 font-mono text-[7px] text-white/20 tracking-wider">
                    MODO SEGURO ACTIVO: SÍ
                </div>
                <div className="absolute bottom-2 right-3 font-mono text-[7px] text-white/20 uppercase tracking-[0.2em]">
                    Sincronía Enlace v1.0.4
                </div>
            </div>
        </>
    );
}
