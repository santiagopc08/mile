/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { test, expect } from '@playwright/test';

const setupMocks = (
    mockCookies: Record<string, string>,
    mockListUsers: () => Promise<any> | any,
    shouldCookiesThrow: boolean = false
) => {
    const nextHeadersPath = require.resolve('next/headers');
    require.cache[nextHeadersPath] = {
        id: nextHeadersPath,
        filename: nextHeadersPath,
        loaded: true,
        exports: {
            cookies: async () => {
                if (shouldCookiesThrow) throw new Error('Cookies error');
                return {
                    get: (name: string) => mockCookies[name] ? { value: mockCookies[name] } : undefined
                };
            }
        }
    } as any;

    const supabasePath = require.resolve('../../../src/lib/supabase.ts');
    require.cache[supabasePath] = {
        id: supabasePath,
        filename: supabasePath,
        loaded: true,
        exports: {
            createServerClient: () => ({
                auth: {
                    admin: {
                        listUsers: mockListUsers
                    }
                }
            })
        }
    } as any;
};

const cleanupMocks = () => {
    const nextHeadersPath = require.resolve('next/headers');
    delete require.cache[nextHeadersPath];
    const supabasePath = require.resolve('../../../src/lib/supabase.ts');
    delete require.cache[supabasePath];

    const authUtilsPath = require.resolve('../../../src/lib/auth-utils.ts');
    delete require.cache[authUtilsPath];
};

test.describe('verifyServerSession', () => {
    let originalConsoleError: typeof console.error;

    test.beforeEach(() => {
        originalConsoleError = console.error;
    });

    test.afterEach(() => {
        cleanupMocks();
        console.error = originalConsoleError;
    });

    test('valid UUID token matched in listUsers returns true', async () => {
        setupMocks(
            { 'mile_device_token': '123e4567-e89b-12d3-a456-426614174000' },
            async () => ({
                data: {
                    users: [
                        { user_metadata: { device_tokens: ['123e4567-e89b-12d3-a456-426614174000'] } }
                    ]
                },
                error: null
            })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(true);
    });

    test('missing cookie returns false', async () => {
        setupMocks(
            {},
            async () => ({})
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(false);
    });

    test('non-UUID token returns false', async () => {
        setupMocks(
            { 'mile_device_token': 'invalid_token_format' },
            async () => ({
                data: {
                    users: [
                        { user_metadata: { device_tokens: ['invalid_token_format'] } }
                    ]
                },
                error: null
            })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(false);
    });

    test('listUsers error returns false', async () => {
        setupMocks(
            { 'mile_device_token': '123e4567-e89b-12d3-a456-426614174000' },
            async () => ({ data: { users: null }, error: new Error('DB Error') })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(false);
    });

    test('valid UUID token not matched in listUsers returns false', async () => {
        setupMocks(
            { 'mile_device_token': '123e4567-e89b-12d3-a456-426614174000' },
            async () => ({
                data: {
                    users: [
                        { user_metadata: { device_tokens: ['different-uuid-here'] } }
                    ]
                },
                error: null
            })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(false);
    });

    test('cookies exception throws error', async () => {
        setupMocks(
            {},
            async () => ({}),
            true // shouldCookiesThrow
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        await expect(verifyServerSession()).rejects.toThrow('Cookies error');
    });
});
