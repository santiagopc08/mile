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
        return (
            <div suppressHydrationWarning className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-earth-soft border-t-earth-dark animate-spin" />
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
