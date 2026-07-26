'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, ArrowRight, User, UserCheck, ChevronLeft, Shield } from 'lucide-react';
import { AmbientField } from './AmbientField';
import { motion, AnimatePresence } from 'framer-motion';

import { PROFILE_PALETTE as PROFILE_COLORS } from '@/lib/profilePalette';

interface LoginOverlayProps {
    onLoginSuccess: (profile: 'el' | 'ella', password?: string) => Promise<boolean>;
}

export function LoginOverlay({ onLoginSuccess }: LoginOverlayProps) {
    const [selectedProfile, setSelectedProfile] = useState<'el' | 'ella' | null>(null);
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [clickCoords, setClickCoords] = useState({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleProfileSelect = (profile: 'el' | 'ella', e: React.MouseEvent<HTMLButtonElement>) => {
        // Track the click coordinates to anchor our radial reveal animation
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setClickCoords({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        } else {
            setClickCoords({
                x: e.clientX,
                y: e.clientY
            });
        }
        setSelectedProfile(profile);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProfile) return;

        const success = await onLoginSuccess(selectedProfile, keyword);
        if (success) {
            // Login successful
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    if (!isMounted) return null;

    const activeColors = selectedProfile ? PROFILE_COLORS[selectedProfile] : null;
    const accentColor = activeColors ? activeColors.primary : '#444444';
    const highlightColor = activeColors ? activeColors.highlight : '#ffffff';

    const transitionStyle = {
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
    };

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#131313] p-4 text-[#fbdae0] font-sans selection:bg-white/20 select-none"
        >
            {/* Layer 01 & 03: Animated Background System */}
            <AmbientField preset="login" profile={selectedProfile} attach="parent" dim interactive={false} />

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

            {/* Layer 05: Main Content Module */}
            <div className="relative z-20 w-full max-w-sm font-mono">
                {/* Main Card Wrapper */}
                <div className="border border-white/15 bg-white/[0.04] backdrop-blur-2xl p-8 relative overflow-hidden transition-all duration-700 shadow-[0_25px_60px_rgba(0,0,0,0.7)]"
                    style={{
                        borderColor: selectedProfile ? `${accentColor}50` : 'rgba(255, 255, 255, 0.15)',
                        boxShadow: selectedProfile ? `0 0 40px ${accentColor}25, 0 25px 60px rgba(0,0,0,0.7)` : '0 25px 60px rgba(0,0,0,0.7)'
                    }}>
                    {/* Corner Accent Box */}
                    <div className="absolute top-0 right-0 p-1 font-mono text-[6px] text-white/40 border-b border-l border-white/10 uppercase bg-white/[0.08] backdrop-blur-md">
                        ACCESO 01
                    </div>

                    <div className="text-center mb-8">
                        {/* Interactive Dynamic Shield Logo */}
                        <div
                            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-2 bg-white/[0.05] backdrop-blur-md transition-all duration-700"
                            style={{
                                borderColor: accentColor,
                                color: highlightColor,
                                boxShadow: selectedProfile ? `0 0 20px ${accentColor}40` : 'none',
                                transform: selectedProfile ? 'rotate(90deg)' : 'none'
                            }}
                        >
                            <Shield className="w-6 h-6 transition-transform duration-700" />
                        </div>
                        <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-white mb-1">
                            CONTROL DE ACCESO
                        </h2>
                        <p className="text-[9px] text-[#a88a7e] uppercase tracking-[0.16em]">
                            SELECCIONE PERFIL OPERATIVO
                        </p>
                    </div>

                    {/* Interactive Body */}
                    <div className="relative">
                        {!selectedProfile ? (
                            /* Grayscale-start tactile card selector */
                            <div className="grid grid-cols-2 gap-3">
                                {/* Button: Él */}
                                <button
                                    onClick={(e) => handleProfileSelect('el', e)}
                                    className="group relative flex flex-col items-center justify-center border border-white/12 bg-white/[0.04] backdrop-blur-md py-8 px-4 transition-all duration-200 hover:border-[#c3f400] hover:bg-[#c3f400]/10 hover:translate-y-[-2px] active:translate-y-[0px]"
                                >
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center border border-white/15 bg-white/[0.04] text-white/60 transition-colors duration-200 group-hover:border-[#c3f400] group-hover:text-[#c3f400]">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 group-hover:text-[#c3f400]">
                                        ÉL
                                    </span>
                                    {/* Tech corner accent inside button */}
                                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white/15 group-hover:bg-[#c3f400] transition-colors" />
                                </button>

                                {/* Button: Ella */}
                                <button
                                    onClick={(e) => handleProfileSelect('ella', e)}
                                    className="group relative flex flex-col items-center justify-center border border-white/12 bg-white/[0.04] backdrop-blur-md py-8 px-4 transition-all duration-200 hover:border-[#ff4b89] hover:bg-[#ff4b89]/10 hover:translate-y-[-2px] active:translate-y-[0px]"
                                >
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center border border-white/15 bg-white/[0.04] text-white/60 transition-colors duration-200 group-hover:border-[#ff4b89] group-hover:text-[#ff4b89]">
                                        <UserCheck className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 group-hover:text-[#ff4b89]">
                                        ELLA
                                    </span>
                                    {/* Tech corner accent inside button */}
                                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white/15 group-hover:bg-[#ff4b89] transition-colors" />
                                </button>
                            </div>
                        ) : (
                            /* Technical Terminal Prompt Access Form */
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <form onSubmit={handleSubmit} className="relative flex flex-col">
                                    <div className="relative">
                                        <input
                                            autoFocus
                                            type="password"
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            placeholder="CONTRASEÑA"
                                            className="w-full border bg-black py-4 pl-4 pr-14 text-center text-sm font-bold tracking-[0.25em] text-white outline-none transition-all placeholder:text-white/20 placeholder:tracking-normal focus:bg-black/50"
                                            style={{
                                                borderColor: error ? '#ff4b89' : accentColor,
                                                color: highlightColor,
                                                boxShadow: `0 0 10px ${accentColor}15`
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            className="absolute right-0 top-0 bottom-0 flex aspect-square items-center justify-center transition-all hover:opacity-85 active:scale-95"
                                            style={{
                                                backgroundColor: accentColor,
                                                color: '#131313'
                                            }}
                                        >
                                            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                                        </button>
                                    </div>
                                </form>

                                <button
                                    onClick={() => { setSelectedProfile(null); setKeyword(''); }}
                                    className="flex w-full items-center justify-center py-2 text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-white"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                                    Elegir otro perfil
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 border border-[#ff4b89] bg-[#ff4b89]/5 p-3 text-center text-[9px] font-black uppercase tracking-[0.25em] text-[#ff4b89]"
                        >
                            CLAVE INCORRECTA // INTENTA DE NUEVO
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
