// Just to find out what indices are what in useState
import { test } from '@playwright/test';
import { Timeline } from './src/components/Timeline';
import React from 'react';

function withFakeReactDispatcher(callback: () => void) {
    const ReactInternals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE || (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    if (ReactInternals) {
        const prevDispatcher = ReactInternals.H;
        let stateIndex = 0;

        ReactInternals.H = {
            useContext: () => ({ updateData: () => {}, profile: { role: 'el' } }),
            useState: (initial: any) => {
                const currentIndex = stateIndex++;
                console.log(`State index ${currentIndex}:`, initial);
                return [initial, () => {}];
            },
            useEffect: () => {},
            useMemo: (factory: any) => factory()
        };
        try { callback(); } finally { ReactInternals.H = prevDispatcher; }
    } else { callback(); }
}

test('find state indices', () => {
    withFakeReactDispatcher(() => {
        Timeline({ events: [] });
    });
});
