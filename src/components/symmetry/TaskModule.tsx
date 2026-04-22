'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, Plus, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: 'work' | 'home' | 'personal';
}

export const TaskModule = ({ onTasksUpdate }: { onTasksUpdate: (focusScore: number) => void }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState<'work' | 'home' | 'personal'>('work');

  useEffect(() => {
    const saved = localStorage.getItem('symmetry_tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('symmetry_tasks', JSON.stringify(tasks));
    const completedCount = tasks.filter(t => t.completed).length;
    const focusScore = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
    onTasksUpdate(focusScore);
  }, [tasks, onTasksUpdate]);

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      text: newTask,
      completed: false,
      category,
    };
    setTasks([...tasks, task]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="New disciplinary action..."
            className="flex-1 bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-xs uppercase tracking-widest outline-none focus:border-user-a transition-colors"
          />
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
              className={`flex-1 text-[10px] uppercase font-bold tracking-widest py-1 border transition-colors ${
                category === cat ? 'border-user-a text-user-a' : 'border-transparent text-stone-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center justify-between p-2 border border-stone-100 dark:border-stone-900 group"
            >
              <button
                onClick={() => toggleTask(task.id)}
                className="flex items-center gap-3 text-left"
              >
                {task.completed ? (
                  <CheckSquare size={16} className="text-user-a" />
                ) : (
                  <Square size={16} className="text-stone-400" />
                )}
                <span className={`text-[11px] uppercase tracking-wider ${task.completed ? 'line-through text-stone-500' : 'text-stone-800 dark:text-stone-200'}`}>
                  {task.text}
                </span>
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
