import { test, expect } from '@playwright/test';
import { urlBase64ToUint8Array } from '../../src/hooks/useNotifications';

test.describe('urlBase64ToUint8Array', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let originalWindow: any;

    test.beforeAll(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        originalWindow = (globalThis as any).window;
    });

    test.afterAll(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).window = originalWindow;
    });

    test.beforeEach(() => {
        // Mock window.atob for Node.js environment
        Object.defineProperty(globalThis, 'window', {
            value: {
                atob: (data: string) => Buffer.from(data, 'base64').toString('binary')
            },
            writable: true,
            configurable: true
        });
    });

    test.afterEach(() => {
        // Clean up the mock
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (globalThis as any).window;
    });

    test('converts simple base64 string to Uint8Array', () => {
        // Base64 encoding of "Hello" is "SGVsbG8="
        const base64String = 'SGVsbG8=';
        const result = urlBase64ToUint8Array(base64String);

        // Expected Uint8Array for "Hello"
        const expected = new Uint8Array([72, 101, 108, 108, 111]);
        expect(result).toEqual(expected);
    });

    test('handles base64 url-safe string replacements (- and _)', () => {
        // "+/==" is normally used, but url-safe uses "-_"
        // Let's encode bytes [251, 255] which is "+/8=" in standard base64 and "-_8=" in url-safe
        const urlSafeBase64 = '-_8=';
        const result = urlBase64ToUint8Array(urlSafeBase64);

        const expected = new Uint8Array([251, 255]);
        expect(result).toEqual(expected);
    });

    test('adds missing padding automatically', () => {
        // "SGVsbG8" missing the "=" padding
        const unpaddedBase64 = 'SGVsbG8';
        const result = urlBase64ToUint8Array(unpaddedBase64);

        // Should still correctly decode "Hello"
        const expected = new Uint8Array([72, 101, 108, 108, 111]);
        expect(result).toEqual(expected);
    });

    test('handles empty string', () => {
        const result = urlBase64ToUint8Array('');
        expect(result).toEqual(new Uint8Array(0));
    });
});
