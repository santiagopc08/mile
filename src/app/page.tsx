'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { useProfile } from "@/context/ProfileContext";
import Link from 'next/link';
import { LayoutDashboard, MapPin, ShieldCheck, Heart, Gamepad2, ArrowRight } from 'lucide-react';
import { AnimatedBrutalistCorners } from "@/components/ui/AnimatedBrutalistCorners";

export default function Home() {
  const { profile } = useProfile();

  // High-Tech Brutalism styling variables
  const accentColorValue = profile === 'ella' ? '#ff4b89' : '#c3f400';

  return (
    <PrivateRoute>
      <div
        className="fixed inset-0 z-[-1] bg-black overflow-hidden"
        style={{ '--color-profile-accent': accentColorValue } as React.CSSProperties}
      >
        {/* Subtle Geometric Background */}
        <div className="absolute inset-0 bg-mosaic opacity-50" />
      </div>

      <main
        className="w-full min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10 text-[#e5e2e1]"
        style={{ '--color-profile-accent': accentColorValue } as React.CSSProperties}
      >

        {/* Main Terminal Container */}
        <div className="w-full max-w-4xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-sm relative">
          <AnimatedBrutalistCorners color={accentColorValue} />

          {/* Header Section */}
          <div className="border-b border-white/10 p-6 lg:p-8 relative">
             <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: accentColorValue }} />
             <div className="flex items-center justify-between mb-6">
               <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-[#a88a7e] border border-white/10 px-2 py-1 bg-[#121212]">
                 SISTEMA OPERATIVO CENTRAL
               </span>
               <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 bg-user-c animate-pulse shadow-[0_0_5px_var(--color-user-c)]" />
                  <span className="text-[9px] font-mono uppercase tracking-widest opacity-60">EN LÍNEA</span>
               </div>
             </div>
             <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white mb-4">
               Terminal de Acceso
             </h1>
             <p className="text-sm md:text-base tracking-normal text-[#e1bfb2] max-w-2xl">
               Seleccione el módulo operativo requerido para esta sesión. Las funciones se encuentran enlazadas a su perfil actual.
             </p>
          </div>

          {/* Body Section */}
          <div className="p-6 lg:p-8 space-y-8 bg-[#050505]">

            {/* Primary Modules - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/10 border border-white/10 p-[1px]">

               {/* Día a Día */}
               <Link href="/dashboard" className="group relative bg-[#0a0a0a] p-8 flex flex-col gap-6 transition-all duration-300 hover:bg-[#121212]">
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                  <div className="flex justify-between items-start">
                     <div className="p-4 border border-white/10 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors group-hover:shadow-[0_0_15px_var(--color-profile-accent)]" style={{ color: accentColorValue }}>
                        <LayoutDashboard size={32} strokeWidth={1.5} />
                     </div>
                     <span className="text-[10px] font-mono font-bold text-white/30 group-hover:text-white/70 transition-colors border border-white/10 px-2 py-1">MOD-01</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase mb-2 group-hover:text-[var(--color-profile-accent)] transition-colors">Día a Día</h2>
                    <p className="text-xs text-[#a88a7e] font-mono uppercase tracking-widest">Gestión de Tareas y Finanzas</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: accentColorValue }}>
                     <span>Inicializar</span>
                     <ArrowRight size={12} />
                  </div>
               </Link>

               {/* Antojos */}
               <Link href="/planes" className="group relative bg-[#0a0a0a] p-8 flex flex-col gap-6 transition-all duration-300 hover:bg-[#121212]">
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                  <div className="flex justify-between items-start">
                     <div className="p-4 border border-white/10 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors group-hover:shadow-[0_0_15px_var(--color-profile-accent)]" style={{ color: accentColorValue }}>
                        <MapPin size={32} strokeWidth={1.5} />
                     </div>
                     <span className="text-[10px] font-mono font-bold text-white/30 group-hover:text-white/70 transition-colors border border-white/10 px-2 py-1">MOD-02</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase mb-2 group-hover:text-[var(--color-profile-accent)] transition-colors">Antojos</h2>
                    <p className="text-xs text-[#a88a7e] font-mono uppercase tracking-widest">Mapa de Planes y Deseos</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: accentColorValue }}>
                     <span>Explorar</span>
                     <ArrowRight size={12} />
                  </div>
               </Link>
            </div>

            {/* Secondary Modules Header */}
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-[9px] font-mono uppercase font-bold tracking-[0.2em] text-[#a88a7e]">Módulos Secundarios</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            {/* Secondary Modules - 3 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[1px] bg-white/10 border border-white/10 p-[1px]">

               {/* Refugio */}
               <Link href="/refugio" className="group relative bg-[#0a0a0a] p-6 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:bg-[#121212]">
                  <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                  <div className="p-3 border border-white/10 text-white/50 group-hover:text-[var(--color-profile-accent)] group-hover:bg-white/5 transition-colors">
                     <ShieldCheck size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase mb-1">Refugio</h3>
                    <p className="text-[9px] font-mono text-[#a88a7e] uppercase tracking-wider">Espacio Privado</p>
                  </div>
               </Link>

               {/* Salud */}
               <Link href="/salud" className="group relative bg-[#0a0a0a] p-6 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:bg-[#121212]">
                  <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                  <div className="p-3 border border-white/10 text-white/50 group-hover:text-[var(--color-profile-accent)] group-hover:bg-white/5 transition-colors">
                     <Heart size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase mb-1">Salud</h3>
                    <p className="text-[9px] font-mono text-[#a88a7e] uppercase tracking-wider">Bienestar y Progreso</p>
                  </div>
               </Link>

               {/* Juego */}
               <Link href="/juego" className="group relative bg-[#0a0a0a] p-6 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:bg-[#121212]">
                  <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                  <div className="p-3 border border-white/10 text-white/50 group-hover:text-[var(--color-profile-accent)] group-hover:bg-white/5 transition-colors">
                     <Gamepad2 size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase mb-1">Juego</h3>
                    <p className="text-[9px] font-mono text-[#a88a7e] uppercase tracking-wider">Memoria y Recreación</p>
                  </div>
               </Link>
            </div>

          </div>

        </div>
      </main>
    </PrivateRoute>
  );
}
