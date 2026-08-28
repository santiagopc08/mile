import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SystemSettings } from '@/components/SystemSettings';
import { ProfileProvider } from '@/context/ProfileContext';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';

// Mock dependencies
vi.mock('@/lib/sound', () => ({
  sound: {
    isEnabled: vi.fn(() => true),
    setEnabled: vi.fn(),
    playTick: vi.fn(),
    playSuccess: vi.fn(),
    playError: vi.fn()
  }
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    isEnabled: vi.fn(() => true),
    setEnabled: vi.fn(),
    triggerTick: vi.fn(),
    triggerSuccess: vi.fn(),
    triggerError: vi.fn()
  }
}));

vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => true)
}));

vi.mock('@/context/ProfileContext', () => ({
  useProfile: () => ({ profile: 'ella' }),
  ProfileProvider: ({ children }: any) => <>{children}</>
}));

let originalNotification: any;
let originalPushManager: any;
let originalServiceWorker: any;

beforeEach(() => {
  originalNotification = (window as any).Notification;
  originalPushManager = (window as any).PushManager;
  originalServiceWorker = (navigator as any).serviceWorker;
});

afterEach(() => {
  if (originalNotification) {
      (window as any).Notification = originalNotification;
      (global as any).Notification = originalNotification;
  } else {
      delete (window as any).Notification;
      delete (global as any).Notification;
  }

  if (originalPushManager) {
      (window as any).PushManager = originalPushManager;
  } else {
      delete (window as any).PushManager;
  }

  if (originalServiceWorker) {
      (navigator as any).serviceWorker = originalServiceWorker;
  } else {
      delete (navigator as any).serviceWorker;
  }

  vi.clearAllMocks();
  cleanup();
});

describe('SystemSettings - Notification Error Handling', () => {
  it('should handle Notification.requestPermission errors gracefully', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const mockRequestPermission = vi.fn().mockRejectedValue(new Error('Permission request failed'));

    const MockNotification = {
      permission: 'default',
      requestPermission: mockRequestPermission
    };

    // Need to set it on both window and global to avoid "Notification is not defined" because in standard TS/JS without window prefix it looks up the global.
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: MockNotification
    });

    Object.defineProperty(global, 'Notification', {
      writable: true,
      configurable: true,
      value: MockNotification
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {}
    });

    Object.defineProperty(window, 'PushManager', {
      writable: true,
      configurable: true,
      value: {}
    });

    render(<SystemSettings />);

    // Open settings
    const toggleButton = screen.getByRole('button', { name: /Consola de Configuración/i });
    fireEvent.click(toggleButton);

    // Find and click "Activar Alertas Push" button
    await waitFor(() => {
        expect(screen.getByText('Activar Alertas Push')).toBeDefined();
    });

    const requestButton = screen.getByText('Activar Alertas Push');

    await act(async () => {
      fireEvent.click(requestButton);
    });

    // We need to wait for the mocked promise rejection to be caught in the component
    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to request notification permission:',
        expect.any(Error)
      );
    });

    expect(consoleWarnSpy.mock.calls[0][1].message).toBe('Permission request failed');

    // Verify it didn't play success sounds/haptics when failing
    expect(sound.playSuccess).not.toHaveBeenCalled();
    expect(haptics.triggerSuccess).not.toHaveBeenCalled();

    // Restore
    consoleWarnSpy.mockRestore();
  });
});
