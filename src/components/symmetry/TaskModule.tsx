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

  const tasks = useMemo(() => {
    const allTasks = (data?.tasks as Task[]) || [];
    return allTasks.filter(t => !t.assignee || t.assignee === profile);
  }, [data?.tasks, profile]);
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
    const item: ChecklistItem = { id: crypto.randomUUID(), text, checked: false };
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
  const categoryStyles: Record<Task['category'], { label: string; chip: string; active: string; stripe: string }> = {
    work: {
      label: 'TRABAJO',
      chip: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
      active: 'border-cyan-400 bg-cyan-400 text-black',
      stripe: 'bg-cyan-400'
    },
    home: {
      label: 'CASA',
      chip: 'border-user-b/40 bg-user-b/10 text-user-b',
      active: 'border-user-b bg-user-b text-black',
      stripe: 'bg-user-b'
    },
    personal: {
      label: 'PERSONAL',
      chip: 'border-user-a/40 bg-user-a/10 text-user-a',
      active: 'border-user-a bg-user-a text-black',
      stripe: 'bg-user-a'
    }
  };
  const priorityStyles: Record<NonNullable<Task['priority']>, { label: string; active: string; chip: string; stripe: string; text: string }> = {
    low: {
      label: 'BAJA',
      active: 'border-sky-400 bg-sky-400 text-black',
      chip: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
      stripe: 'bg-sky-400',
      text: 'text-sky-200'
    },
    medium: {
      label: 'MEDIA',
      active: 'border-amber-400 bg-amber-400 text-black',
      chip: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
      stripe: 'bg-amber-400',
      text: 'text-amber-200'
    },
    high: {
      label: 'ALTA',
      active: 'border-rose-400 bg-rose-400 text-black',
      chip: 'border-rose-400/40 bg-rose-400/10 text-rose-200',
      stripe: 'bg-rose-400',
      text: 'text-rose-200'
    }
  };

  return (
    <div className="space-y-4 border border-white/10 bg-black/40 p-2 sm:p-3">
      {/* Creation UI */}
      <div className="flex flex-col gap-4">
        {/* Objectives First */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                value={newObjective}
                onChange={e => setNewObjective(e.target.value)}
                placeholder="NUEVO OBJETIVO"
                className={`flex-1 border border-white/10 bg-black px-3 py-1.5 text-[10px] font-mono uppercase text-white outline-none placeholder:text-[#594137] focus:border-${newObjectiveAuthor === 'ella' ? 'user-a' : 'user-b'}`}
              />
              <button
                onClick={addObjective}
                className={`!min-h-0 border px-3 py-1.5 text-black transition-colors ${newObjectiveAuthor === 'ella' ? 'border-user-a bg-user-a hover:bg-user-a/80' : 'border-user-b bg-user-b hover:bg-user-b/80'}`}
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
                <div key={obj.id} className={`flex flex-col gap-1 border px-2 py-[2px] transition-all ${obj.is_complete ? 'border-emerald-500 bg-emerald-500/5 opacity-50' : `border-${objColor}/30 bg-${objColor}/5`}`}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleObjectiveComplete(obj.id)}
                      disabled={stats.pendingCount > 0}
                      className={`border p-0.5 ${obj.is_complete ? 'border-emerald-500 bg-emerald-500 text-white' : `border-${objColor}/50 text-transparent hover:border-${objColor}`} disabled:cursor-not-allowed disabled:opacity-30`}
                    >
                      {obj.is_complete ? <Check size={10} /> : <div className="w-[10px] h-[10px]" />}
                    </button>
                    <span className={`text-[8px] font-mono uppercase font-bold ${obj.is_complete ? 'text-emerald-500 line-through' : `text-${objColor}`}`}>{obj.title}</span>
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
              className="space-y-3 overflow-hidden border-t border-white/10 pt-3"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono text-${accentClass} tracking-[0.2em]`}>NUEVA TAREA</span>
                <button onClick={() => setIsTaskFormOpen(false)} className="!min-h-0 text-stone-500 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  placeholder="NUEVA TAREA"
                  className={`flex-1 border border-white/10 bg-black px-3 py-1.5 text-[10px] font-mono uppercase text-white outline-none placeholder:text-[#594137] focus:border-${accentClass}`}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[7px] uppercase font-bold text-stone-400 font-mono">Objetivo</label>
                  <select
                    value={selectedObjectiveId}
                    onChange={e => setSelectedObjectiveId(e.target.value)}
                    className="h-[32px] border border-white/10 bg-black px-2 text-[8px] uppercase text-[#e5e2e1] outline-none font-mono"
                  >
                    <option value="">Sin Objetivo</option>
                    {visibleObjectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[7px] uppercase font-bold text-stone-400 font-mono">Categoría</label>
                  <div className="flex min-h-[30px] border border-white/10 bg-black font-mono">
                    {(['work', 'home', 'personal'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`!min-h-0 flex-1 border-r border-white/10 px-1 py-1.5 text-[7px] font-bold uppercase transition-colors last:border-r-0 font-mono ${category === cat ? categoryStyles[cat].active : `${categoryStyles[cat].chip} opacity-60 hover:opacity-100`}`}
                      >
                        {categoryStyles[cat].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[7px] uppercase font-bold text-stone-400 font-mono">Prioridad</label>
                  <div className="flex min-h-[30px] border border-white/10 bg-black font-mono">
                    {(['low', 'medium', 'high'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setNewPriority(p)}
                        className={`!min-h-0 flex flex-1 items-center justify-center border-r border-white/10 py-1.5 text-[7px] font-bold uppercase transition-colors last:border-r-0 font-mono ${newPriority === p ? priorityStyles[p].active : `${priorityStyles[p].chip} opacity-60 hover:opacity-100`}`}
                      >
                        {priorityStyles[p].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_2fr] gap-2">
                <div className="flex flex-col gap-1 font-mono">
                  <label className="text-[7px] uppercase font-bold text-stone-400 font-mono">Est. (m)</label>
                  <input
                    type="number"
                    value={newEstimatedTime}
                    onChange={e => setNewEstimatedTime(Number(e.target.value))}
                    className="h-[32px] border border-white/10 bg-black px-2 text-[8px] text-white outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1 font-mono">
                  <label className="text-[7px] uppercase font-bold text-stone-400 font-mono">Fecha Límite</label>
                  <input
                    type="datetime-local"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="h-[32px] border border-white/10 bg-black px-2 text-[8px] text-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Advanced Fields Toggle */}
              <div className="pt-1">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="!min-h-0 flex items-center gap-2 text-[8px] uppercase font-bold text-stone-400 hover:text-stone-200 transition-colors">
                  <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  Campos avanzados {showAdvanced ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3 border-l-2 border-stone-800 py-1.5 pl-3">

                    {/* Detail */}
                    <div className="flex flex-col gap-1 font-mono">
                      <label className="text-[7px] uppercase font-bold text-stone-400 font-mono">Detalle</label>
                      <textarea
                        value={newDetail}
                        onChange={e => setNewDetail(e.target.value)}
                        placeholder="Información adicional o contexto..."
                        className="min-h-[48px] resize-none border border-white/10 bg-black px-3 py-1.5 text-[10px] text-white outline-none placeholder:text-[#594137] font-mono"
                      />
                      {newDetail.match(/https?:\/\/[^\s]+/) && (
                        <div className="pt-2 font-mono">
                          <LiveLinkPreview url={newDetail.match(/https?:\/\/[^\s]+/)![0]} label="ENLACE DETECTADO" />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {/* Actions */}
                      <div className="space-y-2 font-mono">
                        <div className="flex justify-between items-center font-mono">
                          <label className="text-[7px] uppercase font-bold text-stone-400 font-mono">Checklist de Acciones</label>
                          <button onClick={() => fetchAiSuggestions('actions')} disabled={!newTask || aiLoading} className={`!min-h-0 text-[7px] flex items-center gap-1 text-${accentClass} hover:text-white disabled:opacity-30 font-mono`}>
                            <Sparkles size={10} /> Sugerir
                          </button>
                        </div>

                        {/* AI Suggestions (Actions) */}
                        {aiSuggestions.field === 'actions' && aiSuggestions.items.length > 0 && (
                          <div className={`p-2 border border-${accentClass}/30 bg-${accentClass}/5 space-y-1 font-mono`}>
                            <div className={`text-[6px] uppercase font-bold text-${accentClass} mb-1 font-mono`}>Sugerencias</div>
                            {aiSuggestions.items.map(sug => (
                              <button key={sug} onClick={() => importSuggestion(sug, 'actions')} className={`!min-h-0 text-left w-full text-[8px] text-stone-300 hover:text-white hover:bg-${accentClass}/20 p-1 flex items-center gap-2 font-mono`}>
                                <Plus size={8} /> {sug}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-1 font-mono">
                          <input
                            value={newActionText}
                            onChange={e => setNewActionText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { setNewActions([...newActions, { id: crypto.randomUUID(), text: newActionText, checked: false }]); setNewActionText(''); } }}
                            placeholder="Nueva acción..."
                            className="flex-1 border border-white/10 bg-black px-2 py-1 text-[9px] text-white outline-none placeholder:text-[#594137] font-mono"
                          />
                          <button onClick={() => { if (newActionText) { setNewActions([...newActions, { id: crypto.randomUUID(), text: newActionText, checked: false }]); setNewActionText(''); } }} className={`!min-h-0 border border-white/10 px-2 hover:border-${accentClass} hover:bg-white/5`}><Plus size={10} /></button>
                        </div>
                        <div className="space-y-1 font-mono">
                          {newActions.map(act => (
                            <div key={act.id} className="flex justify-between items-center text-[9px] px-2 py-[2px] bg-white/5 border border-stone-800/50 font-mono">
                              <span className="truncate pr-2">{act.text}</span>
                              <button onClick={() => setNewActions(newActions.filter(a => a.id !== act.id))} className="text-stone-500 hover:text-red-500"><X size={10} /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Validations */}
                      <div className="space-y-2 font-mono">
                        <div className="flex justify-between items-center font-mono">
                          <label className="text-[7px] uppercase font-bold text-stone-400 font-mono">Validaciones de Éxito</label>
                          <button onClick={() => fetchAiSuggestions('validations')} disabled={!newTask || aiLoading} className="!min-h-0 text-[7px] flex items-center gap-1 text-emerald-500 hover:text-white disabled:opacity-30 font-mono">
                            <Sparkles size={10} /> Sugerir
                          </button>
                        </div>

                        {/* AI Suggestions (Validations) */}
                        {aiSuggestions.field === 'validations' && aiSuggestions.items.length > 0 && (
                          <div className="p-2 border border-emerald-500/30 bg-emerald-500/5 space-y-1 font-mono">
                            <div className="text-[6px] uppercase font-bold text-emerald-500 mb-1 font-mono">Sugerencias</div>
                            {aiSuggestions.items.map(sug => (
                              <button key={sug} onClick={() => importSuggestion(sug, 'validations')} className="!min-h-0 text-left w-full text-[8px] text-stone-300 hover:text-white hover:bg-emerald-500/20 p-1 flex items-center gap-2 font-mono">
                                <Plus size={8} /> {sug}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-1 font-mono">
                          <input
                            value={newValidationText}
                            onChange={e => setNewValidationText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { setNewValidations([...newValidations, { id: crypto.randomUUID(), text: newValidationText, checked: false }]); setNewValidationText(''); } }}
                            placeholder="Nueva validación..."
                            className="flex-1 border border-white/10 bg-black px-2 py-1 text-[9px] text-white outline-none placeholder:text-[#594137] font-mono"
                          />
                          <button onClick={() => { if (newValidationText) { setNewValidations([...newValidations, { id: crypto.randomUUID(), text: newValidationText, checked: false }]); setNewValidationText(''); } }} className="!min-h-0 border border-white/10 px-2 hover:border-emerald-500 hover:bg-white/5"><Plus size={10} /></button>
                        </div>
                        <div className="space-y-1 font-mono">
                          {newValidations.map(val => (
                            <div key={val.id} className="flex justify-between items-center text-[9px] px-2 py-[2px] bg-white/5 border border-stone-800/50 font-mono">
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
                className={`mt-1 w-full border border-${accentClass} bg-${accentClass} py-2.5 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:opacity-80`}
              >
                Guardar tarea
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid min-h-[250px] grid-cols-1 gap-2 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
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
                {col.status === 'todo' && (
                  <button className="mb-2 flex w-full items-center justify-center gap-1.5 border border-dashed border-white/15 py-2 text-[9px] tracking-[0.15em] text-stone-600 transition-colors hover:border-white/40 hover:text-white font-mono" onClick={() => setIsTaskFormOpen(true)}>
                    <Plus size={10} /> CREAR
                  </button>
                )}
                <AnimatePresence>
                  {colTasks.map((task) => {
                    const taskPriority = task.priority || 'medium';
                    const priorityBg = priorityStyles[taskPriority].stripe;
                    const categoryStyle = categoryStyles[task.category];
                    const isLateOrOverflow = isTaskLate(task) || isTaskOverflowed(task);
                    const clockColor = isLateOrOverflow ? 'text-red-500' : 'text-emerald-500';
                    
                    return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`relative w-full border border-white/10 bg-[#0a0a0a] p-0 transition-colors hover:border-white/20 ${editingTaskId === task.id ? `border-white shadow-[0_0_10px_rgba(255,255,255,0.1)]` : ''}`}
                    >
                      {editingTaskId === task.id ? (
                        <div className="p-3 space-y-2">
                          <input value={editTaskText} onChange={e => setEditTaskText(e.target.value)} className={`w-full bg-black border border-white/20 px-2 py-1.5 text-[11px] text-white outline-none focus:border-${accentClass}`} />
                          <div className="flex gap-1 flex-wrap">
                            <select value={editTaskCategory} onChange={e => setEditTaskCategory(e.target.value as any)} className="flex-1 min-w-0 bg-black border border-white/20 px-1 py-1 text-[9px] uppercase text-stone-300 outline-none font-mono"><option value="work">TRABAJO</option><option value="home">HOGAR</option><option value="personal">PERSONAL</option></select>
                            <select value={editPriority} onChange={e => setEditPriority(e.target.value as any)} className="flex-1 min-w-0 bg-black border border-white/20 px-1 py-1 text-[9px] uppercase text-stone-300 outline-none font-mono"><option value="low">BAJA</option><option value="medium">MEDIA</option><option value="high">ALTA</option></select>
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
                        (() => {
                          const isCollapsed = task.status === 'done' || task.status === 'skipped';
                          return (
                            <div className="flex flex-col relative pt-1 pl-6 pr-3 pb-3">
                              {/* Lateral priority stripe */}
                              <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${priorityBg}`} />
                              <div className={`absolute left-[5px] top-0 h-1 w-12 ${categoryStyle.stripe}`} />

                              {/* Corner Indicators Right */}
                              <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 flex items-center">
                                {/* Category Box */}
                                <div className={`border px-1.5 py-[3px] text-[6px] md:text-[7px] font-mono tracking-widest uppercase ${categoryStyle.chip}`}>
                                   {categoryStyle.label}
                                </div>
                                <div className={`border-y border-r px-1.5 py-[3px] text-[6px] md:text-[7px] font-mono tracking-widest uppercase ${priorityStyles[taskPriority].chip}`}>
                                   {priorityStyles[taskPriority].label}
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
                                const priorityText = priorityStyles[taskPriority].active;
                                return (
                                  <div className="absolute -top-2 left-[5px] md:-top-3 flex items-center z-10">
                                    <div className={`px-1.5 py-[3px] text-[6px] md:text-[7px] font-mono uppercase tracking-[0.16em] ${priorityText}`}>
                                      {objective.title}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Title and Detail */}
                              <div className="flex flex-col gap-1 pt-3 md:pt-4 pb-1 mt-1 font-mono">
                                 <p className={`text-[12px] md:text-[13px] uppercase font-semibold leading-tight tracking-tight text-white text-center w-full font-mono ${task.status === 'skipped' ? 'line-through opacity-50' : ''}`}>{task.text}</p>
                                 {!isCollapsed && task.detail && <p className="text-[9px] leading-tight text-[#a88a7e] line-clamp-2 mt-0.5 text-left font-mono">{task.detail}</p>}
                              </div>

                              {/* Progress Bar (Conditional) */}
                              {!isCollapsed && task.estimated_time > 0 && (
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
                              {!isCollapsed && ((task.actions && task.actions.length > 0) || (task.validations && task.validations.length > 0)) && (
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
                                {!isCollapsed && expandedTaskId === task.id && ((task.actions && task.actions.length > 0) || (task.validations && task.validations.length > 0)) && (
                                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2 border-t border-white/5 pt-2 mb-2">
                                     {task.actions && task.actions.length > 0 && (
                                       <div className="space-y-0.5">
                                         <span className="text-[6px] text-stone-600 font-mono tracking-widest uppercase block mb-1">Actions</span>
                                         {task.actions.map(act => {
                                            const obj = getTaskObjective(task);
                                            const clr = obj?.author === 'ella' ? 'user-a' : 'user-b';
                                            return (
                                              <button key={act.id} onClick={() => toggleChecklistInCard(task.id, 'actions', act.id)} className={`w-full flex items-center gap-1.5 py-0 text-[9px] text-left leading-none font-mono ${act.checked ? 'text-stone-600 line-through' : 'text-[#e5e2e1]'}`}>
                                                <div className={`w-1.5 h-1.5 border shrink-0 ${act.checked ? `bg-${clr} border-${clr}` : 'border-stone-500'}`} />
                                                <span className="truncate font-mono">{act.text}</span>
                                              </button>
                                            );
                                         })}
                                       </div>
                                     )}
                                     {task.validations && task.validations.length > 0 && (
                                       <div className="space-y-0.5 font-mono">
                                         <span className="text-[6px] text-stone-600 font-mono tracking-widest uppercase block mb-1">Validations</span>
                                         {task.validations.map(act => {
                                            const obj = getTaskObjective(task);
                                            const clr = obj?.author === 'ella' ? 'user-a' : 'user-b';
                                            return (
                                              <button key={act.id} onClick={() => toggleChecklistInCard(task.id, 'validations', act.id)} className={`w-full flex items-center gap-1.5 py-0 text-[9px] text-left leading-none font-mono ${act.checked ? 'text-stone-600 line-through' : 'text-[#e5e2e1]'}`}>
                                                <div className={`w-1.5 h-1.5 border shrink-0 ${act.checked ? `bg-${clr} border-${clr}` : 'border-stone-500'}`} />
                                                <span className="truncate font-mono">{act.text}</span>
                                              </button>
                                            );
                                         })}
                                       </div>
                                     )}
                                   </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Footer Controls */}
                              <div className="mt-auto flex justify-start items-center border-t border-white/5 pt-2 h-7">
                                 <div className="flex items-center gap-[1px] bg-white/[0.08] brutal-border pl-[1px] pt-[1px]">
                                   {task.status !== 'done' && task.status !== 'skipped' && (
                                     <button onClick={() => deleteTask(task.id)} className="h-5 w-5 bg-[#0a0a0a] text-stone-500 hover:text-red-500 transition-colors flex items-center justify-center !min-h-0">
                                       <Trash2 size={10} strokeWidth={1.5} />
                                     </button>
                                   )}
                                   {task.status !== 'done' && task.status !== 'skipped' && (
                                     <button onClick={() => handleEditStart(task)} className="h-5 w-5 bg-[#0a0a0a] text-stone-500 hover:text-white transition-colors flex items-center justify-center !min-h-0">
                                       <Pencil size={10} strokeWidth={1.5} />
                                     </button>
                                   )}
                                   {task.status === 'todo' && (
                                     <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="h-5 w-5 bg-[#0a0a0a] text-stone-500 hover:text-emerald-500 transition-colors flex items-center justify-center !min-h-0">
                                       <Check size={11} strokeWidth={1.5} />
                                     </button>
                                   )}
                                   {task.status === 'in_progress' && (
                                     <button onClick={() => updateTaskStatus(task.id, 'done')} className="h-5 w-5 bg-[#0a0a0a] text-stone-500 hover:text-emerald-500 transition-colors flex items-center justify-center !min-h-0">
                                       <Check size={11} strokeWidth={1.5} />
                                     </button>
                                   )}
                                   {(task.status === 'done' || task.status === 'skipped') && (
                                     <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="h-5 w-5 bg-[#0a0a0a] text-stone-500 hover:text-white transition-colors flex items-center justify-center !min-h-0" title="Retomar">
                                       <Pencil size={10} strokeWidth={1.5} />
                                     </button>
                                   )}
                                 </div>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </motion.div>
                  )})}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
