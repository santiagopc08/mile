## YYYY-MM-DD - Fix Smash Fest Loading State

**Learning:** The `SmashFestGame` component was returning `null` when it failed to load data from Supabase, leading to a blank screen. Also, a required schema for `smash_fest_levels` was missing from the deployed database.
**Action:** Implemented `isLoading` and `error` states in `SmashFestGame` to surface network/database errors instead of silent failures. In future tasks, ensure components dealing with external async data provide explicit error handling states.
## 2024-05-18 - Fix Waterfall Database Updates in StoreService

**Learning:** In `src/services/storeService.ts`, the `updateStore` function was performing a mix of concurrent and sequential database operations. While core tables were queued in `syncPromises`, updates to `daily_tracking`, `persistent_listening`, `notifications`, and `app_settings` were individually awaited in a sequential waterfall pattern, artificially inflating the total database sync time.
**Action:** Always push isolated, independent asynchronous operations (like single-table upserts or inserts) into an array (like `syncPromises`) and resolve them concurrently via a single `Promise.all()` block at the end of the execution path to eliminate network latency waterfalls.
