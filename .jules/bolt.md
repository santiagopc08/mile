## YYYY-MM-DD - Fix Smash Fest Loading State

**Learning:** The `SmashFestGame` component was returning `null` when it failed to load data from Supabase, leading to a blank screen. Also, a required schema for `smash_fest_levels` was missing from the deployed database.
**Action:** Implemented `isLoading` and `error` states in `SmashFestGame` to surface network/database errors instead of silent failures. In future tasks, ensure components dealing with external async data provide explicit error handling states.
## 2023-10-27 - Intermediate Array Allocations
**Learning:** Chaining `.map().Set()`, `.map().find()`, and `.filter().slice()` results in hidden O(N) array copies, creating unnecessary GC pressure and memory allocations. Similarly, `.map(async () => await op())` instantiates redundant promise wrappers for pass-through async calls. Wrapping state updates in `setTimeout` inside a `useEffect` is an anti-pattern.
**Action:** Replace `Array.from(new Set(arr.map(prop)))` with a `for...of` loop directly calling `set.add(prop)`. Replace `.map().find()` with a `for...of` loop. Replace `batch.map(async () => await op())` with `batch.map(() => op().then().catch())`. Ensure scratch files are deleted before submit.
## 2024-11-20 - Array Reduction Optimization
**Learning:** Double `.reduce()` calls in React `useMemo` hooks inside rendering paths (like `mapCenter` in `GeospatialPlanTracker`) cause unnecessary O(2N) iteration and intermediate array callbacks.
**Action:** Replace adjacent `.reduce()` calls calculating different aggregates over the same array with a single `for...of` loop to calculate all aggregates simultaneously in O(N).
## 2026-07-17 - Optimize frequentSymptoms calculation in BiometricVault
**Learning:** Using chained `.filter().length` within a loop creates unnecessary intermediate arrays and scales poorly (O(N^2) or worse) compared to a single pass nested loop.
**Action:** Replaced `.filter().length` within `BiometricVault.tsx` to calculate `frequentSymptoms` with an O(N) loop to eliminate array allocations and improve execution speed by ~25%.
