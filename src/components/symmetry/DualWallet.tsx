'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Wallet, Tag, FileText } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';

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
  const { profile } = useProfile();
  const accentColor = profile === 'ella' ? 'user-a' : 'user-b';
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
    <div className="space-y-6 border border-white/10 bg-black/40 p-4 font-mono">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest text-[#a88a7e]">
              <Wallet size={8} /> VALOR_TRANSACCIÓN (COP)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full border border-white/10 bg-black px-3 py-2 text-xs uppercase text-white outline-none transition-colors placeholder:text-[#594137] focus:border-${accentColor}`}
            />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest text-[#a88a7e]">
              <FileText size={8} /> CONCEPTO_MOVIMIENTO
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="DESCRIPCIÓN"
              className={`w-full border border-white/10 bg-black px-3 py-2 text-xs uppercase text-white outline-none transition-colors placeholder:text-[#594137] focus:border-${accentColor}`}
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest text-[#a88a7e]">
              <Tag size={8} /> CATEGORÍA_LOG
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Allocation['category'])}
              className={`w-full cursor-pointer appearance-none border border-white/10 bg-black px-3 py-2 text-xs text-[#e5e2e1] outline-none transition-colors focus:border-${accentColor}`}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-[#0a0a0a]">{cat}</option>
              ))}
            </select>
          </div>
          <div className="pt-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={addAllocation}
              className={`flex w-full items-center justify-center gap-2 border border-${accentColor} bg-${accentColor} py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:opacity-90`}
              style={{ boxShadow: `0 0 15px var(--color-${accentColor}-alpha, rgba(255, 112, 32, 0.15))` }}
            >
              <Plus size={14} /> [ REGISTRAR_DATA ]
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto border-t border-white/10 pt-4 pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {allocations.map((alloc) => (
            <motion.div
              key={alloc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`group relative flex items-center justify-between border border-white/10 bg-[#0a0a0a] p-3 transition-all hover:border-${accentColor}/60`}
            >
              <div className={`absolute left-0 top-0 h-1 w-1 border-l border-t border-${accentColor}`} />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white">
                  {alloc.description}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="border border-white/10 bg-black px-1.5 py-0.5 text-[7px] font-bold uppercase text-[#a88a7e]">
                    {alloc.category}
                  </span>
                  <span className="text-[7px] uppercase tracking-widest text-[#594137]">
                    {new Date(alloc.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-[11px] font-bold text-${accentColor} tabular-nums`}>
                  {formatCOP(alloc.amount)}
                </span>
                <button
                  onClick={() => deleteAllocation(alloc.id)}
                  className="p-1.5 text-[#594137] opacity-40 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
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
