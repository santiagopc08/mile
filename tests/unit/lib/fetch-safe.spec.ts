import { test, expect } from '@playwright/test';
import { isLocalOrPrivateIP, resolveSafeIP, validateHostname } from '../../../src/lib/fetch-safe';
import dns from 'dns/promises';

test.describe('isLocalOrPrivateIP', () => {
    test('identifies IPv4 loopback addresses', () => {
        expect(isLocalOrPrivateIP('127.0.0.1')).toBe(true);
        expect(isLocalOrPrivateIP('127.1.2.3')).toBe(true);
    });

    test('identifies IPv4 private class A addresses', () => {
        expect(isLocalOrPrivateIP('10.0.0.1')).toBe(true);
        expect(isLocalOrPrivateIP('10.255.255.255')).toBe(true);
    });

    test('identifies IPv4 private class B addresses', () => {
        expect(isLocalOrPrivateIP('172.16.0.0')).toBe(true);
        expect(isLocalOrPrivateIP('172.20.1.1')).toBe(true);
        expect(isLocalOrPrivateIP('172.31.255.255')).toBe(true);
        // Not class B private
        expect(isLocalOrPrivateIP('172.15.255.255')).toBe(false);
        expect(isLocalOrPrivateIP('172.32.0.0')).toBe(false);
    });

    test('identifies IPv4 private class C addresses', () => {
        expect(isLocalOrPrivateIP('192.168.0.1')).toBe(true);
        expect(isLocalOrPrivateIP('192.168.255.255')).toBe(true);
        // Not class C private
        expect(isLocalOrPrivateIP('192.169.0.1')).toBe(false);
    });

    test('identifies IPv4 link-local addresses', () => {
        expect(isLocalOrPrivateIP('169.254.0.1')).toBe(true);
        expect(isLocalOrPrivateIP('169.254.255.255')).toBe(true);
        // Not link-local
        expect(isLocalOrPrivateIP('169.253.0.1')).toBe(false);
    });

    test('identifies IPv4 current network and broadcast', () => {
        expect(isLocalOrPrivateIP('0.0.0.0')).toBe(true);
        expect(isLocalOrPrivateIP('255.255.255.255')).toBe(true);
    });

    test('identifies public IPv4 addresses', () => {
        expect(isLocalOrPrivateIP('8.8.8.8')).toBe(false);
        expect(isLocalOrPrivateIP('1.1.1.1')).toBe(false);
        expect(isLocalOrPrivateIP('104.21.55.10')).toBe(false);
    });

    test('identifies IPv4-mapped IPv6 addresses correctly', () => {
        expect(isLocalOrPrivateIP('::ffff:127.0.0.1')).toBe(true);
        expect(isLocalOrPrivateIP('::ffff:10.0.0.1')).toBe(true);
        expect(isLocalOrPrivateIP('::ffff:8.8.8.8')).toBe(false);
    });

    test('identifies IPv6 loopback and unspecified addresses', () => {
        expect(isLocalOrPrivateIP('::1')).toBe(true);
        expect(isLocalOrPrivateIP('::')).toBe(true);
    });

    test('identifies IPv6 unique local addresses', () => {
        expect(isLocalOrPrivateIP('fc00::1')).toBe(true);
        expect(isLocalOrPrivateIP('fd12:3456:789a:1::1')).toBe(true);
        expect(isLocalOrPrivateIP('FD00::')).toBe(true); // case-insensitive
    });

    test('identifies IPv6 link-local addresses', () => {
        expect(isLocalOrPrivateIP('fe80::1')).toBe(true);
        expect(isLocalOrPrivateIP('fe90::1')).toBe(true);
        expect(isLocalOrPrivateIP('fea0::1')).toBe(true);
        expect(isLocalOrPrivateIP('feb0::1')).toBe(true);
        expect(isLocalOrPrivateIP('FE80::1')).toBe(true); // case-insensitive
    });

    test('identifies public IPv6 addresses', () => {
        expect(isLocalOrPrivateIP('2001:4860:4860::8888')).toBe(false);
        expect(isLocalOrPrivateIP('2606:4700:4700::1111')).toBe(false);
    });
});

test.describe('resolveSafeIP', () => {
    let originalLookup: typeof dns.lookup;

    test.beforeEach(() => {
        originalLookup = dns.lookup;
    });

    test.afterEach(() => {
        dns.lookup = originalLookup;
    });

    test('throws when DNS resolution fails to prevent bypasses', async () => {
        // Use an explicit type cast to unknown, then to the required function signature
        // This avoids the typescript-eslint/no-unsafe-function-type linting error.
        dns.lookup = (async () => {
            throw new Error('Simulated DNS failure');
        }) as unknown as typeof dns.lookup;

        await expect(resolveSafeIP('example.com')).rejects.toThrow('Private or local addresses are not allowed');
    });
});

test.describe('validateHostname', () => {
    let originalLookup: typeof dns.lookup;
    let originalNow: typeof Date.now;
    const CACHE_TTL_MS = 5 * 60 * 1000;

    test.beforeEach(() => {
        originalLookup = dns.lookup;
        originalNow = Date.now;
    });

    test.afterEach(() => {
        dns.lookup = originalLookup;
        Date.now = originalNow;
    });

    test('caches valid hostnames', async () => {
        let lookupCount = 0;
        dns.lookup = (async () => {
            lookupCount++;
            return [{ address: '8.8.8.8', family: 4 }];
        }) as unknown as typeof dns.lookup;

        const result1 = await validateHostname('valid-test.com');
        expect(result1).toBe(true);
        expect(lookupCount).toBe(1);

        const result2 = await validateHostname('valid-test.com');
        expect(result2).toBe(true);
        expect(lookupCount).toBe(1); // Cached, shouldn't call lookup again
    });

    test('caches invalid hostnames (private IPs)', async () => {
        let lookupCount = 0;
        dns.lookup = (async () => {
            lookupCount++;
            return [{ address: '192.168.1.1', family: 4 }];
        }) as unknown as typeof dns.lookup;

        const result1 = await validateHostname('invalid-test.com');
        expect(result1).toBe(false);
        expect(lookupCount).toBe(1);

        const result2 = await validateHostname('invalid-test.com');
        expect(result2).toBe(false);
        expect(lookupCount).toBe(1); // Cached, shouldn't call lookup again
    });

    test('expires cache after TTL', async () => {
        let lookupCount = 0;
        dns.lookup = (async () => {
            lookupCount++;
            return [{ address: '8.8.8.8', family: 4 }];
        }) as unknown as typeof dns.lookup;

        const startTime = 1000000;
        Date.now = () => startTime;

        await validateHostname('expire-test.com');
        expect(lookupCount).toBe(1);

        // Advance time past TTL
        Date.now = () => startTime + CACHE_TTL_MS + 1;

        await validateHostname('expire-test.com');
        expect(lookupCount).toBe(2); // Should call lookup again
    });

    test('does not cache errors', async () => {
        let lookupCount = 0;
        let shouldThrow = true;

        dns.lookup = (async () => {
            lookupCount++;
            if (shouldThrow) {
                throw new Error('DNS failure');
            }
            return [{ address: '8.8.8.8', family: 4 }];
        }) as unknown as typeof dns.lookup;

        const result1 = await validateHostname('error-test.com');
        expect(result1).toBe(false);
        expect(lookupCount).toBe(1);

        // Next call should succeed since errors aren't cached
        shouldThrow = false;
        const result2 = await validateHostname('error-test.com');
        expect(result2).toBe(true);
        expect(lookupCount).toBe(2);
    });
});
