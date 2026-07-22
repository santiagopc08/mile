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

  // ⚡ Bolt Optimization: Replace tasks.filter().length with a single-pass loop
  let activeTasks = 0;
  for (const t of tasks) {
    if (t.status === 'in_progress') activeTasks++;
  }

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

      <div className="border-x border-white/10">


        <div className="grid grid-cols-2 border-b border-white/10 bg-black">
          {([
            { label: 'Operaciones', key: 'tasks' as const, icon: ShieldCheck, index: '01' },
            { label: 'Finanzas', key: 'finances' as const, icon: WalletCards, index: '02' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`group relative font-mono flex min-h-20 items-center justify-between border-r border-white/10 px-4 py-4 transition-all last:border-r-0 ${activeTab === tab.key
                ? 'text-black font-black'
                : 'bg-[#0a0a0a] text-[#a88a7e] hover:bg-[#121212] hover:text-white'
                }`}
              style={activeTab === tab.key ? { backgroundColor: activeAccent } : undefined}
            >
              <span className="flex flex-col items-start gap-2">
                <tab.icon className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.22em] font-mono">{tab.label}</span>
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-[0.2em] font-mono ${activeTab === tab.key ? 'text-black/55' : 'text-white/20 group-hover:text-white'}`}>
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
