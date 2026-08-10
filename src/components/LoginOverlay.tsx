'use client';

import { useState, useRef, useEffect } from 'react';
import { AmbientField } from './AmbientField';
import { motion, AnimatePresence } from 'framer-motion';

import { PROFILE_PALETTE as PROFILE_COLORS } from '@/lib/profilePalette';
import { BackgroundDecorations } from './login/BackgroundDecorations';
import { LoginCard } from './login/LoginCard';
import { ProfileSelector } from './login/ProfileSelector';
import { LoginForm } from './login/LoginForm';

interface LoginOverlayProps {
    onLoginSuccess: (profile: 'el' | 'ella', password?: string) => Promise<boolean>;
}

export function LoginOverlay({ onLoginSuccess }: LoginOverlayProps) {
    const [selectedProfile, setSelectedProfile] = useState<'el' | 'ella' | null>(null);
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState(false);
    const [clickCoords, setClickCoords] = useState({ x: 0, y: 0 });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // use setTimeout to push this out of the sync render path and appease the linter
        const timer = setTimeout(() => setIsMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);

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

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#131313] p-4 text-[#fbdae0] font-sans selection:bg-white/20 select-none"
        >
            {/* Layer 01 & 03: Animated Background System */}
            <AmbientField preset="login" profile={selectedProfile} attach="parent" dim interactive={false} />

            <BackgroundDecorations
                accentColor={accentColor}
                selectedProfile={selectedProfile}
                clickCoords={clickCoords}
            />

            <div className="relative z-20 w-full max-w-sm font-mono">
                <LoginCard
                    selectedProfile={selectedProfile}
                    accentColor={accentColor}
                    highlightColor={highlightColor}
                >
                    {!selectedProfile ? (
                        <ProfileSelector onSelect={handleProfileSelect} />
                    ) : (
                        <LoginForm
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            onSubmit={handleSubmit}
                            onCancel={() => { setSelectedProfile(null); setKeyword(''); }}
                            error={error}
                            accentColor={accentColor}
                            highlightColor={highlightColor}
                        />
                    )}
                </LoginCard>

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
