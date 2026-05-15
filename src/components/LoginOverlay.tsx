'use client';

import { useState, useEffect } from 'react';
import { Lock, ArrowRight, User, UserCheck, ChevronLeft } from 'lucide-react';
import { GeometricBackground } from './GeometricBackground';

const PASSWORDS = {
    el: 'refugio',
    ella: 'esperanza'
};

interface LoginOverlayProps {
    onLoginSuccess: (profile: 'el' | 'ella') => void;
}

export function LoginOverlay({ onLoginSuccess }: LoginOverlayProps) {
    const [selectedProfile, setSelectedProfile] = useState<'el' | 'ella' | null>(null);
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-surface p-4 text-on-surface font-sans">
            {/* Background elements */}
            <div className="absolute inset-0 bg-mosaic opacity-40" />
            <div className="absolute inset-0 bg-dot-matrix opacity-20" />
            <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(255,75,137,0.1),transparent)]" />
            <GeometricBackground />

            {/* Structural Accents - Symmetry Blueprint style */}
            <div className="absolute left-1/4 top-0 h-full w-px bg-outline/10" />
            <div className="absolute right-1/4 top-0 h-full w-px bg-outline/10" />
            <div className="absolute left-0 right-0 top-1/2 h-px bg-outline/10" />

            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border-2 border-user-a bg-surface-dim text-user-a shadow-[4px_4px_0px_0px_rgba(255,75,137,0.3)]">
                        <Lock className="w-8 h-8" />
                    </div>
                    <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                        [ SYSTEM_ACCESS_NODE_01 ]
                    </div>
                    <h1 className="mb-3 text-4xl font-bold uppercase leading-none tracking-tighter text-white">
                        {selectedProfile ? `Bienvenid${selectedProfile === 'el' ? 'o' : 'a'}` : 'Symmetry Auth'}
                    </h1>
                    <div className="mx-auto mb-4 h-0.5 w-16 bg-user-a" />
                    <p className="text-sm font-medium uppercase tracking-widest text-on-surface-variant">
                        {selectedProfile
                            ? `IDENTIDAD: ${selectedProfile.toUpperCase()}`
                            : 'SELECCIONA IDENTIDAD'}
                    </p>
                </div>

                {!selectedProfile ? (
                    <div className="grid grid-cols-2 gap-px border border-outline/20 bg-outline/20 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                        <button
                            onClick={() => setSelectedProfile('el')}
                            className="group flex flex-col items-center bg-surface-dim p-10 transition-all hover:bg-user-b/10 border-b-2 border-transparent hover:border-user-b"
                        >
                            <div className="mb-4 flex h-14 w-14 items-center justify-center border border-outline/30 text-on-surface-variant transition-colors group-hover:border-user-b group-hover:text-user-b">
                                <User className="w-7 h-7" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">Él</span>
                        </button>
                        <button
                            onClick={() => setSelectedProfile('ella')}
                            className="group flex flex-col items-center bg-surface-dim p-10 transition-all hover:bg-user-a/10 border-b-2 border-transparent hover:border-user-a"
                        >
                            <div className="mb-4 flex h-14 w-14 items-center justify-center border border-outline/30 text-on-surface-variant transition-colors group-hover:border-user-a group-hover:text-user-a">
                                <UserCheck className="w-7 h-7" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">Ella</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <form onSubmit={handleSubmit} className="relative group">
                            <div className="absolute -inset-0.5 bg-user-a/20 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <input
                                autoFocus
                                type="password"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="ACCESS_KEY"
                                className={`relative w-full border-2 bg-surface-dim px-6 py-4 text-center text-lg font-bold tracking-[0.3em] text-white outline-none transition-all placeholder:text-outline/30 ${error ? 'border-system-alert' : 'border-outline/20 focus:border-user-a'}`}
                            />
                            <button
                                type="submit"
                                className="absolute bottom-0 right-0 top-0 flex aspect-square items-center justify-center bg-user-a text-surface-dim transition-all hover:bg-on-surface-variant active:translate-x-1 active:translate-y-1"
                            >
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </form>
                        <button
                            onClick={() => { setSelectedProfile(null); setKeyword(''); }}
                            className="flex w-full items-center justify-center py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant transition-colors hover:text-user-a"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            [ CAMBIAR PERFIL ]
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-6 border border-system-alert bg-system-alert/10 p-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-system-alert animate-pulse">
                        ACCESO_DENEGADO
                    </div>
                )}
            </div>

            {/* Corner Accents - Symmetry Blueprint style */}
            <div className="absolute left-8 top-8 h-6 w-6 border-l-2 border-t-2 border-user-a/40" />
            <div className="absolute right-8 top-8 h-6 w-6 border-r-2 border-t-2 border-user-b/40" />
            <div className="absolute bottom-8 left-8 h-6 w-6 border-b-2 border-l-2 border-user-c/40" />
            <div className="absolute bottom-8 right-8 h-6 w-6 border-b-2 border-r-2 border-user-a/40" />

            {/* Terminal Decorations */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-mono tracking-[0.5em] text-outline/20 uppercase">
                Symmetry OS // Terminal Login
            </div>
        </div>
    );
}
