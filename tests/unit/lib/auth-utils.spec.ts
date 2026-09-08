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

    const supabasePath = require.resolve('../../../src/lib/supabase-server.ts');
    require.cache[supabasePath] = {
        id: supabasePath,
        filename: supabasePath,
        loaded: true,
        exports: {
            createServerClient: () => ({
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
            async () => ({ data: { id: 'some-id', token: '123e4567-e89b-12d3-a456-426614174000' }, error: null })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(true);
    });

    test('missing cookie returns false', async () => {
        setupMocks(
            {},
            async () => ({ data: null, error: new Error('not found') })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(false);
    });

    test('non-UUID token returns false', async () => {
        setupMocks(
            { 'mile_device_token': 'invalid_token_format' },
            async () => ({ data: { id: 'some-id', token: '123e4567-e89b-12d3-a456-426614174000' }, error: null })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(false);
    });

    test('listUsers error returns false', async () => {
        setupMocks(
            { 'mile_device_token': '123e4567-e89b-12d3-a456-426614174000' },
            async () => ({ data: null, error: new Error('DB Error') })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(false);
    });

    test('valid UUID token not matched in listUsers returns false', async () => {
        setupMocks(
            { 'mile_device_token': '123e4567-e89b-12d3-a456-426614174000' },
            async () => ({ data: null, error: new Error('not found') })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(false);
    });

    test('cookies exception throws error', async () => {
        setupMocks(
            {},
            async () => ({ data: null, error: new Error('not found') }),
            true // shouldCookiesThrow
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        await expect(verifyServerSession()).rejects.toThrow('Cookies error');
    });

    test('token mismatch in database returns false', async () => {
        setupMocks(
            { 'mile_device_token': '123e4567-e89b-12d3-a456-426614174000' },
            async () => ({ data: { id: 'some-id', token: '123e4567-e89b-12d3-a456-426614174001' }, error: null })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(false);
    });

    test('uppercase valid UUID token matched in database returns true', async () => {
        setupMocks(
            { 'mile_device_token': '123E4567-E89B-12D3-A456-426614174000' },
            async () => ({ data: { id: 'some-id', token: '123E4567-E89B-12D3-A456-426614174000' }, error: null })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(true);
    });

    test('UUID token with trailing spaces returns false', async () => {
        setupMocks(
            { 'mile_device_token': '123e4567-e89b-12d3-a456-426614174000   ' },
            async () => ({ data: { id: 'some-id', token: '123e4567-e89b-12d3-a456-426614174000' }, error: null })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(false);
    });

    test('valid 64-character hex token matched in database returns true', async () => {
        setupMocks(
            { 'mile_device_token': 'a'.repeat(64) },
            async () => ({ data: { id: 'some-id', token: 'a'.repeat(64) }, error: null })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(true);
    });

    test('invalid hex token returns false', async () => {
        setupMocks(
            { 'mile_device_token': 'a'.repeat(63) + 'g' },
            async () => ({ data: { id: 'some-id', token: 'a'.repeat(64) }, error: null })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(false);
    });

    test('uppercase valid 64-character hex token matched in database returns true', async () => {
        setupMocks(
            { 'mile_device_token': 'A'.repeat(64) },
            async () => ({ data: { id: 'some-id', token: 'A'.repeat(64) }, error: null })
        );

        const { verifyServerSession } = require('../../../src/lib/auth-utils.ts');
        const result = await verifyServerSession();
        expect(result).toBe(true);
    });

});
