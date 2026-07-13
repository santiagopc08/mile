## YYYY-MM-DD - Fix Smash Fest Loading State

**Learning:** The `SmashFestGame` component was returning `null` when it failed to load data from Supabase, leading to a blank screen. Also, a required schema for `smash_fest_levels` was missing from the deployed database.
**Action:** Implemented `isLoading` and `error` states in `SmashFestGame` to surface network/database errors instead of silent failures. In future tasks, ensure components dealing with external async data provide explicit error handling states.
## 2023-10-27 - Intermediate Array Allocations
**Learning:** Chaining `.map().Set()`, `.map().find()`, and `.filter().slice()` results in hidden O(N) array copies, creating unnecessary GC pressure and memory allocations. Similarly, `.map(async () => await op())` instantiates redundant promise wrappers for pass-through async calls. Wrapping state updates in `setTimeout` inside a `useEffect` is an anti-pattern.
**Action:** Replace `Array.from(new Set(arr.map(prop)))` with a `for...of` loop directly calling `set.add(prop)`. Replace `.map().find()` with a `for...of` loop. Replace `batch.map(async () => await op())` with `batch.map(() => op().then().catch())`. Ensure scratch files are deleted before submit.

## 2026-07-13 - Expensive function inside nested Array filters

**Learning:** Found an expensive decryption function `decrypt(c.symptoms_enc)` being called inside an inner `filter` loop nested inside an outer `filter` loop over `FLO_SYMPTOMS`. The O(N) calls to the expensive function became O(N * M) because it was recalculated per symptom being evaluated. Also, my previous attempt to convert it to an O(N) map logic introduced functional bugs since the decryption returned a string instead of an array, and the counts tracked occurrences rather than distinct cycles.
**Action:** The simplest, safest, and most effective optimization in this context is to cache the results of the expensive operation outside the outer loop. Always verify the data types (e.g., string vs array) and the exact algorithmic intent (distinct items vs total occurrences) before attempting complex algorithmic transformations.
