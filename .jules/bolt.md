## 2024-05-18 - Identical Expensive Derived State in DualWallet.tsx
**Learning:** Found a specific bottleneck where `spentAgainstBudget` and `expensesThisMonth` in `DualWallet.tsx` were performing the exact same expensive array reduce operations on every render.
**Action:** Re-used `expensesThisMonth` for `spentAgainstBudget` and wrapped other expensive derived calculations (`budgetRows`, `topCategories`, etc.) in `useMemo` hooks.
## 2024-05-31 - Optimize data synchronization loops in storeService.ts
**Learning:** Found an `O(N^2)` performance bottleneck where multiple `.filter()` and `.includes()` array methods were being used inside loops and `.map()` calls within `storeService.ts` for mapping relational data (like comments for tracks, or contributions for wishlist items). This was causing unnecessary array scans.
**Action:** Replaced nested array scans with dictionary lookups (hash maps) by pre-computing mappings via `Array.reduce()` and replaced `.includes()` with constant-time `.has()` checks using `Set`. This reduced the operation time drastically, transforming quadratic operations to linear operations.
