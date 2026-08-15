import React from 'react';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StoreProvider, useStore } from '../../src/context/StoreContext';
import { useProfile } from '../../src/context/ProfileContext';
import { supabase } from '../../src/lib/supabase';

// Mock dependencies
vi.mock('../../src/context/ProfileContext', () => ({
    useProfile: vi.fn(),
}));

const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
};

vi.mock('../../src/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
        },
        channel: vi.fn(() => mockChannel),
        removeChannel: vi.fn(),
    }
}));

const TestComponent = ({ updatePayload }: { updatePayload?: any }) => {
    const { data, isLoading, refreshData, updateData } = useStore();
    return (
        <div>
            <div data-testid="loading">{isLoading ? 'Loading...' : 'Loaded'}</div>
            <div data-testid="data">{JSON.stringify(data)}</div>
            <button data-testid="update-btn" onClick={() => updateData(updatePayload || { healthHabits: [] })}>Update</button>
            <button data-testid="refresh-btn" onClick={() => refreshData()}>Refresh</button>
        </div>
    );
};

describe('StoreContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
        cleanup();
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        cleanup();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('should throw error if useStore is used outside of StoreProvider', () => {
        // Suppress console.error for the expected error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<TestComponent />)).toThrow('useStore must be used within a StoreProvider');
        consoleSpy.mockRestore();
    });

    it('should not fetch data if not authenticated', async () => {
        (useProfile as any).mockReturnValue({ isAuthenticated: false });

        render(
            <StoreProvider>
                <TestComponent />
            </StoreProvider>
        );

        expect(screen.getByTestId('loading').textContent).toBe('Loaded');
        expect(screen.getByTestId('data').textContent).toBe('null');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch data when authenticated', async () => {
        (useProfile as any).mockReturnValue({ isAuthenticated: true });
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { access_token: 'mock-token' } }
        });

        const mockData = { healthHabits: [{ id: '1' }] };
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        render(
            <StoreProvider>
                <TestComponent />
            </StoreProvider>
        );

        expect(screen.getByTestId('loading').textContent).toBe('Loading...');

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('Loaded');
        }, { timeout: 1000 });

        expect(screen.getByTestId('data').textContent).toBe(JSON.stringify(mockData));
        expect(global.fetch).toHaveBeenCalledWith('/api/store', {
            headers: { Authorization: 'Bearer mock-token' }
        });
    });

    it('should handle optimistic updates correctly and refetch', async () => {
        (useProfile as any).mockReturnValue({ isAuthenticated: true });
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { access_token: 'mock-token' } }
        });

        const mockData = {
            commitments: [{ id: '1', completed: false }],
            dailyProgress: { todayCompleted: 0, todayTotal: 1 }
        };

        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockData
            })
            .mockResolvedValueOnce({
                ok: true // PUT request
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ ...mockData, commitments: [{ id: '1', completed: true }] })
            });

        const updatePayload = {
            commitments: [{ id: '1', completed: true }]
        };

        render(
            <StoreProvider>
                <TestComponent updatePayload={updatePayload} />
            </StoreProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('Loaded');
        }, { timeout: 1000 });

        expect(screen.getByTestId('data').textContent).toBe(JSON.stringify(mockData));

        // Trigger update
        act(() => {
            screen.getByTestId('update-btn').click();
        });

        // The optimistic update should happen immediately
        await waitFor(() => {
            const dataText = screen.getByTestId('data').textContent;
            expect(dataText).toContain('"todayCompleted":1');
            expect(dataText).toContain('"todayTotal":1');
        }, { timeout: 1000 });

        // Wait for the re-fetch to complete
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(3); // 1 initial, 1 PUT, 1 refetch
        }, { timeout: 1000 });
    });

    it('should handle realtime db changes via channel', async () => {
        (useProfile as any).mockReturnValue({ isAuthenticated: true });
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { access_token: 'mock-token' } }
        });

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({})
        });

        render(
            <StoreProvider>
                <TestComponent />
            </StoreProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('Loaded');
        }, { timeout: 1000 });

        // initial fetch
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // find the on handler callback
        let postgresChangesCallback: any = null;
        const calls = (mockChannel.on as any).mock.calls;
        for (const call of calls) {
            if (call[0] === 'postgres_changes') {
                postgresChangesCallback = call[2]; // the callback function
                break;
            }
        }

        expect(postgresChangesCallback).not.toBeNull();

        // trigger an event
        act(() => {
            postgresChangesCallback({ table: 'tasks' });
        });

        // advance timer for the debounce timeout
        act(() => {
            vi.advanceTimersByTime(600);
        });

        // should fetch again
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(global.fetch).toHaveBeenCalledWith('/api/store?tables=tasks', expect.anything());
        }, { timeout: 1000 });
    });
});
