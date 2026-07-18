import { test, expect } from '@playwright/test';
import { Timeline } from '../../src/components/Timeline';
import { TimelineService } from '../../src/services/timelineService';
import React from 'react';

function withFakeReactDispatcher(callback: () => void) {
    const ReactInternals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE || (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    if (ReactInternals) {
        const prevDispatcher = ReactInternals.H;
        const mockStates: any[] = [];
        let stateIndex = 0;

        ReactInternals.H = {
            useContext: (_context: any) => {
                return {
                    updateData: () => {},
                    profile: { role: 'el' }
                };
            },
            useState: (initial: any) => {
                const currentIndex = stateIndex++;
                if (mockStates[currentIndex] === undefined) {
                    // Set isAdding to true to render the add form
                    if (currentIndex === 0) mockStates[currentIndex] = true;
                    // Set editingId to '1' to render the edit form
                    else if (currentIndex === 6) mockStates[currentIndex] = '1';
                    // Set editTitle, editDate, editDesc so the edit form validation passes
                    else if (currentIndex === 7) mockStates[currentIndex] = 'Test Title';
                    else if (currentIndex === 8) mockStates[currentIndex] = '2023-01-01';
                    else if (currentIndex === 9) mockStates[currentIndex] = 'Test Desc';
                    else mockStates[currentIndex] = initial;
                }
                return [mockStates[currentIndex], (updater: any) => {
                    mockStates[currentIndex] = typeof updater === 'function' ? updater(mockStates[currentIndex]) : updater;
                }];
            },
            useEffect: (effect: any, deps: any) => { },
            useMemo: (factory: any, deps: any) => { return factory(); }
        };
        try {
            callback();
        } finally {
            ReactInternals.H = prevDispatcher;
        }
    } else {
        callback();
    }
}

function findFormsWithOnSubmit(element: any, forms: any[] = []): any[] {
    if (!element) return forms;

    if (element.type === 'form' && element.props && element.props.onSubmit) {
        forms.push(element.props.onSubmit);
    }

    if (element.props && element.props.children) {
        if (Array.isArray(element.props.children)) {
            for (const child of element.props.children) {
                findFormsWithOnSubmit(child, forms);
            }
        } else {
            findFormsWithOnSubmit(element.props.children, forms);
        }
    }
    return forms;
}

test.describe('Timeline Component', () => {
    let originalAlert: typeof global.alert;
    let originalUpload: typeof TimelineService.uploadTimelineImage;

    test.beforeEach(() => {
        originalAlert = global.alert;
        originalUpload = TimelineService.uploadTimelineImage;
    });

    test.afterEach(() => {
        global.alert = originalAlert;
        TimelineService.uploadTimelineImage = originalUpload;
    });

    test('handleAddEvent should handle image upload error and show alert', async () => {
        let alertMessage = '';
        global.alert = (msg) => { alertMessage = msg; };

        TimelineService.uploadTimelineImage = async () => {
            throw new Error('Test upload failed');
        };

        let handlers: any[] = [];
        withFakeReactDispatcher(() => {
            const element: any = Timeline({ events: [{ id: '1', date: '2023-01-01', title: 'Test', description: 'Test desc' }] });
            handlers = findFormsWithOnSubmit(element);
        });

        const formEvent = {
            preventDefault: () => {},
            currentTarget: {
                elements: {
                    namedItem: (name: string) => {
                        if (name === 'title') return { value: 'Test Title' };
                        if (name === 'date') return { value: '2023-01-01' };
                        if (name === 'desc') return { value: 'Test Description' };
                        if (name === 'image') return { files: [new File([''], 'test.png')] };
                        return null;
                    }
                }
            }
        };

        // Run the first form's onSubmit, which should be the Add Event form
        if (handlers.length > 0) {
            await handlers[0](formEvent);
        }

        expect(alertMessage).toContain('Error al subir la imagen: Test upload failed');
    });

    test('handleEditSave should handle image upload error and show alert', async () => {
        let alertMessage = '';
        global.alert = (msg) => { alertMessage = msg; };

        TimelineService.uploadTimelineImage = async () => {
            throw new Error('Edit upload failed');
        };

        let handlers: any[] = [];
        withFakeReactDispatcher(() => {
            const element: any = Timeline({ events: [{ id: '1', date: '2023-01-01', title: 'Test', description: 'Test desc' }] });
            handlers = findFormsWithOnSubmit(element);
        });

        const formEvent = {
            preventDefault: () => {},
            currentTarget: {
                elements: {
                    namedItem: (name: string) => {
                        if (name === 'title') return { value: 'Test Title' };
                        if (name === 'date') return { value: '2023-01-01' };
                        if (name === 'desc') return { value: 'Test Description' };
                        if (name === 'editImage') return { files: [new File([''], 'test.png')] };
                        return null;
                    }
                }
            }
        };

        // Edit form could be second or later, run all
        for (const handler of handlers) {
             await handler(formEvent);
        }

        expect(alertMessage).toContain('Error al subir la imagen: Edit upload failed');
    });
});
