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
## 2024-06-04 - Eliminate Nested Array Iterations in MovementTracker
**Learning:** `MovementTracker.tsx` had multiple O(4*N) performance bottlenecks within `weeklyStats` and `painAnalytics` `useMemo` hooks. It was calling `.filter()`, `.map()`, and `.reduce()` sequentially on the `sessions` array on every render, unnecessarily creating intermediate arrays and increasing GC pressure.
**Action:** Replaced sequential array operations with single-pass O(N) `for...of` loops. This consolidates data aggregation and condition checks, dramatically reducing overhead and improving render speeds without losing code readability.
## 2024-03-24 - DualWallet O(N*M) Budget Calculation Bottleneck
**Learning:** In the `DualWallet` component, filtering `monthMovements` inside a `.map()` over budget categories (`BUDGET_CATEGORIES.map(budget => monthMovements.filter(...))`) created an O(N*M) bottleneck. Furthermore, the logic allowed a movement to count towards a budget if either its `related_budget` OR its normalized category matched the budget name. When optimizing this into a single O(N) pass hash map, it's critical to add the amount to *both* keys in the map if they are distinct to prevent breaking the budget accumulation.
**Action:** Replace nested loops (filter/find inside map) with a single pass over the movements array to pre-calculate grouping maps, but carefully preserve the logical OR condition by independently setting values for multiple keys if necessary.
## 2026-06-06 - Eliminate Redundant Array Iterations in TaskAnalytics
**Learning:**  had multiple O(4*N) performance bottlenecks within its   block. It was calling , , and  sequentially on the  array on every render, unnecessarily creating intermediate arrays, taking O(N log N) time, and increasing GC pressure.
**Action:** Replaced sequential array operations and sorts with a single-pass O(N)  loop. This consolidates data aggregation and condition checks, dramatically reducing overhead and improving render speeds without losing code readability.
## 2024-06-05 - Eliminate Redundant Array Iterations in TaskAnalytics
**Learning:** `TaskAnalytics.tsx` had an O(N log N) + O(k*N) performance bottleneck within its `stats` `useMemo` block. It was calling `.reduce()`, `.filter()`, and `.sort()` sequentially on the `tasks` array on every render, unnecessarily creating intermediate arrays and increasing GC pressure.
**Action:** Replaced sequential array operations and sorting logic with a single-pass O(N) `for...of` loop. This consolidates data aggregation and condition checks, eliminating array spreads and extra iterations, thereby improving render speeds.
## 2024-06-06 - Eliminate Redundant Array Iterations in SavingsOverview
**Learning:** `SavingsOverview.tsx` had multiple O(k*N) performance bottlenecks within its `stats` `useMemo` block. It was calling `.filter()` and `.reduce()` sequentially on the `items` array on every render, unnecessarily creating intermediate arrays and increasing GC pressure.
**Action:** Replaced sequential array operations with a single-pass O(N) `for...of` loop. This consolidates data aggregation and condition checks, eliminating array spreads and extra iterations, thereby improving render speeds.
## 2024-06-07 - Eliminate O(C*N) Render Loops in TaskModule Kanban Columns
**Learning:** `TaskModule.tsx` rendered its 4 Kanban columns by calling `.filter()` on the full `tasks` array (length N) four separate times (C=4) on *every single render*. It also used another `.filter()` in a `useEffect` for the focus score. This created severe O(5*N) redundant work on every render cycle.
**Action:** Centralized the grouping into a single O(N) `useMemo` called `groupedTasksByStatus` which returns a dictionary `Record<string, Task[]>`. The components and effects now perform simple O(1) property lookups instead of scanning the array. Also learned to never commit throwaway patch scripts.

## 2026-06-10 - Eliminate O(N*M) Object Mapping Render Bottleneck
**Learning:** `TaskModule.tsx` had an O(N*M) bottleneck during task rendering due to the `getTaskObjective` function using `objectives.find()` repeatedly within the `task.actions.map` and `task.validations.map` render loops. Finding an object inside a large mapping loop results in quadratic-like overhead.
**Action:** Created an O(1) `objectiveMap` hash map wrapped in a `useMemo` hook, and updated `getTaskObjective` to use a `.get()` lookup instead. Always pre-calculate mapping dictionaries before rendering when cross-referencing collections.
## 2026-06-12 - Replace O(N*D) date loop scanning with O(1) Set lookups
**Learning:** Checking for habit presence on consecutive dates using `.some()` inside a `while` loop triggers an O(N * D) nested iteration which kills performance on datasets with extensive historical data.
**Action:** When calculating consecutive day streaks or doing date-based presence checks across loops, pre-compute a `Set` of formatted date strings from the dataset to enable O(1) existence lookups, reducing overall complexity to O(N + D).
## 2024-06-13 - Eliminate Redundant Array Filtering in Progress Analytics Heatmap
**Learning:** `ProgressAnalytics.tsx` had an O(D*N) performance bottleneck where the `sessions` array was filtered 14 times (2 filters x 7 days) and then `.some()` was called 42 times within an `Array.from({length: 7}).map(...)` loop. This caused excessive redundant iteration during rendering.
**Action:** Replaced the in-loop array filtering with a single O(N) `for...of` pass inside a `useMemo` hook to build a `dailyStatusMap` (a nested dictionary caching the state for each day/user). The mapping loop now relies on O(1) property lookups, drastically reducing rendering complexity.
## 2024-06-14 - Eliminate Multiple Array Iterations in FiscalAuditor
**Learning:** `FiscalAuditor.tsx` contained multiple performance bottlenecks where `.filter()` and `.reduce()` were called repeatedly on the `allocations` and `vices` arrays during render. This created unnecessary intermediate arrays and triggered O(3*N) and O(2*M) operations in `useMemo` hooks.
**Action:** Replaced multiple sequential array operations on both sets of data with single-pass `for...of` loops, consolidating logic and significantly reducing array iterations and memory allocation overhead.
## 2024-06-16 - Prevent O(N) Array Lookups in Game Render Loops
**Learning:** `Mahjong.tsx` utilized `.find()` on the 144-item `tiles` array within frequently triggered hooks (`handleTilePointerDown`, `handleHint`) and mapping loops during render. This resulted in recurrent `O(N)` scans on user interactions and re-renders, causing noticeable performance degradation.
**Action:** When a collection requires constant individual lookups by ID across handlers and render loops, inject a `Map<string, Item>` dictionary alongside derived state inside a `useMemo` hook (e.g., `tilesById`) to ensure `O(1)` access time and avoid performance anti-patterns.
## 2024-06-25 - Eliminate In-Render Array Filtering with useMemo
**Learning:** `HabitTracker.tsx` contained an inline `.filter().slice().map()` chain during rendering. This forces JavaScript to iterate through the entire array, create new intermediate arrays, and map them on every single render cycle, causing severe O(N) recalculation overhead.
**Action:** Extracted the data derivation into a `useMemo` hook with a single-pass `for...of` loop and a `break` statement when the required number of items is reached (optimizing from O(N) to O(K)), completely removing array operations from the render cycle.
