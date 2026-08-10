'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/context/StoreContext';
import { useVisibility } from '@/context/VisibilityContext';
import { useProfile } from '@/context/ProfileContext';
import { TasksTab } from './TasksTab';
import { FinancesTab } from './FinancesTab';
import { StoreService } from '@/services/storeService';
import { useMemo } from 'react';
import { ShieldCheck, WalletCards } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';

interface Task {
  id: string;
  text: string;
  status: 'todo' | 'in_progress' | 'done' | 'skipped';
  category: string;
  priority?: 'low' | 'medium' | 'high';
  actual_time: number;
  estimated_time: number;
  assignee?: 'el' | 'ella';
}

export const SymmetryDashboard = () => {
  const { mode, toggleMode } = useVisibility();
  const { profile } = useProfile();
  const { data } = useStore();
  const tasks = useMemo(() => {
    const allTasks = (data?.tasks as Task[]) || [];
    return allTasks.filter(t => !t.assignee || t.assignee === profile);
  }, [data?.tasks, profile]);
  const objectives = useMemo(() => (data?.objectives as any[]) || [], [data?.objectives]);
  const [focusScore, setFocusScore] = useState(0);
  const [isFragmented, setIsFragmented] = useState(false);
  const [dataA, setDataA] = useState({ academic: 45, fitness: 65, work: 80, home: 70, personal: 60 });
  const [dataB, setDataB] = useState({ academic: 75, fitness: 40, work: 90, home: 65, personal: 85 });
  const storeAllocations = useMemo(() => data?.allocations || [], [data?.allocations]);

  // ⚡ Bolt Optimization: Replace useEffect-driven state with a single-pass useMemo to prevent double renders and redundant iterations
  const { allocationsA, allocationsB } = useMemo(() => {
    const aA: any[] = [];
    const aB: any[] = [];
    for (const a of storeAllocations) {
      if ((a as any).profile === 'el') aA.push(a);
      else if ((a as any).profile === 'ella') aB.push(a);
    }
    return { allocationsA: aA, allocationsB: aB };
  }, [storeAllocations]);

  useEffect(() => {
    const savedA = localStorage.getItem('symmetry_A_data');
    const savedB = localStorage.getItem('symmetry_B_data');
    if (savedA) setDataA(JSON.parse(savedA));
    if (savedB) setDataB(JSON.parse(savedB));

    const fetchData = async () => {
      try {
        await StoreService.getStore();
      } catch (e) {
        console.error("Failed to initialize store", e);
      }
    };
    fetchData();
  }, []);

  // Update fragmentation state
  // ⚡ Bolt Optimization: Single O(N) pass instead of multiple array iterations
  useEffect(() => {
    let total = 0;
    let miscTotal = 0;
    for (const e of allocationsA) {
      total += e.amount;
      if (e.category === '🎲 Otros') miscTotal += e.amount;
    }
    const miscPercent = total > 0 ? (miscTotal / total) * 100 : 0;
    if (profile === 'el') setIsFragmented(miscPercent > 20);
  }, [allocationsA, profile]);

  // ⚡ Bolt Optimization: Single O(N) pass instead of multiple array iterations
  useEffect(() => {
    let total = 0;
    let miscTotal = 0;
    for (const e of allocationsB) {
      total += e.amount;
      if (e.category === '🎲 Otros') miscTotal += e.amount;
    }
    const miscPercent = total > 0 ? (miscTotal / total) * 100 : 0;
    if (profile === 'ella') setIsFragmented(miscPercent > 20);
  }, [allocationsB, profile]);

  // Update categories based on tasks
  useEffect(() => {
    // ⚡ Bolt Optimization: Single O(N) pass to group tasks by category instead of calling .filter() repeatedly
    const catStats = new Map<string, { total: number; done: number }>();
    for (const t of tasks) {
      const stats = catStats.get(t.category) || { total: 0, done: 0 };
      stats.total++;
      if (t.status === 'done') stats.done++;
      catStats.set(t.category, stats);
    }

    const calculateCategoryScore = (cat: string) => {
      const stats = catStats.get(cat);
      if (!stats || stats.total === 0) return 50;
      return (stats.done / stats.total) * 100;
    };

    const updateScores = (prev: any) => ({
      ...prev,
      work: calculateCategoryScore('work'),
      home: calculateCategoryScore('home'),
      personal: calculateCategoryScore('personal'),
    });

    if (profile === 'el') {
      setDataA(prev => {
        const next = updateScores(prev);
        localStorage.setItem('symmetry_A_data', JSON.stringify(next));
        return next;
      });
    } else {
      setDataB(prev => {
        const next = updateScores(prev);
        localStorage.setItem('symmetry_B_data', JSON.stringify(next));
        return next;
      });
    }
  }, [tasks, profile]);

  const handleTasksUpdate = useCallback((score: number) => {
    setFocusScore(score);
  }, []);

  const { updateData } = useStore();
  const handleAllocationsChange = (newAllocations: any[]) => {
    // Determine which profile is making the change
    const profileUpdating = profile;
    const otherProfileAllocations = storeAllocations.filter((a: any) => a.profile !== profileUpdating);

    // Assign profile to new allocations
    const newWithProfile = newAllocations.map(a => ({ ...a, profile: profileUpdating }));

    // Sync to store
    updateData({ allocations: [...otherProfileAllocations, ...newWithProfile] });
  };

  const [activeTab, setActiveTab] = useState<'tasks' | 'finances'>('tasks');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URL(window.location.href).searchParams;
      const tab = params.get('tab');
      if (tab === 'tasks' || tab === 'finances') {
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById('dashboard-content');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, []);

  const activeAccent = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';

  // ⚡ Bolt Optimization: Prevent O(N) intermediate array allocation when counting active tasks
  const activeTasks = useMemo(() => {
    let count = 0;
    for (const t of tasks) {
      if (t.status === 'in_progress') count++;
    }
    return count;
  }, [tasks]);

  // Calculate financial statistics for dynamic header cell
  const userAllocations = useMemo(() => profile === 'el' ? allocationsA : allocationsB, [profile, allocationsA, allocationsB]);

  // ⚡ Bolt Optimization: Replace userAllocations.reduce() with a single pass O(N) loop
  const totalSpent = useMemo(() => {
    let sum = 0;
    for (const a of userAllocations) {
      sum += a.amount;
    }
    return sum;
  }, [userAllocations]);

  // ⚡ Bolt Optimization: Replace storeAllocations.reduce() with a single pass O(N) loop
  const combinedTotalSpent = useMemo(() => {
    let sum = 0;
    for (const a of storeAllocations) {
      sum += (a as any).amount;
    }
    return sum;
  }, [storeAllocations]);

  const formatPriceCompact = (v: number) => {
    if (v >= 1000000) {
      return '$ ' + (v / 1000000).toFixed(1) + 'M';
    }
    if (v >= 1000) {
      return '$ ' + Math.round(v / 1000) + 'k';
    }
    return '$ ' + v;
  };

  const accentColorValue = profile === 'ella' ? '#ff4b89' : '#c3f400';
  const accentAlphaValue = profile === 'ella' ? 'rgba(255, 75, 137, 0.3)' : 'rgba(195, 244, 0, 0.3)';

  return (
    <div
      className="relative mx-auto w-full max-w-[98vw] 2xl:max-w-[1920px] px-2 pb-24 text-[#e5e2e1] sm:px-4 font-sans"
      style={{
        '--color-profile-accent': accentColorValue,
        '--color-profile-accent-alpha': accentAlphaValue
      } as React.CSSProperties}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-mosaic opacity-50" />

      {/* Merged Master HUD Header & Tab Selector */}
      <div className="mb-6 space-y-3">
        {/* Main Title Strip */}
        <div className="border border-white/12 p-3.5 sm:p-5 bg-white/[0.04] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_12px_32px_rgba(0,0,0,0.5)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 font-mono">
            <span className="text-xs animate-spin-slow" style={{ color: accentColorValue }}>◆</span>
            <div>
              <p className="text-[8.5px] font-mono font-bold uppercase tracking-[0.24em] text-[#a88a7e]">
                PANEL DE CONTROL // SINTONÍA
              </p>
              <h1 className="text-base sm:text-xl font-bold uppercase tracking-tight text-white leading-none mt-0.5">
                DÍA A DÍA · OPERACIONES Y FINANZAS
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[8.5px] uppercase font-bold tracking-[0.2em] px-2.5 py-1 border border-white/15 bg-black/40 backdrop-blur-md flex items-center gap-1.5" style={{ color: accentColorValue }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColorValue }} />
              <span>SISTEMA ACTIVO</span>
            </span>
          </div>
        </div>

        {/* 2 Merged Interactive Module Cards with Autoplay Video */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Card 1: Operaciones */}
          <button
            onClick={() => {
              if (activeTab !== 'tasks') {
                haptics.triggerTick();
                setActiveTab('tasks');
              }
            }}
            className={`group relative overflow-hidden text-left p-4 sm:p-5 border transition-all duration-300 active:scale-[0.99] flex flex-col justify-between gap-4 ${
              activeTab === 'tasks'
                ? 'border-white/30 bg-white/[0.07] backdrop-blur-2xl shadow-[0_0_24px_-4px_rgba(0,0,0,0.6)]'
                : 'border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05] text-[#a88a7e]'
            }`}
            style={{
              borderColor: activeTab === 'tasks' ? accentColorValue : undefined,
              boxShadow: activeTab === 'tasks' ? `0 0 22px -6px ${accentColorValue}` : undefined
            }}
          >
            {activeTab === 'tasks' && (
              <motion.div
                layoutId="dashboardActiveDeck"
                className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}

            {/* Corner HUD Brackets */}
            <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 pointer-events-none transition-all duration-300 group-hover:scale-125" style={{ borderColor: activeTab === 'tasks' ? accentColorValue : 'rgba(255,255,255,0.15)' }} />
            <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 pointer-events-none transition-all duration-300 group-hover:scale-125" style={{ borderColor: activeTab === 'tasks' ? accentColorValue : 'rgba(255,255,255,0.15)' }} />
            <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 pointer-events-none transition-all duration-300 group-hover:scale-125" style={{ borderColor: activeTab === 'tasks' ? accentColorValue : 'rgba(255,255,255,0.15)' }} />
            <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 pointer-events-none transition-all duration-300 group-hover:scale-125" style={{ borderColor: activeTab === 'tasks' ? accentColorValue : 'rgba(255,255,255,0.15)' }} />

            {/* Top Bar: Code & Status */}
            <div className="flex items-center justify-between gap-2 relative z-10 w-full">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[8.5px] font-black tracking-[0.2em] transition-colors" style={{ color: activeTab === 'tasks' ? accentColorValue : undefined }}>
                  SYS // 01 · OPERACIONES
                </span>
                {activeTab === 'tasks' && (
                  <span className="font-mono text-[7.5px] uppercase font-bold tracking-wider px-1.5 py-0.2 border bg-black/40 text-white border-white/10">
                    SELECCIONADO
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {activeTab === 'tasks' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: accentColorValue }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: accentColorValue }} />
                  </span>
                )}
                <span className={`text-[9px] font-mono font-bold ${activeTab === 'tasks' ? 'text-white' : 'text-white/30'}`}>
                  01
                </span>
              </div>
            </div>

            {/* Main Content: Info + Autoplay Video */}
            <div className="flex items-center justify-between gap-4 relative z-10 w-full">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: activeTab === 'tasks' ? accentColorValue : undefined }} />
                  <h2 className={`font-mono text-base sm:text-lg font-black uppercase tracking-tight transition-colors truncate ${activeTab === 'tasks' ? 'text-white' : 'text-[#e5e2e1]/85 group-hover:text-white'}`}>
                    Tareas y Ritmo
                  </h2>
                </div>
                <p className="font-sans text-[10px] text-[#e1bfb2]/65 line-clamp-1">
                  Registro diario, temporizador Pomodoro y objetivos
                </p>
              </div>

              {/* Autoplay Planning Cat Video */}
              <div className="relative h-16 w-16 sm:h-18 sm:w-18 border border-white/15 bg-black/50 backdrop-blur-md p-0.5 flex-shrink-0 overflow-hidden shadow-inner">
                <AnimatedBrutalistCorners color={activeTab === 'tasks' ? accentColorValue : 'rgba(255,255,255,0.2)'} size={6} />
                <video
                  className="h-full w-full object-cover opacity-85 mix-blend-screen contrast-125"
                  src="vid/planningCat.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
            </div>

            {/* Telemetry Stat Strip */}
            <div className="grid grid-cols-3 border border-white/10 text-center bg-black/40 rounded-none w-full relative z-10">
              <div className="border-r border-white/10 px-2 py-1.5">
                <div className={`text-base font-bold font-mono tracking-tighter ${profile === 'ella' ? 'text-user-a' : 'text-user-b'}`}>{tasks.length}</div>
                <div className="text-[7.5px] font-bold uppercase tracking-[0.15em] text-[#a88a7e]">Tareas</div>
              </div>
              <div className="border-r border-white/10 px-2 py-1.5">
                <div className="text-base font-bold font-mono tracking-tighter text-user-c">{activeTasks}</div>
                <div className="text-[7.5px] font-bold uppercase tracking-[0.15em] text-[#a88a7e]">En curso</div>
              </div>
              <div className="px-2 py-1.5">
                <div className={`text-base font-bold font-mono tracking-tighter ${profile === 'ella' ? 'text-user-b' : 'text-user-a'}`}>{Math.round(focusScore)}%</div>
                <div className="text-[7.5px] font-bold uppercase tracking-[0.15em] text-[#a88a7e]">Enfoque</div>
              </div>
            </div>

            {/* Active Neon Baseline Accent Bar */}
            {activeTab === 'tasks' && (
              <motion.div
                layoutId="dashboardBaselineAccent"
                className="absolute bottom-0 left-0 right-0 h-[2px] shadow-[0_0_10px_var(--color-profile-accent)]"
                style={{ backgroundColor: accentColorValue }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </button>

          {/* Card 2: Finanzas */}
          <button
            onClick={() => {
              if (activeTab !== 'finances') {
                haptics.triggerTick();
                setActiveTab('finances');
              }
            }}
            className={`group relative overflow-hidden text-left p-4 sm:p-5 border transition-all duration-300 active:scale-[0.99] flex flex-col justify-between gap-4 ${
              activeTab === 'finances'
                ? 'border-white/30 bg-white/[0.07] backdrop-blur-2xl shadow-[0_0_24px_-4px_rgba(0,0,0,0.6)]'
                : 'border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05] text-[#a88a7e]'
            }`}
            style={{
              borderColor: activeTab === 'finances' ? accentColorValue : undefined,
              boxShadow: activeTab === 'finances' ? `0 0 22px -6px ${accentColorValue}` : undefined
            }}
          >
            {activeTab === 'finances' && (
              <motion.div
                layoutId="dashboardActiveDeck"
                className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}

            {/* Corner HUD Brackets */}
            <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 pointer-events-none transition-all duration-300 group-hover:scale-125" style={{ borderColor: activeTab === 'finances' ? accentColorValue : 'rgba(255,255,255,0.15)' }} />
            <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 pointer-events-none transition-all duration-300 group-hover:scale-125" style={{ borderColor: activeTab === 'finances' ? accentColorValue : 'rgba(255,255,255,0.15)' }} />
            <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 pointer-events-none transition-all duration-300 group-hover:scale-125" style={{ borderColor: activeTab === 'finances' ? accentColorValue : 'rgba(255,255,255,0.15)' }} />
            <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 pointer-events-none transition-all duration-300 group-hover:scale-125" style={{ borderColor: activeTab === 'finances' ? accentColorValue : 'rgba(255,255,255,0.15)' }} />

            {/* Top Bar: Code & Status */}
            <div className="flex items-center justify-between gap-2 relative z-10 w-full">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[8.5px] font-black tracking-[0.2em] transition-colors" style={{ color: activeTab === 'finances' ? accentColorValue : undefined }}>
                  SYS // 02 · FINANZAS
                </span>
                {activeTab === 'finances' && (
                  <span className="font-mono text-[7.5px] uppercase font-bold tracking-wider px-1.5 py-0.2 border bg-black/40 text-white border-white/10">
                    SELECCIONADO
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {activeTab === 'finances' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: accentColorValue }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: accentColorValue }} />
                  </span>
                )}
                <span className={`text-[9px] font-mono font-bold ${activeTab === 'finances' ? 'text-white' : 'text-white/30'}`}>
                  02
                </span>
              </div>
            </div>

            {/* Main Content: Info + Autoplay Video */}
            <div className="flex items-center justify-between gap-4 relative z-10 w-full">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <WalletCards className="h-5 w-5 shrink-0" style={{ color: activeTab === 'finances' ? accentColorValue : undefined }} />
                  <h2 className={`font-mono text-base sm:text-lg font-black uppercase tracking-tight transition-colors truncate ${activeTab === 'finances' ? 'text-white' : 'text-[#e5e2e1]/85 group-hover:text-white'}`}>
                    Control Presupuestario
                  </h2>
                </div>
                <p className="font-sans text-[10px] text-[#e1bfb2]/65 line-clamp-1">
                  Movimientos compartidos, balances y gráficos de gastos
                </p>
              </div>

              {/* Autoplay Finances Cat Video */}
              <div className="relative h-16 w-16 sm:h-18 sm:w-18 border border-white/15 bg-black/50 backdrop-blur-md p-0.5 flex-shrink-0 overflow-hidden shadow-inner">
                <AnimatedBrutalistCorners color={activeTab === 'finances' ? accentColorValue : 'rgba(255,255,255,0.2)'} size={6} />
                <video
                  className="h-full w-full object-cover opacity-85 mix-blend-screen contrast-125"
                  src="vid/financesCat.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
            </div>

            {/* Telemetry Stat Strip */}
            <div className="grid grid-cols-3 border border-white/10 text-center bg-black/40 rounded-none w-full relative z-10">
              <div className="border-r border-white/10 px-2 py-1.5">
                <div className={`text-base font-bold font-mono tracking-tighter ${profile === 'ella' ? 'text-user-a' : 'text-user-b'}`}>{userAllocations.length}</div>
                <div className="text-[7.5px] font-bold uppercase tracking-[0.15em] text-[#a88a7e]">Registros</div>
              </div>
              <div className="border-r border-white/10 px-2 py-1.5">
                <div className="text-base font-bold font-mono tracking-tighter text-user-c">{formatPriceCompact(totalSpent)}</div>
                <div className="text-[7.5px] font-bold uppercase tracking-[0.15em] text-[#a88a7e]">Tus gastos</div>
              </div>
              <div className="px-2 py-1.5">
                <div className={`text-base font-bold font-mono tracking-tighter ${profile === 'ella' ? 'text-user-b' : 'text-user-a'}`}>{formatPriceCompact(combinedTotalSpent)}</div>
                <div className="text-[7.5px] font-bold uppercase tracking-[0.15em] text-[#a88a7e]">Juntos</div>
              </div>
            </div>

            {/* Active Neon Baseline Accent Bar */}
            {activeTab === 'finances' && (
              <motion.div
                layoutId="dashboardBaselineAccent"
                className="absolute bottom-0 left-0 right-0 h-[2px] shadow-[0_0_10px_var(--color-profile-accent)]"
                style={{ backgroundColor: accentColorValue }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </button>
        </div>
      </div>

      <div id="dashboard-content">
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' ? (
            <TasksTab
              tasks={tasks}
              objectives={objectives}
              profile={profile || ''}
              accentColorValue={accentColorValue}
              focusScore={focusScore}
              activeTasks={activeTasks}
              handleTasksUpdate={handleTasksUpdate}
            />
          ) : (
            <FinancesTab
              profile={profile || ''}
              userAllocations={userAllocations}
              allocationsA={allocationsA}
              allocationsB={allocationsB}
              totalSpent={totalSpent}
              combinedTotalSpent={combinedTotalSpent}
              handleAllocationsChange={handleAllocationsChange}
              mode={mode}
              accentColorValue={accentColorValue}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
