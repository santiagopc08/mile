'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShieldCheck, Gamepad2, MapPin, Heart } from 'lucide-react';

export function AppNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Productividad', path: '/', icon: LayoutDashboard },
    { name: 'Refugio', path: '/refugio', icon: ShieldCheck },
    { name: 'Planes', path: '/planes', icon: MapPin },
    { name: 'Salud', path: '/salud', icon: Heart },
    { name: 'Mahjong', path: '/juego', icon: Gamepad2 },
  ];

  return (
    <>
      <div suppressHydrationWarning className="h-20 lg:h-0" aria-hidden="true" />

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 bg-mosaic backdrop-blur-xl lg:bottom-0 lg:left-0 lg:right-auto lg:top-0 lg:flex lg:w-20 lg:flex-col lg:items-center lg:border-r lg:border-t-0 lg:py-8">
        <div className="hidden w-full border-b border-white/10 pb-6 lg:flex lg:justify-center">
          <div className="grid h-8 w-8 place-items-center border border-[#ff7020]/60 text-[10px] font-black uppercase tracking-normal text-[#ffb595]">
            M
          </div>
        </div>
        <ul className="flex h-16 w-full items-center justify-around px-3 lg:h-full lg:w-full lg:flex-col lg:justify-start lg:gap-7 lg:px-0 lg:pt-8">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path} className="lg:w-full lg:flex lg:justify-center">
                <Link
                  href={item.path}
                  className={`group relative flex h-full w-full flex-col items-center justify-center p-2 transition-all ${
                    isActive ? 'text-[#ff7020]' : 'text-[#a88a7e] hover:text-white'
                  }`}
                >
                  <div className={`relative border p-2 transition-all duration-300 ${
                    isActive 
                      ? 'border-[#ff7020] bg-[#ff7020]/10 shadow-[0_0_18px_rgba(255,112,32,0.18)]' 
                      : 'border-transparent group-hover:border-white/20 group-hover:bg-white/5'
                  }`}>
                    <Icon className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className={`mt-2 text-center text-[7px] font-bold uppercase tracking-[0.12em] transition-all md:text-[9px] ${
                    isActive ? 'opacity-100' : 'opacity-45 group-hover:opacity-100'
                  }`}>
                    {item.name}
                  </span>

                  {isActive && (
                    <span className="absolute bottom-0 h-0.5 w-8 bg-[#00dbe9] lg:bottom-auto lg:left-0 lg:h-12 lg:w-0.5" />
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
