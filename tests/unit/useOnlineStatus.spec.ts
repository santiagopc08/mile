/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
import { test, expect } from '@playwright/test';

test.describe('useOnlineStatus hook', () => {
  test('returns online status and registers event listeners', () => {
    // 1. Setup mocks
    let currentState: boolean | undefined;
    let stateSetter: any;
    let effectCallback: any;

    const mockReact = {
      useState: (initial: any) => {
        if (currentState === undefined) currentState = initial;
        stateSetter = (val: any) => { currentState = val; };
        return [currentState, stateSetter];
      },
      useEffect: (cb: any, _deps: any) => {
        effectCallback = cb;
      }
    };

    const requireCache = require.cache;
    requireCache[require.resolve('react')] = {
      exports: mockReact
    } as NodeModule;

    // Global mocks
    const listeners: Record<string, any> = {};
    const originalWindow = global.window;

    // Instead of overriding global.navigator (which throws), we can mock the typeof window check if we inject a mock window object
    (global as any).window = {
      addEventListener: (evt: string, cb: any) => { listeners[evt] = cb; },
      removeEventListener: (evt: string, cb: any) => {
        if (listeners[evt] === cb) {
          delete listeners[evt];
        }
      }
    };

    // Overriding navigator onLine getter globally on the window
    Object.defineProperty(global, 'navigator', {
        value: { onLine: true },
        configurable: true
    });


    // 2. Import hook
    // To ensure fresh module evaluation, delete the module from cache first if it exists
    delete requireCache[require.resolve('../../src/hooks/useOnlineStatus')];
    const { useOnlineStatus } = require('../../src/hooks/useOnlineStatus');

    // 3. Test initial state
    const result1 = useOnlineStatus();
    expect(result1).toBe(true);

    // 4. Test effect execution
    expect(effectCallback).toBeDefined();
    const cleanup = effectCallback();

    // 5. Test event listeners registration
    expect(listeners['online']).toBeDefined();
    expect(listeners['offline']).toBeDefined();

    // 6. Trigger offline
    Object.defineProperty(global.navigator, 'onLine', { value: false, configurable: true });
    listeners['offline']();
    expect(currentState).toBe(false);

    // 7. Trigger online
    Object.defineProperty(global.navigator, 'onLine', { value: true, configurable: true });
    listeners['online']();
    expect(currentState).toBe(true);

    // 8. Test cleanup
    cleanup();
    expect(listeners['online']).toBeUndefined();
    expect(listeners['offline']).toBeUndefined();

    // Clean up globals
    (global as any).window = originalWindow;
    delete (global as any).navigator;
    delete requireCache[require.resolve('react')];
  });

  test('handles undefined window object safely', () => {
    let effectCallback: any;

    const mockReact = {
      useState: (initial: any) => [initial, () => {}],
      useEffect: (cb: any, _deps: any) => { effectCallback = cb; }
    };

    const requireCache = require.cache;
    requireCache[require.resolve('react')] = { exports: mockReact } as NodeModule;

    const originalWindow = global.window;

    delete (global as any).window;

    // Remove the hook from cache to ensure it re-evaluates the typeof window !== 'undefined'
    delete requireCache[require.resolve('../../src/hooks/useOnlineStatus')];
    const { useOnlineStatus } = require('../../src/hooks/useOnlineStatus');
    const result = useOnlineStatus();

    // It should default to true when window is undefined
    expect(result).toBe(true);
    expect(effectCallback).toBeDefined();

    // Should return early and not throw
    const cleanup = effectCallback();
    expect(cleanup).toBeUndefined();

    (global as any).window = originalWindow;
    delete requireCache[require.resolve('react')];
  });
});
