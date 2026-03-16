'use client';

import React, { useState, useEffect } from 'react';
import { LoginOverlay } from './LoginOverlay';
import { AnimatePresence, motion } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, login } = useProfile();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Just delay briefly to avoid flicker if already auth'd
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    const handleLoginSuccess = (profile: 'el' | 'ella') => {
        login(profile);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
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
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-screen"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
