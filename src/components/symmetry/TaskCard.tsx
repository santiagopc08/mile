import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Check, Pencil, Clock } from 'lucide-react';
import { FuturisticProgressBar } from '@/components/ui/FuturisticProgressBar';
import { LiveLinkPreview } from '@/components/LiveLinkPreview';
import { Task, Objective, categoryStyles, priorityStyles } from './taskTypes';

interface TaskCardProps {
  task: Task;
  isEditing: boolean;
  onEditStart: (task: Task) => void;
  onEditCancel: () => void;
  onEditSave: (updatedTask: Task) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Task['status']) => void;
  onToggleChecklist: (taskId: string, listType: 'actions' | 'validations', itemId: string) => void;
  expandedTaskId: string | null;
  setExpandedTaskId: (id: string | null) => void;
  getTaskObjective: (task: Task) => Objective | undefined;
  accentClass: string;
  accentColor: string;
  profile: 'el' | 'ella' | null;
  isLateOrOverflow: boolean;
}

export const TaskCard = ({
  task,
  isEditing,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDelete,
  onUpdateStatus,
  onToggleChecklist,
  expandedTaskId,
  setExpandedTaskId,
  getTaskObjective,
  accentClass,
  accentColor,
  profile,
  isLateOrOverflow,
}: TaskCardProps) => {
  const taskPriority = task.priority || 'medium';
  const priorityBg = priorityStyles[taskPriority].stripe;
  const categoryStyle = categoryStyles[task.category];
  const clockColor = isLateOrOverflow ? 'text-red-500' : 'text-emerald-500';
  const isCollapsed = task.status === 'done' || task.status === 'skipped';

  let checkedActionsCount = 0;
  if (!isCollapsed && task.actions) {
    for (const a of task.actions) if (a.checked) checkedActionsCount++;
  }

  let checkedValidationsCount = 0;
  if (!isCollapsed && task.validations) {
    for (const v of task.validations) if (v.checked) checkedValidationsCount++;
  }

  // Edit state
  const [editTaskText, setEditTaskText] = useState(task.text);
  const [editTaskCategory, setEditTaskCategory] = useState(task.category);
  const [editTaskObjectiveId, setEditTaskObjectiveId] = useState(task.objective_id || '');
  const [editEstimatedTime, setEditEstimatedTime] = useState(task.estimated_time);
  const [editActualTime, setEditActualTime] = useState(task.actual_time);
  const [editDueDate, setEditDueDate] = useState(task.due_date || '');
  const [editPriority, setEditPriority] = useState(task.priority || 'medium');
  const [editActions, setEditActions] = useState<NonNullable<Task['actions']>>(task.actions || []);
  const [editValidations, setEditValidations] = useState<NonNullable<Task['actions']>>(task.validations || []);
  const [editDetail, setEditDetail] = useState(task.detail || '');
  const [editTaskAssignee, setEditTaskAssignee] = useState(task.assignee || profile || 'el');

  // Reset edit state when editing starts for this task
  useEffect(() => {
    if (isEditing) {
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
    }
  }, [isEditing, task, profile]);

  const handleSave = () => {
    onEditSave({
      ...task,
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
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative w-full border border-white/10 bg-[#0a0a0a] p-0 transition-colors hover:border-white/20 ${isEditing ? `border-white shadow-[0_0_10px_rgba(255,255,255,0.1)]` : ''}`}
    >
      {isEditing ? (
        <div className="p-3 space-y-2">
          <input value={editTaskText} onChange={e => setEditTaskText(e.target.value)} className={`w-full bg-black border border-white/20 px-2 py-1.5 text-[11px] text-white outline-none focus:border-${accentClass}`} />
          <div className="flex gap-1 flex-wrap">
            <select value={editTaskCategory} onChange={e => setEditTaskCategory(e.target.value as "work" | "home" | "personal")} className="flex-1 min-w-0 bg-black border border-white/20 px-1 py-1 text-[9px] uppercase text-stone-300 outline-none font-mono"><option value="work">TRABAJO</option><option value="home">HOGAR</option><option value="personal">PERSONAL</option></select>
            <select value={editPriority} onChange={e => setEditPriority(e.target.value as "low" | "medium" | "high")} className="flex-1 min-w-0 bg-black border border-white/20 px-1 py-1 text-[9px] uppercase text-stone-300 outline-none font-mono"><option value="low">BAJA</option><option value="medium">MEDIA</option><option value="high">ALTA</option></select>
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
            <button onClick={onEditCancel} className="flex-1 py-1 border border-white/20 text-[8px] text-stone-400 hover:text-red-500 hover:border-red-500 transition-colors">✕</button>
            <button onClick={handleSave} className={`flex-1 py-1 border border-${accentClass} bg-${accentClass}/10 text-${accentClass} text-[8px] hover:bg-${accentClass} hover:text-black transition-colors`}>✓</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col relative pt-1 pl-5 pr-2.5 pb-2.5">
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
          <div className="flex flex-col gap-1 pt-2 pb-0.5 mt-0.5 font-mono">
            <p className={`text-[12px] md:text-[13px] uppercase font-semibold leading-tight tracking-tight text-white text-center w-full font-mono ${task.status === 'skipped' ? 'line-through opacity-50' : ''}`}>{task.text}</p>
            {!isCollapsed && task.detail && <p className="text-[9px] leading-tight text-[#a88a7e] line-clamp-2 mt-0.5 text-left font-mono">{task.detail}</p>}
          </div>

          {/* Progress Bar (Conditional) */}
          {!isCollapsed && task.estimated_time > 0 && (
            (() => {
              const progressColor =
                taskPriority === 'high' ? '#f43f5e' :
                  taskPriority === 'medium' ? '#f59e0b' :
                    '#0ea5e9';
              return (
                <div className="mt-1.5 mb-1 font-mono">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[7px] font-mono text-stone-500 tracking-wider">PRG</span>
                    <span className="text-[7.5px] font-mono text-stone-500 tabular-nums">
                      {task.actual_time}/{task.estimated_time}M · {Math.round((task.actual_time / task.estimated_time) * 100)}%
                    </span>
                  </div>
                  <FuturisticProgressBar
                    progress={(task.actual_time / task.estimated_time) * 100}
                    color={progressColor}
                  />
                </div>
              );
            })()
          )}

          {/* Footer Controls & Counters Row */}
          <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isCollapsed && task.actions && task.actions.length > 0 && (
                <button onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className={`text-[7px] font-mono uppercase font-bold hover:text-${accentClass} transition-colors leading-none flex items-center gap-1 text-stone-500`}>
                  ACT · ✓ {checkedActionsCount}/{task.actions.length}
                </button>
              )}
              {!isCollapsed && task.validations && task.validations.length > 0 && (
                <button onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className={`text-[7px] font-mono uppercase font-bold hover:text-${accentClass} transition-colors leading-none flex items-center gap-1 text-stone-500`}>
                  VLD · ✓ {checkedValidationsCount}/{task.validations.length}
                </button>
              )}
            </div>

            <div className="flex items-center gap-[1px] bg-white/[0.08] brutal-border pl-[1px] pt-[1px]">
              {task.status !== 'done' && task.status !== 'skipped' && (
                <button onClick={() => onDelete(task.id)} className="h-4.5 w-4.5 bg-[#0a0a0a] text-stone-500 hover:text-red-500 transition-colors flex items-center justify-center !min-h-0">
                  <Trash2 size={10} strokeWidth={1.5} />
                </button>
              )}
              {task.status !== 'done' && task.status !== 'skipped' && (
                <button onClick={() => onEditStart(task)} className="h-4.5 w-4.5 bg-[#0a0a0a] text-stone-500 hover:text-white transition-colors flex items-center justify-center !min-h-0">
                  <Pencil size={10} strokeWidth={1.5} />
                </button>
              )}
              {task.status === 'todo' && (
                <button onClick={() => onUpdateStatus(task.id, 'in_progress')} className="h-4.5 w-4.5 bg-[#0a0a0a] text-stone-500 hover:text-emerald-500 transition-colors flex items-center justify-center !min-h-0">
                  <Check size={11} strokeWidth={1.5} />
                </button>
              )}
              {task.status === 'in_progress' && (
                <button onClick={() => onUpdateStatus(task.id, 'done')} className="h-4.5 w-4.5 bg-[#0a0a0a] text-stone-500 hover:text-emerald-500 transition-colors flex items-center justify-center !min-h-0">
                  <Check size={11} strokeWidth={1.5} />
                </button>
              )}
              {(task.status === 'done' || task.status === 'skipped') && (
                <button onClick={() => onUpdateStatus(task.id, 'in_progress')} className="h-4.5 w-4.5 bg-[#0a0a0a] text-stone-500 hover:text-white transition-colors flex items-center justify-center !min-h-0" title="Retomar">
                  <Pencil size={10} strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>

          {/* Actions / Validations Collapsible */}
          <AnimatePresence>
            {!isCollapsed && expandedTaskId === task.id && ((task.actions && task.actions.length > 0) || (task.validations && task.validations.length > 0)) && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2 border-t border-white/5 pt-2 mt-2">
                {task.actions && task.actions.length > 0 && (
                  <div className="space-y-0.5">
                    <span className="text-[6px] text-stone-600 font-mono tracking-widest uppercase block mb-1">Actions</span>
                    {task.actions.map(act => {
                      const obj = getTaskObjective(task);
                      const clr = obj?.author === 'ella' ? 'user-a' : 'user-b';
                      return (
                        <button key={act.id} onClick={() => onToggleChecklist(task.id, 'actions', act.id)} className={`w-full flex items-center gap-1.5 py-0 text-[9px] text-left leading-none font-mono ${act.checked ? 'text-stone-600 line-through' : 'text-[#e5e2e1]'}`}>
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
                        <button key={act.id} onClick={() => onToggleChecklist(task.id, 'validations', act.id)} className={`w-full flex items-center gap-1.5 py-0 text-[9px] text-left leading-none font-mono ${act.checked ? 'text-stone-600 line-through' : 'text-[#e5e2e1]'}`}>
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
        </div>
      )}
    </motion.div>
  );
};
