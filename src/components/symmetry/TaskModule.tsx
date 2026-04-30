'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react';

interface Objective {
  id: string;
  title: string;
}
interface Task {
  id: string;
  objectiveId?: string;
  text: string;
  status: 'todo' | 'in_progress' | 'done';
  category: 'work' | 'home' | 'personal';
  updatedAt?: string;
}

export const TaskModule = ({ onTasksUpdate }: { onTasksUpdate: (focusScore: number) => void }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [category, setCategory] = useState<'work' | 'home' | 'personal'>('work');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>('');

  // Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState<'work' | 'home' | 'personal'>('work');
  const [editTaskObjectiveId, setEditTaskObjectiveId] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('symmetry_tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      const savedObjectives = localStorage.getItem('symmetry_objectives');
      if (savedObjectives) setObjectives(JSON.parse(savedObjectives));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('symmetry_tasks', JSON.stringify(tasks));
      localStorage.setItem('symmetry_objectives', JSON.stringify(objectives));
      const completedCount = tasks.filter(t => t.status === 'done').length;
      const focusScore = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
      onTasksUpdate(focusScore);
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
      updatedAt: new Date().toISOString(),
    };
    setTasks([...tasks, task]);
    setNewTask('');
    setSelectedObjectiveId('');
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t));
  };

  const handleEditStart = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskText(task.text);
    setEditTaskCategory(task.category);
    setEditTaskObjectiveId(task.objectiveId || '');
  };

  const handleEditSave = () => {
    if (!editingTaskId) return;
    setTasks(tasks.map(t => t.id === editingTaskId ? {
      ...t,
      text: editTaskText,
      category: editTaskCategory,
      objectiveId: editTaskObjectiveId || undefined,
      updatedAt: new Date().toISOString()
    } : t));
    setEditingTaskId(null);
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    const objective: Objective = {
      id: Date.now().toString(),
      title: newObjective,
    };
    setObjectives([...objectives, objective]);
    setNewObjective('');
  };

  const deleteObjective = (id: string) => {
    setObjectives(objectives.filter(o => o.id !== id));
    setTasks(tasks.map(t => t.objectiveId === id ? { ...t, objectiveId: undefined } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Objective Management */}
      <div className="p-4 border border-stone-200 dark:border-stone-800 bg-white/5 dark:bg-black/20">
        <h4 className="text-[9px] uppercase font-bold tracking-[0.2em] text-stone-500 mb-4 flex items-center justify-between">
          Gestión de Objetivos
          <span className="text-[7px] font-mono opacity-50">v1.0</span>
        </h4>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            placeholder="Nuevo objetivo..."
            className="flex-1 bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-[10px] uppercase tracking-widest outline-none focus:border-user-a transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={addObjective}
            className="bg-stone-800 dark:bg-stone-200 text-white dark:text-black px-4 py-2"
          >
            <Plus size={16} />
          </motion.button>
        </div>
        <div className="flex flex-wrap gap-2">
          {objectives.map(obj => (
            <div key={obj.id} className="flex items-center gap-2 border border-stone-200 dark:border-stone-800 px-2 py-1 bg-white dark:bg-stone-900">
              <span className="text-[8px] uppercase tracking-widest font-bold">#{obj.title}</span>
              <button onClick={() => deleteObjective(obj.id)} className="text-stone-400 hover:text-red-500 transition-colors">
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Task Input */}
      <div className="flex flex-col gap-4 p-4 border border-stone-200 dark:border-stone-800 bg-white/5 dark:bg-black/20">
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Nueva operación..."
              className="flex-1 bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-[10px] uppercase tracking-widest outline-none focus:border-user-a transition-colors"
            />
            <select
              value={selectedObjectiveId}
              onChange={(e) => setSelectedObjectiveId(e.target.value)}
              className="bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-[8px] uppercase tracking-widest outline-none focus:border-user-a transition-colors appearance-none"
            >
              <option value="">Sin Objetivo</option>
              {objectives.map(obj => (
                <option key={obj.id} value={obj.id}>{obj.title}</option>
              ))}
            </select>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={addTask}
            className="bg-stone-800 dark:bg-stone-200 text-white dark:text-black px-4 py-2"
          >
            <Plus size={16} />
          </motion.button>
        </div>
        <div className="flex gap-2">
          {(['work', 'home', 'personal'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-1 text-[9px] uppercase font-bold tracking-widest py-1 border transition-colors ${
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
                        <p className="text-[10px] uppercase tracking-wider text-stone-800 dark:text-stone-200 max-w-[150px] truncate" title={task.text}>{task.text}</p>
                        {task.objectiveId && (
                          <div className="mt-1 text-[7px] uppercase font-bold text-stone-400">
                            #{objectives.find(o => o.id === task.objectiveId)?.title}
                          </div>
                        )}
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
