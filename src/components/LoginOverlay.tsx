'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, ArrowRight, User, UserCheck, ChevronLeft, Shield } from 'lucide-react';
import { GeometricBackground } from './GeometricBackground';
import { motion, AnimatePresence } from 'framer-motion';

const PASSWORDS = {
    el: 'refugio',
    ella: 'esperanza'
};

const PROFILE_COLORS = {
    el: {
        primary: '#89D94A',
        secondary: '#B8FF2E',
        shadow: '#3C5F1F',
        highlight: '#D6FF8A'
    },
    ella: {
        primary: '#FF4F9A',
        secondary: '#FF79B6',
        shadow: '#7A1E47',
        highlight: '#FFB3D0'
    }
};

interface LoginOverlayProps {
    onLoginSuccess: (profile: 'el' | 'ella') => void;
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProfile) return;

        if (keyword.trim().toLowerCase() === PASSWORDS[selectedProfile]) {
            onLoginSuccess(selectedProfile);
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
            <GeometricBackground activeProfile={selectedProfile} />

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
                    SECURE_SYS_NODE // ON_AIR
                </div>
                <div className="absolute top-2 right-3 font-mono text-[7px] text-white/20 tracking-widest">
                    COORD: 04°35&apos;56&quot;N 74°04&apos;51&quot;W
                </div>
                <div className="absolute bottom-2 left-3 font-mono text-[7px] text-white/20 tracking-wider">
                    REVEAL_RADIAL_MAPPED: TRUE
                </div>
                <div className="absolute bottom-2 right-3 font-mono text-[7px] text-white/20 uppercase tracking-[0.2em]">
                    Symmetry OS v1.0.4
                </div>
            </div>

            {/* Layer 05: Main Content Module */}
            <div className="relative z-20 w-full max-w-sm font-mono">
                {/* Main Card Wrapper */}
                <div className="border border-white/10 bg-[#161616] p-8 relative overflow-hidden transition-all duration-700"
                    style={{
                        borderColor: selectedProfile ? `${accentColor}40` : 'rgba(255, 255, 255, 0.1)',
                        boxShadow: selectedProfile ? `0 0 30px ${accentColor}10` : 'none'
                    }}>
                    {/* Corner Accent Box */}
                    <div className="absolute top-0 right-0 p-1 font-mono text-[6px] text-white/30 border-b border-l border-white/10 uppercase bg-[#1e1e1e]">
                        AUTH_01
                    </div>

                    <div className="text-center mb-8">
                        {/* Interactive Dynamic Shield Logo */}
                        <div
                            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-2 bg-[#121212] transition-all duration-700"
                            style={{
                                borderColor: accentColor,
                                color: highlightColor,
                                boxShadow: selectedProfile ? `0 0 15px ${accentColor}30` : 'none',
                                transform: selectedProfile ? 'rotate(90deg)' : 'none'
                            }}
                        >
                            {selectedProfile ? <Shield className="w-6 h-6 animate-pulse" /> : <Lock className="w-6 h-6" />}
                        </div>

                        <div className="mb-2 text-[8px] font-bold uppercase tracking-[0.25em] text-white/40">
                            [ IDENTITY_ROUTER_NODE ]
                        </div>
                        <h1
                            className="mb-1 text-2xl font-black uppercase leading-none tracking-tight text-white transition-colors duration-700"
                            style={{ color: highlightColor }}
                        >
                            {selectedProfile ? (selectedProfile === 'el' ? 'Santiago' : 'Milena') : 'Espacio Seguro'}
                        </h1>
                        <p className="text-[9px] uppercase tracking-[0.15em] text-white/60">
                            {selectedProfile ? 'Confirmar Acceso' : 'Selecciona Identidad'}
                        </p>
                    </div>

                    {/* Content Switcher */}
                    <div className="relative">
                        {!selectedProfile ? (
                            /* Grayscale-start tactile card selector */
                            <div className="grid grid-cols-2 gap-3">
                                {/* Button: Él */}
                                <button
                                    onClick={(e) => handleProfileSelect('el', e)}
                                    className="group relative flex flex-col items-center justify-center border border-white/10 bg-[#121212] py-8 px-4 transition-all duration-200 hover:border-[#89D94A] hover:bg-[#89D94A]/5 hover:translate-y-[-2px] active:translate-y-[0px] active:bg-[#89D94A]/10"
                                >
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center border border-white/10 text-white/50 transition-colors duration-200 group-hover:border-[#89D94A] group-hover:text-[#89D94A]">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 group-hover:text-[#89D94A]">
                                        ÉL
                                    </span>
                                    {/* Tech corner accent inside button */}
                                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white/10 group-hover:bg-[#89D94A] transition-colors" />
                                </button>

                                {/* Button: Ella */}
                                <button
                                    onClick={(e) => handleProfileSelect('ella', e)}
                                    className="group relative flex flex-col items-center justify-center border border-white/10 bg-[#121212] py-8 px-4 transition-all duration-200 hover:border-[#FF4F9A] hover:bg-[#FF4F9A]/5 hover:translate-y-[-2px] active:translate-y-[0px] active:bg-[#FF4F9A]/10"
                                >
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center border border-white/10 text-white/50 transition-colors duration-200 group-hover:border-[#FF4F9A] group-hover:text-[#FF4F9A]">
                                        <UserCheck className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 group-hover:text-[#FF4F9A]">
                                        ELLA
                                    </span>
                                    {/* Tech corner accent inside button */}
                                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white/10 group-hover:bg-[#FF4F9A] transition-colors" />
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
                                            placeholder="ACCESS_KEY"
                                            className="w-full border bg-black py-4 pl-4 pr-14 text-center text-sm font-bold tracking-[0.25em] text-white outline-none transition-all placeholder:text-white/20 placeholder:tracking-normal focus:bg-black/50"
                                            style={{
                                                borderColor: error ? '#FF4F9A' : accentColor,
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
                                    [ Cambiar Perfil ]
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
                            className="mt-4 border border-[#FF4F9A] bg-[#FF4F9A]/5 p-3 text-center text-[9px] font-black uppercase tracking-[0.25em] text-[#FF4F9A]"
                        >
                            SYSTEM_ALERT // ACCESO_DENEGADO
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
