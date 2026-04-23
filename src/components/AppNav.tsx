'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShieldCheck, Gamepad2, MapPin, Clock } from 'lucide-react';

export function AppNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Productividad', path: '/', icon: LayoutDashboard },
    { name: 'Refugio', path: '/refugio', icon: ShieldCheck },
    { name: 'Planes', path: '/planes', icon: MapPin },
    { name: 'Mahjong', path: '/juego', icon: Gamepad2 },
    { name: 'Historia', path: '/historia', icon: Clock },
  ];

  return (
    <>
      <div suppressHydrationWarning className="h-20 lg:h-0" aria-hidden="true" />

      {/* Geometric Side Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-xl border-t border-stone-200 dark:border-stone-800 lg:top-0 lg:left-0 lg:bottom-0 lg:right-auto lg:w-20 lg:border-t-0 lg:border-r lg:flex lg:flex-col lg:items-center lg:py-8 bg-grid-mosaic">
        <ul className="flex items-center justify-around w-full h-16 px-4 lg:flex-col lg:justify-start lg:h-full lg:gap-8 lg:w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path} className="lg:w-full lg:flex lg:justify-center">
                <Link
                  href={item.path}
                  className={`relative flex flex-col items-center justify-center w-full h-full p-2 group transition-all ${
                    isActive ? 'text-geometric-accent' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-100'
                  }`}
                >
                  <div className={`relative p-2 rounded-none border transition-all duration-300 ${
                    isActive 
                      ? 'border-geometric-accent bg-geometric-accent/5' 
                      : 'border-transparent group-hover:border-stone-300 dark:group-hover:border-stone-700'
                  }`}>
                    <Icon className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className={`text-[7px] md:text-[9px] uppercase font-bold mt-2 tracking-[0.1em] transition-all text-center ${
                    isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-100 font-normal'
                  }`}>
                    {item.name}
                  </span>

                  {isActive && (
                    <span className="absolute bottom-0 w-8 h-0.5 bg-geometric-accent lg:bottom-auto lg:left-0 lg:h-12 lg:w-0.5" />
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
