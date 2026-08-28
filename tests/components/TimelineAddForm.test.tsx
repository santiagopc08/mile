import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimelineAddForm } from '@/components/timeline/TimelineAddForm';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/components/ui/Toast';
import { TimelineService } from '@/services/timelineService';

vi.mock('@/context/StoreContext', () => ({
    useStore: vi.fn(),
}));

vi.mock('@/context/ProfileContext', () => ({
    useProfile: vi.fn(),
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: vi.fn(),
}));

vi.mock('@/services/timelineService', () => ({
    TimelineService: {
        uploadTimelineImage: vi.fn(),
    },
}));

vi.mock('@/services/notificationService', () => ({
    NotificationService: {
        addNotification: vi.fn().mockResolvedValue(undefined),
    },
}));

describe('TimelineAddForm', () => {
    const mockUpdateData = vi.fn();
    const mockNotifyError = vi.fn();
    const mockSetIsAdding = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        (useStore as any).mockReturnValue({ updateData: mockUpdateData });
        (useProfile as any).mockReturnValue({ profile: 'el' });
        (useToast as any).mockReturnValue({ error: mockNotifyError });
    });

    afterEach(() => {
        cleanup();
    });

    it('should handle image upload error and show toast', async () => {
        const user = userEvent.setup();
        const testError = new Error('Upload failed');
        (TimelineService.uploadTimelineImage as any).mockRejectedValueOnce(testError);

        const { container } = render(
            <TimelineAddForm
                events={[]}
                isAdding={true}
                setIsAdding={mockSetIsAdding}
            />
        );

        // Fill out required fields
        await user.type(screen.getByPlaceholderText('Título del recuerdo'), 'Test Title');

        const dateInput = container.querySelector('input[name="date"]') as HTMLInputElement;
        fireEvent.change(dateInput, { target: { value: '2023-01-01' } });

        await user.type(screen.getByPlaceholderText('Nuestra historia dice...'), 'Test Description');

        // Add file
        const file = new File(['hello'], 'hello.png', { type: 'image/png' });
        const fileInput = container.querySelector('input[name="image"]') as HTMLInputElement;
        await user.upload(fileInput, file);

        // Submit the form
        const submitButton = screen.getByText('Guardar Recuerdo');
        await user.click(submitButton);

        // Assert that the upload function was called
        expect(TimelineService.uploadTimelineImage).toHaveBeenCalledWith(file);

        // Assert that the error notification was shown
        await waitFor(() => {
            expect(mockNotifyError).toHaveBeenCalledWith('No se pudo subir la imagen: Upload failed');
        });

        // Ensure the loading state is reset
        expect(submitButton).not.toBeDisabled();
        expect(submitButton).toHaveTextContent('Guardar Recuerdo');
    });
});
