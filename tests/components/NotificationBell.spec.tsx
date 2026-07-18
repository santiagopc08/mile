import { test, expect } from '@playwright/test';
import { NotificationBell } from '../../src/components/NotificationBell';
import { NotificationService } from '../../src/services/notificationService';
import React from 'react';

function withFakeReactDispatcher(callback: () => void) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ReactInternals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE || (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    if (ReactInternals) {
        const prevDispatcher = ReactInternals.H;
        const mockStates: unknown[] = [];
        let stateIndex = 0;

        ReactInternals.H = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
            useContext: (_context: any) => {
                return {
                    profile: 'el'
                };
            },
            useState: (initial: unknown) => {
                const currentIndex = stateIndex++;
                if (mockStates[currentIndex] === undefined) {
                    mockStates[currentIndex] = typeof initial === 'function' ? initial() : initial;

                    if (currentIndex === 0) {
                        // The notifications state
                        mockStates[currentIndex] = [{ id: 'test-1', read: false, type: 'timeline', content: { title: 'Test' } }];
                    } else if (currentIndex === 1) {
                        // isOpen state, we need it to be true to render the list of notifications
                        mockStates[currentIndex] = true;
                    }
                }

                return [
                    mockStates[currentIndex],
                    (newVal: unknown) => {
                        const val = typeof newVal === 'function' ? newVal(mockStates[currentIndex]) : newVal;
                        mockStates[currentIndex] = val;
                    }
                ];
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            useRef: (initial: any) => {
                return { current: initial || new Set() };
            },
            useEffect: () => {},
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            useMemo: (cb: any) => cb(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            useCallback: (cb: any) => cb
        };

        try {
            callback();
        } finally {
            ReactInternals.H = prevDispatcher;
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findHandlersWithId(element: any, idToFind: string, handlerName: string): any[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handlers: any[] = [];
    if (!element) return handlers;

    if (element.props && element.props[handlerName] && element.key === idToFind) {
        handlers.push(element.props[handlerName]);
    }

    if (element.props && element.props.children) {
        const children = Array.isArray(element.props.children) ? element.props.children : [element.props.children];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children.forEach((child: any) => {
            handlers = handlers.concat(findHandlersWithId(child, idToFind, handlerName));
        });
    }

    return handlers;
}

test.describe('NotificationBell', () => {
    test('handleRead should catch error and log it when NotificationService.markNotificationRead throws', async () => {
        let loggedError: unknown = null;
        const originalConsoleError = console.error;
        console.error = (msg: string, err: unknown) => {
            if (msg === 'Failed to mark read:') {
                loggedError = err;
            }
        };

        const originalMarkRead = NotificationService.markNotificationRead;
        NotificationService.markNotificationRead = async () => {
            throw new Error('Test read error');
        };

        let onClickHandlers: unknown[] = [];
        withFakeReactDispatcher(() => {
            const element = NotificationBell({ align: 'right' });
            onClickHandlers = findHandlersWithId(element, 'test-1', 'onClick');
        });

        expect(onClickHandlers.length).toBeGreaterThan(0);

        for (const handler of onClickHandlers) {
            const res = handler();
            if (res instanceof Promise) {
                await res;
            }
        }

        expect(loggedError).toBeInstanceOf(Error);
        expect(loggedError.message).toBe('Test read error');

        console.error = originalConsoleError;
        NotificationService.markNotificationRead = originalMarkRead;
    });
});
