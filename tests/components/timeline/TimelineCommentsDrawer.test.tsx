import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { TimelineCommentsDrawer } from '@/components/timeline/TimelineCommentsDrawer';
import * as StoreContext from '@/context/StoreContext';
import * as ProfileContext from '@/context/ProfileContext';
import * as ToastContext from '@/components/ui/Toast';
import { TimelineEvent } from '@/components/timeline/types';

// Mock matchMedia to fix framer-motion errors in jsdom
beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // Deprecated
            removeListener: vi.fn(), // Deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

describe('TimelineCommentsDrawer', () => {
    const mockUpdateData = vi.fn();
    const mockNotifyError = vi.fn();
    const mockSuccess = vi.fn();
    const mockConfirm = vi.fn();

    const activeEvent: TimelineEvent = {
        id: 'event-1',
        title: 'Test Event',
        date: '2023-01-01',
        description: 'Test Description',
        comments: []
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock contexts
        vi.spyOn(StoreContext, 'useStore').mockReturnValue({
            data: { events: [activeEvent] } as any,
            updateData: mockUpdateData,
            isLoading: false,
            refreshData: vi.fn()
        });

        vi.spyOn(ProfileContext, 'useProfile').mockReturnValue({
            profile: 'el',
            isAuthenticated: true,
            login: vi.fn(),
            logout: vi.fn(),
            isLoading: false,
            partner: 'ella',
            canEdit: true
        });

        vi.spyOn(ToastContext, 'useToast').mockReturnValue({
            error: mockNotifyError,
            success: mockSuccess,
            confirm: mockConfirm,
            info: vi.fn(),
            warning: vi.fn()
        });

        // Mock fetch
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should catch error when posting a comment fails and call notifyError', async () => {
        // Arrange
        const mockError = new Error('Simulated network error');
        (global.fetch as any).mockRejectedValueOnce(mockError);

        render(
            <TimelineCommentsDrawer
                activeEvent={activeEvent}
                setActiveEventId={vi.fn()}
            />
        );

        // Wait for the drawer to mount (since it has a mounted state)
        const textarea = screen.getByPlaceholderText(/Escribe algo sobre este momento/i);
        const submitButton = screen.getByRole('button', { name: /Agregar Comentario/i });

        // Act
        fireEvent.change(textarea, { target: { value: 'This is a test comment' } });
        fireEvent.submit(submitButton.closest('form')!);

        // Assert
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/timeline', expect.objectContaining({
                method: 'POST'
            }));
        });

        await waitFor(() => {
            expect(mockNotifyError).toHaveBeenCalledWith(
                `No se pudo publicar el comentario: ${mockError.message}`
            );
        });
    });
});
