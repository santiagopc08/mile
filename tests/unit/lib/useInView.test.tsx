import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';

describe('useInView', () => {
    let mockObserve: Mock;
    let mockUnobserve: Mock;
    let mockDisconnect: Mock;
    let intersectionCallback: IntersectionObserverCallback | null = null;
    let originalIntersectionObserver: any;

    beforeEach(() => {
        mockObserve = vi.fn();
        mockUnobserve = vi.fn();
        mockDisconnect = vi.fn();
        intersectionCallback = null;
        originalIntersectionObserver = global.IntersectionObserver;

        class MockObserver {
            constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
                intersectionCallback = callback;
            }
            observe = mockObserve;
            unobserve = mockUnobserve;
            disconnect = mockDisconnect;
        }

        vi.stubGlobal('IntersectionObserver', MockObserver);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
        vi.resetModules();
    });

    const getUseInView = async () => {
        const mod = await import('../../../src/lib/useInView');
        return mod.useInView;
    };

    it('returns ref and inView boolean correctly initialized', async () => {
        const useInView = await getUseInView();
        const { result } = renderHook(() => useInView());
        expect(result.current.ref).toBeDefined();
        expect(result.current.inView).toBe(false);
    });

    it('observes the element when ref is populated', async () => {
        const useInView = await getUseInView();
        const div = document.createElement('div');

        renderHook(() => {
            const hook = useInView();
            hook.ref.current = div;
            return hook;
        });

        expect(mockObserve).toHaveBeenCalledWith(div);
    });

    it('sets inView to true when element intersects', async () => {
        const useInView = await getUseInView();
        const div = document.createElement('div');
        const { result } = renderHook(() => {
            const hook = useInView();
            hook.ref.current = div;
            return hook;
        });

        expect(result.current.inView).toBe(false);

        act(() => {
            if (intersectionCallback) {
                intersectionCallback(
                    [{ isIntersecting: true, target: div } as unknown as IntersectionObserverEntry],
                    {} as any
                );
            }
        });

        expect(result.current.inView).toBe(true);
    });

    it('toggles inView back to false when element leaves viewport (once: false)', async () => {
        const useInView = await getUseInView();
        const div = document.createElement('div');
        const { result } = renderHook(() => {
            const hook = useInView({ once: false });
            hook.ref.current = div;
            return hook;
        });

        act(() => {
            if (intersectionCallback) {
                intersectionCallback(
                    [{ isIntersecting: true, target: div } as unknown as IntersectionObserverEntry],
                    {} as any
                );
            }
        });

        expect(result.current.inView).toBe(true);

        act(() => {
            if (intersectionCallback) {
                intersectionCallback(
                    [{ isIntersecting: false, target: div } as unknown as IntersectionObserverEntry],
                    {} as any
                );
            }
        });

        expect(result.current.inView).toBe(false);
        expect(mockUnobserve).not.toHaveBeenCalled();
    });

    it('stops observing after first intersection if once: true', async () => {
        const useInView = await getUseInView();
        const div = document.createElement('div');
        const { result } = renderHook(() => {
            const hook = useInView({ once: true });
            hook.ref.current = div;
            return hook;
        });

        act(() => {
            if (intersectionCallback) {
                intersectionCallback(
                    [{ isIntersecting: true, target: div } as unknown as IntersectionObserverEntry],
                    {} as any
                );
            }
        });

        expect(result.current.inView).toBe(true);
        expect(mockUnobserve).toHaveBeenCalledWith(div);
    });

    it('unobserves element on unmount', async () => {
        const useInView = await getUseInView();
        const div = document.createElement('div');
        const { unmount } = renderHook(() => {
            const hook = useInView();
            hook.ref.current = div;
            return hook;
        });

        unmount();

        expect(mockUnobserve).toHaveBeenCalledWith(div);
    });

    it('falls back to inView: true if IntersectionObserver is unsupported', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const useInView = await getUseInView();

        const div = document.createElement('div');
        const { result } = renderHook(() => {
            const hook = useInView();
            hook.ref.current = div;
            return hook;
        });

        expect(result.current.inView).toBe(true);
    });
});
