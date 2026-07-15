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
import { AnimatedBrutalistCorners } from "@/components/ui/AnimatedBrutalistCorners";

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
  const savingPlansCount = useMemo(() => wishlist.filter(item => item.state === 'SAVING').length, [wishlist]);
  const showBdayBanner = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const isTest = window.location.search.includes('test=true') || window.location.search.includes('cumple=true');
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
      <div
        className="fixed inset-0 z-[-1] bg-black overflow-hidden"
        style={{ '--color-profile-accent': accentColorValue } as React.CSSProperties}
      >
        {/* Subtle Geometric Background */}
        <div className="absolute inset-0 bg-mosaic opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-dot-matrix opacity-30 pointer-events-none" />
      </div>

      <main
        className="w-full min-h-screen flex flex-col items-center justify-start py-4 sm:py-8 md:py-12 px-2 sm:px-6 relative z-10 text-[#e5e2e1] overflow-y-auto"
        style={{ '--color-profile-accent': accentColorValue } as React.CSSProperties}
      >
        {/* Main Terminal Container */}
        <div className="w-full max-w-4xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md relative mb-6 sm:mb-12">
          <AnimatedBrutalistCorners color={accentColorValue} size={16} thickness={1.5} />

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
          <div className="border-b border-white/10 p-4 sm:p-8 lg:p-10 relative">
            <div className="absolute left-0 top-0 h-full w-[4px]" style={{ backgroundColor: accentColorValue }} />
            <div className="space-y-3">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-mono font-bold uppercase tracking-tight text-white leading-none">
                {greetingTitle}
              </h1>
              <p className="text-xs sm:text-sm tracking-normal text-[#e1bfb2] font-medium leading-relaxed max-w-xl font-sans">
                {greetingSubtitle}
              </p>
            </div>
          </div>

          {/* Body Section */}
          <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-8 bg-[#050505]/95">

            {/* Primary Modules - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/10 border border-white/10 p-[1px]">

              {/* Día a Día */}
              <div className="group relative bg-[#0a0a0a] p-4 sm:p-6 lg:p-8 flex flex-col gap-3 sm:gap-5 transition-all duration-300 hover:bg-[#121212]">
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                
                {/* Title and stats in same row */}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--color-profile-accent)] shrink-0" style={{ color: accentColorValue }}>
                      <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                    </span>
                    <Link href="/dashboard" className="inline-block">
                      <h2 className="text-lg sm:text-xl font-black uppercase group-hover:text-[var(--color-profile-accent)] transition-colors">Día a Día</h2>
                    </Link>
                  </div>
                  {/* Statistics block */}
                  <div className="inline-flex items-center gap-1.5 bg-black/40 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/5 shrink-0">
                    <CheckSquare size={10} className="text-[#a88a7e]" />
                    <span>{assigneeTasks.length} Tareas Pendientes</span>
                  </div>
                {/* Specific Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-white/5 relative z-20">
                  <Link href="/dashboard?tab=tasks" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <CheckSquare className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-0" />
                      <span className="truncate">Ver mis tareas</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop shrink-0" />
                  </Link>
                  <Link href="/dashboard?tab=finances" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <PlusCircle className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-1" />
                      <span className="truncate">Registrar Gastos</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop-delay-1 shrink-0" />
                  </Link>
                </div>
              </div>

              {/* Antojos */}
              <div className="group relative bg-[#0a0a0a] p-4 sm:p-6 lg:p-8 flex flex-col gap-3 sm:gap-5 transition-all duration-300 hover:bg-[#121212]">
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                
                {/* Title and stats in same row */}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--color-profile-accent)] shrink-0" style={{ color: accentColorValue }}>
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                    </span>
                    <Link href="/planes" className="inline-block">
                      <h2 className="text-lg sm:text-xl font-black uppercase group-hover:text-[var(--color-profile-accent)] transition-colors">Antojos</h2>
                    </Link>
                  </div>
                  {/* Statistics block */}
                  <div className="inline-flex items-center gap-1.5 bg-black/40 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/5 shrink-0">
                    <Compass size={10} className="text-[#a88a7e]" />
                    <span>{activePlansCount} Planes Guardados</span>
                  </div>
                </div>

                {/* Specific Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-white/5 relative z-20">
                  <Link href="/planes?scroll=wishlist" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Compass className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-2" />
                      <span className="truncate">Ver planes</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop-delay-2 shrink-0" />
                  </Link>
                  <Link href="/planes?action=add" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <PlusCircle className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-3" />
                      <span className="truncate">Agregar plan</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop-delay-3 shrink-0" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Secondary Modules Header */}
            <div className="flex items-center gap-4 py-1">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-[9px] font-mono uppercase font-bold tracking-[0.2em] text-[#a88a7e]">Módulos de Sintonía</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            {/* Secondary Modules - 3 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[1px] bg-white/10 border border-white/10 p-[1px]">

              {/* Refugio */}
              <div className="group relative bg-[#0a0a0a] p-4 sm:p-6 lg:p-8 flex flex-col items-start gap-3 sm:gap-5 transition-all duration-300 hover:bg-[#121212] justify-between h-full">
                <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                
                {/* Title and stats in same row */}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 group-hover:text-[var(--color-profile-accent)] transition-colors shrink-0" style={{ color: accentColorValue }}>
                      <ShieldCheck className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={1.5} />
                    </span>
                    <Link href="/refugio">
                      <h3 className="text-sm sm:text-base font-black uppercase group-hover:text-[var(--color-profile-accent)] transition-colors">Refugio</h3>
                    </Link>
                  </div>
                  {/* Statistics block */}
                  <div className="inline-flex items-center gap-1.5 bg-black/40 px-2 py-0.5 text-[7px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/5 shrink-0">
                    <FileText size={8} className="text-[#a88a7e]" />
                    <span>{reflectionsCount} R</span>
                  </div>
                </div>

                {/* Specific Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-white/5 relative z-20">
                  <Link href="/refugio?tab=escucha" className="col-span-2 group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-4" />
                      <span className="truncate">Bitácora</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop shrink-0" />
                  </Link>
                  <Link href="/refugio?tab=bebes" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <PawPrint className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-6" />
                      <span className="truncate">Bebés</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop-delay-2 shrink-0" />
                  </Link>
                  <Link href="/refugio?tab=historia" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-7" />
                      <span className="truncate">Historia</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop-delay-3 shrink-0" />
                  </Link>
                </div>
              </div>

              {/* Salud */}
              <div className="group relative bg-[#0a0a0a] p-4 sm:p-6 lg:p-8 flex flex-col items-start gap-3 sm:gap-5 transition-all duration-300 hover:bg-[#121212] justify-between h-full">
                <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                
                {/* Title and stats in same row */}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 group-hover:text-[var(--color-profile-accent)] transition-colors shrink-0" style={{ color: accentColorValue }}>
                      <Heart className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={1.5} />
                    </span>
                    <Link href="/salud">
                      <h3 className="text-sm sm:text-base font-black uppercase group-hover:text-[var(--color-profile-accent)] transition-colors">Salud</h3>
                    </Link>
                  </div>
                  {/* Statistics block */}
                  <div className="inline-flex items-center gap-1.5 bg-black/40 px-2 py-0.5 text-[7px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/5 shrink-0">
                    <Activity size={8} className="text-[#a88a7e]" />
                    <span>Bitácora activa</span>
                  </div>
                </div>

                {/* Specific Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-white/5 relative z-20">
                  <Link href="/salud?tab=vitals" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <HeartPulse className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-8" />
                      <span className="truncate">Vigilar Presión</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop shrink-0" />
                  </Link>
                  <Link href="/salud?tab=habits" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Activity className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-9" />
                      <span className="truncate">Hábitos</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop-delay-1 shrink-0" />
                  </Link>
                  <Link href="/salud?tab=movement" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Flame className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-10" />
                      <span className="truncate">Entrenos</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop-delay-2 shrink-0" />
                  </Link>
                  <Link href="/salud?tab=biometric" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Shield className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-11" />
                      <span className="truncate">Biometría</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop-delay-3 shrink-0" />
                  </Link>
                </div>
              </div>

              {/* Juego */}
              <div className="group relative bg-[#0a0a0a] p-4 sm:p-6 lg:p-8 flex flex-col items-start gap-3 sm:gap-5 transition-all duration-300 hover:bg-[#121212] justify-between h-full">
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                
                {/* Title and stats in same row */}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 group-hover:text-[var(--color-profile-accent)] transition-colors shrink-0" style={{ color: accentColorValue }}>
                      <Gamepad2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={1.5} />
                    </span>
                    <Link href="/juego">
                      <h3 className="text-sm sm:text-base font-black uppercase group-hover:text-[var(--color-profile-accent)] transition-colors">Juego</h3>
                    </Link>
                  </div>
                  {/* Statistics block */}
                  <div className="inline-flex items-center gap-1.5 bg-black/40 px-2 py-0.5 text-[7px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/5 shrink-0">
                    <Sparkles size={8} className="text-[#a88a7e]" />
                    <span>Memory record</span>
                  </div>
                </div>

                {/* Specific Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-white/5 relative z-20">
                  <Link href="/smash-fest" className="group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Gamepad2 className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-13" />
                      <span className="truncate">Smash Fest</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop shrink-0" />
                  </Link>
                  <Link href="/juego" className="group/link group/link flex items-center justify-between border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-2 text-[9.5px] sm:text-xs font-mono uppercase tracking-wider text-white transition-all rounded-none w-full min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Gamepad2 className="w-3.5 h-3.5 text-[#a88a7e] group-hover/link:text-[var(--color-profile-accent)] transition-colors shrink-0 animate-opt-dance-12" />
                      <span className="truncate">Jugar Mahjong</span>
                    </span>
                    <ArrowRight className="w-3 h-3 animate-slide-loop shrink-0" />
                  </Link>
                </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </PrivateRoute>
  );
}
