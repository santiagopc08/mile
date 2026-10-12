import { renderHook, act } from '@testing-library/react';
import { usePomodoroTimer, PRESETS } from '@/components/symmetry/pomodoro/usePomodoroTimer';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock dependencies
vi.mock('@/context/StoreContext', () => ({
  useStore: vi.fn()
}));

vi.mock('@/context/ProfileContext', () => ({
  useProfile: vi.fn()
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    triggerTick: vi.fn(),
    triggerSuccess: vi.fn(),
  }
}));

vi.mock('@/lib/sound', () => ({
  sound: {
    playTick: vi.fn(),
    playSuccess: vi.fn(),
    playSave: vi.fn(),
  }
}));

describe('usePomodoroTimer', () => {
  beforeEach(() => {
    (useStore as any).mockReturnValue({
      data: { tasks: [] },
      updateData: vi.fn()
    });
    (useProfile as any).mockReturnValue({
      profile: 'ella'
    });
    vi.clearAllMocks();
  });

  it('initializes with correct defaults', () => {
    const { result } = renderHook(() => usePomodoroTimer());
    expect(result.current.totalBudget).toBe(25);
    expect(result.current.mode).toBe('work');
    expect(result.current.timeLeft).toBe(25 * 60);
  });

  it('updates total budget correctly', () => {
    const { result } = renderHook(() => usePomodoroTimer());

    act(() => {
      result.current.updateBudget(45);
    });

    expect(result.current.totalBudget).toBe(45);
    // When updating budget while not running, it resets session and sets mode to work
    expect(result.current.currentSession).toBe(1);
    expect(result.current.mode).toBe('work');
  });

  describe('PRESETS', () => {
    it('applies Sprint preset correctly', () => {
        const { result } = renderHook(() => usePomodoroTimer());
        act(() => {
            result.current.updateBudget(PRESETS[0].duration); // 15
        });
        expect(result.current.totalBudget).toBe(15);
    });

    it('applies Clásico preset correctly', () => {
        const { result } = renderHook(() => usePomodoroTimer());
        act(() => {
            result.current.updateBudget(PRESETS[1].duration); // 25
        });
        expect(result.current.totalBudget).toBe(25);
    });

    it('applies Profundo preset correctly', () => {
        const { result } = renderHook(() => usePomodoroTimer());
        act(() => {
            result.current.updateBudget(PRESETS[2].duration); // 45
        });
        expect(result.current.totalBudget).toBe(45);
    });

    it('applies Extendido preset correctly', () => {
        const { result } = renderHook(() => usePomodoroTimer());
        act(() => {
            result.current.updateBudget(PRESETS[3].duration); // 90
        });
        expect(result.current.totalBudget).toBe(90);
    });
  });
});
