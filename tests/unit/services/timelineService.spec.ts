import { test, expect } from '@playwright/test';
import { TimelineService } from '../../../src/services/timelineService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockSupabase = (mockData: Record<string, any> = {}, mockError: unknown = null) => {
    let mockUploadCalled = false;
    let mockUploadPath = '';
    let mockUploadFile: File | null = null;

    const chainable = {
        select: () => chainable,
        eq: () => chainable,
        insert: () => chainable,
        update: () => chainable,
        delete: () => chainable,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        then: (resolve: any) => resolve({ data: mockData.default || [], error: mockError }),
    };

    const mockSupabase = {
        storage: {
            from: (bucket: string) => {
                return {
                    upload: async (path: string, file: File) => {
                        mockUploadCalled = true;
                        mockUploadPath = path;
                        mockUploadFile = file;
                        return { data: mockData.upload || null, error: mockError };
                    },
                    getPublicUrl: (path: string) => {
                        return { data: { publicUrl: `https://mock-supabase.com/storage/v1/object/public/${bucket}/${path}` } };
                    }
                };
            }
        },
        from: (table: string) => {
            const tableChainable = { ...chainable };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const wrapWithThen = (base: any, isSingle: boolean = false) => {
                const wrapped = { ...base };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                wrapped.then = (resolve: any) => {
                     let data = mockData[table];
                     if (isSingle) {
                        data = Array.isArray(data) ? data[0] : data;
                     }
                     resolve({ data: data || (isSingle ? null : []), error: mockError });
                };
                return wrapped;
            };

            tableChainable.insert = () => wrapWithThen({ ...tableChainable });
            tableChainable.delete = () => wrapWithThen({ ...tableChainable });
            tableChainable.update = () => wrapWithThen({ ...tableChainable });
            tableChainable.eq = () => wrapWithThen({ ...tableChainable });

            return tableChainable;
        }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    mockSupabase._getUploadData = () => ({ mockUploadCalled, mockUploadPath, mockUploadFile });

    return mockSupabase;
};

test.describe('TimelineService', () => {
    test('uploadTimelineImage should successfully upload and return public URL', async () => {
        const supabase = createMockSupabase({ upload: { path: 'test/path.png' } });
        const mockFile = new File([''], 'test-image.png', { type: 'image/png' });

        const url = await TimelineService.uploadTimelineImage(mockFile, supabase);

        expect(url).toContain('https://mock-supabase.com/storage/v1/object/public/timeline/');
        expect(url).toContain('.png');

        const uploadData = supabase._getUploadData();
        expect(uploadData.mockUploadCalled).toBe(true);
        expect(uploadData.mockUploadFile).toBe(mockFile);
        expect(uploadData.mockUploadPath).toContain('.png');
    });

    test('uploadTimelineImage should handle upload failure', async () => {
        // Suppress console.error during this test
        const originalConsoleError = console.error;
        console.error = () => {};

        const mockError = new Error('Upload failed');
        const supabase = createMockSupabase({}, mockError);
        const mockFile = new File([''], 'test-image.png', { type: 'image/png' });

        try {
            await expect(TimelineService.uploadTimelineImage(mockFile, supabase)).rejects.toThrow('Could not upload image.');
        } finally {
            // Restore console.error
            console.error = originalConsoleError;
        }
    });

    test('uploadTimelineImage should handle unexpected exception during upload', async () => {
        // Suppress console.error during this test
        const originalConsoleError = console.error;
        console.error = () => {};

        const mockError = new Error('Unexpected throw');
        // create a custom mock where upload throws directly
        const supabase = createMockSupabase();
        supabase.storage.from = (bucket: string) => ({
            upload: async () => { throw mockError; },
            getPublicUrl: (path: string) => ({ data: { publicUrl: `https://mock-supabase.com/storage/v1/object/public/${bucket}/${path}` } })
        });

        const mockFile = new File([''], 'test-image.png', { type: 'image/png' });

        try {
            await expect(TimelineService.uploadTimelineImage(mockFile, supabase)).rejects.toThrow('Could not upload image.');
        } finally {
            // Restore console.error
            console.error = originalConsoleError;
        }
    });

    test('addEventComment should insert comment', async () => {
        const supabase = createMockSupabase();

        const comment = { eventId: 'event-1', author: 'el' as const, text: 'Nice event!' };
        await expect(TimelineService.addEventComment(comment, supabase)).resolves.toBeUndefined();
    });

    test('addEventComment should throw on error', async () => {
        const mockError = new Error('Insert failed');
        const supabase = createMockSupabase({}, mockError);

        const comment = { eventId: 'event-1', author: 'el' as const, text: 'Nice event!' };
        await expect(TimelineService.addEventComment(comment, supabase)).rejects.toThrow('Insert failed');
    });

    test('deleteEventComment should delete comment', async () => {
        const supabase = createMockSupabase();

        await expect(TimelineService.deleteEventComment('comment-1', supabase)).resolves.toBeUndefined();
    });

    test('deleteEventComment should throw on error', async () => {
        const mockError = new Error('Delete failed');
        const supabase = createMockSupabase({}, mockError);

        await expect(TimelineService.deleteEventComment('comment-1', supabase)).rejects.toThrow('Delete failed');
    });

    test('reactToEvent should update reactions', async () => {
        const supabase = createMockSupabase();

        const reactions = { like: ['user-1'] };
        await expect(TimelineService.reactToEvent('event-1', reactions, supabase)).resolves.toBeUndefined();
    });

    test('reactToEvent should throw on error', async () => {
        const mockError = new Error('Update failed');
        const supabase = createMockSupabase({}, mockError);

        const reactions = { like: ['user-1'] };
        await expect(TimelineService.reactToEvent('event-1', reactions, supabase)).rejects.toThrow('Update failed');
    });
});
