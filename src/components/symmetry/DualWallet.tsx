'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Wallet, Tag, FileText } from 'lucide-react';

interface Allocation {
  id: string;
  amount: number;
  description: string;
  category: '🎓 ACADÉMICO' | '🐾 VETERINARIA' | '🏠 VIVIENDA' | '🏦 RESERVA' | '🍎 SUMINISTROS' | '📦 OTROS';
  date: string;
}

const CATEGORIES = [
  '🎓 ACADÉMICO',
  '🐾 VETERINARIA',
  '🏠 VIVIENDA',
  '🏦 RESERVA',
  '🍎 SUMINISTROS',
  '📦 OTROS'
] as const;

export const DualWallet = ({ allocations, onAllocationsChange }: { allocations: Allocation[], onAllocationsChange: (newAllocations: Allocation[]) => void }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Allocation['category']>('📦 OTROS');

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
    <div className="space-y-6 font-mono">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[7px] uppercase font-bold text-stone-500 tracking-widest flex items-center gap-1">
              <Wallet size={8} /> VALOR_TRANSACCIÓN (COP)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-black border border-white/10 px-3 py-2 text-xs uppercase outline-none focus:border-user-a transition-colors text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[7px] uppercase font-bold text-stone-500 tracking-widest flex items-center gap-1">
              <FileText size={8} /> CONCEPTO_MOVIMIENTO
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="DESCRIPCIÓN"
              className="w-full bg-black border border-white/10 px-3 py-2 text-xs uppercase outline-none focus:border-user-a transition-colors text-white"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[7px] uppercase font-bold text-stone-500 tracking-widest flex items-center gap-1">
              <Tag size={8} /> CATEGORÍA_LOG
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Allocation['category'])}
              className="w-full bg-black border border-white/10 px-3 py-2 text-xs outline-none focus:border-user-a transition-colors text-stone-300 appearance-none cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-stone-900">{cat}</option>
              ))}
            </select>
          </div>
          <div className="pt-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={addAllocation}
              className="w-full bg-user-a text-black py-3 uppercase text-[10px] font-black tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#ffb595] transition-colors border border-user-a"
              style={{ boxShadow: '0 0 15px rgba(255, 112, 32, 0.15)' }}
            >
              <Plus size={14} /> [ REGISTRAR_DATA ]
            </motion.button>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2 border-t border-white/5 pt-4">
        <AnimatePresence mode="popLayout">
          {allocations.map((alloc) => (
            <motion.div
              key={alloc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between p-3 border border-white/5 bg-[#0a0a0a] group hover:border-white/20 transition-all relative"
            >
              <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-stone-700" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white">
                  {alloc.description}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[7px] uppercase font-bold px-1.5 py-0.5 border border-stone-800 text-stone-500 bg-stone-900/50">
                    {alloc.category}
                  </span>
                  <span className="text-[7px] uppercase tracking-widest text-stone-600">
                    {new Date(alloc.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-bold text-user-a tabular-nums">
                  {formatCOP(alloc.amount)}
                </span>
                <button
                  onClick={() => deleteAllocation(alloc.id)}
                  className="p-1.5 text-stone-700 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-40 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

