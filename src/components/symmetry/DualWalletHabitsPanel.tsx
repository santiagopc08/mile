import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { BrutalistPanel } from '@/components/ui/BrutalistPanel';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import { BudgetCategory, formatCOP, t, MetricCell } from './DualWalletShared';

interface DualWalletHabitsPanelProps {
  accentHex: string;
  isHabitsOpen: boolean;
  setIsHabitsOpen: (value: boolean) => void;
  weeklySpending: number;
  averageDailySpending: number;
  savingsRate: number;
  wishlistAffordability: number;
  topCategories: Array<{
    budget: BudgetCategory;
    spent: number;
    color: string;
  }>;
  foodDelta: number;
  budgetRemaining: number;
}

export const DualWalletHabitsPanel: React.FC<DualWalletHabitsPanelProps> = ({
  accentHex,
  isHabitsOpen,
  setIsHabitsOpen,
  weeklySpending,
  averageDailySpending,
  savingsRate,
  wishlistAffordability,
  topCategories,
  foodDelta,
  budgetRemaining,
}) => {
  return (
    <BrutalistPanel accentColor={accentHex} borderColor="rgba(255,255,255,0.1)" corners="animated" cornerSize={8} cornerThickness={1} className="rounded-none overflow-hidden transition-all duration-300">
      <button
        onClick={() => {
          setIsHabitsOpen(!isHabitsOpen);
          sound.playTick();
          haptics.triggerTick();
        }}
        className="w-full px-5 py-4 flex items-center justify-between bg-black/40 hover:bg-black/60 transition-colors text-left"
      >
        <span className="flex items-center gap-3 text-[10px] font-mono font-black uppercase tracking-[0.24em] text-white">
          <Activity size={14} className="stroke-[1.5]" style={{ color: accentHex }} />
          ANÁLISIS DE HÁBITOS, ALERTAS Y SUGERENCIAS
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[7.5px] font-mono opacity-40 uppercase tracking-widest">{isHabitsOpen ? 'Ocultar' : 'Mostrar'}</span>
          {isHabitsOpen ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
        </div>
      </button>

      <AnimatePresence>
        {isHabitsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 p-4"
          >
            <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
              <div className="border border-white/10 bg-black/20 p-4">
                <h4 className="mb-4 border-b border-white/10 pb-3 text-[10px] font-mono font-black uppercase tracking-[0.22em] text-[#a88a7e]">
                  Resumen de Hábitos
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <MetricCell label="Gasto de esta semana" value={formatCOP(weeklySpending)} tone="#ffb4ab" />
                  <MetricCell label="Gasto promedio diario" value={formatCOP(averageDailySpending)} tone="#ffffff" />
                  <MetricCell label="Capacidad de ahorro" value={`${savingsRate.toFixed(1)}%`} tone={savingsRate >= 0 ? '#c3f400' : '#ffb4ab'} />
                  <MetricCell label="Disponible para antojos" value={formatCOP(wishlistAffordability)} tone="#a178ff" />
                </div>
                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e]">En qué gastamos más</p>
                  <div className="space-y-2">
                    {topCategories.map((row) => (
                      <div key={row.budget} className="flex items-center justify-between border border-white/10 bg-black/40 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em]">
                        <span>{t(row.budget)}</span>
                        <span style={{ color: row.color }}>{formatCOP(row.spent)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <h4 className="mb-4 border-b border-white/10 pb-3 text-[10px] font-mono font-black uppercase tracking-[0.22em] text-[#a88a7e]">
                  Sugerencias y Alertas
                </h4>
                <div className="space-y-2">
                  <div className="border border-user-b/30 bg-user-b/5 p-3 text-[10px] font-bold uppercase leading-5 tracking-[0.14em] text-user-b">
                    Puedes destinar de forma segura {formatCOP(wishlistAffordability)} a tus antojos esta semana.
                  </div>
                  <div className="border border-white/10 bg-black/40 p-3 text-[10px] font-bold uppercase leading-5 tracking-[0.14em] text-[#e1bfb2]">
                    Los gastos en comida han {foodDelta >= 0 ? 'aumentado' : 'disminuido'} un {Math.abs(foodDelta).toFixed(0)}% frente al presupuesto básico de este mes.
                  </div>
                  <div className="border border-user-c/30 bg-user-c/5 p-3 text-[10px] font-bold uppercase leading-5 tracking-[0.14em] text-[#d1bcff]">
                    Al ritmo de gasto actual, el dinero restante alcanzará para {budgetRemaining < 0 ? '0' : Math.max(0, Math.floor(budgetRemaining / Math.max(averageDailySpending, 1)))} días de gastos.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BrutalistPanel>
  );
};
