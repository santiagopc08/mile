'use client';

import { useState } from 'react';
import type { AppData } from '@/services/storeService';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { CheckCircle2, Circle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PendingTasks() {
    const { data, updateData } = useStore();
    const { profile } = useProfile();
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('medium');

    const tasks = data?.tasks || [];

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !profile) return;
        
        const newTask = {
            id: Date.now().toString(),
            title: title.trim(),
            description: '',
            status: 'pending',
            priority,
            assignee: 'Ambos'
        };

        await updateData({ tasks: [newTask, ...tasks] });
        setTitle('');
        setPriority('medium');
        setIsAdding(false);
    };

    const toggleTask = async (task: AppData['tasks'][0]) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        const updated = tasks.map((t) => t.id === task.id ? { ...t, status: newStatus } : t);
        await updateData({ tasks: updated });
    };

    const deleteTask = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = tasks.filter((t) => t.id !== id);
        await updateData({ tasks: updated });
    };

    return (
        <div className="glass-panel rounded-3xl p-6 flex flex-col h-full max-h-[500px]">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-cyan" />
                    Tareas Pendientes
                </h3>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-stone-300 transition-colors"
                >
                    <Plus className={`w-4 h-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.form 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddTask}
                        className="mb-4 space-y-3 overflow-hidden"
                    >
                        <input 
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="¿Qué hay por hacer?"
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-400 outline-none focus:border-brand-blue/50"
                        />
                        <div className="flex gap-2">
                            <select 
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="bg-black/20 text-stone-300 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none"
                            >
                                <option value="low">Prioridad Baja</option>
                                <option value="medium">Prioridad Media</option>
                                <option value="high">Prioridad Alta</option>
                            </select>
                            <button 
                                type="submit"
                                disabled={!title.trim()}
                                className="flex-1 bg-brand-blue hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            >
                                Guardar Tarea
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone-500 italic text-sm">
                        No hay tareas pendientes.
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div 
                            key={task.id}
                            onClick={() => toggleTask(task)}
                            className={`group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                task.status === 'completed' 
                                ? 'bg-white/5 border-white/5 opacity-50' 
                                : 'bg-white/10 border-white/10 hover:bg-white/15 hover:border-white/20'
                            }`}
                        >
                            <div className="mt-0.5">
                                {task.status === 'completed' ? (
                                    <CheckCircle2 className="w-5 h-5 text-brand-cyan" />
                                ) : (
                                    <Circle className="w-5 h-5 text-stone-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm tracking-wide ${task.status === 'completed' ? 'text-stone-400 line-through' : 'text-stone-200'}`}>
                                    {task.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] uppercase font-semibold tracking-wider ${
                                        task.priority === 'high' ? 'text-rose-400' :
                                        task.priority === 'medium' ? 'text-amber-400' : 'text-stone-500'
                                    }`}>
                                        {task.priority === 'high' && <AlertCircle className="w-3 h-3 inline mr-1" />}
                                        {task.priority}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => deleteTask(task.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
