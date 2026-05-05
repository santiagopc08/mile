'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TaskModule } from './TaskModule';
import { TaskStatsChart } from './TaskStatsChart';
import { useStore } from '@/context/StoreContext';
import { useVisibility } from '@/context/VisibilityContext';
import { useProfile } from '@/context/ProfileContext';
import { TaskAnalytics } from './TaskAnalytics';
import { PomodoroTimer } from './PomodoroTimer';
import { DualWallet } from './DualWallet';
import { FinanceChart } from './FinanceChart';
import { StoreService } from '@/services/storeService';
import { useMemo } from 'react';

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
  const [focusScore, setFocusScore] = useState(0);
  const [isFragmented, setIsFragmented] = useState(false);
  const [dataA, setDataA] = useState({ academic: 45, fitness: 65, work: 80, home: 70, personal: 60 });
  const [dataB, setDataB] = useState({ academic: 75, fitness: 40, work: 90, home: 65, personal: 85 });
  const [allocationsA, setAllocationsA] = useState<any[]>([]);
  const [allocationsB, setAllocationsB] = useState<any[]>([]);

  useEffect(() => {
    const savedA = localStorage.getItem('symmetry_A_data');
    const savedB = localStorage.getItem('symmetry_B_data');
    if (savedA) setDataA(JSON.parse(savedA));
    if (savedB) setDataB(JSON.parse(savedB));

    const allocA = localStorage.getItem('symmetry_A_allocations') || localStorage.getItem('symmetry_A_expenses');
    const allocB = localStorage.getItem('symmetry_B_allocations') || localStorage.getItem('symmetry_B_expenses');
    if (allocA) setAllocationsA(JSON.parse(allocA));
    if (allocB) setAllocationsB(JSON.parse(allocB));

    const fetchData = async () => {
      try {
        // Data is now handled by StoreContext, but we can still perform initial fetch if needed
        await StoreService.getStore();
      } catch (e) {
        console.error("Failed to initialize store", e);
      }
    };
    fetchData();
  }, []);

  // Sync allocations to localStorage
  useEffect(() => {
    localStorage.setItem('symmetry_A_allocations', JSON.stringify(allocationsA));
    const total = allocationsA.reduce((sum, e) => sum + e.amount, 0);
    const miscTotal = allocationsA.filter(e => e.category === '🎲 Otros').reduce((sum, e) => sum + e.amount, 0);
    const miscPercent = total > 0 ? (miscTotal / total) * 100 : 0;
    if (profile === 'el') setIsFragmented(miscPercent > 20);
  }, [allocationsA, profile]);

  useEffect(() => {
    localStorage.setItem('symmetry_B_allocations', JSON.stringify(allocationsB));
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

  const [activeTab, setActiveTab] = useState<'tasks' | 'finances'>('tasks');

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-24 px-4 sm:px-6 font-sans text-stone-200">
      {/* Header */}
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row border-b border-white/10 pb-6 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-1">
            <div className="w-2 h-2 bg-user-a" />
            <div className="w-2 h-2 bg-user-a" />
            <div className="w-2 h-2 bg-user-a" />
            <div className="w-2 h-2 bg-user-a opacity-50" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-[0.3em] uppercase text-user-a font-mono">
            Symmetry
          </h1>
        </div>

        <div className="flex gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleMode}
            className="px-6 py-2 uppercase text-[10px] font-mono tracking-[0.2em] transition-colors border"
            style={{
              borderColor: mode === 'us' ? 'var(--color-user-b)' : 'var(--color-user-a)',
              color: mode === 'us' ? 'var(--color-user-b)' : 'var(--color-user-a)',
              boxShadow: `0 0 10px ${mode === 'us' ? 'var(--color-user-b)' : 'var(--color-user-a)'}20`
            }}
          >
            [ {mode === 'me' ? 'PERSONAL VIEW' : 'SHARED VIEW'} ]
          </motion.button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-white/10 pb-px">
        {(['operaciones', 'finanzas'] as const).map((tab) => {
          const tabKey = tab === 'operaciones' ? 'tasks' : 'finances';
          return (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`pb-3 text-[10px] font-mono uppercase tracking-[0.2em] transition-all relative ${activeTab === tabKey
                ? 'text-user-a opacity-100'
                : 'text-stone-500 hover:text-stone-300'
                }`}
            >
              {tab.toUpperCase()}
              {activeTab === tabKey && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-user-a"
                  style={{ boxShadow: '0 0 8px var(--color-user-a)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tasks' ? (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            {/* Task Video Header */}
            <div className="flex justify-center py-4">
              <div className="relative p-1 border border-white/10 bg-black">
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-user-a" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-user-a" />
                <video
                  className="w-32 h-32 object-cover contrast-125 opacity-80 mix-blend-screen"
                  src="vid/planningCat.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  webkit-playsinline="true"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className="w-1 h-1 bg-user-a animate-pulse" />
                </div>
              </div>
            </div>

            {/* Row 0: Pomodoro */}
            <div className="geometric-card p-6 sm:p-8 border-white/10 relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-user-a" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-user-a" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-user-a" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-user-a" />

              <h2 className="text-[10px] uppercase font-mono tracking-[0.2em] mb-8 border-b border-white/10 pb-3 text-stone-400 flex justify-between items-center">
                <span>[ ESTADO_DEL_SISTEMA ] OPERATIVO</span>
                <span className="text-[8px] opacity-50">[ VERSIÓN_NODO ] V2.4.0_ESTABLE</span>
              </h2>
              <PomodoroTimer />
            </div>

            {/* Row 1: Kanban Board */}
            <div className="geometric-card p-6 sm:p-8 border-white/10 relative">
              <h2 className="text-[10px] uppercase font-mono tracking-[0.2em] mb-8 border-b border-white/10 pb-3 text-stone-400 flex justify-between items-center">
                <span>{'>'} _ MATRIZ DE OPERACIONES</span>
                <span className="text-[8px] opacity-50">[ DB_SYNC ] ONLINE</span>
              </h2>
              <TaskModule onTasksUpdate={handleTasksUpdate} />
            </div>

            {/* Row 2: Analytics */}
            <div className="geometric-card p-6 sm:p-8 border-white/10 relative">
              <h2 className="text-[10px] uppercase font-mono tracking-[0.2em] mb-8 border-b border-white/10 pb-3 flex items-center gap-2 text-stone-400">
                <div className="w-1.5 h-1.5 bg-user-c" style={{ boxShadow: '0 0 5px var(--color-user-c)' }} />
                [ / ] DIAGNÓSTICO DE RENDIMIENTO
              </h2>
              <TaskAnalytics tasks={tasks} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="finances"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            {/* Finance Video Header */}
            <div className="flex justify-center py-4">
              <div className="relative p-1 border border-white/10 bg-black">
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-user-a" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-user-a" />
                <video
                  className="w-32 h-32 object-cover contrast-125 opacity-80 mix-blend-screen"
                  src="vid/financesCat.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  webkit-playsinline="true"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className="w-1 h-1 bg-user-a animate-pulse" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="geometric-card p-6 border-white/10 relative">
                <h2 className="text-[10px] uppercase font-mono tracking-[0.2em] mb-6 border-b border-white/10 pb-2 flex justify-between items-center text-stone-400">
                  <span>[ / ] GESTIÓN FINANCIERA</span>
                  <span className="text-[8px] opacity-50">BITÁCORA DE FLUJO</span>
                </h2>
                <DualWallet
                  allocations={profile === 'el' ? allocationsA : allocationsB}
                  onAllocationsChange={profile === 'el' ? setAllocationsA : setAllocationsB}
                />
              </div>
              <div className="geometric-card p-6 sm:p-8 border-white/10 relative">
                <h2 className="text-[10px] uppercase font-mono tracking-[0.2em] mb-8 border-b border-white/10 pb-3 flex items-center gap-2 text-stone-400">
                  <div className="w-1.5 h-1.5 bg-user-a" style={{ boxShadow: '0 0 5px var(--color-user-a)' }} />
                  {'>'} ANÁLISIS DE BALANCE
                </h2>
                <div className="h-64">
                  <FinanceChart
                    allocationsA={mode === 'me' && profile === 'ella' ? [] : allocationsA}
                    allocationsB={mode === 'me' && profile === 'el' ? [] : allocationsB}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
