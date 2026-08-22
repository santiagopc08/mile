import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useInView', () => {
    let mockObserve: any;
    let mockUnobserve: any;
    let mockDisconnect: any;
    let observerCallback: IntersectionObserverCallback;
    let originalIntersectionObserver: any;

    beforeEach(() => {
        originalIntersectionObserver = global.IntersectionObserver;

        mockObserve = vi.fn();
        mockUnobserve = vi.fn();
        mockDisconnect = vi.fn();

        class MockIntersectionObserver {
            constructor(callback: IntersectionObserverCallback) {
                observerCallback = callback;
            }
            observe = mockObserve;
            unobserve = mockUnobserve;
            disconnect = mockDisconnect;
        }

        global.IntersectionObserver = MockIntersectionObserver as any;
        vi.resetModules();
    });

    afterEach(() => {
        global.IntersectionObserver = originalIntersectionObserver;
        vi.clearAllMocks();
    });

    it('should fallback to inView=true if IntersectionObserver is missing', async () => {
        global.IntersectionObserver = undefined as any;
        const { useInView } = await import('@/lib/useInView');

        const div = document.createElement('div');
        const { result } = renderHook(() => {
            const hook = useInView();
            // Force the ref to point to our div so useEffect runs
            hook.ref.current = div as any;
            return hook;
        });

        // The fallback should set inView to true
        expect(result.current.inView).toBe(true);
    });

    it('should set inView to true when element intersects', async () => {
        const { useInView } = await import('@/lib/useInView');

        const div = document.createElement('div');
        const { result } = renderHook(() => {
            const hook = useInView();
            hook.ref.current = div as any;
            return hook;
        });

        expect(result.current.inView).toBe(false);
        expect(mockObserve).toHaveBeenCalledWith(div);

        // Simulate intersection
        act(() => {
            observerCallback([{ target: div, isIntersecting: true } as any], {} as any);
        });

        expect(result.current.inView).toBe(true);
    });

    it('should unobserve when once is true and element intersects', async () => {
        const { useInView } = await import('@/lib/useInView');

        const div = document.createElement('div');
        const { result } = renderHook(() => {
            const hook = useInView({ once: true });
            hook.ref.current = div as any;
            return hook;
        });

        expect(mockObserve).toHaveBeenCalledWith(div);

        // Simulate intersection
        act(() => {
            observerCallback([{ target: div, isIntersecting: true } as any], {} as any);
        });

        expect(result.current.inView).toBe(true);
        expect(mockUnobserve).toHaveBeenCalledWith(div);
    });

    it('should not unobserve when once is true but element does not intersect', async () => {
        const { useInView } = await import('@/lib/useInView');

        const div = document.createElement('div');
        const { result } = renderHook(() => {
            const hook = useInView({ once: true });
            hook.ref.current = div as any;
            return hook;
        });

        expect(mockObserve).toHaveBeenCalledWith(div);

        // Simulate non-intersection
        act(() => {
            observerCallback([{ target: div, isIntersecting: false } as any], {} as any);
        });

        expect(result.current.inView).toBe(false);
        expect(mockUnobserve).not.toHaveBeenCalled();
    });

    it('should unobserve on unmount', async () => {
        const { useInView } = await import('@/lib/useInView');

        const div = document.createElement('div');
        const { unmount } = renderHook(() => {
            const hook = useInView();
            hook.ref.current = div as any;
            return hook;
        });

        expect(mockObserve).toHaveBeenCalledWith(div);

        unmount();

        expect(mockUnobserve).toHaveBeenCalledWith(div);
    });
});
