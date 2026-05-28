'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';
import { Clock, TrendingUp, Zap, Target } from 'lucide-react';
import { TaskStatsChart } from './TaskStatsChart';

interface Task {
  id: string;
  text: string;
  category: string;
  actual_time: number;
  estimated_time: number;
  status: string;
}

export const TaskAnalytics = ({ tasks, objectives }: { tasks: Task[], objectives: any[] }) => {
  const { profile } = useProfile();
  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const accentClass = profile === 'ella' ? 'user-a' : 'user-b';

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
    <div className="grid grid-cols-1 gap-4 font-mono text-[#e5e2e1] md:grid-cols-2 lg:grid-cols-4">
      {/* Total Time */}
      <div className="relative flex min-h-[100px] flex-col justify-between border border-white/10 bg-black/40 p-4">
        <div className={`absolute left-0 top-0 h-1.5 w-1.5 border-l border-t border-${accentClass}`} style={{ borderColor: accentColor }} />
        <div className="flex justify-between items-start">
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">01. TIEMPO INVERTIDO</span>
          <Clock size={12} className={`text-${accentClass}`} style={{ color: accentColor }} />
        </div>
        <div className="mt-4">
          <span className="text-3xl font-black tabular-nums tracking-tighter text-white">{stats.totalActual}</span>
          <span className="text-[10px] uppercase font-bold ml-1 opacity-50 tracking-[0.2em]">min</span>
        </div>
      </div>

      {/* Efficiency */}
      <div className="relative flex min-h-[100px] flex-col justify-between border border-white/10 bg-black/40 p-4">
        <div className={`absolute right-0 top-0 h-1.5 w-1.5 border-r border-t border-${accentClass}`} style={{ borderColor: accentColor }} />
        <div className="flex justify-between items-start">
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">02. EFICIENCIA</span>
          <TrendingUp size={12} className={`text-${accentClass}`} style={{ color: accentColor }} />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-black tabular-nums tracking-tighter ${stats.efficiency > 1 ? 'text-red-500' : 'text-white'}`}>
              {(stats.efficiency * 100).toFixed(0)}%
            </span>
            <span className="pb-1.5 text-[8px] tracking-widest text-[#a88a7e]">{stats.efficiency > 1 ? 'SOBRECARGA' : 'ÓPTIMO'}</span>
          </div>
          <div className="h-1 w-full border border-white/10 bg-[#050505]">
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
      <div className="relative flex min-h-[100px] flex-col justify-between border border-white/10 bg-black/40 p-4">
        <div className={`absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l border-${accentClass}`} style={{ borderColor: accentColor }} />
        <div className="flex justify-between items-start">
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">MAYOR TIEMPO</span>
          <Zap size={12} className={`text-${accentClass}`} style={{ color: accentColor }} />
        </div>
        <div className="mt-4 overflow-hidden">
          <p className="text-[12px] uppercase font-bold truncate text-white" title={stats.mostWorked?.text}>
            {stats.mostWorked?.text || '---'}
          </p>
          <p className="mt-1 font-mono text-[8px] tracking-widest text-[#a88a7e]">{stats.mostWorked?.actual_time || 0} MINUTOS</p>
        </div>
      </div>

      {/* Least Worked */}
      <div className="relative flex min-h-[100px] flex-col justify-between border border-white/10 bg-black/40 p-4">
        <div className={`absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-${accentClass}`} style={{ borderColor: accentColor }} />
        <div className="flex justify-between items-start">
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">MENOR TIEMPO</span>
          <Target size={12} className={`text-${accentClass}`} style={{ color: accentColor }} />
        </div>
        <div className="mt-4 overflow-hidden">
          <p className="text-[12px] uppercase font-bold truncate text-white" title={stats.leastWorked?.text}>
            {stats.leastWorked?.text || '---'}
          </p>
          <p className="mt-1 font-mono text-[8px] tracking-widest text-[#a88a7e]">{stats.leastWorked?.actual_time || 0} MINUTOS</p>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="relative mt-4 border border-white/10 bg-black/40 p-6 md:col-span-2 lg:col-span-4">
        <div className={`absolute left-0 top-0 h-2 w-2 border-l border-t border-${accentClass}`} style={{ borderColor: accentColor }} />
        <span className="mb-6 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">03. DISTRIBUCIÓN POR CATEGORÍAS</span>
        <div className="flex flex-col gap-3">
          {stats.catStats.map(cat => {
            const percent = stats.totalActual > 0 ? (cat.time / stats.totalActual) * 100 : 0;
            const translatedName = cat.name === 'work' ? 'TRABAJO' : cat.name === 'home' ? 'HOGAR' : cat.name === 'personal' ? 'PERSONAL' : cat.name;
            return (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-[#e1bfb2]">
                  <span>{translatedName}</span>
                  <span className="text-[#a88a7e]">{cat.time} Minutos ({percent.toFixed(1)}%)</span>
                </div>
                <div className="h-1 w-full border border-white/10 bg-[#050505]">
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

      {/* Weekly Stats Chart */}
      <div className="relative mt-4 border border-white/10 bg-black/40 p-6 md:col-span-2 lg:col-span-4 h-64">
        <div className={`absolute right-0 bottom-0 h-2 w-2 border-r border-b border-${accentClass}`} style={{ borderColor: accentColor }} />
        <span className="mb-6 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">04. RENDIMIENTO SEMANAL</span>
        <TaskStatsChart tasks={tasks} objectives={objectives} />
      </div>
    </div>
  );
};
