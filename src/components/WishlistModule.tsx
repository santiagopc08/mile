'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { Plus, Rss } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { WishlistService } from '@/services/wishlistService';
import { NotificationService } from '@/services/notificationService';
import type { WishlistItem, WishlistState, GoalCategory } from '@/services/storeService';
import { GOAL_CATEGORIES } from './planes/constants';
import { SavingsOverview } from './planes/SavingsOverview';
import { WishlistCard } from './planes/WishlistCard';
import { ActivityFeed } from './planes/ActivityFeed';
import { useWishlist } from '@/hooks/useWishlist';
import { useGoogleMapsSync } from '@/hooks/useGoogleMapsSync';
import { WishlistForm } from './planes/WishlistForm';
import { useToast } from '@/components/ui/Toast';

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
    const { confirm, success, error: notifyError } = useToast();
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';

    const [catFilter, setCatFilter] = useState<GoalCategory | 'ALL'>('ALL');
    const [stateFilter, setStateFilter] = useState<StateFilter>('ALL');
    const [showFeed, setShowFeed] = useState(false);

    const wishlistState = useWishlist();
    const { isAdding, setIsAdding, editingItem, setEditingItem, fTitle, fDesc, fPrice, fCategory, fLocationUrl, fDetailLink, fImage, fOwner, fShared, fPriority, resetForm, openEdit } = wishlistState;

    const items = useMemo(() => (data?.wishlist || []) as WishlistItem[], [data?.wishlist]);
    const activity = useMemo(() => data?.wishlistActivity || [], [data?.wishlistActivity]);

    const { syncGoogleMapsLocation } = useGoogleMapsSync(items);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URL(window.location.href).searchParams;
            const action = params.get('action');
            if (action === 'add') {
                setIsAdding(true);
            }
        }
    }, [setIsAdding]);


    const filteredItems = useMemo(() => {
        // ⚡ Bolt Optimization: Single O(N) loop to replace chained .filter()s, minimizing intermediate arrays
        const filtered: typeof items = [];
        for (const i of items) {
            if (catFilter !== 'ALL' && i.goalCategory !== catFilter) continue;
            if (stateFilter !== 'ALL' && i.state !== stateFilter) continue;
            filtered.push(i);
        }

        return filtered.sort((a, b) => {
            // 1. Group by state rank: Ahorrando/Listo (SAVING, READY_TO_DEPLOY) -> Idea (DISCOVERED) -> Logrado (COMPLETED) -> Archivado (ARCHIVED)
            const stateRank: Record<string, number> = {
                READY_TO_DEPLOY: 1,
                SAVING: 1,
                DISCOVERED: 2,
                COMPLETED: 3,
                ARCHIVED: 4
            };
            const rankA = stateRank[a.state] ?? 5;
            const rankB = stateRank[b.state] ?? 5;
            if (rankA !== rankB) {
                return rankA - rankB;
            }

            // 2. Within the same state group, sort priority (starred) items first
            if (a.isPriority && !b.isPriority) return -1;
            if (!a.isPriority && b.isPriority) return 1;

            // 3. Within the same state and priority, sort by date (newest first)
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }, [items, catFilter, stateFilter]);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fTitle.trim()) return;

        if (editingItem) {
            const updated = items.map(i => i.id === editingItem.id ? {
                ...i, title: fTitle.trim(), description: fDesc.trim(), price: parseFloat(fPrice) || 0,
                goalCategory: fCategory, externalLink: fDetailLink.trim() || undefined, locationUrl: fLocationUrl.trim() || undefined,
                imageUrl: fImage.trim() || undefined, owner: fOwner, shared: fShared, isPriority: fPriority,
            } : i);
            await updateData({ wishlist: updated });

            // Notify other profile if shared
            if (fShared) {
                const target = profile === 'el' ? 'ella' : 'el';
                const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                try { await NotificationService.addNotification(target, 'wishlist', `¡${authorName} editó el plan!: "${fTitle.trim()}"`, supabase); } catch { }
            }
        } else {
            const newItem: WishlistItem = {
                id: crypto.randomUUID(), category: 'antojo', title: fTitle.trim(), description: fDesc.trim(),
                price: parseFloat(fPrice) || 0, savedAmount: 0, isPriority: fPriority, state: 'DISCOVERED',
                goalCategory: fCategory, externalLink: fDetailLink.trim() || undefined, locationUrl: fLocationUrl.trim() || undefined,
                imageUrl: fImage.trim() || undefined, shared: fShared, owner: fOwner,
                author: profile || 'el', reactions: [], contributions: [],
                createdAt: new Date().toISOString(),
            };
            await updateData({ wishlist: [newItem, ...items] });
            // Log activity
            try {
                await WishlistService.logWishlistActivity(null, profile || 'el', 'added', fTitle.trim(), supabase);
            } catch { }
            // Notify other profile if shared
            if (fShared) {
                const target = profile === 'el' ? 'ella' : 'el';
                const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                try { await NotificationService.addNotification(target, 'wishlist', `¡${authorName} agregó un nuevo plan!: "${fTitle.trim()}"`, supabase); } catch { }
            }
        }

        if (fLocationUrl.trim()) {
            const state = editingItem ? editingItem.state : 'DISCOVERED';
            const author = editingItem ? editingItem.author : (profile || 'el');
            syncGoogleMapsLocation(fTitle.trim(), fLocationUrl.trim(), state, author);
        }

        resetForm(); setIsAdding(false); setEditingItem(null);
    };

    const handleDelete = async (id: string) => {
        const itemToDelete = items.find(i => i.id === id);

        // Borrado irreversible y, si el plan es compartido, también desaparece
        // para la pareja. Un toque accidental en la papelera no debe bastar.
        const ok = await confirm({
            title: 'Eliminar plan',
            message: itemToDelete?.shared
                ? `"${itemToDelete.title}" es un plan compartido: también desaparecerá para tu pareja.`
                : `"${itemToDelete?.title ?? 'Este plan'}" se eliminará para siempre.`,
            confirmLabel: 'Eliminar',
            tone: 'danger',
        });
        if (!ok) return;

        if (itemToDelete) {
            try {
                await supabase
                    .from('ubicaciones')
                    .delete()
                    .eq('nombre', itemToDelete.title)
                    .eq('created_by', itemToDelete.author);
                window.dispatchEvent(new CustomEvent('custom:map-refresh'));
            } catch (e) {
                console.error('Error deleting map location:', e);
                notifyError('El plan se eliminó, pero su punto en el mapa no. Puede que siga apareciendo.');
            }
            // Disparar notificación discreta a la pareja si es compartido
            if (itemToDelete.shared) {
                const target = profile === 'el' ? 'ella' : 'el';
                const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                try { await NotificationService.addNotification(target, 'wishlist', `${authorName} eliminó un plan de la lista.`, supabase); } catch { }
            }
        }
        const newItems = items.filter(i => i.id !== id);
        if (newItems.length !== items.length) {
            await updateData({ wishlist: newItems });
        } else {
            await updateData({ wishlist: items });
        }
        success('Plan eliminado.');
    };

    return (
        <div className="w-full space-y-4">
            {/* Savings Overview */}
            <SavingsOverview items={items} />

            <div className="flex items-center gap-2 font-mono text-[9px] w-full overflow-x-auto pb-1.5 scrollbar-none">
                <div className="flex gap-[1px] bg-white/[0.08] brutal-border shrink-0">
                    <button
                        onClick={() => setCatFilter('ALL')}
                        className={`relative w-9 h-9 !min-h-0 flex items-center justify-center transition-colors hover:bg-white/5 ${catFilter === 'ALL'
                            ? 'bg-user-c/10 text-user-c'
                            : 'text-white/40 hover:text-white/70'
                            }`}
                        title="Todos los antojos"
                    >
                        <Rss className="h-4.5 w-4.5" strokeWidth={1.5} />
                    </button>
                    {GOAL_CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const isActive = catFilter === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setCatFilter(cat.id as GoalCategory)}
                                className={`relative w-9 h-9 !min-h-0 flex items-center justify-center transition-colors hover:bg-white/5 ${isActive
                                    ? 'bg-user-c/10 text-user-c'
                                    : 'text-white/40 hover:text-white/70'
                                    }`}
                                title={cat.label}
                            >
                                <Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
                            </button>
                        );
                    })}
                </div>

                {/* Divider */}
                <div className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

                {/* State filter chips — same row */}
                <div className="flex gap-[1px] bg-white/[0.08] brutal-border shrink-0">
                    {STATE_FILTERS.map(sf => (
                        <button key={sf.id} onClick={() => setStateFilter(sf.id)}
                            className={`h-9 !min-h-0 px-4 text-[9px] font-mono font-black uppercase tracking-[0.16em] transition-colors hover:bg-white/5 ${stateFilter === sf.id
                                ? `bg-${accentClass}/10 text-${accentClass}`
                                : 'text-white/40 hover:text-white/70'
                                }`}
                            style={stateFilter === sf.id ? { color: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)' } : {}}
                        >{sf.label}</button>
                    ))}
                </div>
            </div>
            {/* Toolbar: Add + Activity toggle */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mt-3">
                <h3 className="flex items-center gap-3 text-sm font-mono font-bold uppercase tracking-widest text-white">
                    <div className={`h-3 w-3 border border-white/20 bg-${accentClass}`} style={{ backgroundColor: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)' }} />
                    {filteredItems.length} PLANES
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setShowFeed(!showFeed)}
                        className={`h-11 px-4 border text-[9px] font-mono font-black uppercase tracking-widest transition-colors ${showFeed ? `bg-${accentClass}/10 text-${accentClass}` : 'text-white/40 hover:text-white/70 bg-[#080808]'}`}
                        style={{ borderColor: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)' }}
                    >
                        Actividad
                    </button>
                    <button onClick={() => { setIsAdding(!isAdding); setEditingItem(null); if (!isAdding) resetForm(); }}
                        className="flex h-11 w-11 items-center justify-center border transition-all bg-[#080808]"
                        style={{ borderColor: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)', color: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)' }}>
                        <Plus className={`h-5 w-5 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content area */}
            <div className={`grid gap-4 ${showFeed ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
                <div className="space-y-4 min-w-0">
                    <AnimatePresence mode="wait">
                        {isAdding ? (
                            <WishlistForm wishlistState={wishlistState} onSubmit={handleSubmit} profile={profile} />
                        ) : null}
                    </AnimatePresence>

                    {/* Items grid */}
                    {filteredItems.length === 0 ? (
                        <div className="flex min-h-52 flex-col items-center justify-center border border-dashed border-white/10 py-16 text-[#a88a7e] opacity-60">
                            <Rss className="mb-4 h-10 w-10" strokeWidth={1} />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">Sin planes</p>
                            <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-white/25 font-mono">Nuestra lista de planes está vacía. ¡Añade tu primer deseo juntos! ✨</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 pt-3">
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
                            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[#a88a7e] font-mono">Actividad</span>
                            <span className="text-[8px] font-mono text-white/20">{activity.length}</span>
                        </div>
                        <ActivityFeed activity={activity} />
                    </div>
                )}
            </div>
        </div>
    );
}
