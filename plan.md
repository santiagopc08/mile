1.  **Refactor array filtering in `src/app/page.tsx`**
    - Replace the multiple `.filter` calls on `tasks` that result in `assigneeTasks` with a single `useMemo` block that iterates through the array once and calculates `pendingAssigneeTasksCount`.
    - Update the JSX to use `pendingAssigneeTasksCount` instead of `assigneeTasks.length`.
2.  **Refactor array filtering and grouping in `src/components/symmetry/TaskModule.tsx`**
    - Combine the filtering for `tasks` and the grouping logic for `groupedTasksByStatus` into a single `useMemo` hook with one O(N) loop to eliminate unnecessary intermediate allocations.
3.  **Refactor `filter().length` in `src/app/smash-fest/components/SmashFestGame.tsx`**
    - Replace `level?.nodes.filter((n) => n.isMemoryBlock).length` with a `useMemo` hook that iterates over the nodes and increments a counter to prevent intermediate array allocations.
4.  **Refactor `filter().length` in `src/components/symmetry/BiometricVault.tsx`**
    - Replace `recentDecryptedSymptoms.filter(...).length` with a standard `for...of` loop inside `FLO_SYMPTOMS.filter`.
    - Add an early exit condition `if (count >= 2) return true;` to avoid checking all elements once the condition is met.
5.  **Complete pre-commit steps**
    - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
6.  **Submit the change**
    - I will commit the changes on a new branch with a descriptive message in the expected format (e.g. `⚡ Bolt: [performance improvement description]`).
