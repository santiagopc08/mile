import { test, expect } from '@playwright/test';
import { VisibilityProvider, useVisibility } from '../../src/context/VisibilityContext';
import React from 'react';

// In Next.js/React 19 projects without React Testing Library configuration for the node test runner,
// Playwright Babel transpiles JSX in a way that creates raw objects instead of React Elements,
// preventing `renderHook` and `@testing-library/react` from mounting components.
// To deeply unit test Context logic and hooks synchronously without the overhead of E2E,
// we provide a fake React dispatcher to intercept `useState` and `useContext` calls.
function withFakeReactDispatcher(callback: () => void) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ReactInternals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE || (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    if (ReactInternals) {
        const prevDispatcher = ReactInternals.H;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let mockState: any;
        ReactInternals.H = {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
            useContext: (_context: any) => {
                // Return undefined to simulate calling outside of a provider
                return undefined;
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            useState: (initial: any) => {
                if (mockState === undefined) mockState = initial;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return [mockState, (updater: any) => {
                    mockState = typeof updater === 'function' ? updater(mockState) : updater;
                }];
            }
        };
        try {
            callback();
        } finally {
            ReactInternals.H = prevDispatcher;
        }
    } else {
        // Fallback for unexpected React environments
        callback();
    }
}

test.describe('VisibilityContext Component', () => {

    test('should throw error when useVisibility is used outside of VisibilityProvider', () => {
        withFakeReactDispatcher(() => {
            expect(() => useVisibility()).toThrow('useVisibility must be used within a VisibilityProvider');
        });
    });

    test('VisibilityProvider should manage state correctly', () => {
        withFakeReactDispatcher(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const providerElement: any = VisibilityProvider({ children: null });
            const contextValue = providerElement.props.value;

            // 1. Initial State
            expect(contextValue.mode).toBe('me');

            // 2. toggleMode toggles to "us"
            contextValue.toggleMode();

            // Re-render simulates the state update triggering a new render cycle
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const providerElement2: any = VisibilityProvider({ children: null });
            expect(providerElement2.props.value.mode).toBe('us');

            // 3. toggleMode toggles back to "me"
            providerElement2.props.value.toggleMode();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const providerElement3: any = VisibilityProvider({ children: null });
            expect(providerElement3.props.value.mode).toBe('me');

            // 4. setMode sets explicit values
            providerElement3.props.value.setMode('us');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const providerElement4: any = VisibilityProvider({ children: null });
            expect(providerElement4.props.value.mode).toBe('us');
        });
    });
});
