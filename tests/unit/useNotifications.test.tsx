/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { useNotifications } from '../../src/hooks/useNotifications';
import { NotificationService } from '../../src/services/notificationService';
import { expect, test, vi, describe, afterEach, beforeEach } from 'vitest';

vi.mock('../../src/services/notificationService', () => ({
    NotificationService: {
        getNotifications: vi.fn(),
        markNotificationRead: vi.fn(),
        addNotification: vi.fn()
    }
}));

// Provide minimal mock for Supabase
vi.mock('../../src/lib/supabase', () => ({
    supabase: {
        channel: () => ({
            on: () => ({
                subscribe: () => ({})
            })
        }),
        removeChannel: () => {}
    }
}));

describe('useNotifications error path', () => {
    let originalWindow: any;
    let originalNotification: any;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        originalWindow = (globalThis as any).window;
        originalNotification = (globalThis as any).Notification;

        const mockNotification = {
            permission: 'denied',
            requestPermission: vi.fn().mockResolvedValue('denied')
        };
        (globalThis as any).Notification = mockNotification;

        if (typeof window !== 'undefined') {
            (window as any).Notification = mockNotification;
        } else {
             (globalThis as any).window = {
                Notification: mockNotification
             }
        }
    });

    afterEach(() => {
        vi.restoreAllMocks();
        cleanup();
        (globalThis as any).window = originalWindow;
        (globalThis as any).Notification = originalNotification;
    });

    test('handles error when fetching notifications', async () => {
        const testError = new Error('Network failure');
        vi.mocked(NotificationService.getNotifications).mockRejectedValue(testError);

        const { result } = renderHook(() => useNotifications('test-profile'));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Failed to fetch notifications:', testError);
        });

        // Notifications should remain empty
        expect(result.current.notificationsArray).toEqual([]);
        expect(result.current.unreadCount).toBe(0);
    });
});
