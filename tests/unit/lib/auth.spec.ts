/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { test, expect } from '@playwright/test';

const setupMocks = (
    mockHeaders: Record<string, string>,
    mockCookies: Record<string, string>,
    mockGetUser: (token: string) => Promise<any> | any,
    mockListUsers: () => Promise<any> | any,
    shouldHeadersThrow: boolean = false,
    shouldCookiesThrow: boolean = false
) => {
    const nextHeadersPath = require.resolve('next/headers');
    require.cache[nextHeadersPath] = {
        id: nextHeadersPath,
        filename: nextHeadersPath,
        loaded: true,
        exports: {
            headers: async () => {
                if (shouldHeadersThrow) throw new Error('Headers error');
                return {
                    get: (name: string) => mockHeaders[name] || null
                };
            },
            cookies: async () => {
                if (shouldCookiesThrow) throw new Error('Cookies error');
                return {
                    get: (name: string) => mockCookies[name] ? { value: mockCookies[name] } : undefined
                };
            }
        }
    } as any;

    const supabasePath = require.resolve('../../../src/lib/supabase-server.ts');
    require.cache[supabasePath] = {
        id: supabasePath,
        filename: supabasePath,
        loaded: true,
        exports: {
            createServerClient: () => ({
                auth: {
                    getUser: mockGetUser
                },
                from: (_table: string) => ({
                    select: (_columns: string) => ({
                        eq: (_column: string, _value: string) => ({
                            single: mockListUsers // reuse the variable for simplicity
                        })
                    })
                })
            })
        }
    } as any;
};

const cleanupMocks = () => {
    const nextHeadersPath = require.resolve('next/headers');
    delete require.cache[nextHeadersPath];
    const supabasePath = require.resolve('../../../src/lib/supabase-server.ts');
    delete require.cache[supabasePath];

    const authPath = require.resolve('../../../src/lib/auth.ts');
    delete require.cache[authPath];
};

test.describe('verifyAuth', () => {
    let originalConsoleError: typeof console.error;

    test.beforeEach(() => {
        originalConsoleError = console.error;
    });

    test.afterEach(() => {
        cleanupMocks();
        console.error = originalConsoleError;
    });

    test('valid bearer token returns true for el@mile.app', async () => {
        setupMocks(
            { 'authorization': 'Bearer valid_token' },
            {},
            async (token) => {
                expect(token).toBe('valid_token');
                return { data: { user: { email: 'el@mile.app' } }, error: null };
            },
            async () => ({ data: null, error: new Error('not found') })
        );

        const { verifyAuth } = require('../../../src/lib/auth.ts');
        const result = await verifyAuth();
        expect(result).toBe(true);
    });

    test('valid bearer token returns true for ella@mile.app', async () => {
        setupMocks(
            { 'authorization': 'Bearer valid_token' },
            {},
            async (token) => {
                expect(token).toBe('valid_token');
                return { data: { user: { email: 'ella@mile.app' } }, error: null };
            },
            async () => ({ data: null, error: new Error('not found') })
        );

        const { verifyAuth } = require('../../../src/lib/auth.ts');
        const result = await verifyAuth();
        expect(result).toBe(true);
    });

    test('bearer token with wrong email falls back to cookie', async () => {
        setupMocks(
            { 'authorization': 'Bearer valid_token' },
            { 'mile_device_token': 'test_token' },
            async () => ({ data: { user: { email: 'wrong@example.com' } }, error: null }),
            async () => ({ data: { id: 'some-id' }, error: null })
        );

        const { verifyAuth } = require('../../../src/lib/auth.ts');
        const result = await verifyAuth();
        expect(result).toBe(true);
    });

    test('bearer token with getUser error falls back to cookie', async () => {
        setupMocks(
            { 'authorization': 'Bearer valid_token' },
            { 'mile_device_token': 'test_token' },
            async () => ({ data: { user: null }, error: new Error('Invalid token') }),
            async () => ({ data: { id: 'some-id' }, error: null })
        );

        const { verifyAuth } = require('../../../src/lib/auth.ts');
        const result = await verifyAuth();
        expect(result).toBe(true);
    });

    test('headers exception falls back to cookie and logs error', async () => {
        let errorLogged = false;
        console.error = () => {
            errorLogged = true;
        };

        try {
            setupMocks(
                {},
                { 'mile_device_token': 'test_token' },
                async () => ({ data: null, error: new Error('not found') }),
                async () => ({ data: { id: 'some-id' }, error: null }),
                true // shouldHeadersThrow
            );

            const { verifyAuth } = require('../../../src/lib/auth.ts');
            const result = await verifyAuth();

            expect(result).toBe(true);
            expect(errorLogged).toBe(true);
        } finally {
            console.error = originalConsoleError;
        }
    });

    test('missing cookie returns false', async () => {
        setupMocks(
            {},
            {},
            async () => ({ data: null, error: new Error('not found') }),
            async () => ({})
        );

        const { verifyAuth } = require('../../../src/lib/auth.ts');
        const result = await verifyAuth();
        expect(result).toBe(false);
    });

    test('listUsers error returns false', async () => {
        setupMocks(
            {},
            { 'mile_device_token': 'test_token' },
            async () => ({}),
            async () => ({ data: null, error: new Error('DB Error') })
        );

        const { verifyAuth } = require('../../../src/lib/auth.ts');
        const result = await verifyAuth();
        expect(result).toBe(false);
    });

    test('invalid cookie not matched in listUsers returns false', async () => {
        setupMocks(
            {},
            { 'mile_device_token': 'test_token' },
            async () => ({}),
            async () => ({ data: null, error: new Error('not found') })
        );

        const { verifyAuth } = require('../../../src/lib/auth.ts');
        const result = await verifyAuth();
        expect(result).toBe(false);
    });

    test('valid cookie matched in listUsers returns true', async () => {
        setupMocks(
            {},
            { 'mile_device_token': 'test_token' },
            async () => ({}),
            async () => ({ data: { id: 'some-id' }, error: null })
        );

        const { verifyAuth } = require('../../../src/lib/auth.ts');
        const result = await verifyAuth();
        expect(result).toBe(true);
    });

    test('cookies exception returns false and logs error', async () => {
        let errorLogged = false;
        console.error = () => {
            errorLogged = true;
        };

        try {
            setupMocks(
                {},
                {},
                async () => ({}),
                async () => ({}),
                false,
                true // shouldCookiesThrow
            );

            const { verifyAuth } = require('../../../src/lib/auth.ts');
            const result = await verifyAuth();

            expect(result).toBe(false);
            expect(errorLogged).toBe(true);
        } finally {
            console.error = originalConsoleError;
        }
    });
});
