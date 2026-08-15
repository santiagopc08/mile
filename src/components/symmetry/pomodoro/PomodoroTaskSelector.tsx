import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, ChevronDown } from 'lucide-react';
import { Task } from '@/services/storeService';
import { haptics } from '@/lib/haptics';

interface PomodoroTaskSelectorProps {
    isRunning: boolean;
    selectedTaskId: string;
    setSelectedTaskId: (id: string) => void;
    activeTask: Task | undefined;
    isDropdownOpen: boolean;
    setIsDropdownOpen: (open: boolean) => void;
    tasks: Task[];
    accentHex: string;
}

export function PomodoroTaskSelector({
    isRunning,
    selectedTaskId,
    setSelectedTaskId,
    activeTask,
    isDropdownOpen,
    setIsDropdownOpen,
    tasks,
    accentHex
}: PomodoroTaskSelectorProps) {
    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-1.5 text-[8px] uppercase tracking-[0.2em] text-[#a88a7e]">
                <span>OBJETIVO VINCULADO</span>
                {selectedTaskId && (
                    <button
                        onClick={() => setSelectedTaskId('')}
                        disabled={isRunning}
                        className="text-[7.5px] text-red-400/80 hover:text-red-400 uppercase tracking-widest disabled:opacity-30"
                    >
                        [ Desvincular ]
                    </button>
                )}
            </div>
            <button
                onClick={() => !isRunning && setIsDropdownOpen(!isDropdownOpen)}
                disabled={isRunning}
                className={`flex min-h-[46px] w-full items-center justify-between border px-4 py-2.5 transition-all text-left ${
                    selectedTaskId
                        ? 'border-white/25 bg-white/[0.05] shadow-inner'
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                } disabled:opacity-50`}
                style={{ borderColor: selectedTaskId ? accentHex : undefined }}
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <ListTodo className="h-4 w-4 shrink-0" style={{ color: selectedTaskId ? accentHex : '#a88a7e' }} />
                    <span className={`truncate text-xs font-bold uppercase tracking-wide ${selectedTaskId ? 'text-white' : 'text-[#a88a7e]'}`}>
                        {selectedTaskId ? activeTask?.text : 'Vincular una tarea de tu lista...'}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-[#a88a7e] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isDropdownOpen && !isRunning && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-56 overflow-y-auto border border-white/15 bg-[#0e0a10] shadow-2xl backdrop-blur-2xl custom-scrollbar divide-y divide-white/5"
                    >
                        {tasks.length === 0 ? (
                            <div className="p-4 text-center text-[10px] text-[#a88a7e]">
                                No hay tareas pendientes en tu lista.
                            </div>
                        ) : (
                            tasks.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => {
                                        setSelectedTaskId(task.id);
                                        setIsDropdownOpen(false);
                                        haptics.triggerTick();
                                    }}
                                    className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/10 group"
                                >
                                    <div className="min-w-0 flex-1 pr-2">
                                        <span className="block font-bold truncate text-white text-[11px] uppercase group-hover:text-white">
                                            {task.text}
                                        </span>
                                        <span className="block text-[8px] text-[#a88a7e] tracking-wider mt-0.5 font-sans">
                                            {task.category || 'General'} • {task.actual_time || 0}m invertidos
                                        </span>
                                    </div>
                                    <span className="text-[8px] font-mono font-bold text-white/30 group-hover:text-white shrink-0">
                                        [ SELECCIONAR ]
                                    </span>
                                </button>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
