import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleDollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { BrutalistPanel } from '@/components/ui/BrutalistPanel';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import { formatCOP, MetricCell } from './DualWalletShared';

interface DualWalletIncomePanelProps {
  accentHex: string;
  isIncomeOpen: boolean;
  setIsIncomeOpen: (value: boolean) => void;
  recurringIncome: number;
  projectedIncome: number;
  savingsRate: number;
}

export const DualWalletIncomePanel: React.FC<DualWalletIncomePanelProps> = ({
  accentHex,
  isIncomeOpen,
  setIsIncomeOpen,
  recurringIncome,
  projectedIncome,
  savingsRate,
}) => {
  return (
    <BrutalistPanel accentColor={accentHex} borderColor="rgba(255,255,255,0.1)" corners="animated" cornerSize={8} cornerThickness={1} className="rounded-none overflow-hidden transition-all duration-300">
      <button
        onClick={() => {
          setIsIncomeOpen(!isIncomeOpen);
          sound.playTick();
          haptics.triggerTick();
        }}
        className="w-full px-5 py-4 flex items-center justify-between bg-black/40 hover:bg-black/60 transition-colors text-left"
      >
        <span className="flex items-center gap-3 text-[10px] font-mono font-black uppercase tracking-[0.24em] text-white">
          <CircleDollarSign size={14} className="stroke-[1.5]" style={{ color: accentHex }} />
          INGRESOS Y PROYECCIONES MENSUALES
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[7.5px] font-mono opacity-40 uppercase tracking-widest">{isIncomeOpen ? 'Ocultar' : 'Mostrar'}</span>
          {isIncomeOpen ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
        </div>
      </button>

      <AnimatePresence>
        {isIncomeOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 p-4"
          >
            <div className="grid gap-2 sm:grid-cols-3">
              <MetricCell label="Ingreso Recurrente" value={formatCOP(recurringIncome)} tone="#c3f400" />
              <MetricCell label="Proyección de Ingresos" value={formatCOP(projectedIncome)} tone="#a178ff" />
              <MetricCell label="Comparación Mensual" value={`${savingsRate.toFixed(1)}% tasa de ahorro`} tone={savingsRate >= 0 ? '#c3f400' : '#ffb4ab'} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BrutalistPanel>
  );
};
