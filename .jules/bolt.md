## YYYY-MM-DD - Fix Smash Fest Loading State

**Learning:** The `SmashFestGame` component was returning `null` when it failed to load data from Supabase, leading to a blank screen. Also, a required schema for `smash_fest_levels` was missing from the deployed database.
**Action:** Implemented `isLoading` and `error` states in `SmashFestGame` to surface network/database errors instead of silent failures. In future tasks, ensure components dealing with external async data provide explicit error handling states.
