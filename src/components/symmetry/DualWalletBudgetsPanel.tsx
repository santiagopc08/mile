import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Target, ChevronDown, ChevronRight } from 'lucide-react';
import { BrutalistPanel } from '@/components/ui/BrutalistPanel';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import { BudgetCategory, formatCOP, compactCOP, t, ChunkedProgress } from './DualWalletShared';

interface DualWalletBudgetsPanelProps {
  accentHex: string;
  isBudgetsOpen: boolean;
  setIsBudgetsOpen: (value: boolean) => void;
  isEditingBudgets: boolean;
  setIsEditingBudgets: (value: boolean) => void;
  budgetRows: Array<{
    budget: BudgetCategory;
    spent: number;
    limit: number;
    remaining: number;
    percent: number;
    status: string;
    color: string;
  }>;
  budgets: Record<BudgetCategory, number>;
  handleUpdateBudget: (categoryName: BudgetCategory, value: number) => void;
}

export const DualWalletBudgetsPanel: React.FC<DualWalletBudgetsPanelProps> = ({
  accentHex,
  isBudgetsOpen,
  setIsBudgetsOpen,
  isEditingBudgets,
  setIsEditingBudgets,
  budgetRows,
  budgets,
  handleUpdateBudget,
}) => {
  return (
    <BrutalistPanel accentColor={accentHex} borderColor="rgba(255,255,255,0.1)" corners="animated" cornerSize={8} cornerThickness={1} className="rounded-none overflow-hidden transition-all duration-300">
      <button
        onClick={() => {
          setIsBudgetsOpen(!isBudgetsOpen);
          sound.playTick();
          haptics.triggerTick();
        }}
        className="w-full px-5 py-4 flex items-center justify-between bg-black/40 hover:bg-black/60 transition-colors text-left"
      >
        <span className="flex items-center gap-3 text-[10px] font-mono font-black uppercase tracking-[0.24em] text-white">
          <Target size={14} className="stroke-[1.5]" style={{ color: accentHex }} />
          PRESUPUESTOS Y LÍMITES DE GASTOS
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[7.5px] font-mono opacity-40 uppercase tracking-widest">{isBudgetsOpen ? 'Ocultar' : 'Mostrar'}</span>
          {isBudgetsOpen ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
        </div>
      </button>

      <AnimatePresence>
        {isBudgetsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 p-4"
          >
            <h3 className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 text-[10px] font-mono font-black uppercase tracking-[0.22em] text-[#a88a7e]">
              <span className="flex items-center gap-2 font-mono">
                Presupuestos de Gastos
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsEditingBudgets(!isEditingBudgets);
                  if (isEditingBudgets) {
                    sound.playSave();
                    haptics.triggerSave();
                  } else {
                    sound.playTick();
                    haptics.triggerTick();
                  }
                }}
                className="ml-2 border border-white/10 bg-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#a88a7e] hover:border-white/30 hover:text-white"
                style={isEditingBudgets ? { borderColor: accentHex, color: accentHex } : undefined}
              >
                {isEditingBudgets ? 'Listo' : 'Editar Presupuestos'}
              </button>
            </h3>
            <div className="grid gap-2 md:grid-cols-2">
              {budgetRows.map((row) => (
                <div key={row.budget} className="border border-white/10 bg-black/40 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">{t(row.budget)}</span>
                    <span className="border px-1.5 py-1 text-[7px] font-black uppercase tracking-[0.14em]" style={{ borderColor: row.color, color: row.color }}>
                      Estado: {row.status === 'OVERLOAD' ? 'LÍMITE EXCEDIDO' : row.status === 'CAUTION' ? 'ATENCIÓN' : 'ESTABLE'}
                    </span>
                  </div>
                  <ChunkedProgress value={row.percent} color={row.color} />
                  <div className="mt-2 flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.16em] text-[#a88a7e]">
                    <span className="flex items-center gap-1">
                      {compactCOP(row.spent)} /{' '}
                      {isEditingBudgets ? (
                        <input
                          type="number"
                          value={budgets[row.budget] ?? row.limit}
                          onChange={(e) => handleUpdateBudget(row.budget, parseFloat(e.target.value) || 0)}
                          className="w-16 bg-black border border-white/20 px-1 py-0.5 text-[8px] font-bold text-white outline-none focus:border-white/50"
                          min="0"
                        />
                      ) : (
                        <span>{compactCOP(row.limit)}</span>
                      )}
                    </span>
                    <span>{formatCOP(row.remaining)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BrutalistPanel>
  );
};
