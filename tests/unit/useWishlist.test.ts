import { renderHook, act } from '@testing-library/react';
import { useWishlist } from '../../src/hooks/useWishlist';
import type { WishlistItem } from '@/services/storeService';
import { describe, it, expect } from 'vitest';

describe('useWishlist hook', () => {
    it('initializes with default values', () => {
        const { result } = renderHook(() => useWishlist());

        expect(result.current.isAdding).toBe(false);
        expect(result.current.editingItem).toBeNull();
        expect(result.current.fTitle).toBe('');
        expect(result.current.fDesc).toBe('');
        expect(result.current.fPrice).toBe('0');
        expect(result.current.fCategory).toBe('Experiences');
        expect(result.current.fLocationUrl).toBe('');
        expect(result.current.fDetailLink).toBe('');
        expect(result.current.fImage).toBe('');
        expect(result.current.fOwner).toBe('el');
        expect(result.current.fShared).toBe(false);
        expect(result.current.fPriority).toBe(false);
    });

    it('resetForm resets all fields to default values', () => {
        const { result } = renderHook(() => useWishlist());

        act(() => {
            result.current.setFTitle('New Title');
            result.current.setFDesc('New Desc');
            result.current.setFPrice('100');
            result.current.setFCategory('Travel');
            result.current.setFLocationUrl('url');
            result.current.setFDetailLink('link');
            result.current.setFImage('image');
            result.current.setFOwner('ella');
            result.current.setFShared(true);
            result.current.setFPriority(true);
        });

        expect(result.current.fTitle).toBe('New Title');
        expect(result.current.fOwner).toBe('ella');

        act(() => {
            result.current.resetForm();
        });

        expect(result.current.fTitle).toBe('');
        expect(result.current.fDesc).toBe('');
        expect(result.current.fPrice).toBe('0');
        expect(result.current.fCategory).toBe('Experiences');
        expect(result.current.fLocationUrl).toBe('');
        expect(result.current.fDetailLink).toBe('');
        expect(result.current.fImage).toBe('');
        expect(result.current.fOwner).toBe('el');
        expect(result.current.fShared).toBe(false);
        expect(result.current.fPriority).toBe(false);
    });

    it('openEdit sets editingItem, populates form fields, and sets isAdding to true', () => {
        const { result } = renderHook(() => useWishlist());

        const mockItem: WishlistItem = {
            id: '123',
            title: 'Test Title',
            description: 'Test Desc',
            price: 50,
            goalCategory: 'Tech',
            locationUrl: 'http://location',
            externalLink: 'http://external',
            imageUrl: 'http://image',
            owner: 'ella',
            shared: true,
            isPriority: true,
            state: 'DISCOVERED'
        } as any;

        act(() => {
            result.current.openEdit(mockItem);
        });

        expect(result.current.editingItem).toEqual(mockItem);
        expect(result.current.fTitle).toBe('Test Title');
        expect(result.current.fDesc).toBe('Test Desc');
        expect(result.current.fPrice).toBe('50');
        expect(result.current.fCategory).toBe('Tech');
        expect(result.current.fLocationUrl).toBe('http://location');
        expect(result.current.fDetailLink).toBe('http://external');
        expect(result.current.fImage).toBe('http://image');
        expect(result.current.fOwner).toBe('ella');
        expect(result.current.fShared).toBe(true);
        expect(result.current.fPriority).toBe(true);
        expect(result.current.isAdding).toBe(true);
    });

    it('openEdit handles missing optional fields gracefully', () => {
        const { result } = renderHook(() => useWishlist());

        const mockItem: Partial<WishlistItem> = {
            id: '124',
            title: 'Minimal Title',
            description: 'Minimal Desc',
            goalCategory: 'Experiences',
            owner: 'el',
            shared: false,
            isPriority: false,
            state: 'DISCOVERED'
        };

        act(() => {
            result.current.openEdit(mockItem as WishlistItem);
        });

        expect(result.current.editingItem).toEqual(mockItem);
        expect(result.current.fTitle).toBe('Minimal Title');
        expect(result.current.fDesc).toBe('Minimal Desc');
        expect(result.current.fPrice).toBe('0'); // price fallback
        expect(result.current.fLocationUrl).toBe(''); // fallback
        expect(result.current.fDetailLink).toBe(''); // fallback
        expect(result.current.fImage).toBe(''); // fallback
    });
});
