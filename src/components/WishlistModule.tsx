'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { Plus, X, Rss } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { StoreService } from '@/services/storeService';
import type { WishlistItem, WishlistState, GoalCategory } from '@/services/storeService';
import { GOAL_CATEGORIES, STATE_CONFIG, formatCOP } from './planes/constants';
import { SavingsOverview } from './planes/SavingsOverview';
import { WishlistCard } from './planes/WishlistCard';
import { ActivityFeed } from './planes/ActivityFeed';

type StateFilter = WishlistState | 'ALL';

const STATE_FILTERS: { id: StateFilter; label: string }[] = [
    { id: 'ALL', label: 'Todos' },
    { id: 'DISCOVERED', label: 'Descubiertos' },
    { id: 'SAVING', label: 'Ahorrando' },
    { id: 'READY_TO_DEPLOY', label: 'Listos' },
    { id: 'COMPLETED', label: 'Logrados' },
    { id: 'ARCHIVED', label: 'Archivo' },
];

export function WishlistModule() {
    const { data, refreshData, updateData } = useStore();
    const { profile } = useProfile();
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';

    const [catFilter, setCatFilter] = useState<GoalCategory | 'ALL'>('ALL');
    const [stateFilter, setStateFilter] = useState<StateFilter>('ALL');
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
    const [showFeed, setShowFeed] = useState(false);

    // Form state
    const [fTitle, setFTitle] = useState('');
    const [fDesc, setFDesc] = useState('');
    const [fPrice, setFPrice] = useState('0');
    const [fCategory, setFCategory] = useState<GoalCategory>('Experiences');
    const [fLink, setFLink] = useState('');
    const [fImage, setFImage] = useState('');
    const [fOwner, setFOwner] = useState<'el' | 'ella'>('el');
    const [fShared, setFShared] = useState(false);
    const [fPriority, setFPriority] = useState(false);

    const items = useMemo(() => (data?.wishlist || []) as WishlistItem[], [data?.wishlist]);
    const activity = useMemo(() => data?.wishlistActivity || [], [data?.wishlistActivity]);

    const filteredItems = useMemo(() => {
        return items
            .filter(i => catFilter === 'ALL' || i.goalCategory === catFilter)
            .filter(i => stateFilter === 'ALL' || i.state === stateFilter)
            .sort((a, b) => {
                if (a.isPriority && !b.isPriority) return -1;
                if (!a.isPriority && b.isPriority) return 1;
                const stateOrder: Record<string, number> = { READY_TO_DEPLOY: 0, SAVING: 1, DISCOVERED: 2, COMPLETED: 3, ARCHIVED: 4 };
                return (stateOrder[a.state] ?? 5) - (stateOrder[b.state] ?? 5);
            });
    }, [items, catFilter, stateFilter]);

    const resetForm = useCallback(() => {
        setFTitle(''); setFDesc(''); setFPrice('0'); setFCategory('Experiences');
        setFLink(''); setFImage(''); setFOwner('el'); setFShared(false); setFPriority(false);
    }, []);

    const openEdit = useCallback((item: WishlistItem) => {
        setEditingItem(item);
        setFTitle(item.title); setFDesc(item.description); setFPrice(String(item.price || 0));
        setFCategory(item.goalCategory); setFLink(item.externalLink || item.locationUrl || '');
        setFImage(item.imageUrl || ''); setFOwner((item.owner as 'el' | 'ella') || 'el');
        setFShared(item.shared); setFPriority(item.isPriority);
        setIsAdding(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fTitle.trim()) return;

        if (editingItem) {
            const updated = items.map(i => i.id === editingItem.id ? {
                ...i, title: fTitle.trim(), description: fDesc.trim(), price: parseFloat(fPrice) || 0,
                goalCategory: fCategory, externalLink: fLink.trim(), locationUrl: fLink.trim(),
                imageUrl: fImage.trim() || undefined, owner: fOwner, shared: fShared, isPriority: fPriority,
            } : i);
            await updateData({ wishlist: updated as any });
        } else {
            const newItem: WishlistItem = {
                id: crypto.randomUUID(), category: 'antojo', title: fTitle.trim(), description: fDesc.trim(),
                price: parseFloat(fPrice) || 0, savedAmount: 0, isPriority: fPriority, state: 'DISCOVERED',
                goalCategory: fCategory, externalLink: fLink.trim() || undefined, locationUrl: fLink.trim() || undefined,
                imageUrl: fImage.trim() || undefined, shared: fShared, owner: fOwner,
                author: profile || 'el', reactions: [], contributions: [],
            };
            await updateData({ wishlist: [newItem, ...items] as any });
            // Log activity
            try {
                await StoreService.logWishlistActivity(null, profile || 'el', 'added', fTitle.trim(), supabase);
            } catch {}
            // Notify other profile if shared
            if (fShared) {
                const target = profile === 'el' ? 'ella' : 'el';
                try { await StoreService.addNotification(target, 'wishlist', `${profile === 'el' ? 'Santiago' : 'Milena'} agregó: "${fTitle.trim()}"`, supabase); } catch {}
            }
        }

        resetForm(); setIsAdding(false); setEditingItem(null);
    };

    const handleDelete = async (id: string) => {
        await updateData({ wishlist: items.filter(i => i.id !== id) as any });
    };

    return (
        <div className="w-full space-y-6">
            {/* Savings Overview */}
            <SavingsOverview items={items} />

            {/* Category filter bar */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                <button onClick={() => setCatFilter('ALL')}
                    className={`category-pill ${catFilter === 'ALL' ? 'category-pill-active' : ''}`}>Todos</button>
                {GOAL_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setCatFilter(cat.id as GoalCategory)}
                        className={`category-pill ${catFilter === cat.id ? 'category-pill-active' : ''}`}>
                        <span>{cat.emoji}</span> {cat.label}
                    </button>
                ))}
            </div>

            {/* State filter chips */}
            <div className="flex flex-wrap gap-1">
                {STATE_FILTERS.map(sf => (
                    <button key={sf.id} onClick={() => setStateFilter(sf.id)}
                        className={`px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.18em] border transition-all ${
                            stateFilter === sf.id
                                ? `border-${accentClass} text-${accentClass} bg-${accentClass}/10`
                                : 'border-white/[0.06] text-white/25 hover:text-white/50'
                        }`}
                        style={stateFilter === sf.id ? { borderColor: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)', color: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)' } : {}}
                    >{sf.label}</button>
                ))}
            </div>

            {/* Toolbar: Add + Activity toggle */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.22em] text-[#a88a7e]">
                    <div className={`h-2 w-2 bg-${accentClass}`} style={{ backgroundColor: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)' }} />
                    {filteredItems.length} Items
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setShowFeed(!showFeed)}
                        className={`flex h-11 w-11 items-center justify-center border transition-all ${showFeed ? 'border-user-c text-user-c bg-user-c/10' : 'border-white/10 text-[#a88a7e] hover:text-white'}`}>
                        <Rss className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setIsAdding(!isAdding); setEditingItem(null); if (!isAdding) resetForm(); }}
                        className="flex h-11 w-11 items-center justify-center border transition-all"
                        style={{ borderColor: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)', color: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)' }}>
                        <Plus className={`h-4 w-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content area */}
            <div className={`grid gap-6 ${showFeed ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
                <div className="space-y-4">
                    <AnimatePresence mode="wait">
                        {isAdding ? (
                            <motion.form key="form" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleSubmit} className="mb-4 space-y-4 border border-white/10 bg-black/60 p-4 sm:p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a88a7e]">
                                        {editingItem ? 'Editar Item' : 'Nuevo Antojo'}
                                    </span>
                                    <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }} className="text-white/30 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Título</label>
                                        <input required autoFocus value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="¿QUÉ QUEREMOS?..."
                                            className="w-full border border-white/10 bg-[#050505] px-4 py-3 text-xs uppercase tracking-[0.16em] text-white outline-none placeholder:text-white/20 focus:border-[#00dbe9]" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Costo Estimado (COP)</label>
                                        <input type="number" value={fPrice} onChange={e => setFPrice(e.target.value)}
                                            className="w-full border border-white/10 bg-[#050505] px-4 py-3 text-xs text-white outline-none focus:border-[#00dbe9]" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Descripción</label>
                                    <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Detalles..."
                                        className="h-20 w-full resize-none border border-white/10 bg-[#050505] px-4 py-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#00dbe9]" />
                                </div>

                                {/* Category selector */}
                                <div className="space-y-2">
                                    <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Categoría</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {GOAL_CATEGORIES.map(cat => (
                                            <button key={cat.id} type="button" onClick={() => setFCategory(cat.id as GoalCategory)}
                                                className={`category-pill ${fCategory === cat.id ? 'category-pill-active' : ''}`}>
                                                {cat.emoji} {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">URL Externa</label>
                                        <input value={fLink} onChange={e => setFLink(e.target.value)} placeholder="https://..."
                                            className="w-full border border-white/10 bg-[#050505] px-4 py-3 text-xs tracking-normal text-white outline-none placeholder:text-white/20 focus:border-[#00dbe9]" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Imagen URL</label>
                                        <input value={fImage} onChange={e => setFImage(e.target.value)} placeholder="https://...imagen.jpg"
                                            className="w-full border border-white/10 bg-[#050505] px-4 py-3 text-xs tracking-normal text-white outline-none placeholder:text-white/20 focus:border-[#00dbe9]" />
                                    </div>
                                </div>

                                {/* Owner + shared + priority */}
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex gap-1">
                                        <button type="button" onClick={() => setFOwner('el')}
                                            className={`border px-3 py-2 text-[9px] font-bold uppercase ${fOwner === 'el' ? 'border-user-b bg-user-b/10 text-user-b' : 'border-white/10 text-[#a88a7e]'}`}>Santiago</button>
                                        <button type="button" onClick={() => setFOwner('ella')}
                                            className={`border px-3 py-2 text-[9px] font-bold uppercase ${fOwner === 'ella' ? 'border-user-a bg-user-a/10 text-user-a' : 'border-white/10 text-[#a88a7e]'}`}>Milena</button>
                                    </div>
                                    <button type="button" onClick={() => setFShared(!fShared)}
                                        className={`border px-3 py-2 text-[9px] font-bold uppercase ${fShared ? 'border-user-c bg-user-c/10 text-user-c' : 'border-white/10 text-[#a88a7e]'}`}>
                                        {fShared ? '✓ Compartido' : 'Compartir'}
                                    </button>
                                    <button type="button" onClick={() => setFPriority(!fPriority)}
                                        className={`border px-3 py-2 text-[9px] font-bold uppercase ${fPriority ? 'border-[#a100f0] bg-[#a100f0]/10 text-[#e5b5ff]' : 'border-white/10 text-[#a88a7e]'}`}>
                                        {fPriority ? '⚡ Prioridad' : 'Prioridad'}
                                    </button>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }}
                                        className="flex-1 border border-white/10 py-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] hover:text-white transition-all">Cancelar</button>
                                    <button type="submit"
                                        className="flex-1 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-black transition-all hover:opacity-80"
                                        style={{ backgroundColor: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)' }}>
                                        {editingItem ? 'Guardar' : 'Crear Item'}
                                    </button>
                                </div>
                            </motion.form>
                        ) : null}
                    </AnimatePresence>

                    {/* Items grid */}
                    {filteredItems.length === 0 ? (
                        <div className="flex min-h-52 flex-col items-center justify-center border border-dashed border-white/10 py-16 text-[#a88a7e] opacity-60">
                            <Rss className="mb-4 h-10 w-10" strokeWidth={1} />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sin Items</p>
                            <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-white/25">Agrega tu primer antojo</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {filteredItems.map(item => (
                                <WishlistCard key={item.id} item={item} profile={profile || 'el'}
                                    onRefresh={refreshData} onEdit={openEdit} onDelete={handleDelete} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Activity Feed sidebar */}
                {showFeed && (
                    <div className="border border-white/10 bg-black/40">
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[#a88a7e]">Actividad</span>
                            <span className="text-[8px] font-mono text-white/20">{activity.length}</span>
                        </div>
                        <ActivityFeed activity={activity} />
                    </div>
                )}
            </div>
        </div>
    );
}
