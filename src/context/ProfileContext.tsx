'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type Profile = 'el' | 'ella' | null;

interface ProfileContextType {
    profile: Profile;
    login: (selectedProfile: 'el' | 'ella', password?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<Profile>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            // 1. Instant check sessionStorage for immediate UI paint and zero-latency load
            const savedProfile = sessionStorage.getItem('mile_profile') as Profile;
            const authStatus = sessionStorage.getItem('mile_auth');
            if (authStatus === 'true' && (savedProfile === 'el' || savedProfile === 'ella')) {
                setProfile(savedProfile);
                setIsAuthenticated(true);
            }

            try {
                // 2. Query Supabase Auth for backend session verification
                const { data: { session } } = await supabase.auth.getSession();
                const email = session?.user?.email;
                if (email === 'el@mile.app') {
                    setProfile('el');
                    setIsAuthenticated(true);
                } else if (email === 'ella@mile.app') {
                    setProfile('ella');
                    setIsAuthenticated(true);
                } else if (authStatus === 'true' && (savedProfile === 'el' || savedProfile === 'ella')) {
                    // No backend session exists but we have local session, auto-login silently
                    await login(savedProfile);
                }
            } catch (err) {
                console.error('Session load error:', err);
                // Ensure we don't break local auth state if backend check throws
                if (authStatus === 'true' && (savedProfile === 'el' || savedProfile === 'ella')) {
                    setProfile(savedProfile);
                    setIsAuthenticated(true);
                }
            }
        };

        checkSession();
    }, []);

    const login = async (selectedProfile: 'el' | 'ella', password?: string) => {
        try {
            const pwd = password || (selectedProfile === 'ella' ? 'esperanza' : 'refugio');
            const email = selectedProfile === 'ella' ? 'ella@mile.app' : 'el@mile.app';

            // 1. Call custom setup endpoint to ensure Supabase Auth user is created/updated lazily
            const res = await fetch('/api/auth/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: selectedProfile, password: pwd })
            });

            if (!res.ok) {
                console.warn('API lazy auth setup failed, attempting standard sign-in');
            }

            // 2. Perform proper Supabase Auth sign-in to establish standard session
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: pwd
            });

            if (error) {
                console.error('Supabase Auth sign-in error:', error.message);
                return false;
            }

            // 3. Persist standard & backwards-compatible session storage
            sessionStorage.setItem('mile_auth', 'true');
            sessionStorage.setItem('mile_profile', selectedProfile);
            setProfile(selectedProfile);
            setIsAuthenticated(true);
            return true;
        } catch (err) {
            console.error('Login process error:', err);
            return false;
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Supabase signOut error:', err);
        }
        sessionStorage.removeItem('mile_auth');
        sessionStorage.removeItem('mile_profile');
        setProfile(null);
        setIsAuthenticated(false);
    };

    return (
        <ProfileContext.Provider value={{ profile, login, logout, isAuthenticated }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
}
