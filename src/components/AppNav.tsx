'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShieldCheck, Gamepad2, MapPin, Heart, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { NotificationBell } from './NotificationBell';
import { SystemSettings } from './SystemSettings';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function AppNav() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const isOnline = useOnlineStatus();
  const profileAccent = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const profileName = profile === 'ella' ? 'Mile' : 'Santi';

  const navItems = [
    { name: 'Ritmo', detail: 'Tareas y dinero', path: '/dashboard', icon: LayoutDashboard, accent: profileAccent },
    { name: 'Refugio', detail: 'Nuestro centro', path: '/refugio', icon: ShieldCheck, accent: profileAccent },
    { name: 'Planes', detail: 'Antojos y salidas', path: '/planes', icon: MapPin, accent: profileAccent },
    { name: 'Cuidado', detail: 'Salud y hábitos', path: '/salud', icon: Heart, accent: profileAccent },
    { name: 'Juego', detail: 'Memoria compartida', path: '/juego', icon: Gamepad2, accent: profileAccent },
  ];

  return (
    <>
      <div suppressHydrationWarning className="h-16 lg:h-0 bg-[#120d0e]/60 backdrop-blur-md border-b border-white/5 lg:border-none" aria-hidden="true" />

      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 w-full h-16 bg-[#120d0e]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 sm:px-6 lg:hidden z-40">
        <Link
          href="/"
          className="nav-brand group relative overflow-hidden font-mono text-[10px] sm:text-xs font-black tracking-[0.22em] border border-white/15 px-3 py-2 bg-black/60 text-[#a88a7e] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ '--nav-accent': profileAccent, borderColor: `color-mix(in srgb, ${profileAccent} 35%, transparent)`, color: profileAccent } as CSSProperties}
          aria-label="Volver al inicio"
        >
          <span className="relative z-10">MILE / SANTI</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <SystemSettings align="right" />
          <NotificationBell align="right" />
          <div className="flex items-center gap-2" aria-label={isOnline ? 'Conexión activa' : 'Sin conexión'}>
            <div className={`nav-status-dot w-1.5 h-1.5 ${isOnline ? '' : 'nav-status-dot-offline'}`} style={{ '--nav-accent': isOnline ? profileAccent : '#ef4444' } as CSSProperties} />
            <span className="hidden sm:inline text-[7px] font-mono uppercase tracking-[0.22em] text-[#a88a7e] opacity-80">{isOnline ? 'Activo' : 'Offline'}</span>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 w-full z-50 grid grid-cols-5 h-[4.6rem] bg-[#120d0e]/96 backdrop-blur-xl border-t border-white/10 lg:hidden"
        aria-label="Navegación principal"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          const itemAccent = item.accent;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-mobile-item group relative flex flex-col items-center justify-center gap-1.5 px-1 pt-2 pb-1.5 text-[#a88a7e] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60 ${isActive ? 'is-active text-white' : 'opacity-70 hover:opacity-100 hover:bg-white/[0.04]'}`}
              style={{ '--nav-accent': itemAccent } as CSSProperties}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${item.name}: ${item.detail}`}
            >
              <span className="nav-mobile-signal" aria-hidden="true" />
              <span className="relative flex h-7 w-7 items-center justify-center">
                <span className="nav-icon-pulse" aria-hidden="true" />
                <Icon className="relative h-5 w-5 stroke-[1.6] transition-transform duration-300 group-hover:-translate-y-0.5" />
              </span>
              <span className="max-w-full truncate font-mono text-[8px] uppercase font-bold tracking-[0.12em] leading-none">{item.name}</span>
              <span className="hidden sm:block max-w-full truncate text-[7px] uppercase tracking-[0.12em] leading-none text-[#e1bfb2]/50">{item.detail}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-20 border-r border-white/10 bg-[#120d0e]/96 backdrop-blur-xl z-40 items-center py-8 gap-5"
        style={{ '--nav-accent': profileAccent } as CSSProperties}
        aria-label="Navegación principal"
      >
        <Link
          href="/"
          className="nav-brand group relative mb-2 flex h-11 w-11 items-center justify-center overflow-hidden border border-white/20 bg-black/50 font-mono text-xs font-black tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ color: profileAccent }}
          aria-label={`Inicio de ${profileName}`}
        >
          <Sparkles className="relative z-10 h-4 w-4 stroke-[1.5]" />
          <span className="sr-only">Inicio</span>
        </Link>
        <SystemSettings align="left" />
        <NotificationBell align="left" />
        
        <div className="flex w-full flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            const itemAccent = item.accent;

            return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-desktop-item group relative flex h-14 w-full items-center justify-center text-[#a88a7e] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60 ${isActive ? 'is-active text-white bg-white/[0.06]' : 'hover:bg-white/[0.04] hover:text-white'}`}
              style={{ '--nav-accent': itemAccent } as CSSProperties}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${item.name}: ${item.detail}`}
            >
              <span className="nav-desktop-signal" aria-hidden="true" />
              <span className="relative flex h-9 w-9 items-center justify-center">
                <span className="nav-icon-pulse" aria-hidden="true" />
                <Icon className="relative h-6 w-6 stroke-[1.5] transition-transform duration-300 group-hover:scale-110" />
              </span>
              <span className="pointer-events-none absolute left-[4.6rem] top-1/2 z-50 min-w-44 -translate-y-1/2 border border-white/10 bg-[#0a0a0a]/95 px-3 py-2 text-left opacity-0 shadow-2xl shadow-black/40 backdrop-blur-md transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:translate-x-1 group-focus-visible:opacity-100">
                <span className="block font-mono text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: itemAccent }}>{item.name}</span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-[#e1bfb2]/65">{item.detail}</span>
              </span>
            </Link>
            );
          })}
        </div>

        {/* Connection Status indicator at bottom of sidebar */}
        <div className="mt-auto flex flex-col items-center gap-2 text-center" aria-label={isOnline ? 'Conexión activa' : 'Sin conexión'}>
          <div className={`nav-status-dot h-2 w-2 ${isOnline ? '' : 'nav-status-dot-offline'}`} style={{ '--nav-accent': isOnline ? profileAccent : '#ef4444' } as CSSProperties} />
          <span className="text-[6.5px] font-mono tracking-[0.18em] opacity-70 uppercase">{isOnline ? 'Activo' : 'Offline'}</span>
        </div>
      </aside>
    </>
  );
}
