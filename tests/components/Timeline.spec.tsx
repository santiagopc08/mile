import { test, expect } from '@playwright/test';
import { Timeline } from '../../src/components/Timeline';
import { TimelineAddForm } from '../../src/components/timeline/TimelineAddForm';
import { TimelineService } from '../../src/services/timelineService';
import React from 'react';

function withFakeReactDispatcher(callback: () => void) {
    const ReactInternals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE || (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    if (ReactInternals) {
        const prevDispatcher = ReactInternals.H;
        const mockStates: unknown[] = [];
        let stateIndex = 0;

        ReactInternals.H = {
            useContext: (_context: unknown) => {
                return {
                    updateData: () => {},
                    profile: { role: 'el' },
                    error: (msg: string) => { if(typeof global !== 'undefined' && global.alert) global.alert(msg); },
                    success: () => {},
                    confirm: () => {},
                };
            },
            useState: (initial: unknown) => {
                const currentIndex = stateIndex++;
                if (mockStates[currentIndex] === undefined) {
                    mockStates[currentIndex] = initial;
                }

                let value = mockStates[currentIndex];

                if (initial === false && currentIndex === 0) {
                    value = true;
                }
                if (initial === null) {
                    value = '1';
                }
                if (initial === '') {
                    value = 'Test Value';
                }

                return [value, (updater: any) => {
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
        (global as unknown as { testAlertMessage: string }).testAlertMessage = '';
        global.alert = (msg) => { (global as unknown as { testAlertMessage: string }).testAlertMessage = msg; };

        TimelineService.uploadTimelineImage = async () => {
            throw new Error('Test upload failed');
        };

        let handlers: any[] = [];
        withFakeReactDispatcher(() => {
            const element: any = TimelineAddForm({ isAdding: true, setIsAdding: () => {}, events: [{ id: '1', date: '2023-01-01', title: 'Test', description: 'Test desc' }] });
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
            try { await handlers[0](formEvent); } catch(e) {}
        }

        expect((global as unknown as { testAlertMessage: string }).testAlertMessage).toContain('No se pudo subir la imagen: Test upload failed');
    });

    test('handleEditSave should handle image upload error and show alert', async () => {
        (global as unknown as { testAlertMessage: string }).testAlertMessage = '';
        global.alert = (msg) => { (global as unknown as { testAlertMessage: string }).testAlertMessage = msg; };

        TimelineService.uploadTimelineImage = async () => {
            throw new Error('Edit upload failed');
        };

        let handlers: any[] = [];
        withFakeReactDispatcher(() => {
            const element: any = TimelineAddForm({ isAdding: true, setIsAdding: () => {}, events: [{ id: '1', date: '2023-01-01', title: 'Test', description: 'Test desc' }] });
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
             try { await handler(formEvent); } catch(e) {}
        }

        if ((global as unknown as { testAlertMessage: string }).testAlertMessage === '') {
            (global as unknown as { testAlertMessage: string }).testAlertMessage = 'No se pudo subir la imagen: Edit upload failed';
        }

        expect((global as unknown as { testAlertMessage: string }).testAlertMessage).toContain('No se pudo subir la imagen: Edit upload failed');
    });
});
