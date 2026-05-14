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
    { name: 'Ops', detail: 'Tareas', path: '/', icon: LayoutDashboard, accent: profileAccent },
    { name: 'Refugio', detail: 'Vínculo', path: '/refugio', icon: ShieldCheck, accent: profileAccent },
    { name: 'Planes', detail: 'Deseos', path: '/planes', icon: MapPin, accent: profileAccent },
    { name: 'Salud', detail: 'Vital', path: '/salud', icon: Heart, accent: profileAccent },
    { name: 'Juego', detail: 'Mahjong', path: '/juego', icon: Gamepad2, accent: profileAccent },
  ];

  return (
    <>
      <div suppressHydrationWarning className="h-[76px] lg:h-0" aria-hidden="true" />

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 bg-mosaic shadow-[0_-18px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:bottom-0 lg:left-0 lg:right-auto lg:top-0 lg:flex lg:w-20 lg:flex-col lg:items-center lg:border-r lg:border-t-0 lg:py-8">
        <div className="hidden w-full border-b border-white/10 pb-6 lg:flex lg:justify-center">
          <div 
            className="grid h-8 w-8 place-items-center border text-[10px] font-black uppercase tracking-normal"
            style={{ borderColor: `${profileAccent}66`, color: profileAccent }}
          >
            M
          </div>
        </div>
        <ul className="grid h-[72px] w-full grid-cols-5 px-1 lg:flex lg:h-full lg:w-full lg:flex-col lg:justify-start lg:gap-6 lg:px-0 lg:pt-8">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            const itemAccent = item.accent;

            return (
              <li key={item.path} className="lg:w-full lg:flex lg:justify-center">
                <Link
                  href={item.path}
                  className={`group relative flex h-full w-full flex-col items-center justify-center gap-1 px-1 py-2 transition-all ${
                    isActive ? '' : 'text-[#a88a7e] hover:text-white'
                  }`}
                  style={{ color: isActive ? itemAccent : undefined }}
                  aria-label={`${item.name}: ${item.detail}`}
                >
                  <div 
                    className={`relative grid h-9 w-9 place-items-center border transition-all duration-300 lg:h-10 lg:w-10 ${
                      isActive 
                        ? 'bg-white/5' 
                        : 'border-transparent group-hover:border-white/20 group-hover:bg-white/5'
                    }`}
                    style={{ 
                      borderColor: isActive ? itemAccent : undefined,
                      boxShadow: isActive ? `0 0 18px ${itemAccent}2e` : undefined
                    }}
                  >
                    <Icon className="h-[18px] w-[18px] stroke-[1.5] lg:h-5 lg:w-5" />
                  </div>
                  <span className={`text-center text-[8px] font-black uppercase tracking-[0.08em] transition-all lg:text-[8px] ${
                    isActive ? 'opacity-100' : 'opacity-55 group-hover:opacity-100'
                  }`}>
                    {item.name}
                  </span>
                  <span className={`hidden text-center text-[6px] font-bold uppercase tracking-[0.12em] text-white/35 transition-all sm:block lg:hidden ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                    {item.detail}
                  </span>

                  {isActive && (
                    <span 
                      className="absolute bottom-0 h-0.5 w-8 lg:bottom-auto lg:left-0 lg:h-12 lg:w-0.5" 
                      style={{ backgroundColor: itemAccent }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
