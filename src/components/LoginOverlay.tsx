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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black p-4 text-[#e5e2e1]">
            {/* Background elements */}
            <div className="absolute inset-0 bg-mosaic opacity-70" />
            <div className="absolute inset-0 bg-dot-matrix opacity-35" />
            <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(255,112,32,0.16),transparent)]" />
            <GeometricBackground />

            {/* Structural Accents */}
            <div className="absolute left-1/4 top-0 h-full w-px bg-white/10" />
            <div className="absolute right-1/4 top-0 h-full w-px bg-white/10" />
            <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />

            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="mx-auto mb-6 flex h-16 w-16 rotate-45 items-center justify-center border border-[#ff7020]/70 bg-[#0a0a0a] text-[#ffb595] shadow-[0_0_24px_rgba(255,112,32,0.16)]">
                        <Lock className="w-8 h-8 -rotate-45" />
                    </div>
                    <div className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-[#a88a7e]">PRIVATE ACCESS NODE</div>
                    <h1 className="mb-3 text-4xl font-black uppercase leading-none tracking-normal text-white">
                        {selectedProfile ? `Bienvenid${selectedProfile === 'el' ? 'o' : 'a'}` : 'Acceso Privado'}
                    </h1>
                    <div className="mx-auto mb-4 h-px w-16 bg-[#ff7020]" />
                    <p className="text-sm font-medium uppercase tracking-widest text-[#e1bfb2]">
                        {selectedProfile
                            ? `Ingresa credencial`
                            : 'Selecciona identidad'}
                    </p>
                </div>

                {!selectedProfile ? (
                    <div className="grid grid-cols-2 gap-0 border border-white/10 bg-[#0a0a0a]">
                        <button
                            onClick={() => setSelectedProfile('el')}
                            className="group flex flex-col items-center border-r border-white/10 bg-black/40 p-8 transition-all hover:bg-[#ff7020]/10"
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center border border-white/10 text-[#a88a7e] transition-colors group-hover:border-[#ff7020] group-hover:text-[#ffb595]">
                                <User className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest text-white">Él</span>
                        </button>
                        <button
                            onClick={() => setSelectedProfile('ella')}
                            className="group flex flex-col items-center bg-black/40 p-8 transition-all hover:bg-[#a100f0]/10"
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center border border-white/10 text-[#a88a7e] transition-colors group-hover:border-[#e5b5ff] group-hover:text-[#e5b5ff]">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest text-white">Ella</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <form onSubmit={handleSubmit} className="relative">
                            <input
                                autoFocus
                                type="password"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="PALABRA CLAVE"
                                className={`w-full border bg-[#0a0a0a] px-6 py-4 text-center text-lg font-light tracking-[0.2em] text-white outline-none transition-all placeholder:text-[#594137] ${error ? 'border-red-500' : 'border-white/10 focus:border-[#ff7020]'}`}
                            />
                            <button
                                type="submit"
                                className="absolute bottom-0 right-0 top-0 flex aspect-square items-center justify-center border-l border-white/10 bg-[#ff7020] text-black transition-colors hover:bg-[#ffb595]"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                        <button
                            onClick={() => { setSelectedProfile(null); setKeyword(''); }}
                            className="flex w-full items-center justify-center py-2 text-xs font-bold uppercase tracking-widest text-[#a88a7e] transition-colors hover:text-[#ffb595]"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Cambiar Perfil
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-6 animate-pulse border border-red-500/30 bg-red-500/10 p-3 text-center text-xs font-bold uppercase tracking-widest text-red-400">
                        Acceso Denegado
                    </div>
                )}
            </div>

            {/* Corner Accents */}
            <div className="absolute left-10 top-10 h-4 w-4 border-l border-t border-[#ff7020]/70" />
            <div className="absolute right-10 top-10 h-4 w-4 border-r border-t border-[#00dbe9]/70" />
            <div className="absolute bottom-10 left-10 h-4 w-4 border-b border-l border-[#00dbe9]/70" />
            <div className="absolute bottom-10 right-10 h-4 w-4 border-b border-r border-[#ff7020]/70" />
        </div>
    );
}
