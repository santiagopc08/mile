🎯 **What:**
Fixed a Server-Side Request Forgery (SSRF) vulnerability in the `/api/proxy-image` API route. The route previously used global `fetch(url)` directly on user input without validating the hostname or IP address. I have extracted the existing secure fetch implementation (`fetchSafe`) from `link-preview/route.ts` into a shared module at `src/lib/fetch-safe.ts` and updated both routes to use it.

⚠️ **Risk:**
Without this fix, an attacker could supply URLs resolving to local or private IP addresses (e.g., `http://localhost`, `http://169.254.169.254`, `http://10.0.0.1`) to the `proxy-image` endpoint. Because the fetch executes on the server side, it would bypass firewalls and potentially access internal services, read sensitive metadata instances (in cloud environments), or conduct port scanning against the internal network.

🛡️ **Solution:**
- Created a shared `src/lib/fetch-safe.ts` module that implements safe fetching.
- The `fetchSafe` function resolves the hostname using `dns.promises.lookup` and ensures that none of the resolved IP addresses match local (127.x.x.x, ::1), private (10.x.x.x, 192.168.x.x, 172.16.x.x), or link-local (169.254.x.x) address spaces.
- `proxy-image/route.ts` was updated to import and use `fetchSafe` instead of the insecure global `fetch()`.
- Refactored `link-preview/route.ts` to also import from the new shared `fetch-safe.ts`, removing duplicated code while preserving the default `User-Agent` and `Accept-Language` headers required for successful web scraping.
- Maintained all existing link preview SSRF unit tests to guarantee continued security coverage.
