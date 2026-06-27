🎯 **What:**
This PR addresses an untested catch block inside `getMahjongLeaderboard` within `src/services/mahjongService.ts`. Previously, the code execution path where the Supabase client threw an unexpected synchronous error was not covered by our tests.

📊 **Coverage:**
- A new test case was added to `tests/mahjongService.spec.ts`.
- Mocks a completely broken `SupabaseClient` that throws an error when `from()` is called.
- Verifies that `getMahjongLeaderboard` safely intercepts the error and returns the fallback data structure (`{ el: [], ella: [] }`).
- Wraps the test in a `try...finally` block to safely mock `console.error` and ensure it's cleanly restored regardless of test success or failure, avoiding log pollution.

✨ **Result:**
Improved overall test reliability by guaranteeing that the `getMahjongLeaderboard` error handling logic functions as intended without throwing unhandled exceptions.
