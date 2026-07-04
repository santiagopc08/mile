🎯 What:
The application had an SSRF vulnerability where fetchSafe validated the URL hostname with a safe IP resolving check, but then used the original standard fetch API. This resulted in a Time-of-Check to Time-of-Use (TOCTOU) vulnerability where fetch resolved the DNS again, exposing the server to DNS Rebinding attacks.

⚠️ Risk:
Attackers could craft a custom DNS server that returns a safe IP address during the initial validation check (validateHostname), but then quickly switches to return a private or local IP address when fetch resolves the DNS. This allows bypassing SSRF protections to hit internal services or private APIs from the server.

🛡️ Solution:
Replaced the usage of the global fetch API in fetchSafe with Node's native http and https modules. This allows us to manually resolve a safe IP via dns.lookup and explicitly direct the request to that specific IP using hostname: ip, while forwarding the Host header and SNI servername correctly. This securely pins the verified safe IP for the duration of the request, eliminating the TOCTOU vulnerability.
