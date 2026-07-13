'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { Link2, MapPin, Plus, X, Rss } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { StoreService } from '@/services/storeService';
import { WishlistService } from '@/services/wishlistService';
import { NotificationService } from '@/services/notificationService';
import type { WishlistItem, WishlistState, GoalCategory } from '@/services/storeService';
import { GOAL_CATEGORIES } from './planes/constants';
import { SavingsOverview } from './planes/SavingsOverview';
import { WishlistCard } from './planes/WishlistCard';
import { ActivityFeed } from './planes/ActivityFeed';
import { LiveLinkPreview } from './LiveLinkPreview';

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
    const [fLocationUrl, setFLocationUrl] = useState('');
    const [fDetailLink, setFDetailLink] = useState('');
    const [fImage, setFImage] = useState('');
    const [fOwner, setFOwner] = useState<'el' | 'ella'>('el');
    const [fShared, setFShared] = useState(false);
    const [fPriority, setFPriority] = useState(false);

    const items = useMemo(() => (data?.wishlist || []) as WishlistItem[], [data?.wishlist]);
    const activity = useMemo(() => data?.wishlistActivity || [], [data?.wishlistActivity]);

    const syncGoogleMapsLocation = async (title: string, url: string, state: string, author: string) => {
        if (!url) return;
        const isGoogleMaps = url.includes('google.com/maps') || url.includes('maps.google.com') || url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps') || url.includes('share.google');
        if (!isGoogleMaps) return;

        try {
            const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
            if (!res.ok) return;

            const data = await res.json();
            if (data.coords && typeof data.coords.lat === 'number' && typeof data.coords.lng === 'number') {
                const status = (state === 'COMPLETED' || state === 'ARCHIVED') ? 'visited' : 'to-visit';
                const createdBy = author || 'el';

                const { data: existing, error: checkError } = await supabase
                    .from('ubicaciones')
                    .select('id')
                    .eq('nombre', title)
                    .eq('created_by', createdBy);

                if (!checkError && existing && existing.length > 0) {
                    await supabase
                        .from('ubicaciones')
                        .update({
                            latitud: data.coords.lat,
                            longitud: data.coords.lng,
                            status: status
                        })
                        .eq('id', existing[0].id);
                } else {
                    await supabase
                        .from('ubicaciones')
                        .insert({
                            nombre: title,
                            latitud: data.coords.lat,
                            longitud: data.coords.lng,
                            created_by: createdBy,
                            status: status
                        });
                }

                window.dispatchEvent(new CustomEvent('custom:map-refresh'));
            }
        } catch (e) {
            console.error('Error syncing location:', e);
        }
    };

    // Serialized hash of only items with Google Maps URLs and their current state/url,
    // which isolates map backfill checks from other non-map updates.
    const mapItemsHash = useMemo(() => {
        return items
            .filter(item => {
                const url = item.locationUrl;
                if (!url) return false;
                return url.includes('google.com/maps') || url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps');
            })
            .map(item => `${item.id}:${item.state}:${item.locationUrl}`)
            .join('||');
    }, [items]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const action = params.get('action');
            if (action === 'add') {
                setIsAdding(true);
            }
        }
    }, []);

    // Auto-backfill and sync routine for Google Maps items
    useEffect(() => {
        if (items.length === 0) return;

        const performBackfill = async () => {
            try {
                const { data: currentLocations, error } = await supabase.from('ubicaciones').select('*');
                if (error || !currentLocations) return;

                const locationMap = new Map(currentLocations.map(l => [`${l.nombre.toLowerCase()}||${l.created_by}`, l]));
                let mutated = false;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const itemsToFetchMap = new Map<string, { item: any; url: string; expectedStatus: string }>();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const itemsToUpdateMap = new Map<string, any>();

                for (const item of items) {
                    const url = item.locationUrl;
                    if (!url) continue;

                    const isGoogleMaps = url.includes('google.com/maps') || url.includes('maps.google.com') || url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps') || url.includes('share.google');
                    if (!isGoogleMaps) continue;

                    const key = `${item.title.toLowerCase()}||${item.author}`;
                    const existingPin = locationMap.get(key);
                    const expectedStatus = (item.state === 'COMPLETED' || item.state === 'ARCHIVED') ? 'visited' : 'to-visit';

                    if (!existingPin) {
                        itemsToFetchMap.set(key, { item, url, expectedStatus });
                    } else if (existingPin.status !== expectedStatus) {
                        itemsToUpdateMap.set(key, {
                            id: existingPin.id,
                            nombre: existingPin.nombre,
                            latitud: existingPin.latitud,
                            longitud: existingPin.longitud,
                            created_by: existingPin.created_by,
                            status: expectedStatus
                        });
                    }
                }

                const itemsToFetch = Array.from(itemsToFetchMap.values());
                const itemsToUpdate = Array.from(itemsToUpdateMap.values());

                if (itemsToFetch.length > 0) {
                    // ⚡ Bolt Optimization: Use an in-memory Promise cache to deduplicate concurrent requests
                    // for the same URL within the backfill batch.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const urlCache = new Map<string, Promise<any>>();

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const fetchResults: any[] = [];
                    // ⚡ Bolt Optimization: Batch requests to avoid unbounded concurrent fetches
                    // which can exhaust connections, memory, or trigger rate limits.
                    const batchSize = 5;
                    for (let i = 0; i < itemsToFetch.length; i += batchSize) {
                        const batch = itemsToFetch.slice(i, i + batchSize);
                        const batchResults = await Promise.all(
                            batch.map(({ item, url, expectedStatus }) => {
                                // ⚡ Bolt Optimization: Replace .map(async () => await asyncOp()) with .map(() => asyncOp().then().catch())
                                // to minimize intermediate promise instantiation overhead
                                let fetchPromise = urlCache.get(url);
                                if (!fetchPromise) {
                                    fetchPromise = fetch(`/api/link-preview?url=${encodeURIComponent(url)}`).then(res => {
                                        if (!res.ok) throw new Error('Network response was not ok');
                                        return res.json();
                                    });
                                    urlCache.set(url, fetchPromise);
                                }

                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                return fetchPromise.then((resData: any) => {
                                    if (resData.coords && typeof resData.coords.lat === 'number' && typeof resData.coords.lng === 'number') {
                                        return {
                                            nombre: item.title,
                                            latitud: resData.coords.lat,
                                            longitud: resData.coords.lng,
                                            created_by: item.author || 'el',
                                            status: expectedStatus
                                        };
                                    }
                                    return null;
                                }).catch(e => {
                                    console.error(`Error fetching coordinates for ${item.title}:`, e);
                                    return null;
                                });
                            })
                        );
                        for (const res of batchResults) {
                            fetchResults.push(res);
                        }
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const toInsert = fetchResults.filter(Boolean) as any[];
                    if (toInsert.length > 0) {
                        const { error: insertError } = await supabase.from('ubicaciones').insert(toInsert);
                        if (!insertError) {
                            mutated = true;
                        } else {
                            console.error("Error inserting batch locations details: message =", insertError.message, "details =", insertError.details, "hint =", insertError.hint, "code =", insertError.code, "error =", insertError);
                        }
                    }
                }

                if (itemsToUpdate.length > 0) {
                    const { error: updateError } = await supabase.from('ubicaciones').upsert(itemsToUpdate);
                    if (!updateError) {
                        mutated = true;
                    } else {
                        console.error("Error updating batch locations details: message =", updateError.message, "details =", updateError.details, "hint =", updateError.hint, "code =", updateError.code, "error =", updateError);
                    }
                }

                if (mutated) {
                    window.dispatchEvent(new CustomEvent('custom:map-refresh'));
                }
            } catch (err) {
                console.error("Error in auto-backfill:", err);
            }
        };

        const timer = setTimeout(performBackfill, 2000);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapItemsHash]);

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
            }
            // Disparar notificación discreta a la pareja si es compartido
            if (itemToDelete.shared) {
                const target = profile === 'el' ? 'ella' : 'el';
                const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                try { await NotificationService.addNotification(target, 'wishlist', `${authorName} eliminó un plan de la lista.`, supabase); } catch { }
            }
        }
        await updateData({ wishlist: items.filter(i => i.id !== id) });
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
                            <div className="w-full max-w-full overflow-hidden">
                                <motion.form key="form" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    onSubmit={handleSubmit} className="w-full max-w-full mb-4 space-y-1.5 border border-white/10 bg-black/60 p-3.5 sm:p-5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a88a7e] font-mono">
                                            {editingItem ? 'Editar plan' : 'Nuevo plan'}
                                        </span>
                                        <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }} className="text-white/30 hover:text-white !min-h-0">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Título</label>
                                            <input required autoFocus value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="¿Qué queremos?..."
                                                className="w-full border border-white/10 bg-[#050505] px-3 py-2 text-xs uppercase tracking-[0.16em] text-white outline-none placeholder:text-white/20 focus:border-[#00dbe9]" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Precio o costo estimado (COP)</label>
                                            <input type="number" value={fPrice} onChange={e => setFPrice(e.target.value)}
                                                className="w-full border border-white/10 bg-[#050505] px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe9]" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Descripción</label>
                                        <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Detalles..."
                                            className="h-14 w-full resize-none border border-white/10 bg-[#050505] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#00dbe9]" />
                                    </div>

                                    {/* Category selector */}
                                    <div className="space-y-1 mb-4">
                                        <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Categoría</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {GOAL_CATEGORIES.map(cat => {
                                                const Icon = cat.icon;
                                                const isActive = fCategory === cat.id;
                                                return (
                                                    <button key={cat.id} type="button" onClick={() => setFCategory(cat.id as GoalCategory)}
                                                        className={`flex h-7 !min-h-0 items-center gap-1.5 border px-2 transition-all ${isActive
                                                            ? 'border-user-c bg-user-c/10 text-white'
                                                            : 'border-white/10 bg-[#050505] text-[#a88a7e] hover:border-white/25 hover:text-white'
                                                            }`}>
                                                        <Icon className={`h-3 w-3 ${isActive ? 'text-user-c' : 'text-white/25'}`} strokeWidth={1.5} />
                                                        <span className="text-[7px] font-black uppercase tracking-[0.12em] font-mono">{cat.label}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                        <div className="space-y-1">
                                            <label className="ml-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">
                                                <MapPin className="h-3 w-3" /> Lugar en el mapa (Enlace)
                                            </label>
                                            <input value={fLocationUrl} onChange={e => setFLocationUrl(e.target.value)} placeholder="Enlace de Google Maps..."
                                                className="w-full border border-white/10 bg-[#050505] px-3 py-2 text-xs tracking-normal text-white outline-none placeholder:text-white/20 focus:border-[#00dbe9]" />
                                            <LiveLinkPreview url={fLocationUrl} label="Mapa Detectado" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="ml-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">
                                                <Link2 className="h-3 w-3" /> Enlace o página web
                                            </label>
                                            <input value={fDetailLink} onChange={e => setFDetailLink(e.target.value)} placeholder="Enlace de tienda, página web, etc..."
                                                className="w-full border border-white/10 bg-[#050505] px-3 py-2 text-xs tracking-normal text-white outline-none placeholder:text-white/20 focus:border-[#00dbe9]" />
                                            <LiveLinkPreview url={fDetailLink} label="Enlace Detectado" />
                                        </div>
                                    </div>

                                    {/* Owner + shared + priority */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <div className="flex gap-1">
                                            <button type="button" onClick={() => setFOwner('el')}
                                                className={`border px-2 py-1 !min-h-0 text-[9px] font-bold uppercase ${fOwner === 'el' ? 'border-user-b bg-user-b/10 text-user-b' : 'border-white/10 text-[#a88a7e]'}`}>Santiago</button>
                                            <button type="button" onClick={() => setFOwner('ella')}
                                                className={`border px-2 py-1 !min-h-0 text-[9px] font-bold uppercase ${fOwner === 'ella' ? 'border-user-a bg-user-a/10 text-user-a' : 'border-white/10 text-[#a88a7e]'}`}>Milena</button>
                                        </div>
                                        <button type="button" onClick={() => setFShared(!fShared)}
                                            className={`border px-2 py-1 !min-h-0 text-[9px] font-bold uppercase ${fShared ? 'border-user-c bg-user-c/10 text-user-c' : 'border-white/10 text-[#a88a7e]'}`}>
                                            {fShared ? '✓ Plan para los dos' : 'Plan para los dos'}
                                        </button>
                                        <button type="button" onClick={() => setFPriority(!fPriority)}
                                            className={`border px-2 py-1 !min-h-0 text-[9px] font-bold uppercase ${fPriority ? 'border-[#a100f0] bg-[#a100f0]/10 text-[#e5b5ff]' : 'border-white/10 text-[#a88a7e]'}`}>
                                            {fPriority ? '⚡ Destacar plan' : 'Destacar plan'}
                                        </button>
                                    </div>

                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }}
                                            className="flex-1 border border-white/10 h-8 !min-h-0 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] hover:text-white transition-all flex items-center justify-center">Cancelar</button>
                                        <button type="submit"
                                            className="flex-1 h-8 !min-h-0 text-[9px] font-black uppercase tracking-[0.2em] text-black transition-all hover:opacity-80 flex items-center justify-center"
                                            style={{ backgroundColor: profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)' }}>
                                            {editingItem ? 'Guardar' : 'Añadir a la lista'}
                                        </button>
                                    </div>
                                </motion.form>
                            </div>
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
