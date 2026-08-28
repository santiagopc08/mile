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
            addListener: vi.fn(),
            removeListener: vi.fn(),
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
    const mockConfirm = vi.fn().mockResolvedValue(true);

    const activeEvent: TimelineEvent = {
        id: 'event-1',
        title: 'Test Event',
        date: '2023-01-01',
        description: 'Test Description',
        comments: [
            { id: 'comment1', eventId: 'event-1', text: 'Test comment', author: 'el', createdAt: new Date().toISOString() }
        ]
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
            partner: 'ella',
            canEdit: true
        } as any);

        vi.spyOn(ToastContext, 'useToast').mockReturnValue({
            error: mockNotifyError,
            success: mockSuccess,
            confirm: mockConfirm,
            info: vi.fn(),
            warning: vi.fn(),
            toast: vi.fn(),
            dismiss: vi.fn()
        } as any);

        // Mock fetch
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should catch error when posting a comment fails and call notifyError', async () => {
        const mockError = new Error('Simulated network error');
        (global.fetch as any).mockRejectedValueOnce(mockError);

        render(
            <TimelineCommentsDrawer
                activeEvent={activeEvent}
                setActiveEventId={vi.fn()}
            />
        );

        const textarea = screen.getByPlaceholderText(/Escribe algo sobre este momento/i);
        const submitButton = screen.getByRole('button', { name: /Agregar Comentario/i });

        fireEvent.change(textarea, { target: { value: 'This is a test comment' } });
        fireEvent.submit(submitButton.closest('form')!);

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

    it('handleDeleteComment should handle fetch error and show alert', async () => {
        const mockError = new Error('Delete API failed');
        (global.fetch as any).mockRejectedValueOnce(mockError);

        render(
            <TimelineCommentsDrawer
                activeEvent={activeEvent}
                setActiveEventId={vi.fn()}
            />
        );

        let button: any = null;
        await waitFor(() => {
            const buttons = Array.from(document.body.querySelectorAll('button'));
            button = buttons.find(b => b.className.includes('right-3') || b.className.includes('text-[#594137]'));
            expect(button).toBeTruthy();
        });

        if (button) {
            fireEvent.click(button);

            await waitFor(() => {
                expect(mockConfirm).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(mockNotifyError).toHaveBeenCalledWith(
                    `No se pudo eliminar el comentario: ${mockError.message}`
                );
            });
        }
    });
});
