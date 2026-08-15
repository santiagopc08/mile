import { Check } from 'lucide-react';
import { Task } from '@/services/storeService';

interface PomodoroChecklistProps {
    activeTask: Task | undefined;
    toggleTaskChecklist: (taskId: string, listType: 'actions' | 'validations', itemId: string) => Promise<void>;
}

export function PomodoroChecklist({
    activeTask,
    toggleTaskChecklist
}: PomodoroChecklistProps) {
    if (!activeTask || (!activeTask.actions?.length && !activeTask.validations?.length)) {
        return null;
    }

    return (
        <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-[#a88a7e]">
                <span>CHECKLIST DE ACCIONES DE LA TAREA</span>
                <span className="text-white/40">INTERACTIVO</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                {activeTask.actions && activeTask.actions.length > 0 && (
                    <div className="space-y-1.5">
                        <span className="text-[7.5px] font-mono font-bold uppercase tracking-widest text-[#ffb595] block">
                            Acciones
                        </span>
                        {activeTask.actions.map(act => (
                            <button
                                key={act.id}
                                onClick={() => toggleTaskChecklist(activeTask.id, 'actions', act.id)}
                                className={`flex w-full items-center gap-2 border p-2 text-left text-[9.5px] transition-all ${
                                    act.checked
                                        ? 'border-white/10 bg-white/[0.02] text-white/40'
                                        : 'border-white/15 bg-white/[0.04] text-white hover:border-white/30'
                                }`}
                            >
                                <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${act.checked ? 'border-user-a bg-user-a text-black' : 'border-white/30'}`}>
                                    {act.checked && <Check size={8} strokeWidth={4} />}
                                </div>
                                <span className={`truncate ${act.checked ? 'line-through' : ''}`}>
                                    {act.text}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {activeTask.validations && activeTask.validations.length > 0 && (
                    <div className="space-y-1.5">
                        <span className="text-[7.5px] font-mono font-bold uppercase tracking-widest text-[#00dbe9] block">
                            Criterios de éxito
                        </span>
                        {activeTask.validations.map(val => (
                            <button
                                key={val.id}
                                onClick={() => toggleTaskChecklist(activeTask.id, 'validations', val.id)}
                                className={`flex w-full items-center gap-2 border p-2 text-left text-[9.5px] transition-all ${
                                    val.checked
                                        ? 'border-white/10 bg-white/[0.02] text-white/40'
                                        : 'border-white/15 bg-white/[0.04] text-white hover:border-white/30'
                                }`}
                            >
                                <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${val.checked ? 'border-cyan-400 bg-cyan-400 text-black' : 'border-white/30'}`}>
                                    {val.checked && <Check size={8} strokeWidth={4} />}
                                </div>
                                <span className={`truncate ${val.checked ? 'line-through' : ''}`}>
                                    {val.text}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
