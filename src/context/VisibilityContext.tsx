'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type VisibilityMode = 'me' | 'us';

interface VisibilityContextType {
    mode: VisibilityMode;
    setMode: (mode: VisibilityMode) => void;
    toggleMode: () => void;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export function VisibilityProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<VisibilityMode>('me');

    const toggleMode = () => {
        setMode((prev) => (prev === 'me' ? 'us' : 'me'));
    };

    return (
        <VisibilityContext.Provider value={{ mode, setMode, toggleMode }}>
            {children}
        </VisibilityContext.Provider>
    );
}

export function useVisibility() {
    const context = useContext(VisibilityContext);
    if (context === undefined) {
        throw new Error('useVisibility must be used within a VisibilityProvider');
    }
    return context;
}
