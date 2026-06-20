🎯 **What:**
Fixed a Server-Side Request Forgery (SSRF) vulnerability in the `/api/link-preview` route. The previous implementation used a weak regular expression against the URL's `hostname` to filter out local and private IPs. This was insufficient because attackers could bypass it using DNS records resolving to local IPs (e.g., `localtest.me` -> `127.0.0.1`), alternative IP representations (e.g., `0177.0.0.1` or `[::ffff:127.0.0.1]`), or through HTTP redirects to restricted addresses which `fetch` follows implicitly.

⚠️ **Risk:**
Left unfixed, this vulnerability allowed attackers to send arbitrary HTTP/HTTPS GET requests from the Next.js server to internal network resources, loopback addresses (`127.0.0.1`), or cloud instance metadata services (`169.254.169.254`). This could lead to information disclosure of internal services, bypassing firewall rules, or exposing sensitive cloud provider metadata.

🛡️ **Solution:**
Implemented a robust SSRF protection mechanism:
- Switched to manually following redirects in `fetch` (`redirect: 'manual'`) up to a defined limit to prevent DNS rebinding or redirect bypasses.
- Before each HTTP request, the target hostname's IP addresses are resolved via DNS (`dns.lookup`).
- All resolved IP addresses are strictly validated against a comprehensive list of restricted subnets, including loopback, private IPv4 (RFC 1918), link-local (169.254.x.x), and private IPv6 ranges.
- If any resolved IP is deemed unsafe, the request is aborted and a `400 Bad Request` is returned to the user, preventing internal access.
