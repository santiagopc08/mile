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
  CheckSquare 
} from 'lucide-react';
import { AnimatedBrutalistCorners } from "@/components/ui/AnimatedBrutalistCorners";

export default function Home() {
  const { profile } = useProfile();
  const { data } = useStore();

  // Active theme accent styling variables
  const accentColorValue = profile === 'ella' ? '#ff4b89' : '#c3f400';
  const accentHoverBg = profile === 'ella' ? 'rgba(255, 75, 137, 0.15)' : 'rgba(195, 244, 0, 0.15)';
  const partnerName = profile === 'ella' ? 'Santi' : 'Mile';

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
      return `Qué alegría tenerte de vuelta en nuestro rincón compartido. Todo está en orden por aquí. ¿Qué te gustaría coordinar o registrar hoy con ${partnerName}?`;
    }
    if (profile === 'el') {
      return `Listo para la acción. Todo en marcha en tu panel de control compartido con ${partnerName}. ¿Qué misión u objetivo conquistaremos hoy?`;
    }
    return 'Seleccione el módulo operativo requerido para esta sesión.';
  }, [profile, partnerName]);

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
        className="w-full min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10 text-[#e5e2e1]"
        style={{ '--color-profile-accent': accentColorValue } as React.CSSProperties}
      >
        {/* Main Terminal Container */}
        <div className="w-full max-w-4xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md relative">
          <AnimatedBrutalistCorners color={accentColorValue} size={16} thickness={1.5} />

          {/* Header Section */}
          <div className="border-b border-white/10 p-6 sm:p-8 lg:p-10 relative">
             <div className="absolute left-0 top-0 h-full w-[4px]" style={{ backgroundColor: accentColorValue }} />
             
             <div className="flex items-center justify-between mb-6">
               <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-[#a88a7e] border border-white/10 px-2 py-1 bg-[#121212]">
                 NUESTRO ESPACIO SEGURO
               </span>
               <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 bg-user-c animate-pulse shadow-[0_0_5px_var(--color-user-c)]" />
                  <span className="text-[8px] font-mono uppercase tracking-widest opacity-60">EN LÍNEA</span>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
               {/* Greeting block */}
               <div className="lg:col-span-7 space-y-3">
                 <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none">
                   {greetingTitle}
                 </h1>
                 <p className="text-sm tracking-normal text-[#e1bfb2] font-medium leading-relaxed max-w-xl">
                   {greetingSubtitle}
                 </p>
               </div>

               {/* Quick Sync HUD */}
               <div className="lg:col-span-5 border border-white/10 bg-black/40 p-4 font-mono text-[9px] text-[#a88a7e] space-y-2 relative rounded-none">
                 <div className="absolute top-0 right-0 p-1 text-[7px] text-white/20 border-b border-l border-white/10 uppercase bg-[#121212]">
                   HUD-01
                 </div>
                 <div className="text-[8px] font-black text-white/50 border-b border-white/5 pb-1 uppercase tracking-wider">
                   ● BITÁCORA DE SINCRONÍA
                 </div>
                 <div className="space-y-1 text-white/80">
                   <div className="flex justify-between">
                     <span>TAREAS ACTIVAS:</span>
                     <span className="font-bold text-white font-mono">{assigneeTasks.length} pendientes por ti</span>
                   </div>
                   <div className="flex justify-between">
                     <span>PLANES EN CURSO:</span>
                     <span className="font-bold text-white font-mono">{savingPlansCount} en ahorro activo</span>
                   </div>
                   <div className="flex justify-between">
                     <span>REFLEXIONES COMPARTIDAS:</span>
                     <span className="font-bold text-white font-mono">{reflectionsCount} registradas</span>
                   </div>
                   <div className="flex justify-between">
                     <span>TEMAS MUSICALES:</span>
                     <span className="font-bold text-white font-mono">{songsCount} recomendados</span>
                   </div>
                 </div>
               </div>
             </div>
          </div>

          {/* Body Section */}
          <div className="p-6 sm:p-8 space-y-8 bg-[#050505]/95">

            {/* Primary Modules - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/10 border border-white/10 p-[1px]">

               {/* Día a Día */}
               <Link href="/dashboard" className="group relative bg-[#0a0a0a] p-8 flex flex-col gap-6 transition-all duration-300 hover:bg-[#121212]">
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                  <div className="flex justify-between items-start">
                     <div className="p-4 border border-white/10 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors group-hover:shadow-[0_0_15px_var(--color-profile-accent)]" style={{ color: accentColorValue }}>
                        <LayoutDashboard size={32} strokeWidth={1.5} />
                     </div>
                     <span className="text-[9px] font-mono font-bold text-white/30 group-hover:text-white/70 transition-colors border border-white/10 px-2 py-1">MOD-01</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase mb-2 group-hover:text-[var(--color-profile-accent)] transition-colors">Día a Día</h2>
                    <p className="text-xs text-[#a88a7e] leading-relaxed mb-4">
                      Nuestras tareas cotidianas y finanzas compartidas. Revisa pendientes del hogar, objetivos y el balance de nuestros bolsillos.
                    </p>
                    {/* Live Metric */}
                    <div className="inline-flex items-center gap-1.5 border border-white/5 bg-black/40 px-2.5 py-1 text-[8px] font-mono uppercase tracking-wider text-stone-400 group-hover:border-white/10">
                      <CheckSquare size={10} className="text-user-c" />
                      <span>{assigneeTasks.length} Tareas Pendientes</span>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: accentColorValue }}>
                     <span>Ingresar</span>
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
                     <span className="text-[9px] font-mono font-bold text-white/30 group-hover:text-white/70 transition-colors border border-white/10 px-2 py-1">MOD-02</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase mb-2 group-hover:text-[var(--color-profile-accent)] transition-colors">Antojos</h2>
                    <p className="text-xs text-[#a88a7e] leading-relaxed mb-4">
                      Nuestro mapa de planes en común y lista de deseos. Rastrea los viajes que soñamos, restaurantes pendientes y compras en camino.
                    </p>
                    {/* Live Metric */}
                    <div className="inline-flex items-center gap-1.5 border border-white/5 bg-black/40 px-2.5 py-1 text-[8px] font-mono uppercase tracking-wider text-stone-400 group-hover:border-white/10">
                      <Compass size={10} className="text-user-c" />
                      <span>{activePlansCount} Planes Guardados</span>
                    </div>
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
              <span className="text-[9px] font-mono uppercase font-bold tracking-[0.2em] text-[#a88a7e]">Módulos de Sintonía</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            {/* Secondary Modules - 3 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[1px] bg-white/10 border border-white/10 p-[1px]">

               {/* Refugio */}
               <Link href="/refugio" className="group relative bg-[#0a0a0a] p-6 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:bg-[#121212] justify-between h-full">
                  <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                  <div className="p-3 border border-white/10 text-white/50 group-hover:text-[var(--color-profile-accent)] group-hover:bg-white/5 transition-colors">
                     <ShieldCheck size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase mb-1">Refugio</h3>
                    <p className="text-[10px] font-sans text-stone-400 leading-normal mb-3">
                      Bitácora íntima, playlist compartida, recuerdos y cuidados de las mascotas.
                    </p>
                    <div className="inline-flex items-center gap-1 border border-white/5 bg-black/60 px-2 py-0.5 text-[7px] font-mono uppercase text-stone-400 group-hover:border-white/10">
                      <Music size={8} />
                      <span>{songsCount} canciones</span>
                    </div>
                  </div>
               </Link>

               {/* Salud */}
               <Link href="/salud" className="group relative bg-[#0a0a0a] p-6 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:bg-[#121212] justify-between h-full">
                  <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                  <div className="p-3 border border-white/10 text-white/50 group-hover:text-[var(--color-profile-accent)] group-hover:bg-white/5 transition-colors">
                     <Heart size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase mb-1">Salud</h3>
                    <p className="text-[10px] font-sans text-stone-400 leading-normal mb-3">
                      Bitácora de presión arterial, hábitos diarios, diario biométrico y movilidad.
                    </p>
                    <div className="inline-flex items-center gap-1 border border-white/5 bg-black/60 px-2 py-0.5 text-[7px] font-mono uppercase text-stone-400 group-hover:border-white/10">
                      <Activity size={8} />
                      <span>Monitoreo al día</span>
                    </div>
                  </div>
               </Link>

               {/* Juego */}
               <Link href="/juego" className="group relative bg-[#0a0a0a] p-6 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:bg-[#121212] justify-between h-full">
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--color-profile-accent)] transition-colors pointer-events-none" />
                  <div className="p-3 border border-white/10 text-white/50 group-hover:text-[var(--color-profile-accent)] group-hover:bg-white/5 transition-colors">
                     <Gamepad2 size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase mb-1">Juego</h3>
                    <p className="text-[10px] font-sans text-stone-400 leading-normal mb-3">
                      Juego de Mahjong con nuestros recuerdos y clasificaciones en tiempo real.
                    </p>
                    <div className="inline-flex items-center gap-1 border border-white/5 bg-black/60 px-2 py-0.5 text-[7px] font-mono uppercase text-stone-400 group-hover:border-white/10">
                      <Sparkles size={8} />
                      <span>¿Nuevo récord?</span>
                    </div>
                  </div>
               </Link>
            </div>

          </div>

        </div>
      </main>
    </PrivateRoute>
  );
}
