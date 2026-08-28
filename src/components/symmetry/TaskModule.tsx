'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Filter, Layers, LayoutGrid, ListFilter, Sparkles, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { NotificationService } from '@/services/notificationService';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';

import { Task, Objective, categoryStyles } from './taskTypes';
import { TaskForm } from './TaskForm';
import { TaskCard } from './TaskCard';

type ColumnStatus = 'todo' | 'in_progress' | 'done' | 'skipped';

interface ColumnDef {
  status: ColumnStatus;
  title: string;
  shortTitle: string;
  icon: string;
  accent: string;
  bgAccent: string;
  borderAccent: string;
  pulse?: boolean;
  opacity?: string;
}

const COLUMNS: ColumnDef[] = [
  {
    status: 'in_progress',
    title: 'EN CURSO',
    shortTitle: 'ACTIVO',
    icon: '⚡',
    accent: 'text-amber-300',
    bgAccent: 'bg-amber-400',
    borderAccent: 'border-amber-400/40',
    pulse: true,
  },
  {
    status: 'todo',
    title: 'PENDIENTES',
    shortTitle: 'PEND',
    icon: '⏳',
    accent: 'text-stone-300',
    bgAccent: 'bg-stone-400',
    borderAccent: 'border-white/15',
  },
  {
    status: 'done',
    title: 'COMPLETADAS',
    shortTitle: 'HECHO',
    icon: '✓',
    accent: 'text-emerald-400',
    bgAccent: 'bg-emerald-400',
    borderAccent: 'border-emerald-500/30',
  },
  {
    status: 'skipped',
    title: 'OMITIDAS',
    shortTitle: 'SKIP',
    icon: '✕',
    accent: 'text-stone-500',
    bgAccent: 'bg-stone-600',
    borderAccent: 'border-white/10',
    opacity: 'opacity-60',
  },
];

// ⚡ Bolt Optimization: Wrap component in React.memo()
export const TaskModule = memo(({ onTasksUpdate }: { onTasksUpdate: (score: number) => void }) => {
  const { profile } = useProfile();
  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
  const { data, updateData } = useStore();

  // Mobile View State
  const [selectedMobileTab, setSelectedMobileTab] = useState<ColumnStatus | 'all'>('in_progress');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'work' | 'home' | 'personal'>('all');

  // Tasks filtering and grouping
  const { tasks, groupedTasksByStatus, filteredTasksCount } = useMemo(() => {
    const allTasks = (data?.tasks as Task[]) || [];
    const filteredTasks: Task[] = [];
    const grouped: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
      skipped: [],
    };

    for (const t of allTasks) {
      if (!t.assignee || t.assignee === profile) {
        if (selectedCategoryFilter === 'all' || t.category === selectedCategoryFilter) {
          filteredTasks.push(t);
          if (!grouped[t.status]) {
            grouped[t.status] = [];
          }
          grouped[t.status].push(t);
        }
      }
    }
    return {
      tasks: filteredTasks,
      groupedTasksByStatus: grouped,
      filteredTasksCount: filteredTasks.length,
    };
  }, [data?.tasks, profile, selectedCategoryFilter]);

  const objectives = useMemo(() => (data?.objectives as Objective[]) || [], [data?.objectives]);
  const visibleObjectives = useMemo(() => objectives.filter(o => o.author === profile), [objectives, profile]);

  const objectiveMap = useMemo(() => {
    const map = new Map<string, Objective>();
    for (const obj of objectives) {
      map.set(obj.id, obj);
    }
    return map;
  }, [objectives]);

  // ⚡ Bolt Optimization: Calculate completed visible objectives in single O(N) pass, memoized
  const completedObjectivesCount = useMemo(() => {
    let count = 0;
    for (const obj of visibleObjectives) {
      if (obj.is_complete) count++;
    }
    return count;
  }, [visibleObjectives]);

  const objectiveStats = useMemo(() => {
    const statsMap = new Map();
    for (const obj of visibleObjectives) {
      statsMap.set(obj.id, {
        taskCount: 0,
        pendingCount: 0,
        totalEst: 0,
        totalAct: 0,
      });
    }

    for (const task of tasks) {
      if (task.objective_id && statsMap.has(task.objective_id)) {
        const stats = statsMap.get(task.objective_id);
        stats.taskCount++;
        if (task.status !== 'done' && task.status !== 'skipped') {
          stats.pendingCount++;
        }
        stats.totalEst += task.estimated_time || 0;
        stats.totalAct += task.actual_time || 0;
      }
    }
    return statsMap;
  }, [tasks, visibleObjectives]);

  const visibleObjectivesWithStats = useMemo(() => {
    return visibleObjectives.map(obj => {
      const stats = objectiveStats.get(obj.id) || { taskCount: 0, pendingCount: 0, totalEst: 0, totalAct: 0 };
      const completedCount = stats.taskCount - stats.pendingCount;
      const objColor = obj.author === 'ella' ? 'user-a' : 'user-b';
      return { obj, stats, completedCount, objColor };
    });
  }, [visibleObjectives, objectiveStats]);

  const [newObjective, setNewObjective] = useState('');
  const [newObjectiveAuthor, setNewObjectiveAuthor] = useState<'el' | 'ella'>(profile || 'el');

  // Expanded views inside the card
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const toggleChecklistInCard = (taskId: string, listType: 'actions' | 'validations', itemId: string) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const list = task[listType] || [];
    const itemIndex = list.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const newList = [...list];
    newList[itemIndex] = { ...newList[itemIndex], checked: !newList[itemIndex].checked };

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = { ...task, [listType]: newList } as Task;

    updateData({ tasks: updatedTasks });

    sound.playTick();
    haptics.triggerTick();
  };

  useEffect(() => {
    if (tasks.length > 0) {
      const completedCount = (groupedTasksByStatus['done'] || []).length;
      const focusScore = (completedCount / tasks.length) * 100;
      onTasksUpdate(focusScore);
    } else {
      onTasksUpdate(0);
    }
  }, [tasks, groupedTasksByStatus, onTasksUpdate]);

  useEffect(() => {
    if (!profile || !tasks || typeof window === 'undefined') return;
    const now = new Date();
    tasks.forEach(t => {
      if (t.status !== 'done' && t.status !== 'skipped' && t.due_date && (!t.assignee || t.assignee === profile)) {
        const due = new Date(t.due_date);
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours <= 24) {
          const key = `notified_due_${t.id}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, 'true');
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Sincronía de Operaciones', {
                body: `Se aproxima la fecha límite para tu tarea: "${t.text}"`,
                icon: '/icon-192.png',
              });
            }
          }
        }
      }
    });
  }, [tasks, profile]);

  const handleTaskAdd = (taskData: Omit<Task, 'id' | 'status' | 'actual_time' | 'updated_at'>) => {
    const task: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      status: 'todo',
      actual_time: 0,
      updated_at: new Date().toISOString(),
    };
    updateData({ tasks: [task, ...tasks] as Task[] });
    sound.playSave();
    haptics.triggerSave();
    setIsTaskFormOpen(false);
  };

  const addObjective = () => {
    if (!newObjective.trim()) {
      sound.playError();
      haptics.triggerError();
      return;
    }
    const obj: Objective = {
      id: crypto.randomUUID(),
      title: newObjective,
      author: newObjectiveAuthor,
      is_complete: false,
      last_active: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    updateData({ objectives: [...objectives, obj] as Objective[] });
    sound.playSave();
    haptics.triggerSave();
    setNewObjective('');
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    let finalStatus = status;

    if (status === 'done' && task.validations && task.validations.length > 0) {
      const hasChecked = task.validations.some(v => v.checked);
      if (!hasChecked) {
        finalStatus = 'skipped';
      }
    }
    const playedStatus = finalStatus;

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = { ...task, status: finalStatus, updated_at: new Date().toISOString() } as Task;

    updateData({ tasks: updatedTasks });

    if (playedStatus === 'done') {
      sound.playSuccess();
      haptics.triggerSuccess();
    } else if (playedStatus === 'skipped') {
      sound.playError();
      haptics.triggerError();
    } else {
      sound.playTick();
      haptics.triggerTick();
    }
  };

  const deleteTask = (id: string) => {
    updateData({ tasks: tasks.filter(t => t.id !== id) as Task[] });
  };

  const deleteObjective = (id: string) => {
    updateData({ objectives: objectives.filter(o => o.id !== id) as Objective[] });

    const hasMatch = tasks.some(t => t.objective_id === id);
    if (hasMatch) {
      const updatedTasks = tasks.map(t =>
        t.objective_id === id ? { ...t, objective_id: undefined } as Task : t
      );
      updateData({ tasks: updatedTasks });
    }
  };

  const handleEditSave = (updatedTask: Task) => {
    const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
    if (taskIndex !== -1) {
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = { ...updatedTask, updated_at: new Date().toISOString() } as Task;
      updateData({ tasks: updatedTasks });
    }
    setEditingTaskId(null);
  };

  const toggleObjectiveComplete = (id: string) => {
    const stats = objectiveStats.get(id);
    const hasPending = stats ? stats.pendingCount > 0 : false;
    if (hasPending) {
      sound.playError();
      haptics.triggerError();
      return;
    }

    const objIndex = objectives.findIndex(o => o.id === id);
    if (objIndex === -1) return;

    const obj = objectives[objIndex];
    const nextComplete = !obj.is_complete;
    const objTitle = obj.title;

    const updatedObjectives = [...objectives];
    updatedObjectives[objIndex] = { ...obj, is_complete: nextComplete };

    updateData({ objectives: updatedObjectives });

    if (nextComplete) {
      sound.playSuccess();
      haptics.triggerSuccess();
      const partner = profile === 'ella' ? 'el' : 'ella';
      const authorName = profile === 'el' ? 'Santiago' : 'Milena';
      NotificationService.addNotification(partner, 'objective', `¡${authorName} completó el objetivo: "${objTitle}"! 🎯`).catch(err => console.error(err));
    } else {
      sound.playTick();
      haptics.triggerTick();
    }
  };

  const isTaskLate = (task: Task) => task.due_date && new Date() > new Date(task.due_date) && task.status !== 'done' && task.status !== 'skipped';
  const isTaskOverflowed = (task: Task) => task.estimated_time > 0 && task.actual_time > task.estimated_time;
  const getTaskObjective = (task: Task) => (task.objective_id ? objectiveMap.get(task.objective_id) : undefined);

  return (
    <div className="space-y-4">
      {/* Top Mobile-First Control Bar */}
      <div className="flex flex-col gap-3 bg-black/60 border border-white/10 p-3 sm:p-4 backdrop-blur-md">
        {/* Objectives Section (Horizontal Scrollable HUD Chips) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.2em] text-stone-400 font-bold flex items-center gap-1.5">
              <span>🎯</span> OBJETIVOS ACTIVOS
            </span>
              {completedObjectivesCount}/{visibleObjectives.length} COMPLETADOS
          </div>

          <div className="flex items-center gap-2">
            <input
              value={newObjective}
              onChange={e => setNewObjective(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addObjective()}
              placeholder="+ NUEVO OBJETIVO..."
              className={`flex-1 h-[36px] border border-white/10 bg-black/80 px-3 text-[10px] font-mono uppercase text-white outline-none placeholder:text-stone-600 focus:border-${newObjectiveAuthor === 'ella' ? 'user-a' : 'user-b'}`}
            />
            <button
              onClick={addObjective}
              className={`h-[36px] px-3.5 flex items-center justify-center font-mono font-bold text-[10px] uppercase border transition-colors ${
                newObjectiveAuthor === 'ella'
                  ? 'border-user-a bg-user-a text-black hover:bg-user-a/80'
                  : 'border-user-b bg-user-b text-black hover:bg-user-b/80'
              }`}
              title="Añadir objetivo"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Horizontally scrollable chip list */}
          {visibleObjectivesWithStats.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1.5 pt-1 custom-scrollbar">
              {visibleObjectivesWithStats.map(({ obj, stats, completedCount, objColor }) => {
                return (
                  <div
                    key={obj.id}
                    className={`flex items-center gap-2 shrink-0 border px-2.5 py-1.5 transition-all ${
                      obj.is_complete
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : `border-${objColor}/30 bg-${objColor}/5 text-white`
                    }`}
                  >
                    <button
                      onClick={() => toggleObjectiveComplete(obj.id)}
                      disabled={stats.pendingCount > 0}
                      className={`h-4 w-4 border flex items-center justify-center transition-colors ${
                        obj.is_complete
                          ? 'border-emerald-400 bg-emerald-400 text-black'
                          : `border-${objColor}/50 hover:border-${objColor}`
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {obj.is_complete && <Check size={11} strokeWidth={3} />}
                    </button>

                    <div className="flex flex-col">
                      <span
                        className={`text-[9px] font-mono uppercase font-bold tracking-tight ${
                          obj.is_complete ? 'line-through opacity-70' : `text-${objColor}`
                        }`}
                      >
                        {obj.title}
                      </span>
                      {stats.taskCount > 0 && (
                        <span className="text-[7px] font-mono text-stone-400 tabular-nums">
                          {completedCount}/{stats.taskCount} tareas · {stats.totalAct}/{stats.totalEst}m
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => deleteObjective(obj.id)}
                      className="text-stone-500 hover:text-rose-400 ml-1 p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Action Bar & Category Filters */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <span className="text-[7.5px] font-mono text-stone-500 uppercase tracking-wider mr-1 hidden xs:inline">
              Filtro:
            </span>
            {(['all', 'work', 'home', 'personal'] as const).map(cat => {
              const isActive = selectedCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`min-h-[28px] px-2.5 py-1 text-[8px] font-mono uppercase font-bold border transition-all ${
                    isActive
                      ? `border-white bg-white text-black shadow-[0_0_8px_rgba(255,255,255,0.2)]`
                      : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'TODAS' : categoryStyles[cat].label}
                </button>
              );
            })}
          </div>

          {/* Primary Create Task CTA */}
          <button
            onClick={() => setIsTaskFormOpen(true)}
            className={`min-h-[36px] px-4 py-1.5 flex items-center justify-center gap-2 font-mono font-bold text-[10px] uppercase tracking-wider border border-${accentClass} bg-${accentClass}/15 text-${accentClass} hover:bg-${accentClass} hover:text-black transition-all active:scale-95 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>NUEVA TAREA</span>
          </button>
        </div>

        {/* Task Creation Drawer Form */}
        <AnimatePresence>
          {isTaskFormOpen && (
            <TaskForm
              onClose={() => setIsTaskFormOpen(false)}
              onAdd={handleTaskAdd}
              visibleObjectives={visibleObjectives}
              accentClass={accentClass}
              profile={profile}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Column Segmented Switcher (HUD Tabs) - Hidden on md+ */}
      <div className="block md:hidden">
        <div className="grid grid-cols-5 gap-1 p-1 bg-black/80 border border-white/10">
          {COLUMNS.map(col => {
            const count = (groupedTasksByStatus[col.status] || []).length;
            const isSelected = selectedMobileTab === col.status;
            return (
              <button
                key={col.status}
                type="button"
                onClick={() => setSelectedMobileTab(col.status)}
                className={`min-h-[38px] py-1 px-1 flex flex-col items-center justify-center border transition-all ${
                  isSelected
                    ? `border-white bg-white/15 ${col.accent} font-bold shadow-[0_0_8px_rgba(255,255,255,0.15)]`
                    : 'border-transparent text-stone-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1 text-[9px] font-mono leading-none">
                  <span>{col.icon}</span>
                  <span className="font-bold">{col.shortTitle}</span>
                </div>
                <span className="text-[8px] font-mono tabular-nums opacity-70 mt-0.5 font-bold">
                  {count}
                </span>
              </button>
            );
          })}

          {/* "ALL" Columns view tab */}
          <button
            type="button"
            onClick={() => setSelectedMobileTab('all')}
            className={`min-h-[38px] py-1 px-1 flex flex-col items-center justify-center border transition-all ${
              selectedMobileTab === 'all'
                ? 'border-white bg-white/15 text-white font-bold'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1 text-[9px] font-mono leading-none">
              <LayoutGrid size={11} />
              <span>TODAS</span>
            </div>
            <span className="text-[8px] font-mono tabular-nums opacity-70 mt-0.5 font-bold">
              {filteredTasksCount}
            </span>
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      {/* On Mobile: Renders either the active selected column or all columns stacked */}
      {/* On MD+: Always renders full responsive 2/4-column grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-3 xl:grid-cols-4 min-h-[320px]">
        {COLUMNS.map(col => {
          const colTasks = groupedTasksByStatus[col.status] || [];
          const isVisibleOnMobile = selectedMobileTab === 'all' || selectedMobileTab === col.status;

          return (
            <div
              key={col.status}
              className={`flex flex-col border bg-black/40 p-2.5 sm:p-3 transition-all ${
                col.borderAccent
              } ${col.opacity || ''} ${
                isVisibleOnMobile ? 'flex' : 'hidden md:flex'
              }`}
            >
              {/* Column Header */}
              <div className="mb-2.5 pb-2 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{col.icon}</span>
                  <h4 className={`text-[10px] font-mono font-bold uppercase tracking-wider ${col.accent}`}>
                    {col.title}
                  </h4>
                  {col.pulse && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${col.bgAccent} animate-pulse`}
                      style={{ boxShadow: `0 0 6px ${accentColor}` }}
                    />
                  )}
                </div>
                <span className="text-[8.5px] font-mono font-bold tabular-nums px-2 py-0.5 border border-white/10 bg-white/[0.03] text-stone-300">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Body & Tasks */}
              <div className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar pt-1 min-h-[120px]">
                {col.status === 'todo' && (
                  <button
                    onClick={() => setIsTaskFormOpen(true)}
                    className="w-full min-h-[36px] flex items-center justify-center gap-1.5 border border-dashed border-white/20 bg-white/[0.01] py-2 text-[9px] font-mono uppercase tracking-wider text-stone-400 transition-colors hover:border-white/40 hover:text-white"
                  >
                    <Plus size={12} />
                    <span>AÑADIR TAREA</span>
                  </button>
                )}

                {colTasks.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center justify-center border border-dashed border-white/5 bg-white/[0.01] my-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-stone-600">
                      Sin tareas en {col.shortTitle}
                    </span>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isEditing={editingTaskId === task.id}
                        onEditStart={t => setEditingTaskId(t.id)}
                        onEditCancel={() => setEditingTaskId(null)}
                        onEditSave={handleEditSave}
                        onDelete={deleteTask}
                        onUpdateStatus={updateTaskStatus}
                        onToggleChecklist={toggleChecklistInCard}
                        expandedTaskId={expandedTaskId}
                        setExpandedTaskId={setExpandedTaskId}
                        getTaskObjective={getTaskObjective}
                        accentClass={accentClass}
                        accentColor={accentColor}
                        profile={profile}
                        isLateOrOverflow={!!isTaskLate(task) || !!isTaskOverflowed(task)}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
