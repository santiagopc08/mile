'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Pencil, X, Calendar } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { StoreService } from '@/services/storeService';

interface Task {
  id: string;
  objectiveId?: string;
  text: string;
  status: 'todo' | 'in_progress' | 'done';
  category: 'work' | 'home' | 'personal';
  estimated_time: number;
  actual_time: number;
  due_date?: string;
  updatedAt: string;
}

interface Objective {
  id: string;
  title: string;
  author: string;
}

export const TaskModule = ({ onTasksUpdate }: { onTasksUpdate: (score: number) => void }) => {
  const { profile } = useProfile();
  const { data } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState<'work' | 'home' | 'personal'>('work');
  const [newObjective, setNewObjective] = useState('');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>('');
  const [newEstimatedTime, setNewEstimatedTime] = useState<number>(30);
  const [newDueDate, setNewDueDate] = useState('');

  // Edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState<'work' | 'home' | 'personal'>('work');
  const [editTaskObjectiveId, setEditTaskObjectiveId] = useState<string>('');
  const [editEstimatedTime, setEditEstimatedTime] = useState<number>(0);
  const [editActualTime, setEditActualTime] = useState<number>(0);
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const store = await StoreService.getStore();
        setTasks(store.tasks as any);
        setObjectives(store.objectives as any);
      } catch (e) {
        console.error("Failed to fetch tasks", e);
      }
    };
    fetchData();

    // Listen for custom refresh events (e.g. from Pomodoro)
    const handleRefresh = () => fetchData();
    window.addEventListener('tasks-refresh', handleRefresh);
    return () => window.removeEventListener('tasks-refresh', handleRefresh);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('symmetry_tasks', JSON.stringify(tasks));
      localStorage.setItem('symmetry_objectives', JSON.stringify(objectives));
      const completedCount = tasks.filter(t => t.status === 'done').length;
      const focusScore = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
      onTasksUpdate(focusScore);

      // Attempt to sync tasks to Supabase in background
      const syncStore = async () => {
        try {
          await StoreService.updateStore({
            tasks: tasks as any,
            objectives: objectives as any
          });
        } catch (e) {
          console.error("Background sync failed", e);
        }
      };
      syncStore();
    }
  }, [tasks, objectives, onTasksUpdate]);

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      objectiveId: selectedObjectiveId || undefined,
      text: newTask,
      status: 'todo',
      category,
      estimated_time: newEstimatedTime,
      actual_time: 0,
      due_date: newDueDate || undefined,
      updatedAt: new Date().toISOString(),
    };
    setTasks([task, ...tasks]);
    setNewTask('');
    setNewDueDate('');
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    const obj: Objective = {
      id: Date.now().toString(),
      title: newObjective,
      author: profile || 'el'
    };
    setObjectives([...objectives, obj]);
    setNewObjective('');
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const deleteObjective = (id: string) => {
    setObjectives(objectives.filter(o => o.id !== id));
    if (selectedObjectiveId === id) setSelectedObjectiveId('');
    setTasks(tasks.map(t => t.objectiveId === id ? { ...t, objectiveId: undefined } : t));
  };

  const handleEditStart = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskText(task.text);
    setEditTaskCategory(task.category);
    setEditTaskObjectiveId(task.objectiveId || '');
    setEditEstimatedTime(task.estimated_time);
    setEditActualTime(task.actual_time);
    setEditDueDate(task.due_date || '');
  };

  const handleEditSave = () => {
    setTasks(tasks.map(t => t.id === editingTaskId ? {
      ...t,
      text: editTaskText,
      category: editTaskCategory,
      objectiveId: editTaskObjectiveId || undefined,
      estimated_time: editEstimatedTime,
      actual_time: editActualTime,
      due_date: editDueDate || undefined,
      updatedAt: new Date().toISOString()
    } : t));
    setEditingTaskId(null);
  };

  return (
    <div className="space-y-6">
      {/* Creation UI */}
      <div className="flex flex-col gap-6">
        {/* Objectives First */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={newObjective}
              onChange={e => setNewObjective(e.target.value)}
              placeholder="NUEVO OBJETIVO"
              className="flex-1 bg-transparent border border-stone-200 dark:border-stone-800 px-4 py-2 text-[10px] uppercase outline-none focus:border-user-b"
            />
            <button onClick={addObjective} className="px-4 py-2 bg-user-b text-white">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {objectives.map(obj => (
              <div key={obj.id} className="flex items-center gap-2 px-2 py-1 border border-user-b/20 bg-user-b/5">
                <span className="text-[8px] uppercase font-bold text-user-b">{obj.title}</span>
                <button onClick={() => deleteObjective(obj.id)} className="text-stone-400 hover:text-red-500">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Second */}
        <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-900">
          <div className="flex gap-2">
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="NUEVA TAREA"
              className="flex-1 bg-transparent border border-stone-200 dark:border-stone-800 px-4 py-2 text-[10px] uppercase outline-none focus:border-user-a"
            />
            <button onClick={addTask} className="px-4 py-2 bg-user-a text-white">
              <Plus size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
             <div className="flex flex-col gap-1">
                <label className="text-[7px] uppercase font-bold text-stone-400">Objetivo</label>
                <select
                  value={selectedObjectiveId}
                  onChange={e => setSelectedObjectiveId(e.target.value)}
                  className="bg-transparent border border-stone-200 dark:border-stone-800 px-2 h-[32px] text-[8px] uppercase outline-none"
                >
                  <option value="">Sin Objetivo</option>
                  {objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                </select>
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[7px] uppercase font-bold text-stone-400">Est. (m)</label>
                <input
                  type="number"
                  value={newEstimatedTime}
                  onChange={e => setNewEstimatedTime(Number(e.target.value))}
                  className="bg-transparent border border-stone-200 dark:border-stone-800 px-2 h-[32px] text-[8px] outline-none"
                />
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[7px] uppercase font-bold text-stone-400">Fecha Límite (Opcional)</label>
                <input
                  type="datetime-local"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="bg-transparent border border-stone-200 dark:border-stone-800 px-2 h-[32px] text-[8px] outline-none"
                />
             </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="border-t border-stone-100 dark:border-stone-900 pt-4">
        <div className="flex gap-4">
          {['work', 'home', 'personal'].map((cat: any) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-[10px] uppercase font-bold tracking-widest px-4 py-1 border transition-colors ${
                category === cat ? 'border-user-a text-user-a' : 'border-transparent text-stone-500 hover:border-stone-200 dark:hover:border-stone-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[250px]">
        {[
          { status: 'todo' as const, title: 'Pendiente', accent: 'text-stone-500' },
          { status: 'in_progress' as const, title: 'En Progreso', accent: 'text-user-a', pulse: true },
          { status: 'done' as const, title: 'Completado', accent: 'text-stone-500', opacity: 'opacity-70' }
        ].map((col) => (
          <div key={col.status} className={`border border-stone-200 dark:border-stone-800 bg-white/5 dark:bg-black/20 p-3 h-full flex flex-col ${col.opacity || ''}`}>
            <h4 className={`text-[9px] uppercase font-bold tracking-[0.2em] ${col.accent} mb-3 border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-2`}>
              {col.title} {col.pulse && <span className="w-1.5 h-1.5 bg-user-a animate-pulse" />}
            </h4>
            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence>
                {tasks.filter(t => t.status === col.status).map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-2 border bg-white dark:bg-stone-900 group ${editingTaskId === task.id ? 'border-user-a' : 'border-stone-200 dark:border-stone-800'}`}
                  >
                    {editingTaskId === task.id ? (
                      <div className="space-y-2">
                        <input
                          value={editTaskText}
                          onChange={e => setEditTaskText(e.target.value)}
                          className="w-full bg-transparent border border-stone-100 dark:border-stone-800 px-2 py-1 text-[10px] uppercase outline-none focus:border-user-a"
                        />
                        <div className="flex gap-2">
                          <select
                            value={editTaskCategory}
                            onChange={e => setEditTaskCategory(e.target.value as any)}
                            className="flex-1 bg-transparent border border-stone-100 dark:border-stone-800 px-1 py-0.5 text-[8px] uppercase outline-none"
                          >
                            <option value="work">Work</option>
                            <option value="home">Home</option>
                            <option value="personal">Personal</option>
                          </select>
                          <select
                            value={editTaskObjectiveId}
                            onChange={e => setEditTaskObjectiveId(e.target.value)}
                            className="flex-1 bg-transparent border border-stone-100 dark:border-stone-800 px-1 py-0.5 text-[8px] uppercase outline-none"
                          >
                            <option value="">Sin Obj</option>
                            {objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[7px] uppercase font-bold text-stone-400">Est. (m)</label>
                            <input
                              type="number"
                              value={editEstimatedTime}
                              onChange={e => setEditEstimatedTime(Number(e.target.value))}
                              className="w-full bg-transparent border border-stone-100 dark:border-stone-800 px-2 py-1 text-[10px] outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[7px] uppercase font-bold text-stone-400">Act. (m)</label>
                            <input
                              type="number"
                              value={editActualTime}
                              onChange={e => setEditActualTime(Number(e.target.value))}
                              className="w-full bg-transparent border border-stone-100 dark:border-stone-800 px-2 py-1 text-[10px] outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[7px] uppercase font-bold text-stone-400">Due Date</label>
                          <input
                            type="datetime-local"
                            value={editDueDate}
                            onChange={e => setEditDueDate(e.target.value)}
                            className="w-full bg-transparent border border-stone-100 dark:border-stone-800 px-2 py-1 text-[10px] outline-none"
                          />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingTaskId(null)} className="flex-1 py-1 border border-stone-100 text-[8px] uppercase text-stone-500">
                             <X size={12} className="mx-auto" />
                          </button>
                          <button onClick={handleEditSave} className="flex-1 py-1 bg-user-a text-white text-[8px] uppercase font-bold">
                             <Check size={12} className="mx-auto" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-[10px] uppercase tracking-wider text-stone-800 dark:text-stone-200 max-w-[150px] truncate" title={task.text}>{task.text}</p>
                          <div className={`px-1.5 py-0.5 border text-[8px] font-bold tabular-nums ${
                            (task.actual_time / (task.estimated_time || 1)) > 1
                            ? 'border-red-500 text-red-500 bg-red-500/5'
                            : `border-user-${profile === 'ella' ? 'b' : 'a'} text-user-${profile === 'ella' ? 'b' : 'a'} bg-user-${profile === 'ella' ? 'b' : 'a'}/5`
                          }`}>
                            {task.actual_time}/{task.estimated_time}m
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          {task.objectiveId && (
                            <div className="text-[7px] uppercase font-bold text-stone-400">
                              #{objectives.find(o => o.id === task.objectiveId)?.title}
                            </div>
                          )}
                          {task.due_date && (
                            <div className="text-[7px] uppercase font-bold text-stone-400">
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-50 dark:border-stone-800/50">
                          <span className="text-[7px] uppercase font-bold tracking-[0.2em] text-user-a">{task.category}</span>
                          <div className="flex gap-1 items-center">
                            {task.status !== 'done' && (
                              <button onClick={() => handleEditStart(task)} className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-user-a transition-all">
                                <Pencil size={10} />
                              </button>
                            )}
                            {task.status === 'todo' && (
                              <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="text-[8px] font-bold uppercase tracking-widest text-stone-400 hover:text-user-a">▶</button>
                            )}
                            {task.status === 'in_progress' && (
                              <>
                                <button onClick={() => updateTaskStatus(task.id, 'todo')} className="text-[8px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">◀</button>
                                <button onClick={() => updateTaskStatus(task.id, 'done')} className="text-[8px] font-bold uppercase tracking-widest text-stone-400 hover:text-user-a">▶</button>
                              </>
                            )}
                            {task.status === 'done' && (
                              <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="text-[8px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">◀</button>
                            )}
                            <button onClick={() => deleteTask(task.id)} className="text-[8px] opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
