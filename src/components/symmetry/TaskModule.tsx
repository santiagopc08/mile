'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Pencil, X, ChevronDown, Sparkles, Clock, Target } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { StoreService, type ChecklistItem } from '@/services/storeService';
import { LiveLinkPreview } from '@/components/LiveLinkPreview';

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
  assignee?: 'el' | 'ella';
}

interface Objective {
  id: string;
  title: string;
  author: string;
  is_complete?: boolean;
}

export const TaskModule = ({ onTasksUpdate }: { onTasksUpdate: (score: number) => void }) => {
  const { profile } = useProfile();
  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
  const { data, updateData } = useStore();

  const tasks = useMemo(() => (data?.tasks as Task[]) || [], [data?.tasks]);
  const objectives = useMemo(() => (data?.objectives as Objective[]) || [], [data?.objectives]);
  const visibleObjectives = useMemo(() => objectives.filter(o => o.author === profile), [objectives, profile]);

  const objectiveStats = useMemo(() => {
    const statsMap = new Map();
    for (const obj of visibleObjectives) {
      statsMap.set(obj.id, {
        taskCount: 0,
        pendingCount: 0,
        totalEst: 0,
        totalAct: 0
      });
    }

    for (const task of tasks) {
      if (task.objective_id && statsMap.has(task.objective_id)) {
        const stats = statsMap.get(task.objective_id);
        stats.taskCount++;
        if (task.status !== 'done' && task.status !== 'skipped') {
          stats.pendingCount++;
        }
        stats.totalEst += (task.estimated_time || 0);
        stats.totalAct += (task.actual_time || 0);
      }
    }
    return statsMap;
  }, [tasks, visibleObjectives]);

  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState<'work' | 'home' | 'personal'>('work');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newObjective, setNewObjective] = useState('');
  const [newObjectiveAuthor, setNewObjectiveAuthor] = useState<'el' | 'ella'>(profile || 'el');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>('');
  const [newEstimatedTime, setNewEstimatedTime] = useState<number>(30);
  const [newDueDate, setNewDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<'el' | 'ella'>(profile || 'el');
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
  const [editTaskAssignee, setEditTaskAssignee] = useState<'el' | 'ella'>(profile || 'el');

  useEffect(() => {
    if (tasks.length > 0) {
      const completedCount = tasks.filter(t => t.status === 'done').length;
      const focusScore = (completedCount / tasks.length) * 100;
      onTasksUpdate(focusScore);
    } else {
      onTasksUpdate(0);
    }
  }, [tasks, onTasksUpdate]);

  useEffect(() => {
    if (!profile || !tasks || typeof window === 'undefined') return;
    const now = new Date();
    tasks.forEach(t => {
      if (t.status !== 'done' && t.status !== 'skipped' && t.due_date && (!t.assignee || t.assignee === profile)) {
        const due = new Date(t.due_date);
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours <= 24) {
          const key = `notified_due_${t.id}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, 'true');
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Sincronía de Operaciones', {
                body: `Se aproxima la fecha límite para tu tarea: "${t.text}"`,
                icon: '/icon-192.png'
              });
            }
          }
        }
      }
    });
  }, [tasks, profile]);

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
      assignee: newTaskAssignee,
      updated_at: new Date().toISOString(),
    };
    updateData({ tasks: [task, ...tasks] as any });
    setNewTask('');
    setNewDueDate('');
    setNewTaskAssignee(profile || 'el');
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
      author: newObjectiveAuthor,
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
    setEditTaskAssignee(task.assignee || profile || 'el');
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
        assignee: editTaskAssignee,
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
    const obj = objectives.find(o => o.id === id);
    if (!obj) return;
    const nextComplete = !obj.is_complete;
    updateData({ objectives: objectives.map(o => o.id === id ? { ...o, is_complete: nextComplete } : o) as any });

    if (nextComplete) {
      const partner = profile === 'ella' ? 'el' : 'ella';
      const authorName = profile === 'el' ? 'Santiago' : 'Milena';
      StoreService.addNotification(partner, 'objective', `¡${authorName} completó el objetivo: "${obj.title}"! 🎯`).catch(err => console.error(err));
    }
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
  const getTaskObjective = (task: Task) => objectives.find(o => o.id === task.objective_id);

  return (
    <div className="space-y-6 border border-white/10 bg-black/40 p-4">
      {/* Creation UI */}
      <div className="flex flex-col gap-6">
        {/* Objectives First */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                value={newObjective}
                onChange={e => setNewObjective(e.target.value)}
                placeholder="NUEVO OBJETIVO"
                className={`flex-1 border border-white/10 bg-black px-4 py-2 text-[10px] uppercase text-white outline-none placeholder:text-[#594137] focus:border-${newObjectiveAuthor === 'ella' ? 'user-a' : 'user-b'}`}
              />
              <button
                onClick={addObjective}
                className={`border px-4 py-2 text-white transition-colors ${newObjectiveAuthor === 'ella' ? 'border-user-a bg-user-a hover:bg-user-a/80' : 'border-user-b bg-user-b hover:bg-user-b/80'}`}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleObjectives.map(obj => {
              const stats = objectiveStats.get(obj.id) || { taskCount: 0, pendingCount: 0, totalEst: 0, totalAct: 0 };
              const completedCount = stats.taskCount - stats.pendingCount;

              const objColor = obj.author === 'ella' ? 'user-a' : 'user-b';

              return (
                <div key={obj.id} className={`flex flex-col gap-1 border px-2 py-1 transition-all ${obj.is_complete ? 'border-emerald-500 bg-emerald-500/5 opacity-50' : `border-${objColor}/30 bg-${objColor}/5`}`}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleObjectiveComplete(obj.id)}
                      disabled={stats.pendingCount > 0}
                      className={`border p-0.5 ${obj.is_complete ? 'border-emerald-500 bg-emerald-500 text-white' : `border-${objColor}/50 text-transparent hover:border-${objColor}`} disabled:cursor-not-allowed disabled:opacity-30`}
                    >
                      {obj.is_complete ? <Check size={10} /> : <div className="w-[10px] h-[10px]" />}
                    </button>
                    <span className={`text-[8px] uppercase font-bold ${obj.is_complete ? 'text-emerald-500 line-through' : `text-${objColor}`}`}>{obj.title}</span>
                    <button onClick={() => deleteObjective(obj.id)} className="text-stone-400 hover:text-red-500 ml-auto">
                      <X size={10} />
                    </button>
                  </div>
                  {stats.taskCount > 0 && (
                    <div className={`mt-0.5 flex gap-2 border-t border-${objColor}/10 pt-1 font-mono text-[6px] uppercase text-[#a88a7e]`}>
                      <span>{completedCount}/{stats.taskCount} Tareas</span>
                      <span>{stats.totalAct}/{stats.totalEst} Min</span>
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
                <span className={`text-[10px] font-mono text-${accentClass} tracking-[0.2em]`}>NUEVA TAREA</span>
                <button onClick={() => setIsTaskFormOpen(false)} className="text-stone-500 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  placeholder="NUEVA TAREA"
                  className={`flex-1 border border-white/10 bg-black px-4 py-2 text-[10px] uppercase text-white outline-none placeholder:text-[#594137] focus:border-${accentClass}`}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[7px] uppercase font-bold text-stone-400">Objetivo</label>
                  <select
                    value={selectedObjectiveId}
                    onChange={e => setSelectedObjectiveId(e.target.value)}
                    className="h-[32px] border border-white/10 bg-black px-2 text-[8px] uppercase text-[#e5e2e1] outline-none"
                  >
                    <option value="">Sin Objetivo</option>
                    {visibleObjectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
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
                        className={`flex-1 px-1 py-2 text-[7px] font-bold uppercase transition-colors ${category === cat ? `bg-${accentClass}/15 text-${accentClass}` : 'text-stone-500 hover:bg-white/5 hover:text-stone-300'}`}
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
              </div>
              <div className="grid grid-cols-[1fr_2fr] gap-2">
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
                      {newDetail.match(/https?:\/\/[^\s]+/) && (
                        <div className="pt-2">
                          <LiveLinkPreview url={newDetail.match(/https?:\/\/[^\s]+/)![0]} label="ENLACE DETECTADO" />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Actions */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[7px] uppercase font-bold text-stone-400">Checklist de Acciones</label>
                          <button onClick={() => fetchAiSuggestions('actions')} disabled={!newTask || aiLoading} className={`text-[7px] flex items-center gap-1 text-${accentClass} hover:text-white disabled:opacity-30`}>
                            <Sparkles size={10} /> AI Suggest
                          </button>
                        </div>

                        {/* AI Suggestions (Actions) */}
                        {aiSuggestions.field === 'actions' && aiSuggestions.items.length > 0 && (
                          <div className={`p-2 border border-${accentClass}/30 bg-${accentClass}/5 space-y-1`}>
                            <div className={`text-[6px] uppercase font-bold text-${accentClass} mb-1`}>Sugerencias (Pick & Choose)</div>
                            {aiSuggestions.items.map(sug => (
                              <button key={sug} onClick={() => importSuggestion(sug, 'actions')} className={`text-left w-full text-[8px] text-stone-300 hover:text-white hover:bg-${accentClass}/20 p-1 flex items-center gap-2`}>
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
                          <button onClick={() => { if (newActionText) { setNewActions([...newActions, { id: Date.now().toString(), text: newActionText, checked: false }]); setNewActionText(''); } }} className={`border border-white/10 px-2 hover:border-${accentClass} hover:bg-white/5`}><Plus size={10} /></button>
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

              <button
                onClick={addTask}
                className={`w-full py-3 mt-2 border border-${accentClass} bg-${accentClass} text-black font-bold text-[10px] uppercase tracking-widest transition-colors hover:opacity-80`}
              >
                GUARDAR_DATOS (SAVE)
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid min-h-[250px] grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4">
        {[
          { status: 'todo' as const, title: 'PEND', accent: 'text-stone-500', bgAccent: 'bg-stone-500' },
          { status: 'in_progress' as const, title: 'ACTIVO', accent: `text-${accentClass}`, bgAccent: `bg-${accentClass}`, pulse: true },
          { status: 'done' as const, title: 'HECHO', accent: 'text-stone-600', bgAccent: 'bg-stone-600', opacity: 'opacity-50' },
          { status: 'skipped' as const, title: 'SKIP', accent: 'text-red-900', bgAccent: 'bg-red-900', opacity: 'opacity-40' }
        ].map((col) => {
          const colTasks = tasks.filter(t => t.status === col.status);
          return (
            <div key={col.status} className={`flex h-full flex-col border border-white/10 bg-black/30 p-2 md:p-3 ${col.opacity || ''}`}>
              <h4 className={`mb-2 md:mb-3 flex items-center justify-between text-[9px] md:text-[10px] font-mono tracking-tighter uppercase ${col.accent}`}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 ${col.bgAccent} ${col.pulse ? 'animate-pulse' : ''}`} style={col.pulse ? { boxShadow: `0 0 5px ${accentColor}` } : {}} />
                  {col.title}
                </div>
                <span className="text-[8px] font-mono tabular-nums text-stone-500">{colTasks.length}</span>
              </h4>
              <div className="flex-1 space-y-3 md:space-y-4 overflow-y-auto custom-scrollbar pt-2 md:pt-3">
                <AnimatePresence>
                  {colTasks.map((task) => {
                    const priorityBorder = task.priority === 'high' ? 'border-rose-500' : task.priority === 'medium' ? `border-${accentClass}` : 'border-stone-700';
                    const priorityBg = task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? `bg-${accentClass}` : 'bg-stone-600';
                    const isLateOrOverflow = isTaskLate(task) || isTaskOverflowed(task);
                    const clockColor = isLateOrOverflow ? 'text-red-500' : 'text-emerald-500';
                    
                    return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`relative border border-white/10 bg-[#0a0a0a] p-0 transition-colors hover:border-white/20 ${editingTaskId === task.id ? `border-white shadow-[0_0_10px_rgba(255,255,255,0.1)]` : ''}`}
                    >
                      {editingTaskId === task.id ? (
                        <div className="p-3 space-y-2">
                          <input value={editTaskText} onChange={e => setEditTaskText(e.target.value)} className={`w-full bg-black border border-white/20 px-2 py-1.5 text-[11px] text-white outline-none focus:border-${accentClass}`} />
                          <div className="flex gap-1 flex-wrap">
                            <select value={editTaskCategory} onChange={e => setEditTaskCategory(e.target.value as any)} className="flex-1 min-w-0 bg-black border border-white/20 px-1 py-1 text-[9px] uppercase text-stone-300 outline-none"><option value="work">TRABAJO</option><option value="home">HOGAR</option><option value="personal">PERSONAL</option></select>
                            <select value={editPriority} onChange={e => setEditPriority(e.target.value as any)} className="flex-1 min-w-0 bg-black border border-white/20 px-1 py-1 text-[9px] uppercase text-stone-300 outline-none"><option value="low">BAJA</option><option value="medium">MEDIA</option><option value="high">ALTA</option></select>
                            <select value={editTaskAssignee} onChange={e => setEditTaskAssignee(e.target.value as any)} className="flex-1 min-w-0 bg-black border border-white/20 px-1 py-1 text-[9px] uppercase text-stone-300 outline-none"><option value="ella">Mile</option><option value="el">Santi</option></select>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div><label className="text-[7px] uppercase font-bold text-stone-500 block">Est</label><input type="number" value={editEstimatedTime} onChange={e => setEditEstimatedTime(Number(e.target.value))} className="w-full bg-black border border-white/20 px-1 py-1 text-[10px] text-white outline-none" /></div>
                            <div><label className="text-[7px] uppercase font-bold text-stone-500 block">Act</label><input type="number" value={editActualTime} onChange={e => setEditActualTime(Number(e.target.value))} className="w-full bg-black border border-white/20 px-1 py-1 text-[10px] text-white outline-none" /></div>
                          </div>
                          <div>
                            <label className="text-[7px] uppercase font-bold text-stone-500 block">Detalle</label>
                            <textarea value={editDetail} onChange={e => setEditDetail(e.target.value)} className="w-full bg-black border border-white/20 px-1 py-1 text-[9px] text-stone-300 outline-none min-h-[32px] resize-none" />
                            {editDetail.match(/https?:\/\/[^\s]+/) && (
                              <div className="pt-1">
                                <LiveLinkPreview url={editDetail.match(/https?:\/\/[^\s]+/)![0]} label="ENLACE DETECTADO" />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 pt-1">
                            <button onClick={() => setEditingTaskId(null)} className="flex-1 py-1 border border-white/20 text-[8px] text-stone-400 hover:text-red-500 hover:border-red-500 transition-colors">✕</button>
                            <button onClick={handleEditSave} className={`flex-1 py-1 border border-${accentClass} bg-${accentClass}/10 text-${accentClass} text-[8px] hover:bg-${accentClass} hover:text-black transition-colors`}>✓</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col relative pt-1 pl-6 pr-3 pb-3">
                          {/* Lateral priority stripe */}
                          <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${priorityBg}`} />

                          {/* Corner Indicators Right */}
                          <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 flex items-center">
                            {/* Category Box */}
                            <div className="border-l border-b border-white/10 bg-[#050505] px-1.5 py-[3px] text-[6px] md:text-[7px] font-mono tracking-widest uppercase text-stone-400">
                               {task.category === 'personal' ? 'PER' : task.category === 'work' ? 'WRK' : 'HOM'}
                            </div>
                            {/* Clock Box */}
                            <div className={`border-b border-white/10 bg-[#050505] px-1.5 py-[3px] ${clockColor}`}>
                               <Clock size={8} strokeWidth={1.5} />
                            </div>
                          </div>

                          {/* Corner Indicator Left (Objective) */}
                          {(() => {
                            const objective = getTaskObjective(task);
                            if (!objective) return null;
                            const priorityText = task.priority === 'high' ? 'bg-rose-500 text-black font-black' : task.priority === 'medium' ? `bg-${accentClass} text-black font-black` : 'bg-stone-700 text-white';
                            return (
                              <div className="absolute -top-2 left-[5px] md:-top-3 flex items-center z-10">
                                <div className={`px-1.5 py-[3px] text-[6px] md:text-[7px] font-mono uppercase tracking-[0.16em] ${priorityText}`}>
                                  {objective.title}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Title and Detail */}
                          <div className="flex flex-col gap-1 pt-3 md:pt-4 pb-1 mt-1">
                             <p className={`text-[12px] md:text-[13px] uppercase font-semibold leading-tight tracking-tight text-white ${task.status === 'skipped' ? 'line-through opacity-50' : ''}`}>{task.text}</p>
                             {task.detail && <p className="text-[9px] leading-tight text-[#a88a7e] line-clamp-2 mt-0.5">{task.detail}</p>}
                          </div>

                          {/* Progress Bar (Conditional) */}
                          {task.estimated_time > 0 && (
                            <div className="mt-3 mb-2 flex items-center justify-between gap-1.5">
                              <span className="text-[6px] font-mono text-stone-500 tracking-wider">PRG</span>
                              <div className="flex-1 flex gap-[1px] h-1.5">
                                {Array.from({ length: 10 }).map((_, i) => {
                                    const progress = task.actual_time / task.estimated_time;
                                    const filled = i < (progress * 10);
                                    return <div key={i} className={`h-full flex-1 ${filled ? priorityBg : 'bg-white/10'}`} />;
                                })}
                              </div>
                              <span className="text-[6px] font-mono text-stone-500 shrink-0 text-right">
                                {task.actual_time}/{task.estimated_time}M · {Math.round((task.actual_time/task.estimated_time)*100)}%
                              </span>
                            </div>
                          )}

                          {/* Actions / Validations Toggle */}
                          {((task.actions && task.actions.length > 0) || (task.validations && task.validations.length > 0)) && (
                            <div className={`flex justify-start gap-3 mb-2 ${task.estimated_time > 0 ? '' : 'mt-2'}`}>
                              {task.actions && task.actions.length > 0 && (
                                <button onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className={`text-[7px] font-mono uppercase font-bold hover:text-${accentClass} transition-colors leading-none flex items-center gap-1 text-stone-500`}>
                                  ACT · ✓ {task.actions.filter(a => a.checked).length}/{task.actions.length}
                                </button>
                              )}
                              {task.validations && task.validations.length > 0 && (
                                <button onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className={`text-[7px] font-mono uppercase font-bold hover:text-${accentClass} transition-colors leading-none flex items-center gap-1 text-stone-500`}>
                                  VLD · ✓ {task.validations.filter(v => v.checked).length}/{task.validations.length}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Actions / Validations Collapsible */}
                          <AnimatePresence>
                            {expandedTaskId === task.id && ((task.actions && task.actions.length > 0) || (task.validations && task.validations.length > 0)) && (
                               <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2 border-t border-white/5 pt-2 mb-2">
                                 {task.actions && task.actions.length > 0 && (
                                   <div className="space-y-0.5">
                                     <span className="text-[6px] text-stone-600 font-mono tracking-widest uppercase block mb-1">Actions</span>
                                     {task.actions.map(act => {
                                        const obj = getTaskObjective(task);
                                        const clr = obj?.author === 'ella' ? 'user-a' : 'user-b';
                                        return (
                                          <button key={act.id} onClick={() => toggleChecklistInCard(task.id, 'actions', act.id)} className={`w-full flex items-center gap-1.5 py-0.5 text-[9px] text-left leading-none ${act.checked ? 'text-stone-600 line-through' : 'text-[#e5e2e1]'}`}>
                                            <div className={`w-1.5 h-1.5 border shrink-0 ${act.checked ? `bg-${clr} border-${clr}` : 'border-stone-500'}`} />
                                            <span className="truncate">{act.text}</span>
                                          </button>
                                        );
                                     })}
                                   </div>
                                 )}
                                 {task.validations && task.validations.length > 0 && (
                                   <div className="space-y-0.5">
                                     <span className="text-[6px] text-stone-600 font-mono tracking-widest uppercase block mb-1">Validations</span>
                                     {task.validations.map(act => {
                                        const obj = getTaskObjective(task);
                                        const clr = obj?.author === 'ella' ? 'user-a' : 'user-b';
                                        return (
                                          <button key={act.id} onClick={() => toggleChecklistInCard(task.id, 'validations', act.id)} className={`w-full flex items-center gap-1.5 py-0.5 text-[9px] text-left leading-none ${act.checked ? 'text-stone-600 line-through' : 'text-[#e5e2e1]'}`}>
                                            <div className={`w-1.5 h-1.5 border shrink-0 ${act.checked ? `bg-${clr} border-${clr}` : 'border-stone-500'}`} />
                                            <span className="truncate">{act.text}</span>
                                          </button>
                                        );
                                     })}
                                   </div>
                                 )}
                               </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Footer Controls */}
                          <div className="mt-auto flex justify-between items-center border-t border-white/5 pt-2 h-7">
                             {/* Initials block representing author/system like [JD] in reference */}
                             <div className="text-[7px] font-mono font-bold uppercase border border-white/10 px-2 py-0.5 text-stone-500 tracking-widest bg-white/5">
                                {task.assignee === 'el' ? 'SANTI' : 'MILENA'}
                             </div>
                             
                             <div className="flex items-center gap-[1px] bg-white/[0.08] brutal-border pl-[1px] pt-[1px]">
                               {task.status !== 'done' && task.status !== 'skipped' && (
                                 <button onClick={() => deleteTask(task.id)} className="h-6 w-6 bg-[#0a0a0a] text-stone-500 hover:text-red-500 transition-colors flex items-center justify-center !min-h-0">
                                   <Trash2 size={10} strokeWidth={1.5} />
                                 </button>
                               )}
                               {task.status !== 'done' && task.status !== 'skipped' && (
                                 <button onClick={() => handleEditStart(task)} className="h-6 w-6 bg-[#0a0a0a] text-stone-500 hover:text-white transition-colors flex items-center justify-center !min-h-0">
                                   <Pencil size={10} strokeWidth={1.5} />
                                 </button>
                               )}
                               {task.status === 'todo' && (
                                 <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="h-6 w-6 bg-[#0a0a0a] text-stone-500 hover:text-emerald-500 transition-colors flex items-center justify-center !min-h-0">
                                   <Check size={11} strokeWidth={1.5} />
                                 </button>
                               )}
                               {task.status === 'in_progress' && (
                                 <button onClick={() => updateTaskStatus(task.id, 'done')} className="h-6 w-6 bg-[#0a0a0a] text-stone-500 hover:text-emerald-500 transition-colors flex items-center justify-center !min-h-0">
                                   <Check size={11} strokeWidth={1.5} />
                                 </button>
                               )}
                               {(task.status === 'done' || task.status === 'skipped') && (
                                 <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="h-6 w-6 bg-[#0a0a0a] text-stone-500 hover:text-white transition-colors flex items-center justify-center !min-h-0" title="Retomar">
                                   <Pencil size={10} strokeWidth={1.5} />
                                 </button>
                               )}
                             </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )})}
                </AnimatePresence>

                {col.status === 'todo' && (
                  <button className={`w-full mt-1 py-2 border border-dashed border-white/15 text-stone-600 text-[9px] tracking-[0.15em] hover:border-white/40 hover:text-white transition-colors flex items-center justify-center gap-1.5`} onClick={() => setIsTaskFormOpen(true)}>
                    <Plus size={10} /> ADD
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
