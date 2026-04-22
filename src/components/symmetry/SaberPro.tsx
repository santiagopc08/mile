'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correct: number;
}

const FALLBACK_QUESTIONS: Question[] = [
  {
    question: "What is the primary goal of symmetrical architecture in software design?",
    options: ["Performance optimization", "Code reusability", "Predictable state distribution", "Visual aesthetics"],
    correct: 2
  },
  {
    question: "In nursing, which process ensures systemic symmetry in patient care monitoring?",
    options: ["Triage", "The Nursing Process (ADPIE)", "Medication administration", "Shift reporting"],
    correct: 1
  },
  {
    question: "Which data structure is naturally balanced to maintain operational symmetry?",
    options: ["Linked List", "Red-Black Tree", "Stack", "Queue"],
    correct: 1
  },
  {
    question: "The 'Symmetry Shield' in our OS represents what core value?",
    options: ["Financial wealth", "System structural integrity", "User popularity", "Data storage"],
    correct: 1
  },
  {
    question: "Minimalist Brutalism in UI design emphasizes which of the following?",
    options: ["Complex animations", "Raw structural elements", "Pastel color palettes", "Rounded corners"],
    correct: 1
  }
];

export const SaberPro = ({ onCorrectAnswer }: { onCorrectAnswer: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const fetchQuestion = async () => {
    setLoading(true);
    setFeedback(null);
    setSelected(null);

    try {
      // Mocking HF call for now, using fallback as base
      // Actual implementation would use a fetch to HF Inference API
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
    if (idx === question?.correct) {
      setFeedback('correct');
      onCorrectAnswer();
    } else {
      setFeedback('wrong');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Brain size={16} className="text-user-a" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Academic Engine</span>
         </div>
         <motion.button
           whileTap={{ scale: 0.95 }}
           onClick={fetchQuestion}
           disabled={loading}
           className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
         >
           <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
         </motion.button>
      </div>

      <div className="min-h-[160px] flex flex-col justify-center">
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
              Generate Intelligence Challenge
            </motion.button>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-2"
            >
              <div className="text-[10px] uppercase tracking-[0.3em] animate-pulse">Inference in progress...</div>
            </motion.div>
          ) : question ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-[11px] font-bold uppercase leading-relaxed text-stone-700 dark:text-stone-300">
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
                        : 'border-stone-100 dark:border-stone-900 hover:border-user-a'
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
            className={`flex items-center gap-2 p-2 text-[10px] uppercase font-bold tracking-widest ${
              feedback === 'correct' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {feedback === 'correct' ? (
              <><CheckCircle2 size={14} /> Cognitive alignment achieved +5% Academic</>
            ) : (
              <><AlertCircle size={14} /> Structural inconsistency detected</>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
