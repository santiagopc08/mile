'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: 'Engineering/Study' | 'Pets' | 'Home' | 'Investments' | 'Misc';
  date: string;
}

export const DualWallet = ({ onExpensesUpdate }: { onExpensesUpdate: (miscPercentage: number) => void }) => {
  const { profile } = useProfile();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Misc');

  const storageKey = profile === 'el' ? 'symmetry_A_expenses' : 'symmetry_B_expenses';

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setExpenses(JSON.parse(saved));
    else setExpenses([]);
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(expenses));

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const miscTotal = expenses.filter(e => e.category === 'Misc').reduce((sum, e) => sum + e.amount, 0);
    const miscPercent = total > 0 ? (miscTotal / total) * 100 : 0;

    onExpensesUpdate(miscPercent);
  }, [expenses, storageKey, onExpensesUpdate]);

  const addExpense = () => {
    if (!amount || !description) return;
    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description,
      category,
      date: new Date().toISOString(),
    };
    setExpenses([newExpense, ...expenses]);
    setAmount('');
    setDescription('');
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
           <input
             type="number"
             value={amount}
             onChange={(e) => setAmount(e.target.value)}
             placeholder="Amount"
             className="w-full bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-xs uppercase tracking-widest outline-none focus:border-user-a transition-colors"
           />
           <input
             type="text"
             value={description}
             onChange={(e) => setDescription(e.target.value)}
             placeholder="Description"
             className="w-full bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-xs uppercase tracking-widest outline-none focus:border-user-a transition-colors"
           />
        </div>
        <div className="space-y-2">
           <select
             value={category}
             onChange={(e) => setCategory(e.target.value as Expense['category'])}
             className="w-full bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-xs uppercase tracking-widest outline-none focus:border-user-a transition-colors"
           >
             <option value="Engineering/Study">Engineering/Study</option>
             <option value="Pets">Pets</option>
             <option value="Home">Home</option>
             <option value="Investments">Investments</option>
             <option value="Misc">Misc</option>
           </select>
           <motion.button
             whileTap={{ scale: 0.95 }}
             onClick={addExpense}
             className="w-full bg-stone-800 dark:bg-stone-200 text-white dark:text-black py-2 uppercase text-[10px] font-bold tracking-[0.2em] flex items-center justify-center gap-2"
           >
             <Plus size={14} /> Commit Entry
           </motion.button>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence>
          {expenses.map((exp) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between p-3 border border-stone-100 dark:border-stone-900 group"
            >
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-800 dark:text-stone-200">
                  {exp.description}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-stone-400">
                  {exp.category} • {new Date(exp.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono font-bold text-user-a">
                  ${exp.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => deleteExpense(exp.id)}
                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
