/** @vitest-environment jsdom */
import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMovementData } from '@/components/health/movement/useMovementData';
import { supabase } from '@/lib/supabase';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import { MovementSession, ReactionType } from '@/components/health/movement/types';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
        })),
    }
}));

vi.mock('@/lib/sound', () => ({
    sound: {
        playSave: vi.fn(),
        playError: vi.fn(),
    }
}));

vi.mock('@/lib/haptics', () => ({
    haptics: {
        triggerSave: vi.fn(),
        triggerError: vi.fn(),
    }
}));

const mockSessions: MovementSession[] = [
    { id: '1', date: '2023-10-01', title: 'Run', description: '', created_at: '', reactions: [] },
    { id: '2', date: '2023-10-02', title: 'Walk', description: '', created_at: '', reactions: [] },
];

describe('useMovementData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        cleanup();
    });

    it('fetches sessions successfully from Supabase', async () => {
        const mockSelect = vi.fn().mockResolvedValue({ data: mockSessions, error: null });
        const mockOrder = vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ select: mockSelect, order: vi.fn().mockReturnThis() }) });

        const selectObj = {
            order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockSessions, error: null })
            })
        };

        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue(selectObj),
            delete: vi.fn(),
            eq: vi.fn(),
            update: vi.fn(),
        } as any);

        const { result } = renderHook(() => useMovementData('user1'));

        expect(result.current.loading).toBe(true);

        await act(async () => {
            // wait for initial fetch to complete
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.sessions).toEqual(mockSessions);
        expect(result.current.isUsingLocalStorage).toBe(false);
        expect(supabase.from).toHaveBeenCalledWith('movement_sessions');
    });

    it('falls back to localStorage when Supabase fails', async () => {
        const selectObj = {
            order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') })
            })
        };

        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue(selectObj),
            delete: vi.fn(),
            eq: vi.fn(),
            update: vi.fn(),
        } as any);

        localStorage.setItem('movement_sessions', JSON.stringify([{ id: 'local1' }]));

        const { result } = renderHook(() => useMovementData('user1'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.isUsingLocalStorage).toBe(true);
        expect(result.current.sessions).toEqual([{ id: 'local1' }]);
    });

    it('deletes a session successfully via Supabase', async () => {
        const selectObj = {
            order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockSessions, error: null })
            })
        };

        const deleteObj = {
            eq: vi.fn().mockResolvedValue({ error: null })
        };

        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue(selectObj),
            delete: vi.fn().mockReturnValue(deleteObj),
            eq: vi.fn(),
            update: vi.fn(),
        } as any);

        const { result } = renderHook(() => useMovementData('user1'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const notifyError = vi.fn();

        await act(async () => {
            await result.current.handleDeleteSession('1', notifyError);
        });

        expect(supabase.from).toHaveBeenCalledWith('movement_sessions');
        expect(deleteObj.eq).toHaveBeenCalledWith('id', '1');
        expect(notifyError).not.toHaveBeenCalled();
    });

    it('deletes a session when using localStorage fallback', async () => {
        // Force fallback
        const selectObj = {
            order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') })
            })
        };

        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue(selectObj),
            delete: vi.fn(),
            eq: vi.fn(),
            update: vi.fn(),
        } as any);

        localStorage.setItem('movement_sessions', JSON.stringify(mockSessions));

        const { result } = renderHook(() => useMovementData('user1'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const notifyError = vi.fn();

        await act(async () => {
            await result.current.handleDeleteSession('1', notifyError);
        });

        expect(result.current.sessions).toHaveLength(1);
        expect(result.current.sessions[0].id).toBe('2');
        expect(JSON.parse(localStorage.getItem('movement_sessions')!)).toHaveLength(1);
    });

    it('notifies error when deleting a session via Supabase fails', async () => {
        const selectObj = {
            order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockSessions, error: null })
            })
        };

        const deleteObj = {
            eq: vi.fn().mockResolvedValue({ error: new Error('Delete error') })
        };

        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue(selectObj),
            delete: vi.fn().mockReturnValue(deleteObj),
            eq: vi.fn(),
            update: vi.fn(),
        } as any);

        const { result } = renderHook(() => useMovementData('user1'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const notifyError = vi.fn();

        await act(async () => {
            try {
                await result.current.handleDeleteSession('1', notifyError);
            } catch (e) {
                // ignore
            }
        });

        expect(notifyError).toHaveBeenCalledWith('No se pudo eliminar la sesión. Sigue en tu historial.');
    });

    it('adds a reaction successfully via Supabase', async () => {
        const selectObj = {
            order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockSessions, error: null })
            })
        };

        const updateObj = {
            eq: vi.fn().mockResolvedValue({ error: null })
        };

        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue(selectObj),
            delete: vi.fn(),
            update: vi.fn().mockReturnValue(updateObj),
            eq: vi.fn(),
        } as any);

        const { result } = renderHook(() => useMovementData('user1'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.handleAddReaction('1', 'fire');
        });

        expect(supabase.from).toHaveBeenCalledWith('movement_sessions');
        expect(updateObj.eq).toHaveBeenCalledWith('id', '1');
        expect(sound.playSave).toHaveBeenCalled();
        expect(haptics.triggerSave).toHaveBeenCalled();
    });

    it('adds a reaction when using localStorage fallback', async () => {
        const selectObj = {
            order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') })
            })
        };

        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue(selectObj),
            delete: vi.fn(),
            update: vi.fn(),
            eq: vi.fn(),
        } as any);

        localStorage.setItem('movement_sessions', JSON.stringify(mockSessions));

        const { result } = renderHook(() => useMovementData('user1'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.handleAddReaction('1', 'fire');
        });

        expect(result.current.sessions[0].reactions).toHaveLength(1);
        expect(result.current.sessions[0].reactions[0].type).toBe('fire');
        const stored = JSON.parse(localStorage.getItem('movement_sessions')!);
        expect(stored[0].reactions).toHaveLength(1);

        expect(sound.playSave).toHaveBeenCalled();
        expect(haptics.triggerSave).toHaveBeenCalled();
    });

    it('plays error sound/haptics when adding reaction fails via Supabase', async () => {
        const selectObj = {
            order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockSessions, error: null })
            })
        };

        const updateObj = {
            eq: vi.fn().mockResolvedValue({ error: new Error('Update error') })
        };

        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue(selectObj),
            delete: vi.fn(),
            update: vi.fn().mockReturnValue(updateObj),
            eq: vi.fn(),
        } as any);

        const { result } = renderHook(() => useMovementData('user1'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.handleAddReaction('1', 'fire');
        });

        expect(sound.playError).toHaveBeenCalled();
        expect(haptics.triggerError).toHaveBeenCalled();
    });

    it('returns early when handleAddReaction is called without a profile', async () => {
        const { result } = renderHook(() => useMovementData(null));

        await act(async () => {
            await result.current.handleAddReaction('1', 'fire');
        });

        expect(supabase.from).toHaveBeenCalledTimes(1); // Only for fetch
        expect(sound.playSave).not.toHaveBeenCalled();
    });

    it('returns early when handleAddReaction is called with non-existent session', async () => {
        const selectObj = {
            order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockSessions, error: null })
            })
        };
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue(selectObj),
            delete: vi.fn(),
            update: vi.fn(),
            eq: vi.fn(),
        } as any);

        const { result } = renderHook(() => useMovementData('user1'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.handleAddReaction('nonexistent', 'fire');
        });

        expect(sound.playSave).not.toHaveBeenCalled();
    });
});
