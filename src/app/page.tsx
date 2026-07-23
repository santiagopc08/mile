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
  Music,
  Activity,
  CheckSquare,
  PlusCircle,
  FileText,
  Calendar,
  HeartPulse,
  Flame,
  Shield,
  PawPrint,
  Clock,
  Camera
} from 'lucide-react';
import { BrutalistPanel } from "@/components/ui/BrutalistPanel";
import { ChamferedPanel } from "@/components/ui/ChamferedPanel";
import { InteractiveBackground } from "@/components/InteractiveBackground";

export default function Home() {
  const { profile } = useProfile();
  const { data } = useStore();

  // Active theme accent styling variables
  const accentColorValue = profile === 'ella' ? '#ff4b89' : '#c3f400';
  const accentHoverBg = profile === 'ella' ? 'rgba(255, 75, 137, 0.15)' : 'rgba(195, 244, 0, 0.15)';

  // Compute live statistics for custom indicators
  const tasks = useMemo(() => (data?.tasks || []) as any[], [data?.tasks]);
  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== 'done' && t.status !== 'skipped'), [tasks]);
  const assigneeTasks = useMemo(() => pendingTasks.filter(t => !t.assignee || t.assignee === profile), [pendingTasks, profile]);

  const wishlist = useMemo(() => (data?.wishlist || []) as any[], [data?.wishlist]);
  const activePlansCount = wishlist.length;

  // ⚡ Bolt Optimization: Prevent O(N) intermediate array allocation when counting saving plans
  const savingPlansCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < wishlist.length; i++) {
      if (wishlist[i].state === 'SAVING') count++;
    }
    return count;
  }, [wishlist]);
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
      <InteractiveBackground preset="home" profile={profile} />

      <main
        className="w-full min-h-screen flex flex-col items-center justify-start py-4 sm:py-8 md:py-12 px-2 sm:px-6 relative z-10 text-[#e5e2e1] overflow-y-auto"
        style={{ '--color-profile-accent': accentColorValue } as React.CSSProperties}
      >
        {/* Main Terminal Container */}
        <BrutalistPanel accentColor={accentColorValue} borderColor="rgba(255,255,255,0.1)" corners="animated" cornerSize={16} cornerThickness={1.5} className="w-full max-w-4xl !bg-[#0a0a0a]/95 backdrop-blur-md mb-6 sm:mb-12">

          {/* Birthday Surprise Banner */}
          {showBdayBanner && (
            <div className="border-b border-[#ff4b89] bg-[#ff4b89]/10 p-4 font-mono text-xs text-center flex flex-col sm:flex-row items-center justify-between gap-3 relative z-30">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="text-[#ff4b89] animate-pulse">💝</span>
                <span>¡HOY ES UN DÍA MUY ESPECIAL: CUMPLEAÑOS DE MILE!</span>
              </div>
              <Link 
                href="/cumple" 
                className="!min-h-0 border border-[#ff4b89] bg-[#ff4b89]/20 hover:bg-[#ff4b89] hover:text-black transition-all px-4 py-1.5 text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5"
              >
                <span>Descubrir Sorpresa 🎁</span>
                <ArrowRight size={10} className="animate-slide-loop" />
              </Link>
            </div>
          )}

          {/* Header Section */}
          <div className="border-b border-white/10 p-4 sm:p-8 lg:p-10 relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-[4px]" style={{ backgroundColor: accentColorValue }} />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs animate-spin-slow" style={{ color: accentColorValue }}>◆</span>
                <h1 className="text-xl sm:text-3xl md:text-4xl font-mono font-bold uppercase tracking-tight text-white leading-none">
                  {greetingTitle}
                </h1>
              </div>
              <p className="text-xs sm:text-sm tracking-normal text-[#e1bfb2] font-medium leading-relaxed max-w-xl font-sans">
                {greetingSubtitle}
              </p>
            </div>
          </div>

          {/* Body Section */}
          <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-8 bg-[#050505]/95">

            {/* Primary Modules - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Día a Día */}
              <ChamferedPanel
                accentColor={accentColorValue}
                label="DÍA A DÍA · RITMO"
                notchSize={20}
                className="flex flex-col justify-between gap-4 h-full"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className="shrink-0" style={{ color: accentColorValue }}>
                      <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                    </span>
                    <Link href="/dashboard" className="inline-block">
                      <h2 className="text-lg sm:text-xl font-black uppercase transition-colors hover:text-[var(--color-profile-accent)]">Día a Día</h2>
                    </Link>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-black/60 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/10 shrink-0">
                    <CheckSquare size={10} style={{ color: accentColorValue }} />
                    <span>{assigneeTasks.length} Tareas Pendientes</span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-white/10 relative z-20">
                  <Link href="/dashboard?tab=tasks" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <CheckSquare className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0" />
                      <span className="truncate">Mis tareas</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                  <Link href="/dashboard?tab=finances" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <PlusCircle className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0" />
                      <span className="truncate">Registrar Gastos</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                </div>
              </ChamferedPanel>

              {/* Antojos */}
              <ChamferedPanel
                accentColor={accentColorValue}
                label="PLANES · ANTOJOS"
                notchSize={20}
                className="flex flex-col justify-between gap-4 h-full"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className="shrink-0" style={{ color: accentColorValue }}>
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                    </span>
                    <Link href="/planes" className="inline-block">
                      <h2 className="text-lg sm:text-xl font-black uppercase transition-colors hover:text-[var(--color-profile-accent)]">Antojos</h2>
                    </Link>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-black/60 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/10 shrink-0">
                    <Compass size={10} style={{ color: accentColorValue }} />
                    <span>{activePlansCount} Planes Guardados</span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-white/10 relative z-20">
                  <Link href="/planes?scroll=wishlist" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Compass className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0" />
                      <span className="truncate">Ver planes</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                  <Link href="/planes?action=add" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <PlusCircle className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0" />
                      <span className="truncate">Agregar plan</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                </div>
              </ChamferedPanel>
            </div>

            {/* Secondary Modules Header */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs animate-pulse" style={{ color: accentColorValue }}>◈</span>
                <span className="text-[10px] font-mono uppercase font-black tracking-[0.25em]" style={{ color: accentColorValue }}>MÓDULOS DE SINTONÍA</span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Secondary Modules - 3 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Refugio */}
              <ChamferedPanel
                accentColor={accentColorValue}
                label="REFUGIO · BITÁCORA"
                notchSize={16}
                className="flex flex-col justify-between gap-4 h-full"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2.5">
                    <span className="shrink-0" style={{ color: accentColorValue }}>
                      <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <Link href="/refugio">
                      <h3 className="text-sm sm:text-base font-black uppercase transition-colors hover:text-[var(--color-profile-accent)]">Refugio</h3>
                    </Link>
                  </div>
                  <div className="inline-flex items-center gap-1 bg-black/60 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/10 shrink-0">
                    <FileText size={8} style={{ color: accentColorValue }} />
                    <span>{reflectionsCount} R</span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-1.5 pt-2.5 border-t border-white/10 relative z-20">
                  <Link href="/refugio?tab=escucha" className="col-span-2 group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <FileText className="w-3 h-3 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] shrink-0" />
                      <span className="truncate">Bitácora</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                  <Link href="/refugio?tab=bebes" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <PawPrint className="w-3 h-3 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] shrink-0" />
                      <span className="truncate">Bebés</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                  <Link href="/refugio?tab=historia" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Clock className="w-3 h-3 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] shrink-0" />
                      <span className="truncate">Historia</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                </div>
              </ChamferedPanel>

              {/* Salud */}
              <ChamferedPanel
                accentColor={accentColorValue}
                label="SALUD · VITALES"
                notchSize={16}
                className="flex flex-col justify-between gap-4 h-full"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2.5">
                    <span className="shrink-0" style={{ color: accentColorValue }}>
                      <Heart className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <Link href="/salud">
                      <h3 className="text-sm sm:text-base font-black uppercase transition-colors hover:text-[var(--color-profile-accent)]">Salud</h3>
                    </Link>
                  </div>
                  <div className="inline-flex items-center gap-1 bg-black/60 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/10 shrink-0">
                    <Activity size={8} style={{ color: accentColorValue }} />
                    <span>Activo</span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-1.5 pt-2.5 border-t border-white/10 relative z-20">
                  <Link href="/salud?tab=vitals" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <HeartPulse className="w-3 h-3 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] shrink-0" />
                      <span className="truncate">Presión</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                  <Link href="/salud?tab=habits" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Activity className="w-3 h-3 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] shrink-0" />
                      <span className="truncate">Hábitos</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                  <Link href="/salud?tab=movement" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Flame className="w-3 h-3 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] shrink-0" />
                      <span className="truncate">Entrenos</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                  <Link href="/salud?tab=biometric" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Shield className="w-3 h-3 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] shrink-0" />
                      <span className="truncate">Biometría</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                </div>
              </ChamferedPanel>

              {/* Juego */}
              <ChamferedPanel
                accentColor={accentColorValue}
                label="JUEGO · RECUERDOS"
                notchSize={16}
                className="flex flex-col justify-between gap-4 h-full"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2.5">
                    <span className="shrink-0" style={{ color: accentColorValue }}>
                      <Gamepad2 className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <Link href="/juego">
                      <h3 className="text-sm sm:text-base font-black uppercase transition-colors hover:text-[var(--color-profile-accent)]">Juego</h3>
                    </Link>
                  </div>
                  <div className="inline-flex items-center gap-1 bg-black/60 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/10 shrink-0">
                    <Sparkles size={8} style={{ color: accentColorValue }} />
                    <span>Récords</span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-1.5 pt-2.5 border-t border-white/10 relative z-20">
                  <Link href="/smash-fest" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Gamepad2 className="w-3 h-3 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] shrink-0" />
                      <span className="truncate">Smash Fest</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                  <Link href="/juego" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white transition-all w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Gamepad2 className="w-3 h-3 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] shrink-0" />
                      <span className="truncate">Mahjong</span>
                    </span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1 shrink-0" />
                  </Link>
                </div>
              </ChamferedPanel>
            </div>

          </div>

        </BrutalistPanel>
      </main>
    </PrivateRoute>
  );
}
