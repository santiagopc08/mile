## 2024-05-18 - Identical Expensive Derived State in DualWallet.tsx
**Learning:** Found a specific bottleneck where `spentAgainstBudget` and `expensesThisMonth` in `DualWallet.tsx` were performing the exact same expensive array reduce operations on every render.
**Action:** Re-used `expensesThisMonth` for `spentAgainstBudget` and wrapped other expensive derived calculations (`budgetRows`, `topCategories`, etc.) in `useMemo` hooks.
