'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Pencil, X, Calendar, ChevronDown, Sparkles, Lock, Unlock, AlertTriangle, Clock } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { StoreService, type ChecklistItem } from '@/services/storeService';

interface Task {
  id: string;
  objectiveId?: string;
  text: string;
  status: 'todo' | 'in_progress' | 'done' | 'skipped';
  category: 'work' | 'home' | 'personal';
  priority?: 'low' | 'medium' | 'high';
  estimated_time: number;
  actual_time: number;
  due_date?: string;
  updatedAt: string;
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
  
  const tasks = (data?.tasks as Task[]) || [];
  const objectives = (data?.objectives as Objective[]) || [];

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
      objectiveId: selectedObjectiveId || undefined,
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
      updatedAt: new Date().toISOString(),
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
    setAiSuggestions({field: '', items: []});
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
    updateData({ tasks: tasks.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t) as any });
  };

  const deleteTask = (id: string) => {
    updateData({ tasks: tasks.filter(t => t.id !== id) as any });
  };

  const deleteObjective = (id: string) => {
    updateData({ objectives: objectives.filter(o => o.id !== id) as any });
    if (selectedObjectiveId === id) setSelectedObjectiveId('');
    updateData({ tasks: tasks.map(t => t.objectiveId === id ? { ...t, objectiveId: undefined } : t) as any });
  };

  const handleEditStart = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskText(task.text);
    setEditTaskCategory(task.category);
    setEditTaskObjectiveId(task.objectiveId || '');
    setEditEstimatedTime(task.estimated_time);
    setEditActualTime(task.actual_time);
    setEditDueDate(task.due_date || '');
    setEditPriority(task.priority || 'medium');
    setEditActions(task.actions || []);
    setEditValidations(task.validations || []);
    setEditDetail(task.detail || '');
  };

  const handleEditSave = () => {
    updateData({ tasks: tasks.map(t => t.id === editingTaskId ? {
      ...t,
      text: editTaskText,
      category: editTaskCategory,
      objectiveId: editTaskObjectiveId || undefined,
      estimated_time: editEstimatedTime,
      actual_time: editActualTime,
      due_date: editDueDate || undefined,
      priority: editPriority,
      actions: editActions,
      validations: editValidations,
      detail: editDetail.trim() || undefined,
      updatedAt: new Date().toISOString()
    } : t) as any });
    setEditingTaskId(null);
  };

  const skipTask = (id: string) => {
    updateData({ tasks: tasks.map(t => t.id === id ? { ...t, status: 'skipped' as const, updatedAt: new Date().toISOString() } : t) as any });
  };

  const toggleObjectiveComplete = (id: string) => {
    const hasPending = tasks.some(t => t.objectiveId === id && t.status !== 'done' && t.status !== 'skipped');
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
    <div className="space-y-6">
      {/* Creation UI */}
      <div className="flex flex-col gap-6">
        {/* Objectives First */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={newObjective}
              onChange={e => setNewObjective(e.target.value)}
              placeholder="NUEVO OBJETIVO"
              className="flex-1 bg-transparent border border-stone-200 dark:border-stone-800 px-4 py-2 text-[10px] uppercase outline-none focus:border-user-b"
            />
            <button onClick={addObjective} className="px-4 py-2 bg-user-b text-white">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {objectives.map(obj => {
              const objTasks = tasks.filter(t => t.objectiveId === obj.id);
              const pendingCount = objTasks.filter(t => t.status !== 'done' && t.status !== 'skipped').length;
              const completedCount = objTasks.length - pendingCount;
              const totalEst = objTasks.reduce((acc, t) => acc + (t.estimated_time || 0), 0);
              const totalAct = objTasks.reduce((acc, t) => acc + (t.actual_time || 0), 0);
              
              return (
              <div key={obj.id} className={`flex flex-col gap-1 px-2 py-1 border transition-all ${obj.is_complete ? 'border-emerald-500 bg-emerald-500/5 opacity-50' : 'border-user-b/20 bg-user-b/5'}`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleObjectiveComplete(obj.id)}
                    disabled={pendingCount > 0}
                    className={`p-0.5 rounded-sm border ${obj.is_complete ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-user-b/50 text-transparent hover:border-user-b'} disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {obj.is_complete ? <Check size={10} /> : <div className="w-[10px] h-[10px]" />}
                  </button>
                  <span className={`text-[8px] uppercase font-bold ${obj.is_complete ? 'text-emerald-500 line-through' : 'text-user-b'}`}>{obj.title}</span>
                  <button onClick={() => deleteObjective(obj.id)} className="text-stone-400 hover:text-red-500 ml-auto">
                    <X size={10} />
                  </button>
                </div>
                {objTasks.length > 0 && (
                  <div className="flex gap-2 text-[6px] uppercase font-mono text-stone-500 border-t border-user-b/10 pt-1 mt-0.5">
                    <span>{completedCount}/{objTasks.length} Tareas</span>
                    <span>{totalAct}/{totalEst} Min</span>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>

        {/* Tasks Second */}
        <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-900">
          <div className="flex gap-2">
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="NUEVA TAREA"
              className="flex-1 bg-transparent border border-stone-200 dark:border-stone-800 px-4 py-2 text-[10px] uppercase outline-none focus:border-user-a"
            />
            <button onClick={addTask} className="px-4 py-2 bg-user-a text-white">
              <Plus size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
             <div className="flex flex-col gap-1">
                <label className="text-[7px] uppercase font-bold text-stone-400">Objetivo</label>
                <select
                  value={selectedObjectiveId}
                  onChange={e => setSelectedObjectiveId(e.target.value)}
                  className="bg-transparent border border-stone-200 dark:border-stone-800 px-2 h-[32px] text-[8px] uppercase outline-none"
                >
                  <option value="">Sin Objetivo</option>
                  {objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                </select>
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[7px] uppercase font-bold text-stone-400">Prioridad</label>
                <div className="flex border border-stone-200 dark:border-stone-800 min-h-[32px]">
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
                  className="bg-transparent border border-stone-200 dark:border-stone-800 px-2 h-[32px] text-[8px] outline-none"
                />
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[7px] uppercase font-bold text-stone-400">Fecha Límite</label>
                <input
                  type="datetime-local"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="bg-transparent border border-stone-200 dark:border-stone-800 px-2 h-[32px] text-[8px] outline-none"
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
                       className="bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-[10px] outline-none min-h-[60px] resize-none"
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
                             onKeyDown={e => { if (e.key === 'Enter') { setNewActions([...newActions, {id: Date.now().toString(), text: newActionText, checked: false}]); setNewActionText(''); } }}
                             placeholder="Nueva acción..."
                             className="flex-1 bg-transparent border border-stone-800 px-2 py-1 text-[9px] outline-none"
                          />
                          <button onClick={() => { if(newActionText) { setNewActions([...newActions, {id: Date.now().toString(), text: newActionText, checked: false}]); setNewActionText(''); } }} className="px-2 border border-stone-800 hover:bg-white/5"><Plus size={10} /></button>
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
                             onKeyDown={e => { if (e.key === 'Enter') { setNewValidations([...newValidations, {id: Date.now().toString(), text: newValidationText, checked: false}]); setNewValidationText(''); } }}
                             placeholder="Nueva validación..."
                             className="flex-1 bg-transparent border border-stone-800 px-2 py-1 text-[9px] outline-none"
                          />
                          <button onClick={() => { if(newValidationText) { setNewValidations([...newValidations, {id: Date.now().toString(), text: newValidationText, checked: false}]); setNewValidationText(''); } }} className="px-2 border border-stone-800 hover:bg-white/5"><Plus size={10} /></button>
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
        </div>
      </div>

      {/* Category Filter */}
      <div className="border-t border-stone-100 dark:border-stone-900 pt-4">
        <div className="flex gap-4">
          {['work', 'home', 'personal'].map((cat: any) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-[10px] uppercase font-bold tracking-widest px-4 py-1 border transition-colors ${category === cat ? 'border-user-a text-user-a' : 'border-transparent text-stone-500 hover:border-stone-200 dark:hover:border-stone-800'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[250px]">
        {[
          { status: 'todo' as const, title: 'Pendiente', accent: 'text-stone-500' },
          { status: 'in_progress' as const, title: 'En Progreso', accent: 'text-user-a', pulse: true },
          { status: 'done' as const, title: 'Completado', accent: 'text-stone-500', opacity: 'opacity-70' }
        ].map((col) => (
          <div key={col.status} className={`border border-stone-200 dark:border-stone-800 bg-white/5 dark:bg-black/20 p-3 h-full flex flex-col ${col.opacity || ''}`}>
            <h4 className={`text-[9px] uppercase font-bold tracking-[0.2em] ${col.accent} mb-3 border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-2`}>
              {col.title} {col.pulse && <span className="w-1.5 h-1.5 bg-user-a animate-pulse" />}
            </h4>
            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence>
                {tasks.filter(t => t.status === col.status).map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-2 border bg-white dark:bg-stone-900 group ${editingTaskId === task.id ? 'border-user-a' : 'border-stone-200 dark:border-stone-800'}`}
                  >
                    {editingTaskId === task.id ? (
                      <div className="space-y-2">
                        <input
                          value={editTaskText}
                          onChange={e => setEditTaskText(e.target.value)}
                          className="w-full bg-transparent border border-stone-100 dark:border-stone-800 px-2 py-1 text-[10px] uppercase outline-none focus:border-user-a"
                        />
                        <div className="flex gap-2">
                          <select
                            value={editTaskCategory}
                            onChange={e => setEditTaskCategory(e.target.value as any)}
                            className="flex-1 bg-transparent border border-stone-100 dark:border-stone-800 px-1 py-0.5 text-[8px] uppercase outline-none"
                          >
                            <option value="work">Work</option>
                            <option value="home">Home</option>
                            <option value="personal">Personal</option>
                          </select>
                          <select
                            value={editTaskObjectiveId}
                            onChange={e => setEditTaskObjectiveId(e.target.value)}
                            className="flex-1 bg-transparent border border-stone-100 dark:border-stone-800 px-1 py-0.5 text-[8px] uppercase outline-none"
                          >
                            <option value="">Sin Obj</option>
                            {objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                          </select>
                          <select
                            value={editPriority}
                            onChange={e => setEditPriority(e.target.value as any)}
                            className="flex-1 bg-transparent border border-stone-100 dark:border-stone-800 px-1 py-0.5 text-[8px] uppercase outline-none"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[7px] uppercase font-bold text-stone-400">Est. (m)</label>
                            <input
                              type="number"
                              value={editEstimatedTime}
                              onChange={e => setEditEstimatedTime(Number(e.target.value))}
                              className="w-full bg-transparent border border-stone-100 dark:border-stone-800 px-2 py-1 text-[10px] outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[7px] uppercase font-bold text-stone-400">Act. (m)</label>
                            <input
                              type="number"
                              value={editActualTime}
                              onChange={e => setEditActualTime(Number(e.target.value))}
                              className="w-full bg-transparent border border-stone-100 dark:border-stone-800 px-2 py-1 text-[10px] outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[7px] uppercase font-bold text-stone-400">Due Date</label>
                          <input
                            type="datetime-local"
                            value={editDueDate}
                            onChange={e => setEditDueDate(e.target.value)}
                            className="w-full bg-transparent border border-stone-100 dark:border-stone-800 px-2 py-1 text-[10px] outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[7px] uppercase font-bold text-stone-400">Detalle</label>
                          <textarea
                             value={editDetail}
                             onChange={e => setEditDetail(e.target.value)}
                             className="w-full bg-transparent border border-stone-100 dark:border-stone-800 px-2 py-1 text-[8px] outline-none min-h-[40px] resize-none"
                          />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingTaskId(null)} className="flex-1 py-1 border border-stone-100 text-[8px] uppercase text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
                            <X size={12} className="mx-auto" />
                          </button>
                          <button onClick={handleEditSave} className="flex-1 py-1 bg-user-a text-white text-[8px] uppercase font-bold">
                            <Check size={12} className="mx-auto" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={`relative flex flex-col h-full pl-2 ${task.priority === 'high' ? 'border-l-[3px] border-l-rose-500 bg-rose-500/5' : task.priority === 'medium' ? 'border-l-[3px] border-l-amber-500 bg-amber-500/5' : 'border-l-[3px] border-l-stone-500'}`}>
                          
                          {/* X Banner Overlay */}
                          {task.status === 'skipped' && (
                             <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-30">
                                <div className="absolute top-1/2 left-[-10%] w-[120%] h-px bg-red-500 rotate-12" />
                                <div className="absolute top-1/2 left-[-10%] w-[120%] h-px bg-red-500 -rotate-12" />
                             </div>
                          )}

                          {isTaskLate(task) && task.status !== 'skipped' && (
                             <button onClick={() => skipTask(task.id)} className="absolute inset-0 z-10 cursor-pointer opacity-0 hover:opacity-100 bg-red-500/10 backdrop-blur-[1px] transition-all flex items-center justify-center group/xbanner">
                                <span className="text-[10px] uppercase font-bold text-red-500 tracking-[0.3em] scale-90 group-hover/xbanner:scale-100 transition-transform">Marcar como Saltada</span>
                             </button>
                          )}

                          <div className="flex justify-between items-start gap-2 pt-1 pr-1">
                            <div className="flex-1 min-w-0">
                               <p className={`text-[10px] uppercase tracking-wider text-stone-800 dark:text-stone-200 truncate ${task.status === 'skipped' ? 'line-through opacity-50' : ''}`} title={task.text}>{task.text}</p>
                               {task.detail && <p className="text-[7px] italic text-stone-500 truncate mt-0.5">{task.detail}</p>}
                            </div>
                            <div className="flex items-center gap-1">
                               {/* Status Dot */}
                               <div className={`w-2 h-2 rounded-full ${getTaskStatusDot(task).color}`} title={getTaskStatusDot(task).label} />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                             {/* Time Ratio */}
                             <div className={`px-1 py-0.5 border text-[7px] font-mono ${
                                isTaskOverflowed(task)
                                ? 'border-red-500 text-red-500 bg-red-500/5'
                                : `border-stone-200 dark:border-stone-800 text-stone-500 bg-black/5`
                              }`}>
                                {task.actual_time}/{task.estimated_time}m
                             </div>

                             {isTaskOverflowed(task) && (
                                <div className="px-1 py-0.5 bg-red-500 text-white text-[7px] uppercase font-bold tracking-widest flex items-center gap-0.5">
                                   <AlertTriangle size={8} /> Overflow
                                </div>
                             )}

                             {isTaskLate(task) && (
                                <div className="px-1 py-0.5 bg-amber-500 text-white text-[7px] uppercase font-bold tracking-widest flex items-center gap-0.5">
                                   <Clock size={8} /> Late
                                </div>
                             )}

                             {task.actions && task.actions.length > 0 && (
                                <button onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className="px-1 py-0.5 border border-stone-200 dark:border-stone-800 hover:border-user-b text-[7px] font-mono text-stone-500 hover:text-user-b bg-black/5 flex items-center gap-1 transition-colors">
                                   ✓ {task.actions.filter(a => a.checked).length}/{task.actions.length} <ChevronDown size={8} className={`transition-transform ${expandedTaskId === task.id ? 'rotate-180' : ''}`} />
                                </button>
                             )}
                             {task.validations && task.validations.length > 0 && (
                                <button onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className="px-1 py-0.5 border border-emerald-500/30 hover:border-emerald-500 text-[7px] font-mono text-emerald-500 bg-emerald-500/5 flex items-center gap-1 transition-colors">
                                   ☑ {task.validations.filter(a => a.checked).length}/{task.validations.length} <ChevronDown size={8} className={`transition-transform ${expandedTaskId === task.id ? 'rotate-180' : ''}`} />
                                </button>
                             )}
                          </div>

                          <AnimatePresence>
                             {expandedTaskId === task.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 space-y-2 pr-1">
                                   {task.actions && task.actions.length > 0 && (
                                      <div className="space-y-1">
                                         <div className="text-[6px] uppercase font-bold text-user-b">Acciones</div>
                                         {task.actions.map(act => (
                                            <button key={act.id} onClick={() => toggleChecklistInCard(task.id, 'actions', act.id)} className={`w-full flex items-center gap-1.5 p-1 text-left text-[8px] border transition-colors ${act.checked ? 'border-user-b/50 bg-user-b/10 opacity-50' : 'border-stone-200 dark:border-stone-800 hover:border-user-b'}`}>
                                               <div className={`w-2.5 h-2.5 flex items-center justify-center border ${act.checked ? 'border-user-b bg-user-b text-white' : 'border-stone-400'}`}>
                                                  {act.checked && <Check size={6} />}
                                               </div>
                                               <span className={`truncate ${act.checked ? 'line-through' : ''}`}>{act.text}</span>
                                            </button>
                                         ))}
                                      </div>
                                   )}
                                   {task.validations && task.validations.length > 0 && (
                                      <div className="space-y-1">
                                         <div className="text-[6px] uppercase font-bold text-emerald-500">Validaciones</div>
                                         {task.validations.map(val => (
                                            <button key={val.id} onClick={() => toggleChecklistInCard(task.id, 'validations', val.id)} className={`w-full flex items-center gap-1.5 p-1 text-left text-[8px] border transition-colors ${val.checked ? 'border-emerald-500/50 bg-emerald-500/10 opacity-50' : 'border-stone-200 dark:border-stone-800 hover:border-emerald-500'}`}>
                                               <div className={`w-2.5 h-2.5 flex items-center justify-center border ${val.checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-400'}`}>
                                                  {val.checked && <Check size={6} />}
                                               </div>
                                               <span className={`truncate ${val.checked ? 'line-through' : ''}`}>{val.text}</span>
                                            </button>
                                         ))}
                                      </div>
                                   )}
                                </motion.div>
                             )}
                          </AnimatePresence>

                          <div className="flex justify-between items-center mt-2 pr-1">
                            {task.objectiveId && (
                              <div className="text-[7px] uppercase font-bold text-stone-400">
                                #{objectives.find(o => o.id === task.objectiveId)?.title}
                              </div>
                            )}
                            {task.due_date && (
                              <div className={`text-[7px] uppercase font-bold ${isTaskLate(task) ? 'text-red-500' : 'text-stone-400'}`}>
                                {new Date(task.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-stone-50 dark:border-stone-800/50">
                            <span className="text-[7px] uppercase font-bold tracking-[0.2em] text-user-a">{task.category}</span>
                            <div className="flex gap-2 items-center relative z-20">
                              {task.status !== 'done' && task.status !== 'skipped' && (
                                <button onClick={() => handleEditStart(task)} className="text-stone-400 hover:text-user-a transition-all">
                                  <Pencil size={12} />
                                </button>
                              )}
                              {task.status === 'todo' && (
                                <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-user-a">▶</button>
                              )}
                              {task.status === 'in_progress' && (
                                <>
                                  <button onClick={() => updateTaskStatus(task.id, 'todo')} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">◀</button>
                                  <button onClick={() => updateTaskStatus(task.id, 'done')} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-user-a">▶</button>
                                </>
                              )}
                              {task.status === 'done' && (
                                <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">◀</button>
                              )}
                              <button onClick={() => deleteTask(task.id)} className="text-stone-400 hover:text-red-500 transition-all ml-1">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
