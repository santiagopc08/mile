'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';

interface Allocation {
  id: string;
  amount: number;
  description: string;
  category: '💻 Ingeniería/Estudio' | '🐶 Mascotas' | '🏡 Hogar' | '📈 Inversiones/Ahorro' | '🍔 Alimentación' | '🎲 Otros';
  date: string;
}

const CATEGORIES = [
  '💻 Ingeniería/Estudio',
  '🐶 Mascotas',
  '🏡 Hogar',
  '📈 Inversiones/Ahorro',
  '🍔 Alimentación',
  '🎲 Otros'
] as const;

export const DualWallet = ({ allocations, onAllocationsChange }: { allocations: Allocation[], onAllocationsChange: (newAllocations: Allocation[]) => void }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Allocation['category']>('🎲 Otros');

  const addAllocation = () => {
    if (!amount || !description) return;
    const newAllocation: Allocation = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description,
      category,
      date: new Date().toISOString(),
    };
    onAllocationsChange([newAllocation, ...allocations]);
    setAmount('');
    setDescription('');
  };

  const deleteAllocation = (id: string) => {
    onAllocationsChange(allocations.filter(e => e.id !== id));
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
           <input
             type="number"
             value={amount}
             onChange={(e) => setAmount(e.target.value)}
             placeholder="Monto (COP)"
             className="w-full bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-xs uppercase tracking-widest outline-none focus:border-user-a transition-colors"
           />
           <input
             type="text"
             value={description}
             onChange={(e) => setDescription(e.target.value)}
             placeholder="Descripción"
             className="w-full bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-xs uppercase tracking-widest outline-none focus:border-user-a transition-colors"
           />
        </div>
        <div className="space-y-2">
           <select
             value={category}
             onChange={(e) => setCategory(e.target.value as Allocation['category'])}
             className="w-full bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-xs tracking-widest outline-none focus:border-user-a transition-colors"
           >
             {CATEGORIES.map(cat => (
               <option key={cat} value={cat}>{cat}</option>
             ))}
           </select>
           <motion.button
             whileTap={{ scale: 0.95 }}
             onClick={addAllocation}
             className="w-full bg-stone-800 dark:bg-stone-200 text-white dark:text-black py-2 uppercase text-[10px] font-bold tracking-[0.2em] flex items-center justify-center gap-2"
           >
             <Plus size={14} /> Registrar Asignación
           </motion.button>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence>
          {allocations.map((alloc) => (
            <motion.div
              key={alloc.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between p-3 border border-stone-100 dark:border-stone-900 group"
            >
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-800 dark:text-stone-200">
                  {alloc.description}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-stone-400">
                  {alloc.category} • {new Date(alloc.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono font-bold text-user-a">
                  {formatCOP(alloc.amount)}
                </span>
                <button
                  onClick={() => deleteAllocation(alloc.id)}
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
