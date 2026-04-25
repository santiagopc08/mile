'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from "@/context/StoreContext";
import { useVisibility } from '@/context/VisibilityContext';
import { useProfile } from '@/context/ProfileContext';
import { SaberPro } from './SaberPro';
import { TaskModule } from './TaskModule';
import { DualWallet } from './DualWallet';
import { FinanceChart } from './FinanceChart';
import { TaskStatsChart } from './TaskStatsChart';
import { SymmetryChart } from "./SymmetryChart";
import { FiscalAuditor } from './FiscalAuditor';

import { motion } from 'framer-motion';
import { PomodoroTimer } from './PomodoroTimer';
const vids = [{ name: 'finanzas', src: '/vid/financesCat.mp4' }, { name: 'plan', src: '/vid/planningCat.mp4' }];

export const SymmetryDashboard = () => {
  const { mode, toggleMode } = useVisibility();
  const { profile } = useProfile();
  const { data } = useStore();

  const [dataA, setDataA] = useState({ academic: 50, work: 50, home: 50, personal: 50 });
  const [dataB, setDataB] = useState({ academic: 50, work: 50, home: 50, personal: 50 });
  const [focusScore, setFocusScore] = useState(0);
  const [isFragmented, setIsFragmented] = useState(false);

  const [allocationsA, setAllocationsA] = useState<any[]>([]);
  const [allocationsB, setAllocationsB] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const savedA = localStorage.getItem('symmetry_A_data');
    const savedB = localStorage.getItem('symmetry_B_data');
    if (savedA) setDataA(JSON.parse(savedA));
    if (savedB) setDataB(JSON.parse(savedB));

    const allocA = localStorage.getItem('symmetry_A_allocations') || localStorage.getItem('symmetry_A_expenses');
    const allocB = localStorage.getItem('symmetry_B_allocations') || localStorage.getItem('symmetry_B_expenses');
    if (allocA) setAllocationsA(JSON.parse(allocA));
    if (allocB) setAllocationsB(JSON.parse(allocB));

    const savedTasks = localStorage.getItem('symmetry_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
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

  const updateAcademic = useCallback(() => {
    const update = (prev: any) => {
      const next = { ...prev, academic: Math.min(prev.academic + 5, 100) };
      localStorage.setItem(profile === 'el' ? 'symmetry_A_data' : 'symmetry_B_data', JSON.stringify(next));
      return next;
    };
    if (profile === 'el') setDataA(update);
    else setDataB(update);
  }, [profile]);

  const handleTasksUpdate = useCallback((score: number) => {
    setFocusScore(score);
    const savedTasks = localStorage.getItem('symmetry_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
  }, []);

  const handleAddAllocation = (newAlloc: any) => {
    if (profile === 'el') setAllocationsA([newAlloc, ...allocationsA]);
    else setAllocationsB([newAlloc, ...allocationsB]);
  };

  const handleRemoveAllocation = (id: string) => {
    if (profile === 'el') setAllocationsA(allocationsA.filter(a => a.id !== id));
    else setAllocationsB(allocationsB.filter(a => a.id !== id));
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12 pb-24 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row border-b border-stone-200 dark:border-stone-800 pb-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic leading-none">Productividad</h1>
          <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
            <div className={`w-2 h-2 ${mode === 'me' ? 'bg-user-a' : 'bg-user-b'}`} />
            <p className="text-stone-500 text-[8px] sm:text-[10px] uppercase font-bold tracking-[0.4em]">
              {mode === 'me' ? 'Vista Personal' : 'Vista Compartida'}
            </p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleMode}
          className="geometric-card w-full md:w-auto px-8 py-4 uppercase text-[10px] font-bold tracking-[0.2em] border transition-colors bg-white dark:bg-black"
          style={{ borderColor: mode === 'us' ? 'var(--color-user-b)' : 'var(--color-user-a)' }}
        >
          Perspectiva: {mode === 'me' ? 'Privada' : 'Compartida'}
        </motion.button>
      </div>

      {/* Row 0: Pomodoro */}
      <div className="geometric-card p-6 sm:p-8 bg-mosaic border-stone-200 dark:border-stone-800">
        <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] mb-8 border-b border-stone-100 dark:border-stone-900 pb-3 text-user-b flex justify-between items-center">
          <span>Pomodoro</span>
          <span className="text-[8px] font-mono opacity-50">Pomodoro v2.0</span>
        </h2>
        <PomodoroTimer />
      </div>

      {/* Row 1: Kanban Board (full width) */}
      <div className="geometric-card p-6 sm:p-8 bg-mosaic border-stone-200 dark:border-stone-800">
        <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] mb-8 border-b border-stone-100 dark:border-stone-900 pb-3 text-user-b flex justify-between items-center">
          <span>Tablero de Tareas</span>
          <div className="flex items-center justify-center">
            <video 
              className='w-20 h-20 object-cover rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xl' 
              src="vid/planningCat.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline
              webkit-playsinline="true"
            />
          </div>
          <span className="text-[8px] font-mono opacity-50">Kanban v2.0</span>
        </h2>
        <TaskModule onTasksUpdate={handleTasksUpdate} />
      </div>

      {/* Row 2: Task Stats (7 days) + Shield */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        <div className="lg:col-span-7 geometric-card p-6 sm:p-8 bg-dot-matrix border-stone-200 dark:border-stone-800">
          <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] mb-8 border-b border-stone-100 dark:border-stone-900 pb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-user-a" />
            Rendimiento Semanal
          </h2>
          <div className="h-64">
            <TaskStatsChart tasks={tasks} />
          </div>
        </div>
        <div className="lg:col-span-5 geometric-card p-6 sm:p-8 bg-mosaic border-stone-200 dark:border-stone-800 flex flex-col justify-center">
          <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] mb-8 border-b border-stone-100 dark:border-stone-900 pb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-user-b rounded-full" />
            Symmetry Shield
          </h2>
          <div className="h-64 flex items-center justify-center relative">
            <SymmetryChart dataA={dataA} dataB={dataB} lastPulseAt={data?.lastPulseAt} />
          </div>
        </div>
      </div>

      {/* Row 3: Fiscal Auditor & Allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        <div className="lg:col-span-6">
          <FiscalAuditor
            allocations={profile === 'el' ? allocationsA : allocationsB}
            onAddAllocation={handleAddAllocation}
            onRemoveAllocation={handleRemoveAllocation}
            profile={profile || 'el'}
          />
        </div>
        <div className="lg:col-span-6 geometric-card p-6 bg-dot-matrix border-stone-200 dark:border-stone-800">
          <h2 className="text-[9px] uppercase font-bold tracking-[0.2em] mb-6 border-b border-stone-100 dark:border-stone-900 pb-2 flex justify-between items-center">
            <span>Registro de Gastos</span>
            <div className="flex items-center justify-center">
              <video 
                className='w-20 h-20 object-cover rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xl' 
                src="vid/financesCat.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                webkit-playsinline="true"
              />
            </div>
            <span className="text-[8px] font-mono opacity-50">Libro Mayor</span>
          </h2>
          <DualWallet
            allocations={profile === 'el' ? allocationsA : allocationsB}
            onAllocationsChange={profile === 'el' ? setAllocationsA : setAllocationsB}
          />
        </div>
      </div>

      {/* Row 4: Finance Chart (Allocations over 7 days) */}
      <div className="geometric-card p-6 sm:p-8 bg-mosaic border-stone-200 dark:border-stone-800">
        <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] mb-8 border-b border-stone-100 dark:border-stone-900 pb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-user-a" />
          Flujo de Gastos
        </h2>
        <div className="h-64">
          <FinanceChart
            allocationsA={mode === 'me' && profile === 'ella' ? [] : allocationsA}
            allocationsB={mode === 'me' && profile === 'el' ? [] : allocationsB}
          />
        </div>
      </div>

      {/* Row 5: Saber Pro */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        <div className="lg:col-span-6 geometric-card p-6 bg-dot-matrix border-stone-200 dark:border-stone-800">
          <h2 className="text-[9px] uppercase font-bold tracking-[0.2em] mb-6 border-b border-stone-100 dark:border-stone-900 pb-2 text-user-a flex justify-between items-center">
            <span>Preparación Saber Pro</span>
            <span className="text-[8px] font-mono opacity-50">Versión 2.0</span>
          </h2>
          <SaberPro onCorrectAnswer={updateAcademic} />
        </div>
      </div>
    </div>
  );
};
