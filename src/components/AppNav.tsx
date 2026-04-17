'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageCircleHeart, Gamepad2, Mic, Clock, Music } from 'lucide-react';

export function AppNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Inicio', path: '/', icon: LayoutDashboard },
    { name: 'Notas', path: '/tarro', icon: MessageCircleHeart },
    { name: 'Escucha', path: '/escucha', icon: Mic },
    { name: 'Mahjong', path: '/juego', icon: Gamepad2 },
    { name: 'Historia', path: '/historia', icon: Clock },
    { name: 'Música', path: '/audio', icon: Music },
  ];

  return (
    <>
      <div suppressHydrationWarning className="h-20 lg:h-0" aria-hidden="true" /> {/* Spacer for bottom nav on mobile */}

      {/* Bottom Nav for Mobile / Side Nav for Desktop */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-200 dark:border-stone-800 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] lg:top-0 lg:left-0 lg:bottom-0 lg:right-auto lg:w-20 lg:border-t-0 lg:border-r lg:flex lg:flex-col lg:items-center lg:py-6">
        <ul className="flex items-center justify-around w-full h-16 px-2 lg:flex-col lg:justify-start lg:h-full lg:gap-4 lg:w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path} className="lg:w-full lg:flex lg:justify-center">
                <Link
                  href={item.path}
                  className={`relative flex flex-col items-center justify-center w-full h-full p-2 group transition-colors ${isActive ? 'text-earth-base' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                    }`}
                >
                  <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-earth-100/50 dark:bg-earth-900/20 scale-110' : 'group-hover:scale-105 group-hover:bg-stone-50 dark:group-hover:bg-stone-800'
                    }`}>
                    <Icon className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <span className={`text-[10px] font-medium mt-1 tracking-wide transition-all ${isActive ? 'opacity-100 font-semibold' : 'opacity-70 group-hover:opacity-100'
                    }`}>
                    {item.name}
                  </span>

                  {isActive && (
                    <span className="absolute top-0 w-8 h-1 bg-earth-base rounded-b-full lg:top-auto lg:bottom-0 lg:left-0 lg:h-8 lg:w-1 lg:rounded-r-full lg:rounded-b-none" />
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
