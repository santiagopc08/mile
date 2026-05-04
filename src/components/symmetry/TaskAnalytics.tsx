'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';
import { Clock, TrendingUp, Zap, Target } from 'lucide-react';

interface Task {
  id: string;
  text: string;
  category: string;
  actual_time: number;
  estimated_time: number;
  status: string;
}

export const TaskAnalytics = ({ tasks }: { tasks: Task[] }) => {
  const { profile } = useProfile();
  const accentColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';

  const stats = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;

    const totalActual = tasks.reduce((sum, t) => sum + (t.actual_time || 0), 0);
    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimated_time || 0), 0);

    const tasksWithTime = tasks.filter(t => (t.actual_time || 0) > 0);

    const mostWorked = tasksWithTime.length > 0
      ? [...tasksWithTime].sort((a, b) => b.actual_time - a.actual_time)[0]
      : null;

    const leastWorked = tasksWithTime.length > 0
      ? [...tasksWithTime].sort((a, b) => a.actual_time - b.actual_time)[0]
      : null;

    const efficiency = totalEstimated > 0 ? (totalActual / totalEstimated) : 0;

    const categories = ['work', 'home', 'personal'];
    const catStats = categories.map(cat => {
      const catTasks = tasks.filter(t => t.category === cat);
      const catTime = catTasks.reduce((sum, t) => sum + (t.actual_time || 0), 0);
      return { name: cat, time: catTime };
    });

    return {
      totalActual,
      efficiency,
      mostWorked,
      leastWorked,
      catStats
    };
  }, [tasks]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-stone-200 font-mono">
      {/* Total Time */}
      <div className="p-4 border border-white/10 bg-[#0a0a0a] flex flex-col justify-between min-h-[100px] relative">
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-stone-500" />
        <div className="flex justify-between items-start">
          <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-stone-500">{'>'} 01. TIME_INV</span>
          <Clock size={12} className="text-stone-500" />
        </div>
        <div className="mt-4">
          <span className="text-3xl font-black tabular-nums tracking-tighter text-white">{stats.totalActual}</span>
          <span className="text-[10px] uppercase font-bold ml-1 opacity-50 tracking-[0.2em]">min</span>
        </div>
      </div>

      {/* Efficiency */}
      <div className="p-4 border border-white/10 bg-[#0a0a0a] flex flex-col justify-between min-h-[100px] relative">
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-stone-500" />
        <div className="flex justify-between items-start">
          <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-stone-500">{'>'} 02. SYS_PERF</span>
          <TrendingUp size={12} className="text-stone-400" />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-black tabular-nums tracking-tighter ${stats.efficiency > 1 ? 'text-red-500' : 'text-white'}`}>
              {(stats.efficiency * 100).toFixed(0)}%
            </span>
            <span className="text-[8px] text-stone-500 pb-1.5 tracking-widest">{stats.efficiency > 1 ? '[ OVERLOAD ]' : '[ OPTIMAL ]'}</span>
          </div>
          <div className="h-1 w-full bg-stone-900 border border-stone-800">
            <div
              className="h-full transition-all"
              style={{
                width: `${Math.min(100, stats.efficiency * 100)}%`,
                backgroundColor: stats.efficiency > 1 ? '#ef4444' : accentColor
              }}
            />
          </div>
        </div>
      </div>

      {/* Most Worked */}
      <div className="p-4 border border-white/10 bg-[#0a0a0a] flex flex-col justify-between min-h-[100px] relative">
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-stone-500" />
        <div className="flex justify-between items-start">
          <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-stone-500">{'>'} MAX_NODE</span>
          <Zap size={12} className="text-stone-400" />
        </div>
        <div className="mt-4 overflow-hidden">
          <p className="text-[12px] uppercase font-bold truncate text-white" title={stats.mostWorked?.text}>
            {stats.mostWorked?.text || '---'}
          </p>
          <p className="text-[8px] font-mono text-stone-500 mt-1 tracking-widest">{stats.mostWorked?.actual_time || 0}M SYNCED</p>
        </div>
      </div>

      {/* Least Worked */}
      <div className="p-4 border border-white/10 bg-[#0a0a0a] flex flex-col justify-between min-h-[100px] relative">
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-stone-500" />
        <div className="flex justify-between items-start">
          <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-stone-500">{'>'} MIN_NODE</span>
          <Target size={12} className="text-stone-400" />
        </div>
        <div className="mt-4 overflow-hidden">
          <p className="text-[12px] uppercase font-bold truncate text-white" title={stats.leastWorked?.text}>
            {stats.leastWorked?.text || '---'}
          </p>
          <p className="text-[8px] font-mono text-stone-500 mt-1 tracking-widest">{stats.leastWorked?.actual_time || 0}M SYNCED</p>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="md:col-span-2 lg:col-span-4 p-6 border border-white/10 bg-[#0a0a0a] relative mt-4">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-stone-500" />
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-500 block mb-6">{'>'} 03. CAT_DISTRIBUTION</span>
        <div className="flex flex-col gap-3">
          {stats.catStats.map(cat => {
            const percent = stats.totalActual > 0 ? (cat.time / stats.totalActual) * 100 : 0;
            return (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest text-stone-300">
                  <span>{cat.name}</span>
                  <span className="text-stone-500">{cat.time}M ({percent.toFixed(1)}%)</span>
                </div>
                <div className="h-1 w-full bg-stone-900 border border-stone-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className="h-full"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};
