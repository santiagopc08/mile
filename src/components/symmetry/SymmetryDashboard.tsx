'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TaskModule } from './TaskModule';
import { useStore } from '@/context/StoreContext';
import { useVisibility } from '@/context/VisibilityContext';
import { useProfile } from '@/context/ProfileContext';
import { TaskAnalytics } from './TaskAnalytics';
import { PomodoroTimer } from './PomodoroTimer';
import { DualWallet } from './DualWallet';
import { FinanceChart } from './FinanceChart';
import { StoreService } from '@/services/storeService';
import { useMemo } from 'react';
import { Activity, BarChart3, Eye, ShieldCheck, WalletCards, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';
import { NotificationsFeed } from '@/components/NotificationsFeed';

interface Task {
  id: string;
  text: string;
  status: 'todo' | 'in_progress' | 'done' | 'skipped';
  category: string;
  priority?: 'low' | 'medium' | 'high';
  actual_time: number;
  estimated_time: number;
}

export const SymmetryDashboard = () => {
  const { mode, toggleMode } = useVisibility();
  const { profile } = useProfile();
  const { data } = useStore();
  const tasks = useMemo(() => (data?.tasks as Task[]) || [], [data?.tasks]);
  const objectives = useMemo(() => (data?.objectives as any[]) || [], [data?.objectives]);
  const [focusScore, setFocusScore] = useState(0);
  const [isFragmented, setIsFragmented] = useState(false);
  const [dataA, setDataA] = useState({ academic: 45, fitness: 65, work: 80, home: 70, personal: 60 });
  const [dataB, setDataB] = useState({ academic: 75, fitness: 40, work: 90, home: 65, personal: 85 });
  const [allocationsA, setAllocationsA] = useState<any[]>([]);
  const [allocationsB, setAllocationsB] = useState<any[]>([]);
  const storeAllocations = useMemo(() => data?.allocations || [], [data?.allocations]);

  useEffect(() => {
    setAllocationsA(storeAllocations.filter((a: any) => a.profile === 'el'));
    setAllocationsB(storeAllocations.filter((a: any) => a.profile === 'ella'));
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
  useEffect(() => {
    const total = allocationsA.reduce((sum, e) => sum + e.amount, 0);
    const miscTotal = allocationsA.filter(e => e.category === '🎲 Otros').reduce((sum, e) => sum + e.amount, 0);
    const miscPercent = total > 0 ? (miscTotal / total) * 100 : 0;
    if (profile === 'el') setIsFragmented(miscPercent > 20);
  }, [allocationsA, profile]);

  useEffect(() => {
    const total = allocationsB.reduce((sum, e) => sum + e.amount, 0);
    const miscTotal = allocationsB.filter(e => e.category === '🎲 Otros').reduce((sum, e) => sum + e.amount, 0);
    const miscPercent = total > 0 ? (miscTotal / total) * 100 : 0;
    if (profile === 'ella') setIsFragmented(miscPercent > 20);
  }, [allocationsB, profile]);

  // Update categories based on tasks
  useEffect(() => {
    const calculateCategoryScore = (cat: string) => {
      const catTasks = tasks.filter(t => t.category === cat);
      if (catTasks.length === 0) return 50;
      return (catTasks.filter((t: any) => t.status === 'done').length / catTasks.length) * 100;
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

  // Collapsible drawer states
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'tasks' || tab === 'finances') {
        setActiveTab(tab);
      }
    }
  }, []);

  const activeAccent = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const activeTasks = tasks.filter(t => t.status === 'in_progress').length;

  // Calculate financial statistics for dynamic header cell
  const userAllocations = useMemo(() => profile === 'el' ? allocationsA : allocationsB, [profile, allocationsA, allocationsB]);
  const totalSpent = useMemo(() => userAllocations.reduce((sum, a) => sum + a.amount, 0), [userAllocations]);
  const combinedTotalSpent = useMemo(() => storeAllocations.reduce((sum, a: any) => sum + a.amount, 0), [storeAllocations]);

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
      className="relative mx-auto w-full max-w-[95%] 2xl:max-w-[1800px] px-4 pb-24 text-[#e5e2e1] sm:px-6"
      style={{ 
        '--color-profile-accent': accentColorValue,
        '--color-profile-accent-alpha': accentAlphaValue
      } as React.CSSProperties}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-mosaic opacity-50" />

      <div className="border-x border-white/10">
        <div className="border-y border-white/10 bg-[#0a0a0a]/95">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute left-0 top-0 h-full w-px" style={{ backgroundColor: activeAccent }} />
            <div className="mb-8 flex items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#a88a7e]">
                <span className={`border px-2 py-1 ${profile === 'ella' ? 'border-user-a/50 text-user-a' : 'border-user-b/50 text-user-b'}`}>ENFOQUE</span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-user-c" />
                  CONECTADOS
                </span>
              </div>
            </div>
            <h1 className="text-5xl font-black uppercase leading-[0.92] tracking-normal text-white sm:text-7xl lg:text-8xl">
              Eficiencia
            </h1>
            <div className="mt-6 grid max-w-4xl gap-5 border-t border-white/10 pt-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <p className="max-w-2xl text-sm leading-6 tracking-normal text-[#e1bfb2] md:text-base font-sans">
                {activeTab === 'tasks' 
                  ? 'Plataforma de gestión de operaciones, objetivos y tareas cotidianas.'
                  : 'Bitácora financiera compartida, distribución de presupuesto y proyección.'}
              </p>
              
              {activeTab === 'tasks' ? (
                <div className="grid grid-cols-3 border border-white/10 text-center bg-black/20 rounded-none shrink-0 min-w-[280px]">
                  <div className="border-r border-white/10 px-4 py-3">
                    <div className={`text-2xl font-black font-mono tracking-tighter ${profile === 'ella' ? 'text-user-a' : 'text-user-b'}`}>{tasks.length}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] mt-1">Tareas</div>
                  </div>
                  <div className="border-r border-white/10 px-4 py-3">
                    <div className="text-2xl font-black font-mono tracking-tighter text-user-c">{activeTasks}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] mt-1">Activas</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className={`text-2xl font-black font-mono tracking-tighter ${profile === 'ella' ? 'text-user-b' : 'text-user-a'}`}>{Math.round(focusScore)}%</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] mt-1">Enfoque</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 border border-white/10 text-center bg-black/20 rounded-none shrink-0 min-w-[280px]">
                  <div className="border-r border-white/10 px-4 py-3">
                    <div className={`text-2xl font-black font-mono tracking-tighter ${profile === 'ella' ? 'text-user-a' : 'text-user-b'}`}>{userAllocations.length}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] mt-1">Registros</div>
                  </div>
                  <div className="border-r border-white/10 px-4 py-3">
                    <div className="text-2xl font-black font-mono tracking-tighter text-user-c">{formatPriceCompact(totalSpent)}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] mt-1">Gastos Tuyos</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className={`text-2xl font-black font-mono tracking-tighter ${profile === 'ella' ? 'text-user-b' : 'text-user-a'}`}>{formatPriceCompact(combinedTotalSpent)}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] mt-1">Gastado Juntos</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-white/10 bg-black">
          {([
            { label: 'Operaciones', key: 'tasks' as const, icon: ShieldCheck, index: '01' },
            { label: 'Finanzas', key: 'finances' as const, icon: WalletCards, index: '02' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`group relative flex min-h-20 items-center justify-between border-r border-white/10 px-4 py-4 transition-all last:border-r-0 ${activeTab === tab.key
                ? 'text-black font-black'
                : 'bg-[#0a0a0a] text-[#a88a7e] hover:bg-[#121212] hover:text-white'
                }`}
              style={activeTab === tab.key ? { backgroundColor: activeAccent } : undefined}
            >
              <span className="flex flex-col items-start gap-2">
                <tab.icon className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.22em]">{tab.label}</span>
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${activeTab === tab.key ? 'text-black/55' : 'text-white/20 group-hover:text-white'}`}>
                {tab.index}
              </span>
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-0 bottom-0 h-1 bg-user-c"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tasks' ? (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8 border-x border-white/10 bg-[#050505] p-3 sm:p-5 md:p-8"
          >
            {/* Task Video Header */}
            <div className="grid gap-4 border border-white/10 bg-[#0a0a0a] p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
              <div className="relative h-28 w-28 border border-white/10 bg-black p-1">
                <AnimatedBrutalistCorners color="var(--color-user-a)" />
                <video
                  className="h-full w-full object-cover opacity-80 mix-blend-screen contrast-125"
                  src="vid/planningCat.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  webkit-playsinline="true"
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-user-c">Plataforma de gestión</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-normal text-white">Ejecución y planeación</h2>
              </div>
              <BarChart3 className="hidden h-10 w-10 text-user-a md:block" strokeWidth={1} />
            </div>

             {/* Row 0: Pomodoro (COLLAPSIBLE) */}
            <div className="border border-white/10 bg-[#0a0a0a] rounded-none overflow-hidden transition-all duration-300 relative">
              <AnimatedBrutalistCorners color={accentColorValue} size={8} thickness={1} />
              <button 
                onClick={() => setIsPomodoroOpen(!isPomodoroOpen)} 
                className="w-full px-5 py-4 flex items-center justify-between bg-black/40 hover:bg-black/60 transition-colors text-left"
              >
                <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                  <Clock size={14} className="stroke-[1.5]" style={{ color: accentColorValue }} />
                  TEMPORIZADOR DE ENFOQUE (POMODORO)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[7.5px] font-mono opacity-40 uppercase tracking-widest">{isPomodoroOpen ? 'Ocultar' : 'Mostrar'}</span>
                  {isPomodoroOpen ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
                </div>
              </button>
              
              <AnimatePresence>
                {isPomodoroOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10 p-6 sm:p-8"
                  >
                    <PomodoroTimer />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Row 1: Kanban Board (Always Expanded - Core Interface) */}
            <div className="geometric-card relative border-white/10 bg-[#0a0a0a] p-6 sm:p-8 overflow-hidden">
              <AnimatedBrutalistCorners color={accentColorValue} />
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <ShieldCheck size={120} style={{ color: accentColorValue }} />
              </div>
              <h2 className="mb-8 flex items-center justify-between border-b border-white/5 pb-4 text-[10px] font-black uppercase tracking-[0.22em] relative z-10" style={{ color: accentColorValue }}>
                <span>NUESTRAS TAREAS Y OBJETIVOS</span>
                <span className="hidden text-[8px] opacity-50 sm:inline">CONECTADOS // EN LÍNEA</span>
              </h2>
              <TaskModule onTasksUpdate={handleTasksUpdate} />
            </div>

            {/* Row 2: Analytics (COLLAPSIBLE) */}
            <div className="border border-white/10 bg-[#0a0a0a] rounded-none overflow-hidden transition-all duration-300 relative">
              <AnimatedBrutalistCorners color="#00dbe9" size={8} thickness={1} />
              <button 
                onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)} 
                className="w-full px-5 py-4 flex items-center justify-between bg-black/40 hover:bg-black/60 transition-colors text-left"
              >
                <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                  <BarChart3 size={14} className="stroke-[1.5] text-[#00dbe9]" />
                  MÉTRICAS Y ANÁLISIS DE PROGRESO
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[7.5px] font-mono opacity-40 uppercase tracking-widest">{isAnalyticsOpen ? 'Ocultar' : 'Mostrar'}</span>
                  {isAnalyticsOpen ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
                </div>
              </button>
              
              <AnimatePresence>
                {isAnalyticsOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10 p-6 sm:p-8"
                  >
                    <TaskAnalytics tasks={tasks} objectives={objectives} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Row 3: Bitácora de Alertas en Tiempo Real (COLLAPSIBLE) */}
            <div className="border border-white/10 bg-[#0a0a0a] rounded-none overflow-hidden transition-all duration-300 relative">
              <AnimatedBrutalistCorners color={accentColorValue} size={8} thickness={1} />
              <button 
                onClick={() => setIsActivityOpen(!isActivityOpen)} 
                className="w-full px-5 py-4 flex items-center justify-between bg-black/40 hover:bg-black/60 transition-colors text-left"
              >
                <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                  <Activity size={14} className="stroke-[1.5]" style={{ color: accentColorValue }} />
                  BITÁCORA DE ACTIVIDAD COMPARTIDA
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[7.5px] font-mono opacity-40 uppercase tracking-widest">{isActivityOpen ? 'Ocultar' : 'Mostrar'}</span>
                  {isActivityOpen ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
                </div>
              </button>
              
              <AnimatePresence>
                {isActivityOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10 p-6 sm:p-8"
                  >
                    <NotificationsFeed />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="finances"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8 border-x border-white/10 bg-[#050505] p-3 sm:p-5 md:p-8"
          >
            {/* Finance Video Header */}
            <div className="grid gap-4 border border-white/10 bg-[#0a0a0a] p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
              <div className="relative h-28 w-28 border border-white/10 bg-black p-1">
                <AnimatedBrutalistCorners color="var(--color-user-a)" />
                <video
                  className="h-full w-full object-cover opacity-80 mix-blend-screen contrast-125"
                  src="vid/financesCat.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  webkit-playsinline="true"
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-user-c">Actividad Financiera</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-normal text-white">Nuestro Balance</h2>
              </div>
              <WalletCards className="hidden h-10 w-10 text-user-a md:block" strokeWidth={1} />
            </div>

            <div className="grid grid-cols-1 gap-8">
              {/* Financial Movement Log & Form (Always Expanded - Core Ledger) */}
              <div className="geometric-card relative border-white/10 bg-[#0a0a0a] p-6 overflow-hidden">
                <AnimatedBrutalistCorners color={accentColorValue} />
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <WalletCards size={120} style={{ color: accentColorValue }} />
                </div>
                <h2 className="mb-6 flex items-center justify-between border-b border-white/5 pb-3 text-[10px] font-black uppercase tracking-[0.22em] relative z-10" style={{ color: accentColorValue }}>
                  <span>NUESTRAS FINANZAS</span>
                  <span className="text-[8px] opacity-50">HISTORIAL DE MOVIMIENTOS</span>
                </h2>
                <DualWallet
                  allocations={profile === 'el' ? allocationsA : allocationsB}
                  onAllocationsChange={handleAllocationsChange}
                />
              </div>

              {/* Finance Chart (COLLAPSIBLE) */}
              <div className="border border-white/10 bg-[#0a0a0a] rounded-none overflow-hidden transition-all duration-300 relative">
                <AnimatedBrutalistCorners color="var(--color-user-a)" size={8} thickness={1} />
                <button 
                  onClick={() => setIsChartOpen(!isChartOpen)} 
                  className="w-full px-5 py-4 flex items-center justify-between bg-black/40 hover:bg-black/60 transition-colors text-left"
                >
                  <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                    <BarChart3 size={14} className="stroke-[1.5] text-user-a" />
                    DISTRIBUCIÓN Y ANÁLISIS GRÁFICO DE GASTOS
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[7.5px] font-mono opacity-40 uppercase tracking-widest">{isChartOpen ? 'Ocultar' : 'Mostrar'}</span>
                    {isChartOpen ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
                  </div>
                </button>
                
                <AnimatePresence>
                  {isChartOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10 p-6 sm:p-8"
                    >
                      <div className="h-64">
                        <FinanceChart
                          allocationsElla={mode === 'me' && profile === 'el' ? [] : allocationsB}
                          allocationsEl={mode === 'me' && profile === 'ella' ? [] : allocationsA}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
