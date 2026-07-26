'use client';

import React, { useState, useEffect } from 'react';
import { LoginOverlay } from './LoginOverlay';
import { AnimatePresence, motion } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, login } = useProfile();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const handleLoginSuccess = async (profile: 'el' | 'ella', password?: string): Promise<boolean> => {
        return await login(profile, password);
    };

    const showLoader = isLoading && !isAuthenticated;

    if (showLoader) {
        // Este bloque se pinta en cada arranque, antes de resolver la sesión.
        // Antes usaba `bg-stone-50` (casi blanco) con `dark:` dependiente de la
        // preferencia del sistema: con el móvil en modo claro, la app —que es
        // negra entera— soltaba un destello blanco a pantalla completa.
        // Además, `border-earth-soft`/`border-t-earth-dark` no existen en el
        // theme, así que el aro giraba sin contraste y parecía congelado.
        return (
            <div
                suppressHydrationWarning
                className="flex min-h-screen items-center justify-center bg-[#0a070c]"
                role="status"
                aria-label="Cargando"
            >
                <div className="h-8 w-8 rounded-full border-4 border-white/10 border-t-[#a178ff] animate-spin" />
                <span className="sr-only">Cargando tu espacio…</span>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {!isAuthenticated ? (
                <React.Fragment key="login">
                    <LoginOverlay onLoginSuccess={handleLoginSuccess} />
                </React.Fragment>
            ) : (
                <motion.div
                    key="app"
                    // Solo opacidad (sin scale): un transform aquí convertiría los fondos
                    // `fixed inset-0` de las páginas en absolutos y los desplazaría al hacer scroll.
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-screen"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
