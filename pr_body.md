🎯 **What:** We added a comprehensive Playwright unit test suite for the untested `/api/timeline` endpoint (`src/app/api/timeline/route.ts`).

📊 **Coverage:** The new tests cover:
- **POST Method**: Missing authentication (401), invalid actions (400), internal server errors (500), and successful processing of the `comment` and `react` actions (200), asserting they properly call the mocked `TimelineService`.
- **DELETE Method**: Missing authentication (401), missing ID parameter (400), invalid type (400), internal server errors (500), and successful deletion of event comments (200).

✨ **Result:** The `timeline/route.ts` API endpoint is now completely covered by unit tests, ensuring that future refactoring of authentication, database client logic, or the timeline service will not silently break this route.
