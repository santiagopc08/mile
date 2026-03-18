'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { NotificationBell } from './NotificationBell';
import { User, LogOut, Home, History, Music, LayoutDashboard, Settings, Heart } from 'lucide-react';
import Link from 'next/link';

export function NavBar() {
    const { profile, logout, isAuthenticated } = useProfile();
    const [activeSection, setActiveSection] = useState('hero');

    useEffect(() => {
        const handleScroll = () => {
            const sections = ['hero', 'dashboard', 'notes', 'timeline', 'audio'];
            let current = 'hero';

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // If the section is currently in the middle of the viewport
                    if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.4) {
                        current = section;
                    }
                }
            }
            setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isAuthenticated || !profile) return null;

    const navLinks = [
        { name: 'Inicio', id: 'hero', href: '#hero', icon: Home },
        { name: 'Progreso', id: 'dashboard', href: '#dashboard', icon: LayoutDashboard },
        { name: 'Tarro', id: 'notes', href: '#notes', icon: Heart },
        { name: 'Historia', id: 'timeline', href: '#timeline', icon: History },
        { name: 'Música', id: 'audio', href: '#audio', icon: Music },
    ];

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-5xl">
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/50 dark:border-stone-800/50 rounded-2xl px-4 py-2 flex items-center justify-between shadow-lg shadow-stone-200/20 dark:shadow-none">

                {/* Logo / Brand */}
                <Link href="/" className="flex items-center gap-2 px-2 group">
                    <div className="w-8 h-8 bg-earth-base rounded-lg flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                        <span className="font-serif font-bold italic"> M.S </span>
                    </div>
                    <span className="text-stone-800 dark:text-stone-200 font-light tracking-widest text-xs uppercase hidden sm:block">Nuestro Espacio</span>
                </Link>

                {/* Main Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const isActive = activeSection === link.id;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium ${isActive
                                        ? 'text-earth-dark bg-stone-100 dark:bg-stone-800 scale-105 shadow-sm font-medium'
                                        : 'text-stone-500 font-light hover:text-earth-dark hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:scale-105'
                                    }`}
                            >
                                <link.icon className="w-4 h-4" />
                                {link.name}
                            </Link>
                        );
                    })}
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-stone-500 hover:text-earth-dark hover:bg-stone-100 dark:hover:bg-stone-800 transition-all text-sm font-light hover:scale-105"
                    >
                        <Settings className="w-4 h-4" />
                        Admin
                    </Link>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <NotificationBell />

                    <div className="h-6 w-px bg-stone-200 dark:bg-stone-800 mx-2" />

                    <div className="flex items-center gap-3 pl-2">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Sesión</span>
                            <span className={`text-xs font-medium ${profile === 'ella' ? 'text-rose-600' : 'text-amber-600'}`}>
                                {profile === 'el' ? 'Santiago' : 'Mile'}
                            </span>
                        </div>
                        <div className={`p-2 rounded-full border ${profile === 'ella' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-amber-50 border-amber-100 text-amber-500'}`}>
                            <User className="w-4 h-4" />
                        </div>
                        <button
                            onClick={logout}
                            title="Cerrar Sesión"
                            className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
