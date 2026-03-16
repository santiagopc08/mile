'use client';

import { useProfile } from '@/context/ProfileContext';
import { NotificationBell } from './NotificationBell';
import { User, LogOut, Home, History, Music, LayoutDashboard, Settings } from 'lucide-react';
import Link from 'next/link';

export function NavBar() {
    const { profile, logout, isAuthenticated } = useProfile();

    if (!isAuthenticated || !profile) return null;

    const navLinks = [
        { name: 'Inicio', href: '/#hero', icon: Home },
        { name: 'Historia', href: '/#timeline', icon: History },
        { name: 'Progreso', href: '/#dashboard', icon: LayoutDashboard },
        { name: 'Música', href: '/#audio', icon: Music },
    ];

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-5xl">
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/50 dark:border-stone-800/50 rounded-2xl px-4 py-2 flex items-center justify-between shadow-lg shadow-stone-200/20 dark:shadow-none">

                {/* Logo / Brand */}
                <Link href="/" className="flex items-center gap-2 px-2 group">
                    <div className="w-8 h-8 bg-earth-base rounded-lg flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                        <span className="font-serif font-bold italic">M</span>
                    </div>
                    <span className="text-stone-800 dark:text-stone-200 font-light tracking-widest text-xs uppercase hidden sm:block">Nuestro Refugio</span>
                </Link>

                {/* Main Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-stone-500 hover:text-earth-dark hover:bg-stone-100 dark:hover:bg-stone-800 transition-all text-sm font-light"
                        >
                            <link.icon className="w-4 h-4" />
                            {link.name}
                        </Link>
                    ))}
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-stone-500 hover:text-earth-dark hover:bg-stone-100 dark:hover:bg-stone-800 transition-all text-sm font-light"
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
                                {profile === 'el' ? 'El' : 'Ella'}
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
