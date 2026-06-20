'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Target,

  ChevronDown,
  ChevronRight,
  CircleDollarSign,
} from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import { FinancialMovement, BudgetCategory, DEFAULT_BUDGETS, BUDGET_CATEGORIES, formatCOP, compactCOP, t, normalizeCategory, inferType, signedAmount, isThisMonth, isWithinDays, MetricCell, ChunkedProgress } from './DualWalletShared';
import { DualWalletForm } from './DualWalletForm';
import { DualWalletHistory } from './DualWalletHistory';
import { DualWalletMetrics } from './DualWalletMetrics';

export const DualWallet = ({
  allocations,
  onAllocationsChange,
}: {
  allocations: FinancialMovement[];
  onAllocationsChange: (newAllocations: FinancialMovement[]) => void;
}) => {
  const { profile } = useProfile();
  const accentHex = profile === 'ella' ? '#ff4b89' : '#c3f400';

  // Budgets State
  const [budgets, setBudgets] = useState<Record<BudgetCategory, number>>(DEFAULT_BUDGETS);
  const [isEditingBudgets, setIsEditingBudgets] = useState(false);

  // Collapsible States
  const [isBudgetsOpen, setIsBudgetsOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isHabitsOpen, setIsHabitsOpen] = useState(false);

  // Sync budgets per profile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`symmetry_budgets_${profile}`);
      if (saved) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setBudgets(JSON.parse(saved));
        } catch (e) {
          console.error("Error loading budgets:", e);
          setBudgets(DEFAULT_BUDGETS);
        }
      } else {
        setBudgets(DEFAULT_BUDGETS);
      }
    }
  }, [profile]);

  const handleUpdateBudget = (categoryName: BudgetCategory, value: number) => {
    const next = { ...budgets, [categoryName]: value };
    setBudgets(next);
    localStorage.setItem(`symmetry_budgets_${profile}`, JSON.stringify(next));
  };

  const movements = useMemo(
    () => allocations.map((movement) => ({ ...movement, type: inferType(movement), amount: Math.abs(Number(movement.amount) || 0) })),
    [allocations]
  );

  // ⚡ Bolt Optimization: Replace O(N*M) budget filtering inside map and multiple O(N) array loops
  // with a single O(N) pass over movements. We pre-calculate totals and group expenses into a Map.
  const {
    incomeThisMonth,
    expensesThisMonth,
    savingsTotal,
    totalAvailable,
    weeklySpending,
    budgetExpensesMap
  } = useMemo(() => {
    const result = {
      incomeThisMonth: 0,
      expensesThisMonth: 0,
      savingsTotal: 0,
      totalAvailable: 0,
      weeklySpending: 0,
      budgetExpensesMap: new Map<string, number>()
    };

    for (const m of movements) {
      const isThisMonthDate = isThisMonth(m.date);
      const mAmount = m.amount;
      const mSignedAmount = signedAmount(m);
      const isExpense = m.type === 'expense';
      const isIncome = m.type === 'income';
      const normCat = normalizeCategory(m.category);

      // Accumulate totals across all movements
      result.totalAvailable += mSignedAmount;
      if (isIncome || normCat === 'Savings' || m.related_budget === 'Savings') {
        result.savingsTotal += mSignedAmount;
      }
      if (isExpense && isWithinDays(m.date, 7)) {
        result.weeklySpending += mAmount;
      }

      // Process monthly specific totals
      if (isThisMonthDate) {
        if (isIncome) {
          result.incomeThisMonth += mAmount;
        } else if (isExpense) {
          result.expensesThisMonth += mAmount;

          // Accumulate expenses for budget rows into an O(1) hash map.
          // Note: The original logic allowed matching either related_budget OR normalized category.
          // We must add the amount to both keys if they exist and are distinct to ensure accurate budget tracking.
          if (m.related_budget) {
            result.budgetExpensesMap.set(
              m.related_budget,
              (result.budgetExpensesMap.get(m.related_budget) || 0) + mAmount
            );
          }
          if (normCat && normCat !== m.related_budget) {
            result.budgetExpensesMap.set(
              normCat,
              (result.budgetExpensesMap.get(normCat) || 0) + mAmount
            );
          }
        }
      }
    }

    return result;
  }, [movements]);

  // ⚡ Bolt Optimization: Calculate total budget using a simple O(N) loop without intermediate array allocation
  const totalBudget = useMemo(() => {
    let sum = 0;
    for (const key in budgets) {
      sum += budgets[key as BudgetCategory];
    }
    return sum;
  }, [budgets]);
  const spentAgainstBudget = expensesThisMonth;
  const budgetRemaining = totalBudget - spentAgainstBudget;
  const savingsRate = incomeThisMonth > 0 ? ((incomeThisMonth - expensesThisMonth) / incomeThisMonth) * 100 : 0;
  const averageDailySpending = weeklySpending / 7;

  const { budgetRows, budgetRowsMap } = useMemo(() => {
    const rows = [];
    const map = new Map();
    for (const budget of BUDGET_CATEGORIES) {
      const spent = budgetExpensesMap.get(budget) || 0;
      const limit = budgets[budget];
      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      const status = percent >= 100 ? 'OVERLOAD' : percent >= 80 ? 'CAUTION' : 'STABLE';
      const color = status === 'OVERLOAD' ? '#ffb4ab' : status === 'CAUTION' ? '#a178ff' : '#c3f400';
      const row = { budget, spent, limit, remaining: limit - spent, percent, status, color };
      rows.push(row);
      map.set(budget, row);
    }
    return { budgetRows: rows, budgetRowsMap: map };
  }, [budgetExpensesMap, budgets]);

  // ⚡ Bolt Optimization: Filter before sort and slice to minimize intermediate operations
  const topCategories = useMemo(() => {
    const top = budgetRows
      .filter(row => row.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3);

    // Fallback to top 3 generic categories if no spending
    return top.length > 0 ? top : budgetRows.slice(0, 3);
  }, [budgetRows]);

  // ⚡ Bolt Optimization: Single O(N) pass to avoid intermediate array creation
  const recurringIncome = useMemo(() => {
    let sum = 0;
    for (const m of movements) {
      if (m.type === 'income' && m.recurring) sum += m.amount;
    }
    return sum;
  }, [movements]);
  const projectedIncome = incomeThisMonth + recurringIncome;
  const wishlistBudget = budgetRowsMap.get('Wishlist');
  const wishlistAffordability = Math.max(0, Math.min(wishlistBudget?.remaining || 0, Math.max(totalAvailable, 0) * 0.18));
  const foodSpent = budgetRowsMap.get('Food')?.spent || 0;
  const foodBaseline = budgets.Food * 0.32;
  const foodDelta = foodBaseline > 0 ? ((foodSpent - foodBaseline) / foodBaseline) * 100 : 0;
  const balanceTone = totalAvailable < 0 ? '#ffb4ab' : '#c3f400';


  const deleteMovement = (id: string) => {
    onAllocationsChange(allocations.filter((movement) => movement.id !== id));
  };


  return (
    <div className="space-y-6 font-mono">
<DualWalletMetrics totalAvailable={totalAvailable} incomeThisMonth={incomeThisMonth} expensesThisMonth={expensesThisMonth} savingsTotal={savingsTotal} budgetRemaining={budgetRemaining} balanceTone={balanceTone} accentHex={accentHex} />

<DualWalletForm onAllocationsChange={onAllocationsChange} allocations={allocations} />

      {/* budgets (COLLAPSIBLE) */}
      <div className="border border-white/10 bg-[#0a0a0a] rounded-none overflow-hidden transition-all duration-300 relative">
        <AnimatedBrutalistCorners color={accentHex} size={8} thickness={1} />
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
      </div>

      {/* income (COLLAPSIBLE) */}
      <div className="border border-white/10 bg-[#0a0a0a] rounded-none overflow-hidden transition-all duration-300 relative">
        <AnimatedBrutalistCorners color={accentHex} size={8} thickness={1} />
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
      </div>

      {/* habits & alerts (COLLAPSIBLE) */}
      <div className="border border-white/10 bg-[#0a0a0a] rounded-none overflow-hidden transition-all duration-300 relative">
        <AnimatedBrutalistCorners color={accentHex} size={8} thickness={1} />
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
      </div>

<DualWalletHistory movements={movements} deleteMovement={deleteMovement} />
    </div>
  );
};
