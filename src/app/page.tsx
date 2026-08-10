'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { useProfile } from "@/context/ProfileContext";
import { useStore } from "@/context/StoreContext";
import Link from 'next/link';
import { useMemo } from 'react';
import {
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Heart,
  Gamepad2,
  ArrowRight,
  Sparkles,
  Compass,
  Activity,
  CheckSquare,
  PlusCircle,
  FileText,
  HeartPulse,
  Flame,
  Shield,
  PawPrint,
  Clock
} from 'lucide-react';
import { BrutalistPanel } from "@/components/ui/BrutalistPanel";
import { ChamferedPanel } from "@/components/ui/ChamferedPanel";
import { AmbientField } from "@/components/AmbientField";
import { DecoRule, DataStrip, TickScale, ContourLines, RadialBurst, WireSolid } from "@/components/deco";

export default function Home() {
  const { profile } = useProfile();
  const { data } = useStore();

  // Active theme accent styling variables
  const accentColorValue = profile === 'ella' ? '#ff4b89' : '#c3f400';

  // Compute live statistics for custom indicators
  const tasks = useMemo(() => data?.tasks || [], [data?.tasks]);
  // ⚡ Bolt Optimization: Replace multiple .filter() calls with a single O(N) pass, directly counting tasks to avoid array allocation
  const pendingAssigneeTasksCount = useMemo(() => {
    let count = 0;
    for (const t of tasks) {
      if (t.status !== 'done' && t.status !== 'skipped' && (!t.assignee || t.assignee === profile)) {
        count++;
      }
    }
    return count;
  }, [tasks, profile]);

  const wishlist = useMemo(() => data?.wishlist || [], [data?.wishlist]);
  const activePlansCount = wishlist.length;
  const showBdayBanner = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URL(window.location.href).searchParams;
    const isTest = params.has('test') || params.has('cumple');
    const today = new Date();
    const isBdayDate = today.getMonth() === 5 && today.getDate() === 17;
    return isTest || (profile === 'ella' && isBdayDate);
  }, [profile]);

  const reflections = useMemo(() => data?.persistentListening || [], [data?.persistentListening]);
  const reflectionsCount = reflections.length;

  // Personalized conversational greeting based on current local hour
  const greetingTitle = useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = '¡Buenas noches';
    if (hour < 12) timeGreeting = '¡Buenos días';
    else if (hour < 18) timeGreeting = '¡Buenas tardes';

    if (profile === 'ella') return `${timeGreeting}, Mile! ✨`;
    if (profile === 'el') return `${timeGreeting}, Santi! ⚡`;
    return '¡Hola!';
  }, [profile]);

  const greetingSubtitle = useMemo(() => {
    if (profile === 'ella') {
      return `Qué lindo tenerte aquí. Todo listo para compartir hoy con Santi.`;
    }
    if (profile === 'el') {
      return `Qué lindo tenerte aquí. Todo listo para compartir hoy con Mile.`;
    }
    return 'Seleccione el módulo operativo para esta sesión.';
  }, [profile]);

  return (
    <PrivateRoute>
      <AmbientField preset="home" profile={profile} />

      <main
        className="w-full min-h-screen flex flex-col items-center justify-start py-4 sm:py-8 md:py-12 px-2 sm:px-6 relative z-10 text-[#e5e2e1] overflow-y-auto"
        style={{ '--color-profile-accent': accentColorValue } as React.CSSProperties}
      >
        {/* Main Terminal Container */}
        <BrutalistPanel accentColor={accentColorValue} borderColor="rgba(255,255,255,0.12)" corners="animated" cornerSize={16} cornerThickness={1.5} className="w-full max-w-4xl !bg-white/[0.035] !backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] mb-6 sm:mb-12">

          {/* Birthday Surprise Banner */}
          {showBdayBanner && (
            <div className="border-b border-[#ff4b89] bg-[#ff4b89]/15 backdrop-blur-md p-4 font-mono text-xs text-center flex flex-col sm:flex-row items-center justify-between gap-3 relative z-30">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="text-[#ff4b89] animate-pulse">💝</span>
                <span>¡HOY ES UN DÍA MUY ESPECIAL: CUMPLEAÑOS DE MILE!</span>
              </div>
              <Link 
                href="/cumple" 
                className="!min-h-0 border border-[#ff4b89] bg-[#ff4b89]/25 hover:bg-[#ff4b89] hover:text-black backdrop-blur-md transition-all px-4 py-1.5 text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5"
              >
                <span>Descubrir Sorpresa 🎁</span>
                <ArrowRight size={10} className="animate-slide-loop" />
              </Link>
            </div>
          )}

          {/* Header Section */}
          <div className="stagger-item border-b border-white/10 p-4 sm:p-8 lg:p-10 relative overflow-hidden flex flex-col justify-between gap-4 group" style={{ '--i': 0 } as React.CSSProperties}>
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}
            />
            {/* Animated HUD Corner Brackets */}
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 pointer-events-none transition-all duration-300 group-hover:scale-110" style={{ borderColor: accentColorValue }} />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 pointer-events-none transition-all duration-300 group-hover:scale-110" style={{ borderColor: accentColorValue }} />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 pointer-events-none transition-all duration-300 group-hover:scale-110" style={{ borderColor: accentColorValue }} />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 pointer-events-none transition-all duration-300 group-hover:scale-110" style={{ borderColor: accentColorValue }} />
            
            <div className="space-y-3 relative z-10">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-2 py-0.5 border border-white/10 bg-black/40 backdrop-blur-md shrink-0">
                  <span className="font-mono text-xs animate-spin-slow inline-block" style={{ color: accentColorValue }}>◆</span>
                  <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: accentColorValue }}>
                    LOC // SYNC
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: accentColorValue }} />
                </div>
                <h1 className="text-xl sm:text-3xl md:text-4xl font-mono font-bold uppercase tracking-tight text-white leading-none">
                  {greetingTitle}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="h-[2px] w-16 sm:w-24 transition-all duration-700 animate-pulse shadow-[0_0_12px_var(--color-profile-accent)]" 
                  style={{ backgroundColor: accentColorValue }} 
                />
                <div className="h-[1px] w-8 bg-white/20" />
              </div>
              <p className="text-xs sm:text-sm tracking-normal text-[#e1bfb2] font-medium leading-relaxed max-w-xl font-sans">
                {greetingSubtitle}
              </p>
            </div>
          </div>
          {/* Body Section */}
          <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-8 bg-transparent">

            {/* Primary Modules - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Día a Día */}
              <ChamferedPanel
                accentColor={accentColorValue}
                label="DÍA A DÍA · RITMO"
                staggerIndex={1}
                notchSize={20}
                showSideTabs={false}
                className="flex flex-col justify-between gap-4 h-full"
              >
                <div className="flex gap-3 h-full">
                  <div
                    className="relative flex w-12 shrink-0 flex-col items-center justify-between border py-3"
                    style={{ backgroundColor: `${accentColorValue}12`, borderColor: `${accentColorValue}40` }}
                  >
                    <span className="shrink-0" style={{ color: accentColorValue }}>
                      <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                    </span>
                    <span
                      className="font-mono text-[8px] font-black uppercase tracking-[0.3em] [writing-mode:vertical-rl] rotate-180"
                      style={{ color: accentColorValue }}
                    >
                      Ritmo
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link href="/dashboard" className="inline-block">
                        <h2 className="text-lg sm:text-xl font-black uppercase transition-colors hover:text-[var(--color-profile-accent)]">Día a Día</h2>
                      </Link>
                      <div className="inline-flex items-center gap-1.5 bg-black/60 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/10 shrink-0">
                        <CheckSquare size={10} style={{ color: accentColorValue }} />
                        <span>{pendingAssigneeTasksCount} Tareas Pendientes</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Link href="/dashboard?tab=tasks" className="touch-target flex items-center justify-between border-b border-white/10 py-1.5 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-[#a88a7e] shrink-0" />
                          Mis tareas
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                      <Link href="/dashboard?tab=finances" className="touch-target flex items-center justify-between py-1.5 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <PlusCircle className="w-3.5 h-3.5 text-[#a88a7e] shrink-0" />
                          Registrar Gastos
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                    </div>

                    <div className="pt-1">
                      <TickScale length={160} ticks={16} color={accentColorValue} />
                    </div>
                  </div>
                </div>
              </ChamferedPanel>

              {/* Antojos */}
              <ChamferedPanel
                accentColor={accentColorValue}
                label="PLANES · ANTOJOS"
                staggerIndex={2}
                notchSize={20}
                showSideTabs={false}
                className="flex flex-col justify-between gap-4 h-full"
              >
                <div className="flex gap-3 h-full">
                  <div
                    className="relative flex w-12 shrink-0 flex-col items-center justify-between border py-3"
                    style={{ backgroundColor: `${accentColorValue}12`, borderColor: `${accentColorValue}40` }}
                  >
                    <span className="shrink-0" style={{ color: accentColorValue }}>
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                    </span>
                    <span
                      className="font-mono text-[8px] font-black uppercase tracking-[0.3em] [writing-mode:vertical-rl] rotate-180"
                      style={{ color: accentColorValue }}
                    >
                      Antojos
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link href="/planes" className="inline-block">
                        <h2 className="text-lg sm:text-xl font-black uppercase transition-colors hover:text-[var(--color-profile-accent)]">Antojos</h2>
                      </Link>
                      <div className="inline-flex items-center gap-1.5 bg-black/60 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/10 shrink-0">
                        <Compass size={10} style={{ color: accentColorValue }} />
                        <span>{activePlansCount} Planes Guardados</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Link href="/planes?scroll=wishlist" className="touch-target flex items-center justify-between border-b border-white/10 py-1.5 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-[#a88a7e] shrink-0" />
                          Ver planes
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                      <Link href="/planes?action=add" className="touch-target flex items-center justify-between py-1.5 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <PlusCircle className="w-3.5 h-3.5 text-[#a88a7e] shrink-0" />
                          Agregar plan
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                    </div>

                    <div className="pt-1">
                      <ContourLines width={160} height={22} lines={3} color={accentColorValue} />
                    </div>
                  </div>
                </div>
              </ChamferedPanel>
            </div>

            {/* Secondary Modules Header */}
            <div className="stagger-item flex items-center gap-3 py-2" style={{ '--i': 3 } as React.CSSProperties}>
              <DecoRule className="flex-1" color={accentColorValue} />
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs animate-pulse" style={{ color: accentColorValue }}>◈</span>
                <span className="text-[10px] font-mono uppercase font-black tracking-[0.25em]" style={{ color: accentColorValue }}>MÓDULOS DE SINTONÍA</span>
              </div>
              <DecoRule className="flex-1 scale-x-[-1]" color={accentColorValue} />
            </div>

            {/* Secondary Modules - 3 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Refugio */}
              <ChamferedPanel
                accentColor={accentColorValue}
                label="REFUGIO · BITÁCORA"
                staggerIndex={4}
                notchSize={16}
                showSideTabs={false}
                className="flex flex-col justify-between gap-4 h-full"
              >
                <div className="flex gap-3 h-full">
                  <div
                    className="relative flex w-11 shrink-0 flex-col items-center justify-between border py-3"
                    style={{ backgroundColor: `${accentColorValue}12`, borderColor: `${accentColorValue}40` }}
                  >
                    <span className="shrink-0" style={{ color: accentColorValue }}>
                      <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <span
                      className="font-mono text-[8px] font-black uppercase tracking-[0.3em] [writing-mode:vertical-rl] rotate-180"
                      style={{ color: accentColorValue }}
                    >
                      Refugio
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link href="/refugio">
                        <h3 className="text-sm sm:text-base font-black uppercase transition-colors hover:text-[var(--color-profile-accent)]">Refugio</h3>
                      </Link>
                      <div className="inline-flex items-center gap-1 bg-black/60 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/10 shrink-0">
                        <FileText size={8} style={{ color: accentColorValue }} />
                        <span>{reflectionsCount} R</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Link href="/refugio?tab=escucha" className="touch-target flex items-center justify-between border-b border-white/10 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-[#a88a7e] shrink-0" />
                          Bitácora
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                      <Link href="/refugio?tab=bebes" className="touch-target flex items-center justify-between border-b border-white/10 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <PawPrint className="w-3 h-3 text-[#a88a7e] shrink-0" />
                          Bebés
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                      <Link href="/refugio?tab=historia" className="touch-target flex items-center justify-between py-1.5 text-[9px] font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#a88a7e] shrink-0" />
                          Historia
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                    </div>

                    <div className="pt-1">
                      <DataStrip bars={28} height={14} color={accentColorValue} seed={11} />
                    </div>
                  </div>
                </div>
              </ChamferedPanel>

              {/* Salud */}
              <ChamferedPanel
                accentColor={accentColorValue}
                label="SALUD · VITALES"
                staggerIndex={5}
                notchSize={16}
                showSideTabs={false}
                className="flex flex-col justify-between gap-4 h-full"
              >
                <div className="flex gap-3 h-full">
                  <div
                    className="relative flex w-11 shrink-0 flex-col items-center justify-between border py-3"
                    style={{ backgroundColor: `${accentColorValue}12`, borderColor: `${accentColorValue}40` }}
                  >
                    <span className="shrink-0" style={{ color: accentColorValue }}>
                      <Heart className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <span
                      className="font-mono text-[8px] font-black uppercase tracking-[0.3em] [writing-mode:vertical-rl] rotate-180"
                      style={{ color: accentColorValue }}
                    >
                      Salud
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link href="/salud">
                        <h3 className="text-sm sm:text-base font-black uppercase transition-colors hover:text-[var(--color-profile-accent)]">Salud</h3>
                      </Link>
                      <div className="inline-flex items-center gap-1 bg-black/60 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/10 shrink-0">
                        <Activity size={8} style={{ color: accentColorValue }} />
                        <span>Activo</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Link href="/salud?tab=vitals" className="touch-target flex items-center justify-between border-b border-white/10 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <HeartPulse className="w-3 h-3 text-[#a88a7e] shrink-0" />
                          Presión
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                      <Link href="/salud?tab=habits" className="touch-target flex items-center justify-between border-b border-white/10 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-[#a88a7e] shrink-0" />
                          Hábitos
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                      <Link href="/salud?tab=movement" className="touch-target flex items-center justify-between border-b border-white/10 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <Flame className="w-3 h-3 text-[#a88a7e] shrink-0" />
                          Entrenos
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                      <Link href="/salud?tab=biometric" className="touch-target flex items-center justify-between py-1.5 text-[9px] font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-[#a88a7e] shrink-0" />
                          Biometría
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                    </div>

                    <div className="flex justify-end pt-1">
                      <RadialBurst size={28} rays={24} color={accentColorValue} />
                    </div>
                  </div>
                </div>
              </ChamferedPanel>

              {/* Juego */}
              <ChamferedPanel
                accentColor={accentColorValue}
                label="JUEGO · RECUERDOS"
                staggerIndex={6}
                notchSize={16}
                showSideTabs={false}
                className="flex flex-col justify-between gap-4 h-full"
              >
                <div className="flex gap-3 h-full">
                  <div
                    className="relative flex w-11 shrink-0 flex-col items-center justify-between border py-3"
                    style={{ backgroundColor: `${accentColorValue}12`, borderColor: `${accentColorValue}40` }}
                  >
                    <span className="shrink-0" style={{ color: accentColorValue }}>
                      <Gamepad2 className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <span
                      className="font-mono text-[8px] font-black uppercase tracking-[0.3em] [writing-mode:vertical-rl] rotate-180"
                      style={{ color: accentColorValue }}
                    >
                      Juego
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link href="/juego">
                        <h3 className="text-sm sm:text-base font-black uppercase transition-colors hover:text-[var(--color-profile-accent)]">Juego</h3>
                      </Link>
                      <div className="inline-flex items-center gap-1 bg-black/60 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/10 shrink-0">
                        <Sparkles size={8} style={{ color: accentColorValue }} />
                        <span>Récords</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Link href="/juego" className="touch-target flex items-center justify-between border-b border-white/10 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <Gamepad2 className="w-3 h-3 text-[#a88a7e] shrink-0" />
                          Mahjong
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                      <Link href="/smash-fest" className="touch-target flex items-center justify-between py-1.5 text-[9px] font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all">
                        <span className="flex items-center gap-1.5">
                          <Gamepad2 className="w-3 h-3 text-[#a88a7e] shrink-0" />
                          Smash Fest
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                    </div>

                    <div className="flex justify-end pt-1">
                      <WireSolid size={30} color={accentColorValue} />
                    </div>
                  </div>
                </div>
              </ChamferedPanel>
            </div>

          </div>

        </BrutalistPanel>
      </main>
    </PrivateRoute>
  );
}
