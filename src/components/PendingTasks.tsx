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
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-geometric-accent" />
                    <h3 className="text-sm uppercase font-bold tracking-[0.3em] text-white">
                        Log de Operaciones
                    </h3>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className={`w-8 h-8 flex items-center justify-center border transition-all ${
                        isAdding ? 'border-geometric-accent bg-geometric-accent/10 text-white' : 'border-stone-800 text-stone-600 hover:text-white hover:border-stone-600'
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
                            placeholder="ESPECIFICAR NUEVA TAREA..."
                            className="w-full bg-black/40 border border-stone-800 rounded-none px-4 py-3 text-xs uppercase tracking-widest text-white placeholder-stone-700 outline-none focus:border-geometric-accent"
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
                                className="flex-1 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-30 hover:bg-geometric-accent hover:text-white"
                            >
                                INSERTAR TAREA
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {tasks.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-stone-700 uppercase font-bold text-[10px] tracking-[0.4em] border border-stone-800 border-dashed">
                        SISTEMA SIN TAREAS
                    </div>
                ) : (
                    tasks.map((task: any) => (
                        <div 
                            key={task.id}
                            onClick={() => toggleTask(task)}
                            className={`group grid grid-cols-[auto_1fr_auto] items-center gap-6 p-5 border transition-all cursor-pointer ${
                                task.status === 'completed' 
                                ? 'bg-black/40 border-stone-900 opacity-30 shadow-none' 
                                : 'bg-white/5 border-stone-800 hover:border-stone-600 hover:bg-white/10 shadow-sm'
                            }`}
                        >
                            <div className="flex items-center justify-center">
                                <div className={`w-5 h-5 border flex items-center justify-center transition-all ${
                                    task.status === 'completed' ? 'bg-geometric-accent border-geometric-accent' : 'border-stone-700'
                                }`}>
                                    {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                            </div>
                            
                            <div className="min-w-0">
                                <p className={`text-sm tracking-wide font-medium ${task.status === 'completed' ? 'text-stone-600 line-through italic' : 'text-stone-100 uppercase'}`}>
                                    {task.title}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className={`w-1 h-3 ${
                                        task.priority === 'high' ? 'bg-rose-500' :
                                        task.priority === 'medium' ? 'bg-amber-500' : 'bg-stone-600'
                                    }`} />
                                    <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-stone-500">
                                        P{task.priority === 'high' ? '01' : task.priority === 'medium' ? '02' : '03'} // {task.priority}
                                    </span>
                                </div>
                            </div>

                            <button 
                                onClick={(e) => deleteTask(task.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 hover:text-white transition-all bg-white/5"
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
