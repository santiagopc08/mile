import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronDown, Sparkles } from 'lucide-react';
import { type ChecklistItem } from '@/services/storeService';
import { LiveLinkPreview } from '@/components/LiveLinkPreview';
import { Task, Objective, categoryStyles, priorityStyles } from './taskTypes';

interface TaskFormProps {
  onClose: () => void;
  onAdd: (taskData: Omit<Task, 'id' | 'status' | 'actual_time' | 'updated_at'>) => void;
  visibleObjectives: Objective[];
  accentClass: string;
  profile: 'el' | 'ella' | null;
}

export const TaskForm = ({ onClose, onAdd, visibleObjectives, accentClass, profile }: TaskFormProps) => {
  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState<'work' | 'home' | 'personal'>('work');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
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

  const fetchAiSuggestions = async (field: 'actions' | 'validations') => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskText: newTask, category, field })
      });
      const data = await res.json();
      setAiSuggestions({ field, items: data.suggestions || [] });
    } catch { setAiSuggestions({ field, items: [] }); }
    setAiLoading(false);
  };

  const importSuggestion = (text: string, field: 'actions' | 'validations') => {
    const item: ChecklistItem = { id: crypto.randomUUID(), text, checked: false };
    if (field === 'actions') setNewActions(prev => [...prev, item]);
    else setNewValidations(prev => [...prev, item]);
    setAiSuggestions(prev => ({ ...prev, items: prev.items.filter(i => i !== text) }));
  };

  const handleAdd = () => {
    if (!newTask.trim()) {
      return; // Validation handled by parent
    }

    onAdd({
      text: newTask,
      category,
      objective_id: selectedObjectiveId || undefined,
      priority: newPriority,
      estimated_time: newEstimatedTime,
      due_date: newDueDate || undefined,
      actions: newActions.length > 0 ? newActions : undefined,
      validations: newValidations.length > 0 ? newValidations : undefined,
      detail: newDetail.trim() || undefined,
      assignee: newTaskAssignee,
    });

    // Reset form after successful add
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
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="space-y-3 overflow-hidden border-t border-white/10 pt-3"
    >
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-mono text-${accentClass} tracking-[0.2em]`}>NUEVA TAREA</span>
        <button onClick={onClose} className="!min-h-0 text-stone-500 hover:text-white transition-colors">
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
        onClick={handleAdd}
        className={`mt-1 w-full border border-${accentClass} bg-${accentClass} py-2.5 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:opacity-80`}
      >
        Guardar tarea
      </button>
    </motion.div>
  );
};
