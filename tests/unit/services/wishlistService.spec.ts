/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { WishlistService } from '../../../src/services/wishlistService';

const createMockSupabase = (mockData: any = {}) => {
    let calledTables: string[] = [];
    let calledMethods: { method: string, args: any[] }[] = [];

    const chainable = {
        select: () => { calledMethods.push({ method: 'select', args: [] }); return chainable; },
        eq: (...args: any[]) => { calledMethods.push({ method: 'eq', args }); return chainable; },
        single: () => { calledMethods.push({ method: 'single', args: [] }); return chainable; },
        maybeSingle: () => { calledMethods.push({ method: 'maybeSingle', args: [] }); return chainable; },
        insert: (args: any) => { calledMethods.push({ method: 'insert', args: [args] }); return chainable; },
        update: (args: any) => { calledMethods.push({ method: 'update', args: [args] }); return chainable; },
        delete: () => { calledMethods.push({ method: 'delete', args: [] }); return chainable; },
        then: (resolve: any) => {
            const table = calledTables[calledTables.length - 1];
            let data = mockData[table];
            const isSingle = calledMethods.some(m => m.method === 'single' || m.method === 'maybeSingle');
            if (isSingle && Array.isArray(data)) {
                data = data[0];
            } else if (!isSingle && !data) {
                data = [];
            }
            resolve({ data, error: null });
        },
    };

    return {
        from: (table: string) => {
            calledTables.push(table);
            const tableChainable = { ...chainable };

            const wrapWithThen = (base: any) => {
                const wrapped = { ...base };
                wrapped.then = (resolve: any) => {
                    let data = mockData[table];
                    const isSingle = calledMethods.some(m => m.method === 'single' || m.method === 'maybeSingle');
                    if (isSingle && Array.isArray(data)) {
                        data = data[0];
                    } else if (isSingle && data === undefined && calledMethods.some(m => m.method === 'maybeSingle')) {
                         data = null;
                    } else if (isSingle && data === undefined) {
                         data = null; // or throw? depends on supabase. single() throws if not exactly 1, but maybeSingle returns null. we'll use null for both for simplicity here if undefined.
                    } else if (!isSingle && !data) {
                        data = [];
                    }
                    resolve({ data, error: null });
                };

                wrapped.single = () => { calledMethods.push({ method: 'single', args: [] }); return wrapWithThen(wrapped); };
                wrapped.maybeSingle = () => { calledMethods.push({ method: 'maybeSingle', args: [] }); return wrapWithThen(wrapped); };
                wrapped.eq = (...args: any[]) => { calledMethods.push({ method: 'eq', args }); return wrapWithThen(wrapped); };
                wrapped.select = () => { calledMethods.push({ method: 'select', args: [] }); return wrapWithThen(wrapped); };
                wrapped.insert = (args: any) => { calledMethods.push({ method: 'insert', args: [args] }); return wrapWithThen(wrapped); };
                wrapped.update = (args: any) => { calledMethods.push({ method: 'update', args: [args] }); return wrapWithThen(wrapped); };
                wrapped.delete = () => { calledMethods.push({ method: 'delete', args: [] }); return wrapWithThen(wrapped); };

                return wrapped;
            };

            return wrapWithThen(tableChainable);
        },
        _getCalledTables: () => calledTables,
        _getCalledMethods: () => calledMethods,
        _resetSpies: () => {
             calledTables = [];
             calledMethods = [];
        }
    } as any;
};

test.describe('WishlistService', () => {

    test.describe('addContribution', () => {
        test('should insert contribution, update saved_amount, and log activity', async () => {
            const mockSupabase = createMockSupabase({
                wishlist: [{ id: 'item1', saved_amount: 50000 }]
            });

            await WishlistService.addContribution('item1', 'userA', 10000, 'Test note', mockSupabase);

            const tables = mockSupabase._getCalledTables();
            const methods = mockSupabase._getCalledMethods();

            expect(tables).toContain('wishlist_contributions');
            expect(tables).toContain('wishlist');
            expect(tables).toContain('wishlist_activity');

            const inserts = methods.filter((m: any) => m.method === 'insert');
            expect(inserts).toHaveLength(2); // One for contribution, one for activity

            // Check contribution insert
            expect(inserts[0].args[0]).toEqual({
                wishlist_item_id: 'item1',
                contributor: 'userA',
                amount: 10000,
                note: 'Test note'
            });

            // Check activity insert
            const formatCOP = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
            expect(inserts[1].args[0]).toEqual({
                wishlist_item_id: 'item1',
                actor: 'userA',
                action: 'contributed',
                detail: `+${formatCOP(10000)}`
            });

            // Check wishlist update
            const updates = methods.filter((m: any) => m.method === 'update');
            expect(updates).toHaveLength(1);
            expect(updates[0].args[0]).toEqual({
                saved_amount: 60000
            });
        });

        test('should handle missing note gracefully', async () => {
            const mockSupabase = createMockSupabase({
                wishlist: [{ id: 'item1', saved_amount: 0 }]
            });

            await WishlistService.addContribution('item1', 'userA', 10000, undefined, mockSupabase);

            const methods = mockSupabase._getCalledMethods();
            const inserts = methods.filter((m: any) => m.method === 'insert');
            expect(inserts[0].args[0].note).toBeNull();
        });
    });

    test.describe('toggleReaction', () => {
        test('should delete reaction if it exists and return false', async () => {
            const mockSupabase = createMockSupabase({
                wishlist_reactions: [{ id: 'reaction1', wishlist_item_id: 'item1', reactor: 'userA', type: 'like' }]
            });

            const result = await WishlistService.toggleReaction('item1', 'userA', 'like', mockSupabase);

            expect(result).toBe(false);

            const tables = mockSupabase._getCalledTables();
            const methods = mockSupabase._getCalledMethods();

            expect(tables).toContain('wishlist_reactions');

            const deletes = methods.filter((m: any) => m.method === 'delete');
            expect(deletes).toHaveLength(1);

            // Should not insert new reaction or log activity
            const inserts = methods.filter((m: any) => m.method === 'insert');
            expect(inserts).toHaveLength(0);
        });

        test('should insert reaction if it does not exist, log activity, and return true', async () => {
            const mockSupabase = createMockSupabase({
                wishlist_reactions: [] // Empty means not found
            });

            const result = await WishlistService.toggleReaction('item1', 'userA', 'like', mockSupabase);

            expect(result).toBe(true);

            const tables = mockSupabase._getCalledTables();
            const methods = mockSupabase._getCalledMethods();

            expect(tables).toContain('wishlist_reactions');
            expect(tables).toContain('wishlist_activity');

            const inserts = methods.filter((m: any) => m.method === 'insert');
            expect(inserts).toHaveLength(2); // One for reaction, one for activity

            expect(inserts[0].args[0]).toEqual({
                wishlist_item_id: 'item1',
                reactor: 'userA',
                type: 'like'
            });

            expect(inserts[1].args[0]).toEqual({
                wishlist_item_id: 'item1',
                actor: 'userA',
                action: 'reacted',
                detail: 'like'
            });
        });
    });

    test.describe('logWishlistActivity', () => {
        test('should insert activity log', async () => {
            const mockSupabase = createMockSupabase();

            await WishlistService.logWishlistActivity('item1', 'userA', 'viewed', 'details here', mockSupabase);

            const tables = mockSupabase._getCalledTables();
            const methods = mockSupabase._getCalledMethods();

            expect(tables).toContain('wishlist_activity');

            const inserts = methods.filter((m: any) => m.method === 'insert');
            expect(inserts).toHaveLength(1);
            expect(inserts[0].args[0]).toEqual({
                wishlist_item_id: 'item1',
                actor: 'userA',
                action: 'viewed',
                detail: 'details here'
            });
        });

        test('should handle missing detail gracefully', async () => {
            const mockSupabase = createMockSupabase();

            await WishlistService.logWishlistActivity('item1', 'userA', 'viewed', undefined, mockSupabase);

            const methods = mockSupabase._getCalledMethods();
            const inserts = methods.filter((m: any) => m.method === 'insert');
            expect(inserts[0].args[0].detail).toBeNull();
        });
    });

    test.describe('updateWishlistState', () => {
        test('should update item state to COMPLETED and status to visited', async () => {
            const mockSupabase = createMockSupabase({
                wishlist: [{ id: 'item1', state: 'DISCOVERED' }]
            });

            await WishlistService.updateWishlistState('item1', 'COMPLETED', 'userA', mockSupabase);

            const tables = mockSupabase._getCalledTables();
            const methods = mockSupabase._getCalledMethods();

            expect(tables).toContain('wishlist');
            expect(tables).toContain('wishlist_activity');

            const updates = methods.filter((m: any) => m.method === 'update');
            expect(updates).toHaveLength(1);
            expect(updates[0].args[0]).toEqual({
                state: 'COMPLETED',
                status: 'visited'
            });

            const inserts = methods.filter((m: any) => m.method === 'insert');
            expect(inserts).toHaveLength(1);
            expect(inserts[0].args[0]).toEqual({
                wishlist_item_id: 'item1',
                actor: 'userA',
                action: 'state_changed',
                detail: 'DISCOVERED → COMPLETED'
            });
        });

        test('should update item state to anything else and status to to-visit', async () => {
            const mockSupabase = createMockSupabase({
                wishlist: [{ id: 'item1', state: 'DISCOVERED' }]
            });

            await WishlistService.updateWishlistState('item1', 'PLANNED', 'userA', mockSupabase);

            const methods = mockSupabase._getCalledMethods();

            const updates = methods.filter((m: any) => m.method === 'update');
            expect(updates).toHaveLength(1);
            expect(updates[0].args[0]).toEqual({
                state: 'PLANNED',
                status: 'to-visit'
            });
        });

        test('should use default oldState DISCOVERED if item not found', async () => {
            const mockSupabase = createMockSupabase({
                wishlist: []
            });

            await WishlistService.updateWishlistState('item1', 'PLANNED', 'userA', mockSupabase);

            const methods = mockSupabase._getCalledMethods();

            const inserts = methods.filter((m: any) => m.method === 'insert');
            expect(inserts).toHaveLength(1);
            expect(inserts[0].args[0].detail).toBe('DISCOVERED → PLANNED');
        });
    });
});
