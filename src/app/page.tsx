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

  const playlist = useMemo(() => data?.audioPlaylist || [], [data?.audioPlaylist]);
  const songsCount = playlist.length;

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
        className="w-full min-h-screen flex flex-col items-center justify-start py-8 sm:py-12 md:py-16 px-4 sm:px-6 relative z-10 text-[#e5e2e1] overflow-y-auto"
        style={{ '--color-profile-accent': accentColorValue } as React.CSSProperties}
      >
        {/* Main Terminal Container */}
        <div className="w-full max-w-4xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md relative mb-12">
          <AnimatedBrutalistCorners color={accentColorValue} size={16} thickness={1.5} />

          {/* Header Section */}
          <div className="border-b border-white/10 p-6 sm:p-8 lg:p-10 relative">
            <div className="absolute left-0 top-0 h-full w-[4px]" style={{ backgroundColor: accentColorValue }} />
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold uppercase tracking-tight text-white leading-none">
                {greetingTitle}
              </h1>
              <p className="text-sm tracking-normal text-[#e1bfb2] font-medium leading-relaxed max-w-xl font-sans">
                {greetingSubtitle}
              </p>
            </div>
          </div>

          {/* Body Section */}
          <div className="p-6 sm:p-8 space-y-8 bg-[#050505]/95">

            {/* Primary Modules - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/10 border border-white/10 p-[1px]">

              {/* Día a Día */}
              <div className="group relative bg-[#0a0a0a] p-8 flex flex-col gap-5 transition-all duration-300 hover:bg-[#121212]">
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                
                {/* Title and stats in same row */}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--color-profile-accent)] shrink-0" style={{ color: accentColorValue }}>
                      <LayoutDashboard size={24} strokeWidth={1.5} />
                    </span>
                    <Link href="/dashboard" className="inline-block">
                      <h2 className="text-xl font-black uppercase group-hover:text-[var(--color-profile-accent)] transition-colors">Día a Día</h2>
                    </Link>
                  </div>
                  {/* Statistics block */}
                  <div className="inline-flex items-center gap-1.5 bg-black/40 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/5 shrink-0">
                    <CheckSquare size={10} className="text-[#a88a7e]" />
                    <span>{assigneeTasks.length} Tareas Pendientes</span>
                  </div>
                </div>

                {/* Specific Action Buttons */}
                <div className="flex flex-col gap-2 pt-2 border-t border-white/5 relative z-20">
                  <div className="flex flex-wrap gap-1.5">
                    <Link href="/dashboard?tab=tasks" className="inline-flex items-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-1.5 text-[8px] font-mono uppercase tracking-wider text-white transition-all">
                      <CheckSquare size={8} />
                      <span>Ver mis tareas</span>
                    </Link>
                    <Link href="/dashboard?tab=finances" className="inline-flex items-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-1.5 text-[8px] font-mono uppercase tracking-wider text-white transition-all">
                      <PlusCircle size={8} />
                      <span>Registrar Gastos</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Antojos */}
              <div className="group relative bg-[#0a0a0a] p-8 flex flex-col gap-5 transition-all duration-300 hover:bg-[#121212]">
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                
                {/* Title and stats in same row */}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--color-profile-accent)] shrink-0" style={{ color: accentColorValue }}>
                      <MapPin size={24} strokeWidth={1.5} />
                    </span>
                    <Link href="/planes" className="inline-block">
                      <h2 className="text-xl font-black uppercase group-hover:text-[var(--color-profile-accent)] transition-colors">Antojos</h2>
                    </Link>
                  </div>
                  {/* Statistics block */}
                  <div className="inline-flex items-center gap-1.5 bg-black/40 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/5 shrink-0">
                    <Compass size={10} className="text-[#a88a7e]" />
                    <span>{activePlansCount} Planes Guardados</span>
                  </div>
                </div>

                {/* Specific Action Buttons */}
                <div className="flex flex-col gap-2 pt-2 border-t border-white/5 relative z-20">
                  <div className="flex flex-wrap gap-1.5">
                    <Link href="/planes?scroll=wishlist" className="inline-flex items-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-1.5 text-[8px] font-mono uppercase tracking-wider text-white transition-all">
                      <Compass size={8} />
                      <span>Ver planes guardados</span>
                    </Link>
                    <Link href="/planes?action=add" className="inline-flex items-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 px-2.5 py-1.5 text-[8px] font-mono uppercase tracking-wider text-white transition-all">
                      <PlusCircle size={8} />
                      <span>Agregar nuevo plan</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Modules Header */}
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-[9px] font-mono uppercase font-bold tracking-[0.2em] text-[#a88a7e]">Módulos de Sintonía</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            {/* Secondary Modules - 3 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[1px] bg-white/10 border border-white/10 p-[1px]">

              {/* Refugio */}
              <div className="group relative bg-[#0a0a0a] p-6 flex flex-col items-start gap-5 transition-all duration-300 hover:bg-[#121212] justify-between h-full">
                <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                
                {/* Title and stats in same row */}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 group-hover:text-[var(--color-profile-accent)] transition-colors shrink-0" style={{ color: accentColorValue }}>
                      <ShieldCheck size={20} strokeWidth={1.5} />
                    </span>
                    <Link href="/refugio">
                      <h3 className="text-sm font-black uppercase group-hover:text-[var(--color-profile-accent)] transition-colors">Refugio</h3>
                    </Link>
                  </div>
                  {/* Statistics block */}
                  <div className="inline-flex items-center gap-1.5 bg-black/40 px-2 py-0.5 text-[7px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/5 shrink-0">
                    <Music size={8} className="text-[#a88a7e]" />
                    <span>{songsCount} temas / {reflectionsCount} reflexiones</span>
                  </div>
                </div>

                {/* Specific Action Buttons */}
                <div className="w-full flex flex-col gap-2 pt-2 border-t border-white/5 relative z-20 items-center">
                  <div className="flex flex-col gap-1 w-full">
                    <Link href="/refugio?tab=escucha" className="inline-flex items-center justify-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 py-1 text-[7.5px] font-mono uppercase tracking-wider text-white transition-all">
                      <FileText size={8} />
                      <span>Escribir en bitácora</span>
                    </Link>
                    <Link href="/refugio?tab=musica" className="inline-flex items-center justify-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 py-1 text-[7.5px] font-mono uppercase tracking-wider text-white transition-all">
                      <Music size={8} />
                      <span>Recomendar canción</span>
                    </Link>
                    <Link href="/refugio?tab=bebes" className="inline-flex items-center justify-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 py-1 text-[7.5px] font-mono uppercase tracking-wider text-white transition-all">
                      <PawPrint size={8} />
                      <span>Diario de bebés</span>
                    </Link>
                    <Link href="/refugio?tab=historia" className="inline-flex items-center justify-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 py-1 text-[7.5px] font-mono uppercase tracking-wider text-white transition-all">
                      <Clock size={8} />
                      <span>Nuestra historia</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Salud */}
              <div className="group relative bg-[#0a0a0a] p-6 flex flex-col items-start gap-5 transition-all duration-300 hover:bg-[#121212] justify-between h-full">
                <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                
                {/* Title and stats in same row */}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 group-hover:text-[var(--color-profile-accent)] transition-colors shrink-0" style={{ color: accentColorValue }}>
                      <Heart size={20} strokeWidth={1.5} />
                    </span>
                    <Link href="/salud">
                      <h3 className="text-sm font-black uppercase group-hover:text-[var(--color-profile-accent)] transition-colors">Salud</h3>
                    </Link>
                  </div>
                  {/* Statistics block */}
                  <div className="inline-flex items-center gap-1.5 bg-black/40 px-2 py-0.5 text-[7px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/5 shrink-0">
                    <Activity size={8} className="text-[#a88a7e]" />
                    <span>Bitácora clínica activa</span>
                  </div>
                </div>

                {/* Specific Action Buttons */}
                <div className="w-full flex flex-col gap-2 pt-2 border-t border-white/5 relative z-20 items-center">
                  <div className="flex flex-col gap-1 w-full">
                    <Link href="/salud?tab=vitals" className="inline-flex items-center justify-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 py-1 text-[7.5px] font-mono uppercase tracking-wider text-white transition-all">
                      <HeartPulse size={8} />
                      <span>Presión Arterial</span>
                    </Link>
                    <Link href="/salud?tab=habits" className="inline-flex items-center justify-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 py-1 text-[7.5px] font-mono uppercase tracking-wider text-white transition-all">
                      <Activity size={8} />
                      <span>Registrar Hábitos</span>
                    </Link>
                    <Link href="/salud?tab=movement" className="inline-flex items-center justify-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 py-1 text-[7.5px] font-mono uppercase tracking-wider text-white transition-all">
                      <Flame size={8} />
                      <span>Entreno o terapia</span>
                    </Link>
                    <Link href="/salud?tab=biometric" className="inline-flex items-center justify-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 py-1 text-[7.5px] font-mono uppercase tracking-wider text-white transition-all">
                      <Shield size={8} />
                      <span>Diario biométrico</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Juego */}
              <div className="group relative bg-[#0a0a0a] p-6 flex flex-col items-start gap-5 transition-all duration-300 hover:bg-[#121212] justify-between h-full">
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                
                {/* Title and stats in same row */}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 group-hover:text-[var(--color-profile-accent)] transition-colors shrink-0" style={{ color: accentColorValue }}>
                      <Gamepad2 size={20} strokeWidth={1.5} />
                    </span>
                    <Link href="/juego">
                      <h3 className="text-sm font-black uppercase group-hover:text-[var(--color-profile-accent)] transition-colors">Juego</h3>
                    </Link>
                  </div>
                  {/* Statistics block */}
                  <div className="inline-flex items-center gap-1.5 bg-black/40 px-2 py-0.5 text-[7px] font-mono uppercase tracking-wider text-[#a88a7e] border border-white/5 shrink-0">
                    <Sparkles size={8} className="text-[#a88a7e]" />
                    <span>Récords de memoria</span>
                  </div>
                </div>

                {/* Specific Action Buttons */}
                <div className="w-full flex flex-col gap-2 pt-2 border-t border-white/5 relative z-20 items-center">
                  <div className="flex flex-col gap-1 w-full">
                    <Link href="/juego" className="inline-flex items-center justify-center gap-1 border border-white/10 bg-white/5 hover:border-[var(--color-profile-accent)] hover:bg-[var(--color-profile-accent)]/10 py-1 text-[7.5px] font-mono uppercase tracking-wider text-white transition-all">
                      <Gamepad2 size={8} />
                      <span>Jugar Mahjong</span>
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
