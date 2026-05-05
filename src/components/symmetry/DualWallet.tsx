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
        <div className="space-y-4">
           <div className="space-y-1">
             <label className="text-[10px] font-display font-bold uppercase tracking-[0.15em] text-stone-500">
               Monto (COP)
             </label>
             <input
               type="number"
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               placeholder="0"
               className="w-full bg-surface-dim border border-white/10 px-4 py-3 text-sm font-display outline-none focus:border-user-a transition-colors placeholder:opacity-20"
             />
           </div>
           <div className="space-y-1">
             <label className="text-[10px] font-display font-bold uppercase tracking-[0.15em] text-stone-500">
               Descripción
             </label>
             <input
               type="text"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="REGISTRO_FLUJO"
               className="w-full bg-surface-dim border border-white/10 px-4 py-3 text-sm font-display uppercase outline-none focus:border-user-a transition-colors placeholder:opacity-20"
             />
           </div>
        </div>
        <div className="space-y-4 flex flex-col justify-end">
           <div className="space-y-1">
             <label className="text-[10px] font-display font-bold uppercase tracking-[0.15em] text-stone-500">
               Categoría
             </label>
             <select
               value={category}
               onChange={(e) => setCategory(e.target.value as Allocation['category'])}
               className="w-full bg-surface-dim border border-white/10 px-4 py-3 text-sm font-display outline-none focus:border-user-a transition-colors"
             >
               {CATEGORIES.map(cat => (
                 <option key={cat} value={cat}>{cat}</option>
               ))}
             </select>
           </div>
           <motion.button
             whileTap={{ scale: 0.98 }}
             onClick={addAllocation}
             className="w-full bg-user-a text-black py-4 uppercase text-[12px] font-display font-black tracking-[0.2em] flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(255,112,32,0.4)] transition-all"
           >
             <Plus size={16} strokeWidth={3} /> Registrar Operación
           </motion.button>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence>
          {allocations.map((alloc) => (
            <motion.div
              key={alloc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between p-4 border border-white/5 bg-surface-dim/50 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-user-a opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col">
                <span className="text-[11px] font-display font-black uppercase tracking-wider text-stone-200">
                  {alloc.description}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] font-display font-bold uppercase tracking-widest text-stone-500 bg-white/5 px-2 py-0.5 border border-white/10">
                    {alloc.category}
                  </span>
                  <span className="text-[8px] font-display uppercase tracking-widest text-stone-600">
                    {new Date(alloc.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm font-display font-black tracking-tighter text-user-a">
                  {formatCOP(alloc.amount)}
                </span>
                <button
                  onClick={() => deleteAllocation(alloc.id)}
                  className="text-stone-700 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
