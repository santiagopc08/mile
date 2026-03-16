'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Profile = 'el' | 'ella' | null;

interface ProfileContextType {
    profile: Profile;
    login: (selectedProfile: 'el' | 'ella') => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<Profile>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const savedProfile = sessionStorage.getItem('mile_profile') as Profile;
        const authStatus = sessionStorage.getItem('mile_auth');

        if (authStatus === 'true' && savedProfile) {
            setProfile(savedProfile);
            setIsAuthenticated(true);
        }
    }, []);

    const login = (selectedProfile: 'el' | 'ella') => {
        sessionStorage.setItem('mile_auth', 'true');
        sessionStorage.setItem('mile_profile', selectedProfile);
        setProfile(selectedProfile);
        setIsAuthenticated(true);
    };

    const logout = () => {
        sessionStorage.removeItem('mile_auth');
        sessionStorage.removeItem('mile_profile');
        setProfile(null);
        setIsAuthenticated(true);
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
