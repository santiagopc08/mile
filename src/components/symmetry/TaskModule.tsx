'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Pencil, X, Calendar, ChevronDown, Sparkles, Lock, Unlock, AlertTriangle, Clock } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { StoreService, type ChecklistItem } from '@/services/storeService';

interface Task {
  id: string;
  objective_id?: string;
  text: string;
  status: 'todo' | 'in_progress' | 'done' | 'skipped';
  category: 'work' | 'home' | 'personal';
  priority?: 'low' | 'medium' | 'high';
  estimated_time: number;
  actual_time: number;
  due_date?: string;
  updated_at: string;
  actions?: ChecklistItem[];
  validations?: ChecklistItem[];
  detail?: string;
}

interface Objective {
  id: string;
  title: string;
  author: string;
  is_complete?: boolean;
}

export const TaskModule = ({ onTasksUpdate }: { onTasksUpdate: (score: number) => void }) => {
  const { profile } = useProfile();
  const { data, updateData } = useStore();

  const tasks = useMemo(() => (data?.tasks as Task[]) || [], [data?.tasks]);
  const objectives = useMemo(() => (data?.objectives as Objective[]) || [], [data?.objectives]);

  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState<'work' | 'home' | 'personal'>('work');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newObjective, setNewObjective] = useState('');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>('');
  const [newEstimatedTime, setNewEstimatedTime] = useState<number>(30);
  const [newDueDate, setNewDueDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newDetail, setNewDetail] = useState('');
  const [newActions, setNewActions] = useState<ChecklistItem[]>([]);
  const [newValidations, setNewValidations] = useState<ChecklistItem[]>([]);
  const [newActionText, setNewActionText] = useState('');
  const [newValidationText, setNewValidationText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<{ field: string; items: string[] }>({ field: '', items: [] });
  const [aiLoading, setAiLoading] = useState(false);

  // Expanded views inside the card
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  const toggleChecklistInCard = (taskId: string, listType: 'actions' | 'validations', itemId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const list = task[listType] || [];
    const newList = list.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i);
    updateData({ tasks: tasks.map(t => t.id === taskId ? { ...t, [listType]: newList } : t) as any });
  };

  // Edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState<'work' | 'home' | 'personal'>('work');
  const [editTaskObjectiveId, setEditTaskObjectiveId] = useState<string>('');
  const [editEstimatedTime, setEditEstimatedTime] = useState<number>(0);
  const [editActualTime, setEditActualTime] = useState<number>(0);
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editActions, setEditActions] = useState<ChecklistItem[]>([]);
  const [editValidations, setEditValidations] = useState<ChecklistItem[]>([]);
  const [editDetail, setEditDetail] = useState('');

  useEffect(() => {
    if (tasks.length > 0) {
      const completedCount = tasks.filter(t => t.status === 'done').length;
      const focusScore = (completedCount / tasks.length) * 100;
      onTasksUpdate(focusScore);
    } else {
      onTasksUpdate(0);
    }
  }, [tasks, onTasksUpdate]);

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      objective_id: selectedObjectiveId || undefined,
      text: newTask,
      status: 'todo',
      category,
      priority: newPriority,
      estimated_time: newEstimatedTime,
      actual_time: 0,
      due_date: newDueDate || undefined,
      actions: newActions.length > 0 ? newActions : undefined,
      validations: newValidations.length > 0 ? newValidations : undefined,
      detail: newDetail.trim() || undefined,
      updated_at: new Date().toISOString(),
    };
    updateData({ tasks: [task, ...tasks] as any });
    setNewTask('');
    setNewDueDate('');
    setNewDetail('');
    setNewActions([]);
    setNewValidations([]);
    setNewPriority('medium');
    setSelectedObjectiveId('');
    setNewEstimatedTime(30);
    setShowAdvanced(false);
    setAiSuggestions({ field: '', items: [] });
    setIsTaskFormOpen(false);
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    const obj: Objective = {
      id: crypto.randomUUID(),
      title: newObjective,
      author: profile || 'el',
      is_complete: false
    };
    updateData({ objectives: [...objectives, obj] as any });
    setNewObjective('');
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    let finalStatus = status;
    if (status === 'done' && task.validations && task.validations.length > 0) {
      const hasChecked = task.validations.some(v => v.checked);
      if (!hasChecked) {
        finalStatus = 'skipped';
      }
    }

    updateData({ tasks: tasks.map(t => t.id === id ? { ...t, status: finalStatus, updated_at: new Date().toISOString() } : t) as any });
  };

  const deleteTask = (id: string) => {
    updateData({ tasks: tasks.filter(t => t.id !== id) as any });
  };

  const deleteObjective = (id: string) => {
    updateData({ objectives: objectives.filter(o => o.id !== id) as any });
    if (selectedObjectiveId === id) setSelectedObjectiveId('');
    updateData({ tasks: tasks.map(t => t.objective_id === id ? { ...t, objective_id: undefined } : t) as any });
  };

  const handleEditStart = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskText(task.text);
    setEditTaskCategory(task.category);
    setEditTaskObjectiveId(task.objective_id || '');
    setEditEstimatedTime(task.estimated_time);
    setEditActualTime(task.actual_time);
    setEditDueDate(task.due_date || '');
    setEditPriority(task.priority || 'medium');
    setEditActions(task.actions || []);
    setEditValidations(task.validations || []);
    setEditDetail(task.detail || '');
  };

  const handleEditSave = () => {
    updateData({
      tasks: tasks.map(t => t.id === editingTaskId ? {
        ...t,
        text: editTaskText,
        category: editTaskCategory,
        objective_id: editTaskObjectiveId || undefined,
        estimated_time: editEstimatedTime,
        actual_time: editActualTime,
        due_date: editDueDate || undefined,
        priority: editPriority,
        actions: editActions,
        validations: editValidations,
        detail: editDetail.trim() || undefined,
        updated_at: new Date().toISOString()
      } : t) as any
    });
    setEditingTaskId(null);
  };

  const skipTask = (id: string) => {
    updateData({ tasks: tasks.map(t => t.id === id ? { ...t, status: 'skipped' as const, updated_at: new Date().toISOString() } : t) as any });
  };

  const toggleObjectiveComplete = (id: string) => {
    const hasPending = tasks.some(t => t.objective_id === id && t.status !== 'done' && t.status !== 'skipped');
    if (hasPending) return;
    updateData({ objectives: objectives.map(o => o.id === id ? { ...o, is_complete: !o.is_complete } : o) as any });
  };

  const fetchAiSuggestions = async (field: 'actions' | 'validations') => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskText: newTask || editTaskText, category, field })
      });
      const data = await res.json();
      setAiSuggestions({ field, items: data.suggestions || [] });
    } catch { setAiSuggestions({ field, items: [] }); }
    setAiLoading(false);
  };

  const importSuggestion = (text: string, field: 'actions' | 'validations') => {
    const item: ChecklistItem = { id: Date.now().toString() + Math.random(), text, checked: false };
    if (editingTaskId) {
      if (field === 'actions') setEditActions(prev => [...prev, item]);
      else setEditValidations(prev => [...prev, item]);
    } else {
      if (field === 'actions') setNewActions(prev => [...prev, item]);
      else setNewValidations(prev => [...prev, item]);
    }
    setAiSuggestions(prev => ({ ...prev, items: prev.items.filter(i => i !== text) }));
  };

  const getTaskStatusDot = (task: Task) => {
    if (task.status === 'skipped') return { color: 'bg-red-500', label: 'Saltada' };
    const vals = task.validations || [];
    if (vals.length === 0) return { color: 'bg-stone-400', label: 'Sin validación' };
    const checked = vals.filter(v => v.checked).length;
    if (checked === vals.length) return { color: 'bg-emerald-500', label: 'Completa' };
    return { color: 'bg-amber-500', label: `${checked}/${vals.length}` };
  };

  const isTaskLate = (task: Task) => task.due_date && new Date() > new Date(task.due_date) && task.status !== 'done' && task.status !== 'skipped';
  const isTaskOverflowed = (task: Task) => task.estimated_time > 0 && task.actual_time > task.estimated_time;

  return (
    <div className="space-y-6 border border-white/10 bg-black/40 p-4">
      {/* Creation UI */}
      <div className="flex flex-col gap-6">
        {/* Objectives First */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={newObjective}
              onChange={e => setNewObjective(e.target.value)}
              placeholder="NUEVO OBJETIVO"
              className="flex-1 border border-white/10 bg-black px-4 py-2 text-[10px] uppercase text-white outline-none placeholder:text-[#594137] focus:border-user-b"
            />
            <button onClick={addObjective} className="border border-user-b bg-user-b px-4 py-2 text-white transition-colors hover:bg-user-b/80">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {objectives.map(obj => {
              const objTasks = tasks.filter(t => t.objective_id === obj.id);
              const pendingCount = objTasks.filter(t => t.status !== 'done' && t.status !== 'skipped').length;
              const completedCount = objTasks.length - pendingCount;
              const totalEst = objTasks.reduce((acc, t) => acc + (t.estimated_time || 0), 0);
              const totalAct = objTasks.reduce((acc, t) => acc + (t.actual_time || 0), 0);

              return (
                <div key={obj.id} className={`flex flex-col gap-1 border px-2 py-1 transition-all ${obj.is_complete ? 'border-emerald-500 bg-emerald-500/5 opacity-50' : 'border-user-b/30 bg-user-b/5'}`}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleObjectiveComplete(obj.id)}
                      disabled={pendingCount > 0}
                      className={`border p-0.5 ${obj.is_complete ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-user-b/50 text-transparent hover:border-user-b'} disabled:cursor-not-allowed disabled:opacity-30`}
                    >
                      {obj.is_complete ? <Check size={10} /> : <div className="w-[10px] h-[10px]" />}
                    </button>
                    <span className={`text-[8px] uppercase font-bold ${obj.is_complete ? 'text-emerald-500 line-through' : 'text-user-b'}`}>{obj.title}</span>
                    <button onClick={() => deleteObjective(obj.id)} className="text-stone-400 hover:text-red-500 ml-auto">
                      <X size={10} />
                    </button>
                  </div>
                  {objTasks.length > 0 && (
                    <div className="mt-0.5 flex gap-2 border-t border-user-b/10 pt-1 font-mono text-[6px] uppercase text-[#a88a7e]">
                      <span>{completedCount}/{objTasks.length} Tareas</span>
                      <span>{totalAct}/{totalEst} Min</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Tasks Second */}
        <AnimatePresence>
          {isTaskFormOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden border-t border-white/10 pt-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-user-a tracking-[0.2em]">[ NEW_OPERATION_SHEET ]</span>
                <button onClick={() => setIsTaskFormOpen(false)} className="text-stone-500 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div className="flex gap-2">
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="NUEVA TAREA"
              className="flex-1 border border-white/10 bg-black px-4 py-2 text-[10px] uppercase text-white outline-none placeholder:text-[#594137] focus:border-user-a"
            />
            <button onClick={addTask} className="border border-user-a bg-user-a px-4 py-2 text-black transition-colors hover:bg-[#ffb595]">
              <Plus size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
            <div className="flex flex-col gap-1">
              <label className="text-[7px] uppercase font-bold text-stone-400">Objetivo</label>
              <select
                value={selectedObjectiveId}
                onChange={e => setSelectedObjectiveId(e.target.value)}
                className="h-[32px] border border-white/10 bg-black px-2 text-[8px] uppercase text-[#e5e2e1] outline-none"
              >
                <option value="">Sin Objetivo</option>
                {objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[7px] uppercase font-bold text-stone-400">Categoría</label>
              <div className="flex min-h-[32px] border border-white/10 bg-black">
                {(['work', 'home', 'personal'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex-1 px-1 py-2 text-[7px] font-bold uppercase transition-colors ${category === cat ? 'bg-user-a/15 text-user-a' : 'text-stone-500 hover:bg-white/5 hover:text-stone-300'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[7px] uppercase font-bold text-stone-400">Prioridad</label>
              <div className="flex min-h-[32px] border border-white/10 bg-black">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setNewPriority(p)}
                    className={`flex-1 flex items-center justify-center py-2 text-[7px] uppercase font-bold transition-colors ${newPriority === p ? (p === 'high' ? 'bg-rose-500/20 text-rose-500' : p === 'medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-stone-500/20 text-stone-400') : 'text-stone-500 hover:bg-white/5'}`}
                  >
                    {p === 'high' ? 'ALTA' : p === 'medium' ? 'MED' : 'BAJA'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[7px] uppercase font-bold text-stone-400">Est. (m)</label>
              <input
                type="number"
                value={newEstimatedTime}
                onChange={e => setNewEstimatedTime(Number(e.target.value))}
                className="h-[32px] border border-white/10 bg-black px-2 text-[8px] text-white outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[7px] uppercase font-bold text-stone-400">Fecha Límite</label>
              <input
                type="datetime-local"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                className="h-[32px] border border-white/10 bg-black px-2 text-[8px] text-white outline-none"
              />
            </div>
          </div>

          {/* Advanced Fields Toggle */}
          <div className="pt-2">
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-[8px] uppercase font-bold text-stone-400 hover:text-stone-200 transition-colors">
              <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              Campos Avanzados {showAdvanced ? '(Ocultar)' : '(Mostrar)'}
            </button>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4 border-l-2 border-stone-800 pl-4 py-2">

                {/* Detail */}
                <div className="flex flex-col gap-1">
                  <label className="text-[7px] uppercase font-bold text-stone-400">Detalle (Contexto Estático)</label>
                  <textarea
                    value={newDetail}
                    onChange={e => setNewDetail(e.target.value)}
                    placeholder="Información adicional o contexto..."
                    className="min-h-[60px] resize-none border border-white/10 bg-black px-3 py-2 text-[10px] text-white outline-none placeholder:text-[#594137]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[7px] uppercase font-bold text-stone-400">Checklist de Acciones</label>
                      <button onClick={() => fetchAiSuggestions('actions')} disabled={!newTask || aiLoading} className="text-[7px] flex items-center gap-1 text-user-b hover:text-white disabled:opacity-30">
                        <Sparkles size={10} /> AI Suggest
                      </button>
                    </div>

                    {/* AI Suggestions (Actions) */}
                    {aiSuggestions.field === 'actions' && aiSuggestions.items.length > 0 && (
                      <div className="p-2 border border-user-b/30 bg-user-b/5 space-y-1">
                        <div className="text-[6px] uppercase font-bold text-user-b mb-1">Sugerencias (Pick & Choose)</div>
                        {aiSuggestions.items.map(sug => (
                          <button key={sug} onClick={() => importSuggestion(sug, 'actions')} className="text-left w-full text-[8px] text-stone-300 hover:text-white hover:bg-user-b/20 p-1 flex items-center gap-2">
                            <Plus size={8} /> {sug}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-1">
                      <input
                        value={newActionText}
                        onChange={e => setNewActionText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { setNewActions([...newActions, { id: Date.now().toString(), text: newActionText, checked: false }]); setNewActionText(''); } }}
                        placeholder="Nueva acción..."
                        className="flex-1 border border-white/10 bg-black px-2 py-1 text-[9px] text-white outline-none placeholder:text-[#594137]"
                      />
                      <button onClick={() => { if (newActionText) { setNewActions([...newActions, { id: Date.now().toString(), text: newActionText, checked: false }]); setNewActionText(''); } }} className="border border-white/10 px-2 hover:border-user-b hover:bg-white/5"><Plus size={10} /></button>
                    </div>
                    <div className="space-y-1">
                      {newActions.map(act => (
                        <div key={act.id} className="flex justify-between items-center text-[9px] px-2 py-1 bg-white/5 border border-stone-800/50">
                          <span className="truncate pr-2">{act.text}</span>
                          <button onClick={() => setNewActions(newActions.filter(a => a.id !== act.id))} className="text-stone-500 hover:text-red-500"><X size={10} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Validations */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[7px] uppercase font-bold text-stone-400">Validaciones de Éxito</label>
                      <button onClick={() => fetchAiSuggestions('validations')} disabled={!newTask || aiLoading} className="text-[7px] flex items-center gap-1 text-emerald-500 hover:text-white disabled:opacity-30">
                        <Sparkles size={10} /> AI Suggest
                      </button>
                    </div>

                    {/* AI Suggestions (Validations) */}
                    {aiSuggestions.field === 'validations' && aiSuggestions.items.length > 0 && (
                      <div className="p-2 border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                        <div className="text-[6px] uppercase font-bold text-emerald-500 mb-1">Sugerencias (Pick & Choose)</div>
                        {aiSuggestions.items.map(sug => (
                          <button key={sug} onClick={() => importSuggestion(sug, 'validations')} className="text-left w-full text-[8px] text-stone-300 hover:text-white hover:bg-emerald-500/20 p-1 flex items-center gap-2">
                            <Plus size={8} /> {sug}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-1">
                      <input
                        value={newValidationText}
                        onChange={e => setNewValidationText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { setNewValidations([...newValidations, { id: Date.now().toString(), text: newValidationText, checked: false }]); setNewValidationText(''); } }}
                        placeholder="Nueva validación..."
                        className="flex-1 border border-white/10 bg-black px-2 py-1 text-[9px] text-white outline-none placeholder:text-[#594137]"
                      />
                      <button onClick={() => { if (newValidationText) { setNewValidations([...newValidations, { id: Date.now().toString(), text: newValidationText, checked: false }]); setNewValidationText(''); } }} className="border border-white/10 px-2 hover:border-emerald-500 hover:bg-white/5"><Plus size={10} /></button>
                    </div>
                    <div className="space-y-1">
                      {newValidations.map(val => (
                        <div key={val.id} className="flex justify-between items-center text-[9px] px-2 py-1 bg-white/5 border border-stone-800/50">
                          <span className="truncate pr-2">{val.text}</span>
                          <button onClick={() => setNewValidations(newValidations.filter(v => v.id !== val.id))} className="text-stone-500 hover:text-red-500"><X size={10} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
      </div>

      <div className="grid min-h-[250px] grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { status: 'todo' as const, title: 'PENDIENTE', accent: 'text-stone-500', bgAccent: 'bg-stone-500' },
          { status: 'in_progress' as const, title: 'PROGRESO', accent: 'text-user-a', bgAccent: 'bg-user-a', pulse: true },
          { status: 'done' as const, title: 'COMPLETADO', accent: 'text-stone-600', bgAccent: 'bg-stone-600', opacity: 'opacity-50' },
          { status: 'skipped' as const, title: 'SALTADO', accent: 'text-red-900', bgAccent: 'bg-red-900', opacity: 'opacity-40' }
        ].map((col) => {
          const colTasks = tasks.filter(t => t.status === col.status);
          return (
          <div key={col.status} className={`flex h-full flex-col border border-white/10 bg-black/30 p-3 ${col.opacity || ''}`}>
            <h4 className={`text-[10px] font-mono font-bold tracking-[0.2em] ${col.accent} mb-4 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 ${col.bgAccent} ${col.pulse ? 'animate-pulse' : ''}`} style={col.pulse ? { boxShadow: `0 0 5px var(--color-user-a)` } : {}} />
                {col.title}
              </div>
              <div className="px-1.5 py-0.5 border border-white/10 text-stone-500 text-[8px]">
                {colTasks.length.toString().padStart(2, '0')}
              </div>
            </h4>
            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence>
                {colTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`border bg-[#0a0a0a] p-3 transition-colors hover:border-white/20 ${editingTaskId === task.id ? 'border-user-a' : 'border-white/10'}`}
                  >
                    {editingTaskId === task.id ? (
                      <div className="space-y-3">
                        <input
                          value={editTaskText}
                          onChange={e => setEditTaskText(e.target.value)}
                          className="w-full bg-black border border-white/20 px-2 py-1.5 text-[10px] uppercase font-mono text-white outline-none focus:border-user-a"
                        />
                        <div className="flex gap-2">
                          <select
                            value={editTaskCategory}
                            onChange={e => setEditTaskCategory(e.target.value as any)}
                            className="flex-1 bg-black border border-white/20 px-1 py-1 text-[8px] uppercase font-mono text-stone-300 outline-none"
                          >
                            <option value="work">WORK</option>
                            <option value="home">HOME</option>
                            <option value="personal">PERSONAL</option>
                          </select>
                          <select
                            value={editTaskObjectiveId}
                            onChange={e => setEditTaskObjectiveId(e.target.value)}
                            className="flex-1 bg-black border border-white/20 px-1 py-1 text-[8px] uppercase font-mono text-stone-300 outline-none"
                          >
                            <option value="">NO_OBJ</option>
                            {objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                          </select>
                          <select
                            value={editPriority}
                            onChange={e => setEditPriority(e.target.value as any)}
                            className="flex-1 bg-black border border-white/20 px-1 py-1 text-[8px] uppercase font-mono text-stone-300 outline-none"
                          >
                            <option value="low">LOW</option>
                            <option value="medium">MEDIUM</option>
                            <option value="high">HIGH</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[7px] uppercase font-mono font-bold text-stone-500">EST_MIN</label>
                            <input
                              type="number"
                              value={editEstimatedTime}
                              onChange={e => setEditEstimatedTime(Number(e.target.value))}
                              className="w-full bg-black border border-white/20 px-2 py-1 text-[10px] font-mono text-white outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[7px] uppercase font-mono font-bold text-stone-500">ACT_MIN</label>
                            <input
                              type="number"
                              value={editActualTime}
                              onChange={e => setEditActualTime(Number(e.target.value))}
                              className="w-full bg-black border border-white/20 px-2 py-1 text-[10px] font-mono text-white outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[7px] uppercase font-mono font-bold text-stone-500">DUE_DATE</label>
                          <input
                            type="datetime-local"
                            value={editDueDate}
                            onChange={e => setEditDueDate(e.target.value)}
                            className="w-full bg-black border border-white/20 px-2 py-1 text-[10px] font-mono text-white outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[7px] uppercase font-mono font-bold text-stone-500">DETAIL_STR</label>
                          <textarea
                            value={editDetail}
                            onChange={e => setEditDetail(e.target.value)}
                            className="w-full bg-black border border-white/20 px-2 py-1 text-[8px] font-mono text-stone-300 outline-none min-h-[40px] resize-none"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => setEditingTaskId(null)} className="flex-1 py-1.5 border border-white/20 text-[8px] font-mono text-stone-400 hover:text-red-500 hover:border-red-500 transition-colors">
                            [ CANCEL ]
                          </button>
                          <button onClick={handleEditSave} className="flex-1 py-1.5 border border-user-a bg-user-a/10 text-user-a text-[8px] font-mono hover:bg-user-a hover:text-black transition-colors">
                            [ COMMIT ]
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-wrap gap-1">
                             <span className="px-1 py-0.5 border border-stone-700 text-[7px] font-mono text-stone-400">#{task.category.toUpperCase()}</span>
                             <span className={`px-1 py-0.5 border text-[7px] font-mono ${task.priority === 'high' ? 'border-rose-900 text-rose-500' : task.priority === 'medium' ? 'border-amber-900 text-amber-500' : 'border-stone-700 text-stone-500'}`}>
                               {task.priority?.toUpperCase() || 'LOW'}
                             </span>
                          </div>
                          
                          <div className="flex gap-2">
                            {task.status !== 'done' && task.status !== 'skipped' && (
                              <button onClick={() => handleEditStart(task)} className="text-stone-600 hover:text-white transition-colors">
                                <Pencil size={10} />
                              </button>
                            )}
                            {task.status === 'todo' && (
                              <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="text-[10px] font-bold text-stone-600 hover:text-user-a transition-colors">▶</button>
                            )}
                            {task.status === 'in_progress' && (
                              <>
                                <button onClick={() => updateTaskStatus(task.id, 'todo')} className="text-[10px] font-bold text-stone-600 hover:text-white transition-colors">◀</button>
                                <button onClick={() => updateTaskStatus(task.id, 'done')} className="text-[10px] font-bold text-stone-600 hover:text-user-a transition-colors">▶</button>
                              </>
                            )}
                            {task.status === 'done' && (
                              <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="text-[10px] font-bold text-stone-600 hover:text-white transition-colors">◀</button>
                            )}
                            {task.status === 'skipped' && (
                              <button onClick={() => updateTaskStatus(task.id, 'in_progress')} title="Retomar" className="text-[10px] font-bold text-stone-600 hover:text-white transition-colors">◀</button>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className={`text-[11px] font-medium leading-snug text-white ${task.status === 'skipped' ? 'line-through opacity-50' : ''}`}>{task.text}</p>
                          {task.detail && <p className="text-[8px] font-mono text-stone-500 mt-1 truncate">{task.detail}</p>}
                        </div>

                        <div className="flex flex-wrap gap-1 mt-1">
                          <div className={`px-1 py-0.5 border text-[7px] font-mono ${isTaskOverflowed(task) ? 'border-red-900 text-red-500' : 'border-stone-700 text-stone-500'}`}>
                             <Clock size={8} className="inline mr-1" /> {task.actual_time}/{task.estimated_time}m
                          </div>
                          {(task.actions?.length || 0) > 0 && (
                            <button onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className="px-1 py-0.5 border border-stone-700 text-[7px] font-mono text-stone-500 hover:border-user-b hover:text-user-b flex items-center gap-1">
                              ✓ {task.actions?.filter(a => a.checked).length}/{task.actions?.length}
                            </button>
                          )}
                        </div>

                        <AnimatePresence>
                            {expandedTaskId === task.id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 space-y-1 pr-1 border-t border-white/5 pt-2">
                                {task.actions && task.actions.map(act => (
                                  <button key={act.id} onClick={() => toggleChecklistInCard(task.id, 'actions', act.id)} className={`w-full flex items-center gap-1.5 p-1 text-[8px] font-mono ${act.checked ? 'text-stone-600 line-through' : 'text-stone-300'}`}>
                                    <div className={`w-2 h-2 border ${act.checked ? 'bg-user-b border-user-b' : 'border-stone-500'}`} />
                                    {act.text}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                        </AnimatePresence>

                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                            <span className="text-[7px] uppercase font-bold font-mono tracking-[0.2em] text-stone-500">#{task.id.substring(0,4)}</span>
                            {task.status !== 'done' && task.status !== 'skipped' && (
                              <button onClick={() => deleteTask(task.id)} className="text-stone-600 hover:text-red-500 transition-all">
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Add Button for Todo Column */}
              {col.status === 'todo' && (
                <button 
                  className="w-full mt-2 py-3 border border-dashed border-white/20 text-stone-500 text-[10px] font-mono tracking-[0.2em] hover:border-white/50 hover:text-white transition-colors flex items-center justify-center gap-2"
                  onClick={() => setIsTaskFormOpen(true)}
                >
                  <Plus size={12} /> [ ADD ]
                </button>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};
