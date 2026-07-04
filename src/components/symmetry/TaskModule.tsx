'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { NotificationService } from '@/services/notificationService';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';

import { Task, Objective } from './taskTypes';
import { TaskForm } from './TaskForm';
import { TaskCard } from './TaskCard';

export const TaskModule = ({ onTasksUpdate }: { onTasksUpdate: (score: number) => void }) => {
  const { profile } = useProfile();
  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
  const { data, updateData } = useStore();

  const tasks = useMemo(() => {
    const allTasks = (data?.tasks as Task[]) || [];
    return allTasks.filter(t => !t.assignee || t.assignee === profile);
  }, [data?.tasks, profile]);

  const groupedTasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
      skipped: []
    };
    for (const t of tasks) {
      if (grouped[t.status]) {
        grouped[t.status].push(t);
      }
    }
    return grouped;
  }, [tasks]);

  const objectives = useMemo(() => (data?.objectives as Objective[]) || [], [data?.objectives]);
  const visibleObjectives = useMemo(() => objectives.filter(o => o.author === profile), [objectives, profile]);

  const objectiveMap = useMemo(() => {
    const map = new Map<string, Objective>();
    for (const obj of objectives) {
      map.set(obj.id, obj);
    }
    return map;
  }, [objectives]);

  const objectiveStats = useMemo(() => {
    const statsMap = new Map();
    for (const obj of visibleObjectives) {
      statsMap.set(obj.id, {
        taskCount: 0,
        pendingCount: 0,
        totalEst: 0,
        totalAct: 0
      });
    }

    for (const task of tasks) {
      if (task.objective_id && statsMap.has(task.objective_id)) {
        const stats = statsMap.get(task.objective_id);
        stats.taskCount++;
        if (task.status !== 'done' && task.status !== 'skipped') {
          stats.pendingCount++;
        }
        stats.totalEst += (task.estimated_time || 0);
        stats.totalAct += (task.actual_time || 0);
      }
    }
    return statsMap;
  }, [tasks, visibleObjectives]);

  // ⚡ Bolt Optimization: Pre-calculate map lookups outside the render loop
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
    // ⚡ Bolt Optimization: Replace O(N) double pass (.find + .map) with single pass
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    const task = tasks[taskIndex];
    const list = task[listType] || [];
    const newList = list.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i);

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
                icon: '/icon-192.png'
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
      created_at: new Date().toISOString()
    };
    updateData({ objectives: [...objectives, obj] as Objective[] });
    sound.playSave();
    haptics.triggerSave();
    setNewObjective('');
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    // ⚡ Bolt Optimization: Replace O(N) double pass (.find + .map) with single pass
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

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = { ...task, status: finalStatus, updated_at: new Date().toISOString() } as Task;
    updateData({ tasks: updatedTasks });

    if (finalStatus === 'done') {
      sound.playSuccess();
      haptics.triggerSuccess();
    } else if (finalStatus === 'skipped') {
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

    // ⚡ Bolt Optimization: Replace O(N) map allocation with lazy clone only on match
    let hasMatch = false;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].objective_id === id) {
        hasMatch = true;
        break;
      }
    }

    if (hasMatch) {
      const updatedTasks = [...tasks];
      for (let i = 0; i < updatedTasks.length; i++) {
        if (updatedTasks[i].objective_id === id) {
          updatedTasks[i] = { ...updatedTasks[i], objective_id: undefined } as Task;
        }
      }
      updateData({ tasks: updatedTasks });
    }
  };

  const handleEditSave = (updatedTask: Task) => {
    // ⚡ Bolt Optimization: Replace O(N) map with single pass findIndex + mutation
    const updatedTasks = [...tasks];
    const taskIndex = updatedTasks.findIndex(t => t.id === editingTaskId);
    if (taskIndex !== -1) {
      updatedTasks[taskIndex] = {
        ...updatedTask,
        updated_at: new Date().toISOString()
      } as Task;
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
    // ⚡ Bolt Optimization: Replace O(N) double pass (.find + .map) with single pass
    const objIndex = objectives.findIndex(o => o.id === id);
    if (objIndex === -1) return;

    const obj = objectives[objIndex];
    const nextComplete = !obj.is_complete;

    const updatedObjectives = [...objectives];
    updatedObjectives[objIndex] = { ...obj, is_complete: nextComplete };
    updateData({ objectives: updatedObjectives });

    if (nextComplete) {
      sound.playSuccess();
      haptics.triggerSuccess();
      const partner = profile === 'ella' ? 'el' : 'ella';
      const authorName = profile === 'el' ? 'Santiago' : 'Milena';
      NotificationService.addNotification(partner, 'objective', `¡${authorName} completó el objetivo: "${obj.title}"! 🎯`).catch(err => console.error(err));
    } else {
      sound.playTick();
      haptics.triggerTick();
    }
  };

  const isTaskLate = (task: Task) => task.due_date && new Date() > new Date(task.due_date) && task.status !== 'done' && task.status !== 'skipped';
  const isTaskOverflowed = (task: Task) => task.estimated_time > 0 && task.actual_time > task.estimated_time;
  const getTaskObjective = (task: Task) => task.objective_id ? objectiveMap.get(task.objective_id) : undefined;

  return (
    <div className="space-y-4 border border-white/10 bg-black/40 p-2 sm:p-3">
      {/* Creation UI */}
      <div className="flex flex-col gap-4">
        {/* Objectives First */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                value={newObjective}
                onChange={e => setNewObjective(e.target.value)}
                placeholder="NUEVO OBJETIVO"
                className={`flex-1 border border-white/10 bg-black px-3 py-1.5 text-[10px] font-mono uppercase text-white outline-none placeholder:text-[#594137] focus:border-${newObjectiveAuthor === 'ella' ? 'user-a' : 'user-b'}`}
              />
              <button
                onClick={addObjective}
                className={`!min-h-0 border px-3 py-1.5 text-black transition-colors ${newObjectiveAuthor === 'ella' ? 'border-user-a bg-user-a hover:bg-user-a/80' : 'border-user-b bg-user-b hover:bg-user-b/80'}`}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleObjectivesWithStats.map(({ obj, stats, completedCount, objColor }) => {
              return (
                <div key={obj.id} className={`flex flex-col gap-1 border px-2 py-[2px] transition-all ${obj.is_complete ? 'border-emerald-500 bg-emerald-500/5 opacity-50' : `border-${objColor}/30 bg-${objColor}/5`}`}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleObjectiveComplete(obj.id)}
                      disabled={stats.pendingCount > 0}
                      className={`border p-0.5 ${obj.is_complete ? 'border-emerald-500 bg-emerald-500 text-white' : `border-${objColor}/50 text-transparent hover:border-${objColor}`} disabled:cursor-not-allowed disabled:opacity-30`}
                    >
                      {obj.is_complete ? <Check size={10} /> : <div className="w-[10px] h-[10px]" />}
                    </button>
                    <span className={`text-[8px] font-mono uppercase font-bold ${obj.is_complete ? 'text-emerald-500 line-through' : `text-${objColor}`}`}>{obj.title}</span>
                    <button onClick={() => deleteObjective(obj.id)} className="text-stone-400 hover:text-red-500 ml-auto">
                      <X size={10} />
                    </button>
                  </div>
                  {stats.taskCount > 0 && (
                    <div className={`mt-0.5 flex gap-2 border-t border-${objColor}/10 pt-1 font-mono text-[6px] uppercase text-[#a88a7e]`}>
                      <span>{completedCount}/{stats.taskCount} Tareas</span>
                      <span>{stats.totalAct}/{stats.totalEst} Min</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Tasks Second */}
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

      <div className="grid min-h-[250px] grid-cols-1 gap-2 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
        {[
          { status: 'todo' as const, title: 'PEND', accent: 'text-stone-500', bgAccent: 'bg-stone-500' },
          { status: 'in_progress' as const, title: 'ACTIVO', accent: `text-${accentClass}`, bgAccent: `bg-${accentClass}`, pulse: true },
          { status: 'done' as const, title: 'HECHO', accent: 'text-stone-600', bgAccent: 'bg-stone-600', opacity: 'opacity-50' },
          { status: 'skipped' as const, title: 'SKIP', accent: 'text-red-900', bgAccent: 'bg-red-900', opacity: 'opacity-40' }
        ].map((col) => {
          const colTasks = groupedTasksByStatus[col.status] || [];
          return (
            <div key={col.status} className={`flex h-full flex-col border border-white/10 bg-black/30 p-2 md:p-3 ${col.opacity || ''}`}>
              <h4 className={`mb-2 md:mb-3 flex items-center justify-between text-[9px] md:text-[10px] font-mono tracking-tighter uppercase ${col.accent}`}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 ${col.bgAccent} ${col.pulse ? 'animate-pulse' : ''}`} style={col.pulse ? { boxShadow: `0 0 5px ${accentColor}` } : {}} />
                  {col.title}
                </div>
                <span className="text-[8px] font-mono tabular-nums text-stone-500">{colTasks.length}</span>
              </h4>
              <div className="flex-1 space-y-3 md:space-y-4 overflow-y-auto custom-scrollbar pt-2 md:pt-3">
                {col.status === 'todo' && (
                  <button className="mb-2 flex w-full items-center justify-center gap-1.5 border border-dashed border-white/15 py-2 text-[9px] tracking-[0.15em] text-stone-600 transition-colors hover:border-white/40 hover:text-white font-mono" onClick={() => setIsTaskFormOpen(true)}>
                    <Plus size={10} /> CREAR
                  </button>
                )}
                <AnimatePresence>
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isEditing={editingTaskId === task.id}
                      onEditStart={(t) => setEditingTaskId(t.id)}
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
