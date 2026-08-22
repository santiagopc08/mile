import { test, expect } from '@playwright/test';
import { haptics } from '../../src/lib/haptics';

/**
 * `NODE_ENV` está tipado como sólo lectura, pero estos tests necesitan
 * alternarlo para cubrir las ramas de desarrollo y producción.
 */
function setNodeEnv(value: string | undefined) {
    (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

test.describe('HapticEngine', () => {
    let originalWindow: unknown;
    let originalNavigator: unknown;
    let originalLocalStorage: unknown;
    let consoleWarnMock: unknown[] = [];
    let originalWarn: typeof console.warn;

    test.beforeAll(() => {
        try { originalWindow = global.window; } catch {}
        try { originalNavigator = global.navigator; } catch {}
        try { originalLocalStorage = (global as unknown as { localStorage: unknown }).localStorage; } catch {}
        originalWarn = console.warn;
    });

    test.afterAll(() => {
        if (originalNavigator !== undefined) {
             Object.defineProperty(global, 'navigator', { value: originalNavigator, writable: true, configurable: true });
        } else {
             delete (global as unknown as { navigator: unknown }).navigator;
        }

        if (originalWindow !== undefined) {
             Object.defineProperty(global, 'window', { value: originalWindow, writable: true, configurable: true });
        } else {
             delete (global as unknown as { window: unknown }).window;
        }

        if (originalLocalStorage !== undefined) {
             Object.defineProperty(global, 'localStorage', { value: originalLocalStorage, writable: true, configurable: true });
        } else {
             delete (global as unknown as { localStorage: unknown }).localStorage;
        }

        console.warn = originalWarn;
    });

    test.beforeEach(() => {
        // mock localStorage for all tests before setting haptics enabled
        Object.defineProperty(global, 'localStorage', {
            value: { setItem: () => {}, getItem: () => null },
            writable: true,
            configurable: true
        });

        haptics.setEnabled(true);
        consoleWarnMock = [];
        console.warn = (...args) => consoleWarnMock.push(args);
    });

    test('should return early if disabled', () => {
        let vibrateCalled = false;
        Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
        Object.defineProperty(global, 'navigator', {
            value: { vibrate: () => { vibrateCalled = true; } },
            writable: true,
            configurable: true
        });

        haptics.setEnabled(false);
        haptics.vibrate(10);

        expect(vibrateCalled).toBe(false);
    });

    test('should not call vibrate if window is undefined', () => {
        let vibrateCalled = false;
        Object.defineProperty(global, 'window', { value: undefined, writable: true, configurable: true });
        Object.defineProperty(global, 'navigator', {
            value: { vibrate: () => { vibrateCalled = true; } },
            writable: true,
            configurable: true
        });

        haptics.vibrate(10);

        expect(vibrateCalled).toBe(false);
    });

    test('should not call vibrate if navigator.vibrate is undefined', () => {
        const vibrateCalled = false;
        Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
        Object.defineProperty(global, 'navigator', {
            value: {}, // no vibrate
            writable: true,
            configurable: true
        });

        haptics.vibrate(10);

        expect(vibrateCalled).toBe(false);
    });

    test('should call vibrate successfully', () => {
        let vibratePattern: unknown = null;
        Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
        Object.defineProperty(global, 'navigator', {
            value: { vibrate: (pattern: unknown) => { vibratePattern = pattern; } },
            writable: true,
            configurable: true
        });

        haptics.vibrate([10, 20]);

        expect(vibratePattern).toEqual([10, 20]);
        expect(consoleWarnMock.length).toBe(0);
    });

    test('should catch and warn on vibrate error in development', () => {
        Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
        Object.defineProperty(global, 'navigator', {
            value: { vibrate: () => { throw new Error('Test error'); } },
            writable: true,
            configurable: true
        });

        const originalEnv = process.env.NODE_ENV;
        setNodeEnv('development');

        haptics.vibrate(10);

        setNodeEnv(originalEnv);

        expect(consoleWarnMock.length).toBe(1);
        const warnArgs = consoleWarnMock[0] as unknown[];
        expect(warnArgs[0]).toBe('Vibration API blocked or failed:');
        expect((warnArgs[1] as Error).message).toBe('Test error');
    });


    test('should not throw if process is undefined on vibrate error', () => {
        Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
        Object.defineProperty(global, 'navigator', {
            value: { vibrate: () => { throw new Error('Test error'); } },
            writable: true,
            configurable: true
        });

        const originalProcess = global.process;
        Object.defineProperty(global, 'process', { value: { env: {} }, writable: true, configurable: true });

        haptics.vibrate(10);

        expect(consoleWarnMock.length).toBe(0);

        Object.defineProperty(global, 'process', { value: originalProcess, writable: true, configurable: true });
    });

    test('should catch but not warn on vibrate error in production', () => {
        Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
        Object.defineProperty(global, 'navigator', {
            value: { vibrate: () => { throw new Error('Test error'); } },
            writable: true,
            configurable: true
        });

        const originalEnv = process.env.NODE_ENV;
        setNodeEnv('production');

        haptics.vibrate(10);

        setNodeEnv(originalEnv);

        expect(consoleWarnMock.length).toBe(0);
    });

    test('trigger methods should call vibrate with correct patterns', () => {
        let vibratePattern: unknown = null;
        Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
        Object.defineProperty(global, 'navigator', {
            value: { vibrate: (pattern: unknown) => { vibratePattern = pattern; } },
            writable: true,
            configurable: true
        });

        haptics.triggerTick();
        expect(vibratePattern).toBe(15);

        haptics.triggerSuccess();
        expect(vibratePattern).toEqual([20, 50, 20]);

        haptics.triggerSave();
        expect(vibratePattern).toBe(30);

        haptics.triggerError();
        expect(vibratePattern).toEqual([50, 100, 50]);
    });

    test('setEnabled should update local state and localStorage if window is defined', () => {
        let setItemArgs: Record<string, string> | null = null;
        Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
        Object.defineProperty(global, 'localStorage', {
            value: { setItem: (key: string, val: string) => { setItemArgs = { key, val }; } },
            writable: true,
            configurable: true
        });

        haptics.setEnabled(false);
        expect(haptics.isEnabled()).toBe(false);
        expect(setItemArgs).toEqual({ key: 'mile_haptic_enabled', val: 'false' });

        haptics.setEnabled(true);
        expect(haptics.isEnabled()).toBe(true);
        expect(setItemArgs).toEqual({ key: 'mile_haptic_enabled', val: 'true' });
    });
});
