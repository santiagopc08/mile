'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    const savedTasks = localStorage.getItem('symmetry_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    const savedObjectives = localStorage.getItem('symmetry_objectives');
    if (savedObjectives) setObjectives(JSON.parse(savedObjectives));
  }, []);

  useEffect(() => {
    localStorage.setItem('symmetry_tasks', JSON.stringify(tasks));
    localStorage.setItem('symmetry_objectives', JSON.stringify(objectives));
    const completedCount = tasks.filter(t => t.status === 'done').length;
    const focusScore = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
    onTasksUpdate(focusScore);
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
              {objectives.map((obj) => (
                <div key={obj.id} className="flex items-center gap-2 px-2 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-stone-600">{obj.title}</span>
                  <button onClick={() => deleteObjective(obj.id)} className="text-stone-400 hover:text-red-500">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          {/* Objectives Summary Stats */}
          {objectives.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {objectives.map((obj) => {
                const objTasks = tasks.filter(t => t.objectiveId === obj.id);
                const total = objTasks.length;
                const completed = objTasks.filter(t => t.status === 'done').length;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div key={obj.id} className="p-3 border border-stone-200 dark:border-stone-800 bg-white/5 dark:bg-black/20 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-user-a truncate max-w-[80%]" title={obj.title}>
                        {obj.title}
                      </span>
                      <span className="text-[8px] font-mono text-stone-500">{percent}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[7px] uppercase font-bold tracking-wider text-stone-500">
                      <span>Tareas: {total}</span>
                      <span>Completadas: {completed}</span>
                    </div>
                    <div className="w-full h-1 bg-stone-100 dark:bg-stone-900 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        className="h-full bg-user-a"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-2">
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
                  className="bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-[8px] uppercase tracking-widest outline-none focus:border-user-a transition-colors"
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
             {/* Column 1: TODO */}
             <div className="border border-stone-200 dark:border-stone-800 bg-white/5 dark:bg-black/20 p-3 h-full flex flex-col">
                <h4 className="text-[9px] uppercase font-bold tracking-[0.2em] text-stone-500 mb-3 border-b border-stone-200 dark:border-stone-800 pb-2">Pendiente</h4>
                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                   <AnimatePresence>
                     {tasks.filter(t => t.status === 'todo').map((task) => (
                       <motion.div
                         key={task.id}
                         initial={{ opacity: 0, y: 5 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         className="p-2 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 group"
                       >
                         <p className="text-[10px] uppercase tracking-wider text-stone-800 dark:text-stone-200 max-w-[150px] truncate" title={task.text}>{task.text}</p>
                         {task.objectiveId && (
                           <div className="mt-1 text-[7px] uppercase font-bold text-stone-400">
                             #{objectives.find(o => o.id === task.objectiveId)?.title}
                           </div>
                         )}
                         <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-50 dark:border-stone-800/50">
                           <span className="text-[7px] uppercase font-bold tracking-[0.2em] text-user-a">{task.category}</span>
                           <div className="flex gap-1">
                              <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="text-[8px] font-bold uppercase tracking-widest text-stone-400 hover:text-user-a">▶</button>
                              <button onClick={() => deleteTask(task.id)} className="text-[8px] opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all"><Trash2 size={10} /></button>
                           </div>
                         </div>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                </div>
             </div>
    
             {/* Column 2: IN PROGRESS */}
             <div className="border border-stone-200 dark:border-stone-800 bg-white/5 dark:bg-black/20 p-3 h-full flex flex-col">
                <h4 className="text-[9px] uppercase font-bold tracking-[0.2em] text-stone-500 mb-3 border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-2">
                   En Progreso <span className="w-1.5 h-1.5 bg-user-a animate-pulse" />
                </h4>
                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                   <AnimatePresence>
                     {tasks.filter(t => t.status === 'in_progress').map((task) => (
                       <motion.div
                         key={task.id}
                         initial={{ opacity: 0, y: 5 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         className="p-2 border border-user-a/30 bg-white dark:bg-stone-900 group"
                       >
                         <p className="text-[10px] uppercase tracking-wider text-stone-800 dark:text-stone-200">{task.text}</p>
                         {task.objectiveId && (
                           <div className="mt-1 text-[7px] uppercase font-bold text-stone-400">
                             #{objectives.find(o => o.id === task.objectiveId)?.title}
                           </div>
                         )}
                         <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-50 dark:border-stone-800/50">
                           <span className="text-[7px] uppercase font-bold tracking-[0.2em] text-user-a">{task.category}</span>
                           <div className="flex gap-2">
                              <button onClick={() => updateTaskStatus(task.id, 'todo')} className="text-[8px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">◀</button>
                              <button onClick={() => updateTaskStatus(task.id, 'done')} className="text-[8px] font-bold uppercase tracking-widest text-stone-400 hover:text-user-a">▶</button>
                           </div>
                         </div>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                </div>
             </div>
    
             {/* Column 3: DONE */}
             <div className="border border-stone-200 dark:border-stone-800 bg-white/5 dark:bg-black/20 p-3 h-full flex flex-col opacity-70">
                <h4 className="text-[9px] uppercase font-bold tracking-[0.2em] text-stone-500 mb-3 border-b border-stone-200 dark:border-stone-800 pb-2">Completado</h4>
                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                   <AnimatePresence>
                     {tasks.filter(t => t.status === 'done').map((task) => (
                       <motion.div
                         key={task.id}
                         initial={{ opacity: 0, y: 5 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         className="p-2 border border-stone-100 dark:border-stone-900 bg-transparent group"
                       >
                         <p className="text-[10px] uppercase tracking-wider text-stone-500 line-through">{task.text}</p>
                         {task.objectiveId && (
                           <div className="mt-1 text-[7px] uppercase font-bold text-stone-400">
                             #{objectives.find(o => o.id === task.objectiveId)?.title}
                           </div>
                         )}
                         <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 dark:border-stone-900">
                           <span className="text-[7px] uppercase font-bold tracking-[0.2em] text-stone-500">{task.category}</span>
                           <div className="flex gap-2">
                              <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="text-[8px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">◀</button>
                              <button onClick={() => deleteTask(task.id)} className="text-[8px] opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all"><Trash2 size={10} /></button>
                           </div>
                         </div>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                </div>
             </div>
          </div>
        </div>
      );
    };
