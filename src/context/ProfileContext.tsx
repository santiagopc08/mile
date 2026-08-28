'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type Profile = 'el' | 'ella' | null;

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

    const login = async (selectedProfile: 'el' | 'ella', password?: string) => {
        try {
            if (!password) {
                // Try silent login via refresh
                const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    if (data.profile === selectedProfile) {
                        if (data.session) {
                            const { error: setSessionError } = await supabase.auth.setSession(data.session);
                            if (setSessionError) {
                                return false;
                            }
                        }
                        localStorage.setItem('mile_auth', 'true');
                        localStorage.setItem('mile_profile', selectedProfile);
                        setProfile(selectedProfile);
                        setIsAuthenticated(true);
                        return true;
                    }
                }
                return false;
            }

            // Perform backend validation and authentication
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: selectedProfile, password })
            });

            if (!res.ok) {
                return false;
            }

            const loginData = await res.json();

            if (loginData.session) {
                // Set the session locally so client-side supabase works immediately
                const { error: setSessionError } = await supabase.auth.setSession(loginData.session);
                if (setSessionError) {
                    return false;
                }
            } else {
                // Re-fetch session from Supabase client to ensure auth state is in sync locally as fallback
                const { error } = await supabase.auth.getSession();
                if (error) {
                    return false;
                }
            }

            // 3. Persist standard & backwards-compatible local storage
            localStorage.setItem('mile_auth', 'true');
            localStorage.setItem('mile_profile', selectedProfile);
            setProfile(selectedProfile);
            setIsAuthenticated(true);
            return true;
        } catch (err) {
            return false;
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            // 1. Instant check localStorage for immediate UI paint and zero-latency load
            const savedProfile = typeof window !== 'undefined' ? localStorage.getItem('mile_profile') as Profile : null;
            const authStatus = typeof window !== 'undefined' ? localStorage.getItem('mile_auth') : null;
            if (authStatus === 'true' && (savedProfile === 'el' || savedProfile === 'ella')) {
                setProfile(savedProfile);
                setIsAuthenticated(true);
            }

            try {
                // 2. Query Supabase Auth for backend session verification
                const { data: { session } } = await supabase.auth.getSession();
                const email = session?.user?.email;
                const allowedEmailsStr = process.env.NEXT_PUBLIC_ALLOWED_EMAILS || 'el@mile.app,ella@mile.app';
                const allowedEmails = allowedEmailsStr.split(',').map(e => e.trim().toLowerCase());

                if (email && allowedEmails.includes(email.toLowerCase())) {
                    const matchedProfile = email ? (email.split('@')[0] as Profile) : 'el';
                    setProfile(matchedProfile);
                    setIsAuthenticated(true);

                    // Sync backend cookie silently using access token
                    if (session?.access_token) {
                        fetch('/api/auth/sync', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${session.access_token}`
                            }
                        }).catch(() => {});
                    }
                } else if (authStatus === 'true' && (savedProfile === 'el' || savedProfile === 'ella')) {
                    // No backend session exists but we have local session, auto-login silently
                    await login(savedProfile);
                }
            } catch (err) {
                // Ensure we don't break local auth state if backend check throws
                if (authStatus === 'true' && (savedProfile === 'el' || savedProfile === 'ella')) {
                    setProfile(savedProfile);
                    setIsAuthenticated(true);
                }
            }
        };

        checkSession();
    }, []);

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
        }
        try {
            await fetch('/api/logout', { method: 'POST' });
        } catch (err) {
        }
        localStorage.removeItem('mile_auth');
        localStorage.removeItem('mile_profile');
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
