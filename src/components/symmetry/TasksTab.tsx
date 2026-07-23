import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TaskModule } from './TaskModule';
import { TaskAnalytics } from './TaskAnalytics';
import { PomodoroTimer } from './PomodoroTimer';
import { Activity, BarChart3, ShieldCheck, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';
import { BrutalistPanel } from '@/components/ui/BrutalistPanel';
import { NotificationsFeed } from '@/components/NotificationsFeed';

interface Task {
  id: string;
  text: string;
  status: 'todo' | 'in_progress' | 'done' | 'skipped';
  category: string;
  priority?: 'low' | 'medium' | 'high';
  actual_time: number;
  estimated_time: number;
  assignee?: 'el' | 'ella';
}

interface TasksTabProps {
  tasks: Task[];
  objectives: any[];
  profile: string;
  accentColorValue: string;
  focusScore: number;
  activeTasks: number;
  handleTasksUpdate: (score: number) => void;
}

export const TasksTab = ({
  tasks,
  objectives,
  profile,
  accentColorValue,
  focusScore,
  activeTasks,
  handleTasksUpdate,
}: TasksTabProps) => {
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  return (
    <motion.div
      key="tasks"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 border-x border-white/10 bg-[#050505] p-2 sm:p-4 md:p-5"
    >
      {/* Task Video Header */}
      <BrutalistPanel accentColor={accentColorValue} borderColor="rgba(255,255,255,0.1)" corners="animated" cornerSize={12} cornerThickness={1.5} className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="w-full">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-xs animate-spin-slow" style={{ color: accentColorValue }}>◆</span>
            <p className="text-[9px] font-mono font-bold uppercase tracking-[0.24em] text-user-c">OPERACIONES Y RITMO</p>
          </div>
          <h2 className="text-2xl font-mono font-bold uppercase tracking-tight text-white mt-1 flex justify-between items-center w-full">
            <span>TAREAS · REGISTRO DIARIO</span>
            <div className="relative h-20 w-20 border border-white/10 bg-black p-1 flex-shrink-0">
              <AnimatedBrutalistCorners color="var(--color-profile-accent)" size={6} />
              <video
                className="h-full w-full object-cover opacity-80 mix-blend-screen contrast-125"
                src="vid/planningCat.mp4"
                autoPlay
                loop
                muted
                playsInline
                webkit-playsinline="true"
              />
            </div>
          </h2>
        </div>
        <div className="grid grid-cols-3 border border-white/10 text-center bg-black/40 rounded-none shrink-0 md:min-w-[280px]">
          <div className="border-r border-white/10 px-3 py-2">
            <div className={`text-xl font-bold font-mono tracking-tighter ${profile === 'ella' ? 'text-user-a' : 'text-user-b'}`}>{tasks.length}</div>
            <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#a88a7e] mt-0.5">Tareas</div>
          </div>
          <div className="border-r border-white/10 px-3 py-2">
            <div className="text-xl font-bold font-mono tracking-tighter text-user-c">{activeTasks}</div>
            <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#a88a7e] mt-0.5">Activas</div>
          </div>
          <div className="px-3 py-2">
            <div className={`text-xl font-bold font-mono tracking-tighter ${profile === 'ella' ? 'text-user-b' : 'text-user-a'}`}>{Math.round(focusScore)}%</div>
            <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#a88a7e] mt-0.5">Enfoque</div>
          </div>
        </div>
      </BrutalistPanel>

      {/* Row 0: Pomodoro (COLLAPSIBLE) */}
      <BrutalistPanel accentColor={accentColorValue} borderColor="rgba(255,255,255,0.1)" corners="animated" cornerSize={8} cornerThickness={1} className="rounded-none overflow-hidden transition-all duration-300">
        <button
          onClick={() => setIsPomodoroOpen(!isPomodoroOpen)}
          className="w-full px-5 py-4 flex items-center justify-between bg-black/40 hover:bg-black/60 transition-colors text-left"
        >
          <span className="flex items-center gap-3 text-[10px] font-mono font-black uppercase tracking-[0.24em] text-white">
            <Clock size={14} className="stroke-[1.5]" style={{ color: accentColorValue }} />
            TEMPORIZADOR DE ENFOQUE (POMODORO)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[7.5px] font-mono opacity-40 uppercase tracking-widest">{isPomodoroOpen ? 'Ocultar' : 'Mostrar'}</span>
            {isPomodoroOpen ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
          </div>
        </button>

        <AnimatePresence>
          {isPomodoroOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 p-6 sm:p-8"
            >
              <PomodoroTimer />
            </motion.div>
          )}
        </AnimatePresence>
      </BrutalistPanel>

      {/* Row 1: Kanban Board (Always Expanded - Core Interface) */}
      <div className="geometric-card relative overflow-hidden border-white/10 bg-[#0a0a0a] p-3 sm:p-4 md:p-5">
        <AnimatedBrutalistCorners color={accentColorValue} />
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <ShieldCheck size={120} style={{ color: accentColorValue }} />
        </div>
        <h2 className="relative z-10 mb-4 flex items-center justify-between border-b border-white/5 pb-3 text-[10px] font-mono font-black uppercase tracking-[0.22em]" style={{ color: accentColorValue }}>
          <span>TAREAS Y OBJETIVOS</span>
        </h2>
        <TaskModule onTasksUpdate={handleTasksUpdate} />
      </div>

      {/* Row 2: Analytics (COLLAPSIBLE) */}
      <BrutalistPanel accentColor="#00dbe9" borderColor="rgba(255,255,255,0.1)" corners="animated" cornerSize={8} cornerThickness={1} className="rounded-none overflow-hidden transition-all duration-300">
        <button
          onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
          className="w-full px-5 py-4 flex items-center justify-between bg-black/40 hover:bg-black/60 transition-colors text-left"
        >
          <span className="flex items-center gap-3 text-[10px] font-mono font-black uppercase tracking-[0.24em] text-white">
            <BarChart3 size={14} className="stroke-[1.5] text-[#00dbe9]" />
            MÉTRICAS Y ANÁLISIS DE PROGRESO
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[7.5px] font-mono opacity-40 uppercase tracking-widest">{isAnalyticsOpen ? 'Ocultar' : 'Mostrar'}</span>
            {isAnalyticsOpen ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
          </div>
        </button>

        <AnimatePresence>
          {isAnalyticsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 p-6 sm:p-8"
            >
              <TaskAnalytics tasks={tasks} objectives={objectives} />
            </motion.div>
          )}
        </AnimatePresence>
      </BrutalistPanel>

      {/* Row 3: Bitácora de Alertas en Tiempo Real (COLLAPSIBLE) */}
      <BrutalistPanel accentColor={accentColorValue} borderColor="rgba(255,255,255,0.1)" corners="animated" cornerSize={8} cornerThickness={1} className="rounded-none overflow-hidden transition-all duration-300">
        <button
          onClick={() => setIsActivityOpen(!isActivityOpen)}
          className="w-full px-5 py-4 flex items-center justify-between bg-black/40 hover:bg-black/60 transition-colors text-left"
        >
          <span className="flex items-center gap-3 text-[10px] font-mono font-black uppercase tracking-[0.24em] text-white">
            <Activity size={14} className="stroke-[1.5]" style={{ color: accentColorValue }} />
            BITÁCORA DE ACTIVIDAD COMPARTIDA
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[7.5px] font-mono opacity-40 uppercase tracking-widest">{isActivityOpen ? 'Ocultar' : 'Mostrar'}</span>
            {isActivityOpen ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
          </div>
        </button>

        <AnimatePresence>
          {isActivityOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 p-6 sm:p-8"
            >
              <NotificationsFeed />
            </motion.div>
          )}
        </AnimatePresence>
      </BrutalistPanel>
    </motion.div>
  );
};
