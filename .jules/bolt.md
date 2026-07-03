## 2024-05-30 - Map Lookup inside React Render Loop
**Learning:** Performing multiple Map `.get()` lookups inside an array `.map()` call that executes on every React render loop can cause a minor but frequent CPU overhead, which scales poorly as the array size increases.
**Action:** Extract these derivations into a `useMemo` hook that runs only when the dependencies change, returning an array of pre-calculated state objects that the render loop can cheaply iterate over.
