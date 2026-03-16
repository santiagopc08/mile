'use client';

import { useState, useEffect } from 'react';
import { Lock, ArrowRight, User, UserCheck, ChevronLeft } from 'lucide-react';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="mx-auto w-16 h-16 bg-earth-soft/20 text-earth-dark dark:text-earth-soft rounded-full flex items-center justify-center mb-6">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-light text-stone-800 dark:text-stone-200 mb-3">
                        {selectedProfile ? `Bienvenid${selectedProfile === 'el' ? 'o' : 'a'}` : 'Un Espacio Privado'}
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400">
                        {selectedProfile
                            ? `Ingresa tu palabra clave para acceder.`
                            : 'Selecciona tu perfil para ingresar a nuestro refugio.'}
                    </p>
                </div>

                {!selectedProfile ? (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setSelectedProfile('el')}
                            className="group flex flex-col items-center p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl hover:border-earth-accent hover:shadow-lg transition-all"
                        >
                            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 text-stone-400 group-hover:bg-earth-soft/20 group-hover:text-earth-dark dark:group-hover:text-earth-soft rounded-full flex items-center justify-center mb-4 transition-colors">
                                <User className="w-8 h-8" />
                            </div>
                            <span className="text-lg font-light text-stone-700 dark:text-stone-300">Él</span>
                        </button>
                        <button
                            onClick={() => setSelectedProfile('ella')}
                            className="group flex flex-col items-center p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl hover:border-earth-accent hover:shadow-lg transition-all"
                        >
                            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 text-stone-400 group-hover:bg-earth-soft/20 group-hover:text-earth-dark dark:group-hover:text-earth-soft rounded-full flex items-center justify-center mb-4 transition-colors">
                                <UserCheck className="w-8 h-8" />
                            </div>
                            <span className="text-lg font-light text-stone-700 dark:text-stone-300">Ella</span>
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
                                placeholder="Palabra Clave"
                                className={`w-full bg-white dark:bg-stone-900 border ${error ? 'border-red-400 dark:border-red-500/50' : 'border-stone-200 dark:border-stone-800'
                                    } rounded-2xl px-6 py-4 outline-none focus:border-earth-accent focus:ring-1 focus:ring-earth-accent transition-all text-center text-lg tracking-widest`}
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-2 bottom-2 aspect-square bg-earth-base hover:bg-earth-dark text-white rounded-xl flex items-center justify-center transition-colors"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                        <button
                            onClick={() => { setSelectedProfile(null); setKeyword(''); }}
                            className="w-full flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-earth-dark dark:hover:text-stone-200 transition-colors py-2"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Cambiar Perfil
                        </button>
                    </div>
                )}

                {error && (
                    <p className="text-center text-red-500 text-sm mt-4 animate-bounce">
                        Palabra incorrecta. Inténtalo de nuevo.
                    </p>
                )}
            </div>
        </div>
    );
}
