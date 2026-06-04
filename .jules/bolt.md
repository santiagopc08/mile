## 2024-05-18 - Identical Expensive Derived State in DualWallet.tsx
**Learning:** Found a specific bottleneck where `spentAgainstBudget` and `expensesThisMonth` in `DualWallet.tsx` were performing the exact same expensive array reduce operations on every render.
**Action:** Re-used `expensesThisMonth` for `spentAgainstBudget` and wrapped other expensive derived calculations (`budgetRows`, `topCategories`, etc.) in `useMemo` hooks.
## 2024-05-31 - Optimize data synchronization loops in storeService.ts
**Learning:** Found an `O(N^2)` performance bottleneck where multiple `.filter()` and `.includes()` array methods were being used inside loops and `.map()` calls within `storeService.ts` for mapping relational data (like comments for tracks, or contributions for wishlist items). This was causing unnecessary array scans.
**Action:** Replaced nested array scans with dictionary lookups (hash maps) by pre-computing mappings via `Array.reduce()` and replaced `.includes()` with constant-time `.has()` checks using `Set`. This reduced the operation time drastically, transforming quadratic operations to linear operations.

## 2024-05-18 - Identical Expensive Derived State in DualWallet.tsx
**Learning:** Found a specific bottleneck where \`spentAgainstBudget\` and \`expensesThisMonth\` in \`DualWallet.tsx\` were performing the exact same expensive array reduce operations on every render.
**Action:** Re-used \`expensesThisMonth\` for \`spentAgainstBudget\` and wrapped other expensive derived calculations (\`budgetRows\`, \`topCategories\`, etc.) in \`useMemo\` hooks.

## 2024-05-31 - Optimize data synchronization loops in storeService.ts
**Learning:** Found an \`O(N^2)\` performance bottleneck where multiple \`.filter()\` and \`.includes()\` array methods were being used inside loops and \`.map()\` calls within \`storeService.ts\` for mapping relational data (like comments for tracks, or contributions for wishlist items). This was causing unnecessary array scans.
**Action:** Replaced nested array scans with dictionary lookups (hash maps) by pre-computing mappings via \`Array.reduce()\` and replaced \`.includes()\` with constant-time \`.has()\` checks using \`Set\`. This reduced the operation time drastically, transforming quadratic operations to linear operations.

## 2024-06-01 - Avoid Nested Array Scans in Render/Mapping Loops
**Learning:** Discovered O(N*M) calculation bottlenecks in \`TaskModule.tsx\` and \`TaskAnalytics.tsx\` where nested array methods (\`.filter\` and \`.reduce\`) were used inside mapping functions across large datasets on every render.
**Action:** Pre-calculated the grouped stats in a single O(N) pass using a \`Map\` wrapped in a \`useMemo\` hook, eliminating nested loops entirely and significantly boosting render performance.
## 2024-06-02 - Eliminate Redundant Date Parsing and Nested Array Scans in FinanceChart
**Learning:** `FinanceChart.tsx` exhibited a hidden O(D*N) performance bottleneck inside a `useMemo` hook. For each chart day (D=7), the code iterated over the full `allocations` arrays and repeatedly executed `new Date(e.date).toLocaleDateString()` for every element. This caused massive redundant object instantiation and string formatting overhead, especially as the allocations array grows.
**Action:** Transformed the approach into O(D+N) by pre-calculating the 7 target dates into an O(1) hash map `Map<string, Stats>`, parsing each `allocation`'s date strictly *once* in a single pass, and mutating the hash map values directly before returning the array. Always prioritize single-pass aggregations with maps over nested array filtering when deriving chart data.
## 2024-06-03 - Eliminate Redundant Date Parsing and Nested Array Scans in TaskStatsChart
**Learning:** `TaskStatsChart.tsx` exhibited an O(D * N * M) performance bottleneck inside a `useMemo` hook. For each chart day (D=7), the code iterated over the full `tasks` array and repeatedly executed `new Date(t.updated_at).toLocaleDateString()`. For each matching task, it then scanned the `objectives` array (M) using `.find` to match authors. This caused severe redundant object instantiation and nested looping overhead.
**Action:** Transformed the approach into O(D + M + N) by pre-calculating the 7 target dates into an O(1) hash map, pre-calculating an `objectiveAuthorMap` mapping IDs to authors, and parsing each task's date strictly *once* in a single pass to increment counters in the hash map directly.
