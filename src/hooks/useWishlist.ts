import { useState, useCallback } from 'react';
import type { WishlistItem, GoalCategory } from '@/services/storeService';

export function useWishlist() {
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

    const [fTitle, setFTitle] = useState('');
    const [fDesc, setFDesc] = useState('');
    const [fPrice, setFPrice] = useState('0');
    const [fCategory, setFCategory] = useState<GoalCategory>('Experiences');
    const [fLocationUrl, setFLocationUrl] = useState('');
    const [fDetailLink, setFDetailLink] = useState('');
    const [fImage, setFImage] = useState('');
    const [fOwner, setFOwner] = useState<'el' | 'ella'>('el');
    const [fShared, setFShared] = useState(false);
    const [fPriority, setFPriority] = useState(false);

    const resetForm = useCallback(() => {
        setFTitle(''); setFDesc(''); setFPrice('0'); setFCategory('Experiences');
        setFLocationUrl(''); setFDetailLink(''); setFImage(''); setFOwner('el'); setFShared(false); setFPriority(false);
    }, []);

    const openEdit = useCallback((item: WishlistItem) => {
        setEditingItem(item);
        setFTitle(item.title); setFDesc(item.description); setFPrice(String(item.price || 0));
        setFCategory(item.goalCategory); setFLocationUrl(item.locationUrl || ''); setFDetailLink(item.externalLink || '');
        setFImage(item.imageUrl || ''); setFOwner((item.owner as 'el' | 'ella') || 'el');
        setFShared(item.shared); setFPriority(item.isPriority);
        setIsAdding(true);
    }, []);

    return {
        isAdding, setIsAdding,
        editingItem, setEditingItem,
        fTitle, setFTitle,
        fDesc, setFDesc,
        fPrice, setFPrice,
        fCategory, setFCategory,
        fLocationUrl, setFLocationUrl,
        fDetailLink, setFDetailLink,
        fImage, setFImage,
        fOwner, setFOwner,
        fShared, setFShared,
        fPriority, setFPriority,
        resetForm, openEdit
    };
}
