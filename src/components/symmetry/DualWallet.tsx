'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { FinancialMovement, BudgetCategory, DEFAULT_BUDGETS, BUDGET_CATEGORIES, normalizeCategory, inferType, signedAmount, isThisMonth, isWithinDays } from './DualWalletShared';
import { DualWalletForm } from './DualWalletForm';
import { DualWalletHistory } from './DualWalletHistory';
import { DualWalletMetrics } from './DualWalletMetrics';
import { DualWalletBudgetsPanel } from './DualWalletBudgetsPanel';
import { DualWalletIncomePanel } from './DualWalletIncomePanel';
import { DualWalletHabitsPanel } from './DualWalletHabitsPanel';

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

<DualWalletBudgetsPanel
  accentHex={accentHex}
  isBudgetsOpen={isBudgetsOpen}
  setIsBudgetsOpen={setIsBudgetsOpen}
  isEditingBudgets={isEditingBudgets}
  setIsEditingBudgets={setIsEditingBudgets}
  budgetRows={budgetRows}
  budgets={budgets}
  handleUpdateBudget={handleUpdateBudget}
/>

<DualWalletIncomePanel
  accentHex={accentHex}
  isIncomeOpen={isIncomeOpen}
  setIsIncomeOpen={setIsIncomeOpen}
  recurringIncome={recurringIncome}
  projectedIncome={projectedIncome}
  savingsRate={savingsRate}
/>

<DualWalletHabitsPanel
  accentHex={accentHex}
  isHabitsOpen={isHabitsOpen}
  setIsHabitsOpen={setIsHabitsOpen}
  weeklySpending={weeklySpending}
  averageDailySpending={averageDailySpending}
  savingsRate={savingsRate}
  wishlistAffordability={wishlistAffordability}
  topCategories={topCategories}
  foodDelta={foodDelta}
  budgetRemaining={budgetRemaining}
/>

<DualWalletHistory movements={movements} deleteMovement={deleteMovement} />
    </div>
  );
};
