'use client';

import { useState } from 'react';
import { Task, TaskStatus } from '@/services/storeService';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { Plus } from 'lucide-react';
import { TaskItem } from './tasks/TaskItem';
import { motion, AnimatePresence } from 'framer-motion';

export function PendingTasks() {
    const { data, updateData } = useStore();
    const { profile } = useProfile();
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('medium');


    const tasks = data?.tasks || [];
    const accentColor = profile === 'ella' ? 'user-a' : 'user-b';

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !profile) return;
        
        const newTask: Task = {
            id: Date.now().toString(),
            text: title.trim(),
            status: 'todo',
            category: 'work',
            estimated_time: 0,
            actual_time: 0,
            updated_at: new Date().toISOString()
        };

        await updateData({ tasks: [newTask, ...tasks] });
        setTitle('');
        setPriority('medium');
        setIsAdding(false);
    };

    const handleSaveTask = async (id: string, newText: string, newPriority: 'low' | 'medium' | 'high') => {
        const updated = tasks.map(t => t.id === id ? {
            ...t,
            text: newText,
            priority: newPriority
        } : t);
        await updateData({ tasks: updated });
    };

    const toggleTask = async (task: Task) => {
        const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
        const updated = tasks.map((t) => t.id === task.id ? { ...t, status: newStatus } : t);
        await updateData({ tasks: updated });
    };

    const deleteTask = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = tasks.filter((t) => t.id !== id);
        await updateData({ tasks: updated });
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-geometric-accent" />
                    <h3 className="text-sm uppercase font-bold tracking-[0.3em] text-white">
                        Nuestros Pendientes
                    </h3>
                </div>
                <button 
                    onClick={() => { setIsAdding(!isAdding); }}
                    className={`w-8 h-8 flex items-center justify-center border transition-all ${
                        isAdding ? `border-${accentColor} bg-${accentColor}/10 text-white` : 'border-stone-800 text-stone-600 hover:text-white hover:border-stone-600'
                    }`}
                >
                    <Plus className={`w-4 h-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.form 
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                        onSubmit={handleAddTask}
                        className="mb-8 p-6 border border-geometric-accent/30 bg-geometric-accent/5 origin-top"
                    >
                        <input 
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="¿QUÉ TENEMOS PENDIENTE?..."
                            className={`w-full bg-black/40 border border-stone-800 rounded-none px-4 py-3 text-xs uppercase tracking-widest text-white placeholder-stone-700 outline-none focus:border-${accentColor}`}
                        />
                        <div className="flex gap-4 mt-4">
                            <select 
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="bg-black/40 text-[10px] uppercase font-bold tracking-widest text-stone-500 border border-stone-800 rounded-none px-4 py-2 outline-none appearance-none cursor-pointer hover:border-stone-600"
                            >
                                <option value="low">PRIORIDAD: BAJA</option>
                                <option value="medium">PRIORIDAD: MEDIA</option>
                                <option value="high">PRIORIDAD: ALTA</option>
                            </select>
                            <button 
                                type="submit"
                                disabled={!title.trim()}
                                className={`flex-1 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-30 hover:bg-${accentColor} hover:text-white`}
                            >
                                AGREGAR TAREA
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {tasks.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-stone-700 uppercase font-bold text-[10px] tracking-[0.4em] border border-stone-800 border-dashed">
                        ¡TODO AL DÍA! SIN PENDIENTES
                    </div>
                ) : (
                    tasks.map((task: Task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            accentColor={accentColor}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            onSave={handleSaveTask}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
