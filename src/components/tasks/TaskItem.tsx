import { useState } from 'react';
import { Task } from '@/services/storeService';
import { CheckCircle2, Trash2, Pencil, X, Check } from 'lucide-react';
import { FuturisticProgressBar } from '../ui/FuturisticProgressBar';

interface TaskItemProps {
    task: Task;
    accentColor: string;
    onToggle: (task: Task) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onSave: (id: string, newText: string, newPriority: 'low' | 'medium' | 'high') => void;
}

export function TaskItem({ task, accentColor, onToggle, onDelete, onSave }: TaskItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.text);
    const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>(task.priority || 'medium');

    const handleEditStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditTitle(task.text);
        setEditPriority(task.priority || 'medium');
        setIsEditing(true);
    };

    const handleEditSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(task.id, editTitle.trim(), editPriority);
        setIsEditing(false);
    };

    return (
        <div
            onClick={() => onToggle(task)}
            className={`group grid grid-cols-[auto_1fr_auto] items-center gap-6 p-5 border transition-all cursor-pointer ${
                task.status === 'done'
                ? 'bg-black/40 border-stone-900 opacity-30 shadow-none'
                : 'bg-white/5 border-stone-800 hover:border-stone-600 hover:bg-white/10 shadow-sm'
            } ${isEditing ? `border-${accentColor} ring-1 ring-${accentColor}/30` : ''}`}
        >
             <div className="flex items-center justify-center">
                <div className={`w-5 h-5 border flex items-center justify-center transition-all ${
                    task.status === 'done' ? `bg-${accentColor} border-${accentColor}` : 'border-stone-700'
                }`}>
                    {task.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
            </div>

            <div className="min-w-0">
                {isEditing ? (
                    <form onSubmit={handleEditSave} onClick={e => e.stopPropagation()} className="space-y-3">
                        <input
                            autoFocus
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="w-full bg-black/60 border border-stone-700 px-2 py-1 text-xs uppercase tracking-widest text-white outline-none focus:border-geometric-accent"
                        />
                        <div className="flex gap-2">
                            <select
                                value={editPriority}
                                onChange={e => setEditPriority(e.target.value as 'low' | 'medium' | 'high')}
                                className="bg-black/60 border border-stone-700 px-2 py-1 text-[8px] uppercase font-bold text-stone-400 outline-none"
                            >
                                <option value="low">BAJA</option>
                                <option value="medium">MEDIA</option>
                                <option value="high">ALTA</option>
                            </select>
                            <button type="button" onClick={() => setIsEditing(false)} className="p-1 text-stone-500 hover:text-white transition-colors">
                                <X size={14} />
                            </button>
                            <button type="submit" className="p-1 text-geometric-accent hover:text-white transition-colors">
                                <Check size={14} />
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <p className={`text-sm tracking-wide font-medium ${task.status === 'done' ? 'text-stone-600 line-through italic' : 'text-stone-100 uppercase'}`}>
                            {task.text}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                            <div className={`w-1 h-3 ${
                                task.priority === 'high' ? 'bg-rose-500' :
                                task.priority === 'medium' ? 'bg-amber-500' : 'bg-stone-600'
                            }`} />
                            <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-stone-500">
                                P{task.priority === 'high' ? '01' : task.priority === 'medium' ? '02' : '03'} {'//'} {task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MEDIA' : 'BAJA'}
                            </span>
                        </div>
                        {task.estimated_time > 0 && task.status !== 'done' && (
                            <div className="mt-2.5">
                                <FuturisticProgressBar
                                    progress={Math.min((task.actual_time / task.estimated_time) * 100, 100)}
                                    color={task.priority === 'high' ? '#f43f5e' : task.priority === 'medium' ? '#f59e0b' : '#0ea5e9'}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="flex flex-col gap-2">
                {!isEditing && task.status !== 'done' && (
                    <button
                        onClick={handleEditStart}
                        className="p-2 text-stone-400 hover:text-geometric-accent transition-all bg-white/5"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={(e) => onDelete(task.id, e)}
                    className="p-2 text-stone-400 hover:text-red-500 transition-all bg-white/5"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
