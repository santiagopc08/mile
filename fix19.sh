cat << 'INNER_EOF' > tests/components/timeline/TimelineCommentsDrawer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimelineCommentsDrawer } from '../../../src/components/timeline/TimelineCommentsDrawer';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to mock the contexts
import { useStore } from '../../../src/context/StoreContext';
import { useProfile } from '../../../src/context/ProfileContext';
import { useToast } from '../../../src/components/ui/Toast';

vi.mock('../../../src/context/StoreContext', () => ({
    useStore: vi.fn()
}));

vi.mock('../../../src/context/ProfileContext', () => ({
    useProfile: vi.fn()
}));

vi.mock('../../../src/components/ui/Toast', () => ({
    useToast: vi.fn()
}));

describe('TimelineCommentsDrawer Component', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.clearAllMocks();
    });

    it('handleDeleteComment should handle fetch error and show alert', async () => {
        let alertMessage = '';
        const mockError = vi.fn((msg) => { alertMessage = msg; });
        const mockConfirm = vi.fn().mockResolvedValue(true);
        const mockUpdateData = vi.fn();

        (useStore as any).mockReturnValue({
            data: { events: [] },
            updateData: mockUpdateData
        });
        (useProfile as any).mockReturnValue({ profile: 'el' });
        (useToast as any).mockReturnValue({
            error: mockError,
            success: vi.fn(),
            confirm: mockConfirm
        });

        global.fetch = vi.fn().mockRejectedValue(new Error('Delete API failed'));

        const mockEvent = {
            id: 'event1',
            title: 'Test Event',
            date: '2024-01-01',
            comments: [
                { id: 'comment1', text: 'Test comment', author: 'el', createdAt: new Date().toISOString() }
            ]
        };

        const { container } = render(
            <TimelineCommentsDrawer activeEvent={mockEvent as any} setActiveEventId={vi.fn()} />
        );

        // Wait for it to render
        const button = container.querySelector('button.text-\\[\\#594137\\]'); // Delete button
        if (!button) {
            // Find any button inside the comment item
            const buttons = container.querySelectorAll('button');
            for(let i=0; i<buttons.length; i++) {
                 if(buttons[i].className.includes('absolute right-3')) {
                     fireEvent.click(buttons[i]);
                     break;
                 }
            }
        } else {
             fireEvent.click(button);
        }

        // It needs a moment for async stuff
        await waitFor(() => {
            expect(mockError).toHaveBeenCalled();
        });

        expect(mockError.mock.calls[0][0]).toContain('No se pudo eliminar el comentario: Delete API failed');
    });
});
INNER_EOF
