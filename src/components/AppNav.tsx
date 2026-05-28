'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShieldCheck, Gamepad2, MapPin, Heart } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';

export function AppNav() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const profileAccent = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';

  const navItems = [
    { name: 'Día a Día', detail: 'Tareas', path: '/', icon: LayoutDashboard, accent: profileAccent },
    { name: 'Refugio', detail: 'Nosotros', path: '/refugio', icon: ShieldCheck, accent: profileAccent },
    { name: 'Antojos', detail: 'Deseos', path: '/planes', icon: MapPin, accent: profileAccent },
    { name: 'Salud', detail: 'Bienestar', path: '/salud', icon: Heart, accent: profileAccent },
    { name: 'Juego', detail: 'Memoria', path: '/juego', icon: Gamepad2, accent: profileAccent },
  ];

  return (
    <>
      <div suppressHydrationWarning className="h-16 lg:h-0" aria-hidden="true" />

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-[#120d0e] border-t border-white/10 lg:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          const itemAccent = item.accent;

          if (isActive) {
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex flex-col items-center justify-center pt-1 w-full h-full border-t-2"
                style={{ 
                  borderColor: itemAccent, 
                  color: itemAccent,
                  boxShadow: `inset 0 2px 5px -2px ${itemAccent}` 
                }}
                aria-label={`${item.name}: ${item.detail}`}
              >
                <Icon className="h-5 w-5 mb-1 stroke-[1.5]" />
                <span className="font-mono text-[8px] uppercase font-bold tracking-widest">{item.name}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex flex-col items-center justify-center p-2 w-full h-full text-[#a88a7e] opacity-60 hover:opacity-100 hover:bg-white/5 transition-all"
              style={{ '--tw-hover-text-color': itemAccent } as any}
              aria-label={`${item.name}: ${item.detail}`}
            >
              <Icon className="h-5 w-5 mb-1 stroke-[1.5]" />
              <span className="font-mono text-[8px] uppercase tracking-widest opacity-0">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Sidebar (Placeholder structure as per design) */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-20 border-r border-white/10 bg-[#120d0e] z-40 items-center py-10 gap-8">
        <div className="font-mono text-sm font-bold tracking-widest border border-white/20 p-2" style={{ color: profileAccent }}>OC</div>
        
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          const itemAccent = item.accent;

          if (isActive) {
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex justify-center items-center p-2 w-full border-l-2 bg-white/5"
                style={{ 
                  borderColor: itemAccent, 
                  color: itemAccent,
                  boxShadow: `inset 2px 0 5px -2px ${itemAccent}` 
                }}
                aria-label={`${item.name}: ${item.detail}`}
              >
                <Icon className="h-6 w-6 stroke-[1.5]" />
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex justify-center items-center p-2 w-full text-[#a88a7e] hover:bg-white/5 transition-all hover:text-white"
              aria-label={`${item.name}: ${item.detail}`}
            >
              <Icon className="h-6 w-6 stroke-[1.5]" />
            </Link>
          );
        })}
      </aside>
    </>
  );
}
