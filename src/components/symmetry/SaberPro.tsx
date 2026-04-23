'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, RefreshCw, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correct: number;
}

const FALLBACK_QUESTIONS: Question[] = [
  {
    question: "Dentro de la arquitectura simétrica, ¿cuál es el objetivo principal del equilibrio estructural?",
    options: ["Optimización de rendimiento bruto", "Reutilización extrema de código", "Estabilidad predictiva del sistema", "Estética visual"],
    correct: 2
  },
  {
    question: "En enfermería, ¿qué proceso asegura un monitoreo sistémico continuo y eficiente?",
    options: ["Tratamiento aislado", "Proceso de Atención de Enfermería (PAE)", "Administración de medicamentos", "Informes verbales"],
    correct: 1
  },
  {
    question: "En la gestión financiera, una 'asignación' hace referencia a:",
    options: ["Un gasto innecesario", "Distribución deliberada de recursos", "Un préstamo bancario", "Ahorro inactivo"],
    correct: 1
  }
];

export const SaberPro = ({ onCorrectAnswer }: { onCorrectAnswer: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const [competency, setCompetency] = useState('Mixto');
  const [focus, setFocus] = useState('General');
  const [numQuestions, setNumQuestions] = useState(1);
  
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  const fetchQuestion = async () => {
    setLoading(true);
    setFeedback(null);
    setSelected(null);

    try {
      await new Promise(r => setTimeout(r, 800));
      const randomQ = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
      setQuestion(randomQ);
    } catch (e) {
      setQuestion(FALLBACK_QUESTIONS[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (feedback) return;
    setSelected(idx);
    
    setStats(prev => ({ ...prev, total: prev.total + 1 }));
    
    if (idx === question?.correct) {
      setFeedback('correct');
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      onCorrectAnswer();
    } else {
      setFeedback('wrong');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 border-b border-stone-200 dark:border-stone-800 pb-2">
         <div className="flex items-center gap-2">
            <Brain size={16} className="text-user-a" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-600">Configuración Engine</span>
         </div>
         <div className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-[0.2em] text-user-a border border-user-a/20 px-2 py-1 bg-user-a/5">
            <TrendingUp size={12} />
            {stats.total > 0 ? `${Math.round((stats.correct / stats.total) * 100)}% (${stats.correct}/${stats.total})` : '0% (0/0)'}
         </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
         <select value={competency} onChange={e => setCompetency(e.target.value)} className="bg-transparent border border-stone-200 dark:border-stone-800 px-2 py-1 flex-1 text-[9px] uppercase tracking-widest text-stone-500 outline-none">
            <option>Matemáticas</option>
            <option>Lectura Crítica</option>
            <option>Inglés</option>
            <option>Copetencias Ciudadanas</option>
            <option>Mixto</option>
         </select>
         <select value={focus} onChange={e => setFocus(e.target.value)} className="bg-transparent border border-stone-200 dark:border-stone-800 px-2 py-1 flex-1 text-[9px] uppercase tracking-widest text-stone-500 outline-none">
            <option>Enfermería</option>
            <option>Ingeniería de Sistemas</option>
            <option>General</option>
         </select>
         <input type="number" min={1} max={5} value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))} className="bg-transparent border border-stone-200 dark:border-stone-800 px-2 py-1 w-full text-[9px] uppercase tracking-widest text-stone-500 outline-none max-w-[80px]" title="Cantidad (1-5)" />
      </div>

      <div className="min-h-[160px] flex flex-col justify-center mt-4">
        <AnimatePresence mode="wait">
          {!question && !loading ? (
            <motion.button
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={fetchQuestion}
              className="w-full h-24 border border-dashed border-stone-200 dark:border-stone-800 text-[10px] uppercase tracking-widest text-stone-500 hover:border-user-a hover:text-user-a transition-all"
            >
              Generar Desafío Intelectual
            </motion.button>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-2 py-8"
            >
              <RefreshCw size={24} className="animate-spin text-user-a mx-auto" />
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-500">Inferencia en progreso...</div>
            </motion.div>
          ) : question ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 geometric-card p-4 bg-white/5 border-stone-200 dark:border-stone-800"
            >
              <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-900 pb-2 mb-2">
                 <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-user-a">{focus} • {competency}</span>
                 <motion.button onClick={fetchQuestion} className="text-stone-400 hover:text-user-a" title="Re-generar">
                   <RefreshCw size={12} />
                 </motion.button>
              </div>
              <p className="text-[11px] font-bold uppercase leading-relaxed text-stone-800 dark:text-stone-200">
                {question.question}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {question.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={feedback !== null}
                    className={`text-left px-3 py-2 text-[10px] uppercase tracking-wider border transition-all ${
                      selected === i
                        ? (feedback === 'correct' ? 'border-green-500 bg-green-500/5 text-green-500' : 'border-red-500 bg-red-500/5 text-red-500')
                        : 'border-stone-100 dark:border-stone-900 hover:border-user-a text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`flex items-center gap-2 p-2 mt-2 text-[10px] uppercase font-bold tracking-widest ${
              feedback === 'correct' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
            }`}
          >
            {feedback === 'correct' ? (
              <><CheckCircle2 size={14} /> Alineación cognitiva lograda</>
            ) : (
              <><AlertCircle size={14} /> Inconsistencia estructural detectada</>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
