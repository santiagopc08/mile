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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-grid-mosaic opacity-60" />
            <div className="absolute inset-0 bg-dot-matrix opacity-40" />
            <GeometricBackground />

            {/* Structural Accents */}
            <div className="absolute top-0 left-1/4 w-[1px] h-full bg-stone-200/50 dark:bg-stone-800/30" />
            <div className="absolute top-0 right-1/4 w-[1px] h-full bg-stone-200/50 dark:bg-stone-800/30" />

            <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="mx-auto w-16 h-16 bg-white dark:bg-stone-900 border border-geometric-border text-stone-800 dark:text-stone-200 flex items-center justify-center mb-6 rotate-45">
                        <Lock className="w-8 h-8 -rotate-45" />
                    </div>
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-3 uppercase tracking-tighter">
                        {selectedProfile ? `Bienvenid${selectedProfile === 'el' ? 'o' : 'a'}` : 'Acceso Privado'}
                    </h1>
                    <div className="h-px w-12 bg-geometric-accent mx-auto mb-4" />
                    <p className="text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-widest">
                        {selectedProfile
                            ? `Ingresa credencial`
                            : 'Selecciona identidad'}
                    </p>
                </div>

                {!selectedProfile ? (
                    <div className="grid grid-cols-2 gap-0 border border-geometric-border">
                        <button
                            onClick={() => setSelectedProfile('el')}
                            className="group flex flex-col items-center p-8 bg-white dark:bg-stone-900 border-r border-geometric-border hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                        >
                            <div className="w-12 h-12 border border-stone-200 dark:border-stone-800 text-stone-400 group-hover:border-geometric-accent group-hover:text-geometric-accent flex items-center justify-center mb-4 transition-colors">
                                <User className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300">Él</span>
                        </button>
                        <button
                            onClick={() => setSelectedProfile('ella')}
                            className="group flex flex-col items-center p-8 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                        >
                            <div className="w-12 h-12 border border-stone-200 dark:border-stone-800 text-stone-400 group-hover:border-geometric-accent group-hover:text-geometric-accent flex items-center justify-center mb-4 transition-colors">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300">Ella</span>
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
                                className={`w-full bg-white dark:bg-stone-900 border ${error ? 'border-red-500' : 'border-geometric-border'
                                    } rounded-none px-6 py-4 outline-none focus:border-geometric-accent transition-all text-center text-lg tracking-[0.2em] font-light`}
                            />
                            <button
                                type="submit"
                                className="absolute right-0 top-0 bottom-0 aspect-square bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-geometric-accent dark:hover:bg-geometric-accent hover:text-white flex items-center justify-center transition-colors border-l border-geometric-border"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                        <button
                            onClick={() => { setSelectedProfile(null); setKeyword(''); }}
                            className="w-full flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-geometric-accent transition-colors py-2 text-xs uppercase tracking-widest font-bold"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Cambiar Perfil
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-3 border border-red-500/20 bg-red-500/5 text-center text-red-500 text-xs uppercase tracking-widest font-bold animate-pulse">
                        Acceso Denegado
                    </div>
                )}
            </div>

            {/* Corner Accents */}
            <div className="absolute top-10 left-10 w-4 h-4 border-t border-l border-geometric-border" />
            <div className="absolute top-10 right-10 w-4 h-4 border-t border-r border-geometric-border" />
            <div className="absolute bottom-10 left-10 w-4 h-4 border-b border-l border-geometric-border" />
            <div className="absolute bottom-10 right-10 w-4 h-4 border-b border-r border-geometric-border" />
        </div>
    );
}
