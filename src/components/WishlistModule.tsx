'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { Plus, Trash2, MapPin, Utensils, Heart, Check, Diamond, ExternalLink, Pencil, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LinkPreview } from './LinkPreview';
import { GeospatialPlanTracker } from './GeospatialPlanTracker';
import { supabase } from '@/lib/supabase';

type Category = 'plan' | 'antojo' | 'gusto';

function GustoItem({ item }: { item: any }) {
    const isSantiago = item.owner === "el" || (!item.owner && item.author === "el");
    const borderColorClass = isSantiago ? "border-user-a/35" : "border-user-b/35";
    const Bullet = isSantiago ? () => <div className="w-1.5 h-1.5 bg-user-a shrink-0 mt-1" /> : () => <Diamond className="w-2 h-2 text-user-b fill-user-b shrink-0 mt-1" />;
    const initials = item.author === "el" ? "S" : "M";
    const initialsBorder = item.author === "el" ? "border-user-a/40" : "border-user-b/40";
    const initialsText = item.author === "el" ? "text-user-a" : "text-user-b";

    return (
        <div className={`group flex items-start gap-3 border ${borderColorClass} bg-black/65 p-3 transition-all hover:bg-white/[0.04]`}>
            <Bullet />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-[11px] font-bold uppercase tracking-[0.14em] ${item.status === "visited" ? "line-through opacity-40" : "text-white"}`}>
                        {item.title}
                    </p>
                    <div className={`px-1.5 py-0.5 border ${initialsBorder} ${initialsText} text-[7px] font-black tracking-tighter shrink-0`}>
                        {initials}
                    </div>
                </div>
                {item.description && (
                    <p className="mt-0.5 truncate text-[9px] tracking-normal text-[#a88a7e]">{item.description}</p>
                )}
            </div>
        </div>
    );
}

export function WishlistModule() {
    const { data, updateData } = useStore();
    const { profile } = useProfile();
    const [activeCategory, setActiveCategory] = useState<Category>('plan');
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newLocationUrl, setNewLocationUrl] = useState('');
    const [newPrice, setNewPrice] = useState<string>('0');
    const [newIsPriority, setNewIsPriority] = useState(false);
    const [newOwner, setNewOwner] = useState<"el" | "ella">("el");

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editPrice, setEditPrice] = useState('0');
    const [editLocationUrl, setEditLocationUrl] = useState('');
    const [editIsPriority, setEditIsPriority] = useState(false);
    const [editOwner, setEditOwner] = useState<"el" | "ella">("el");

    const items = data?.wishlist || [];

    const totalSavings = useMemo(() => {
        const allocA = JSON.parse(localStorage.getItem('symmetry_A_allocations') || '[]');
        const allocB = JSON.parse(localStorage.getItem('symmetry_B_allocations') || '[]');
        const savingsA = allocA
            .filter((a: any) => a.category === '📈 Inversiones/Ahorro')
            .reduce((sum: number, a: any) => sum + a.amount, 0);
        const savingsB = allocB
            .filter((a: any) => a.category === '📈 Inversiones/Ahorro')
            .reduce((sum: number, a: any) => sum + a.amount, 0);
        return savingsA + savingsB;
    }, [data]);

    const filteredItems = useMemo(() => {
        return items
            .filter(item => item.category === activeCategory)
            .sort((a, b) => {
                if (a.isPriority && !b.isPriority) return -1;
                if (!a.isPriority && b.isPriority) return 1;
                return 0;
            });
    }, [items, activeCategory]);

    const categories = [
        { id: 'plan', label: 'Planes', icon: MapPin, code: 'MAP' },
        { id: 'antojo', label: 'Antojos', icon: Utensils, code: 'SAVE' },
        { id: 'gusto', label: 'Gustos', icon: Heart, code: 'LIKE' },
    ];

    const currentCategory = categories.find(c => c.id === activeCategory)!;
    const CategoryIcon = currentCategory.icon;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTitle.trim()) {
            const newItem = {
                id: crypto.randomUUID(),
                category: activeCategory,
                title: newTitle.trim(),
                description: newDesc.trim(),
                locationUrl: newLocationUrl.trim(),
                price: parseFloat(newPrice) || 0,
                isPriority: newIsPriority,
                status: 'to-visit' as const,
                author: profile || "el",
                owner: activeCategory === "gusto" ? newOwner : undefined
            };

            await updateData({ wishlist: [newItem, ...items] });

            // Auto-update map if it's a plan with a link
            if (activeCategory === 'plan' && newLocationUrl.trim()) {
                try {
                    const res = await fetch(`/api/link-preview?url=${encodeURIComponent(newLocationUrl.trim())}`);
                    if (res.ok) {
                        const previewData = await res.json();
                        if (previewData.coords) {
                            await supabase.from('ubicaciones').insert({
                                nombre: newTitle.trim(),
                                latitud: previewData.coords.lat,
                                longitud: previewData.coords.lng,
                                created_by: profile || 'el',
                                status: 'to-visit'
                            });
                            // Notify map to refresh
                            window.dispatchEvent(new CustomEvent('custom:map-refresh'));
                        }
                    }
                } catch (err) {
                    console.error('Failed to auto-add location to map:', err);
                }
            }

            if (activeCategory === "gusto" && newOwner !== profile) {
                await updateData({ lastPulseAt: new Date().toISOString() });
            }

            setNewTitle('');
            setNewDesc('');
            setNewLocationUrl('');
            setNewPrice('0');
            setNewIsPriority(false);
            setIsAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        await updateData({ wishlist: items.filter(i => i.id !== id) });
    };

    const handleEditStart = (item: any) => {
        setEditingId(item.id);
        setEditTitle(item.title);
        setEditDesc(item.description || '');
        setEditPrice(String(item.price || 0));
        setEditLocationUrl(item.locationUrl || '');
        setEditIsPriority(item.isPriority || false);
        setEditOwner(item.owner || 'el');
        setIsAdding(false);
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId || !editTitle.trim()) return;

        const updated = items.map(i => i.id === editingId ? {
            ...i,
            title: editTitle.trim(),
            description: editDesc.trim(),
            price: parseFloat(editPrice) || 0,
            locationUrl: editLocationUrl.trim(),
            isPriority: editIsPriority,
            owner: i.category === 'gusto' ? editOwner : i.owner
        } : i);

        await updateData({ wishlist: updated });
        setEditingId(null);
    };

    const toggleStatus = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        const isMarkingBought = item.status === 'to-visit';
        const updated = items.map(i =>
            i.id === id ? { ...i, status: (i.status === 'visited' ? 'to-visit' : 'visited') as 'to-visit' | 'visited' } : i
        );

        if (isMarkingBought && item.category === 'antojo') {
            const storageKey = profile === 'el' ? 'symmetry_A_allocations' : 'symmetry_B_allocations';
            const currentAllocations = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const newAllocation = {
                id: Date.now().toString(),
                amount: -(item.price || 0),
                description: `COMPRA: ${item.title}`,
                category: '📈 Inversiones/Ahorro',
                date: new Date().toISOString(),
            };
            localStorage.setItem(storageKey, JSON.stringify([newAllocation, ...currentAllocations]));
        }

        await updateData({ wishlist: updated });
    };

    const formatCOP = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="w-full space-y-6">
            <div className="grid grid-cols-1 border border-white/10 bg-black sm:grid-cols-3">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => { setActiveCategory(cat.id as Category); setIsAdding(false); }}
                            className={`group relative flex min-h-20 items-center justify-between border-b border-white/10 px-4 py-4 transition-all last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 ${isActive
                                ? 'bg-[#a100f0] text-black'
                                : 'bg-[#0a0a0a] text-[#a88a7e] hover:bg-[#121212] hover:text-white'
                                }`}
                        >
                            <span className="flex flex-col items-start gap-2">
                                <Icon className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.22em]">{cat.label}</span>
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isActive ? 'text-black/55' : 'text-white/20 group-hover:text-[#00dbe9]'}`}>
                                {cat.code}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabPlanes"
                                    className="absolute inset-x-0 bottom-0 h-1 bg-[#00dbe9]"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="min-h-[560px] border border-white/10 bg-[#080808] p-4 sm:p-6 md:p-8">
                {activeCategory === 'antojo' && (
                    <div className="mb-8 flex items-center justify-between border border-[#ff7020]/50 bg-[#ff7020]/8 p-4">
                         <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#a88a7e]">Dinero guardado para antojos</span>
                         <span className="font-mono text-sm font-bold tracking-normal text-[#ffb595]">{formatCOP(totalSavings)}</span>
                    </div>
                )}

                {activeCategory === 'plan' && (
                    <div className="mb-8">
                        <GeospatialPlanTracker />
                    </div>
                )}

                <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.26em] text-[#a88a7e]">
                        <div className="h-2 w-2 bg-[#00dbe9]" />
                        Lista de {currentCategory.label}
                    </h3>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex h-11 w-11 items-center justify-center border border-[#a100f0] text-[#e5b5ff] transition-all hover:bg-[#a100f0] hover:text-black"
                        aria-label={isAdding ? 'Cerrar formulario' : 'Agregar item'}
                    >
                        <Plus className={`h-4 w-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {isAdding ? (
                        <motion.form
                            key="form"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleAdd}
                            className="mb-8 space-y-4 border border-white/10 bg-black/60 p-4 sm:p-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Título del {activeCategory}</label>
                                    <input
                                        required
                                        autoFocus
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        placeholder="¿QUÉ TENEMOS EN MENTE?..."
                                        className="w-full border border-white/10 bg-[#050505] px-4 py-3 text-xs uppercase tracking-[0.16em] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#00dbe9]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Precio estimado (COP)</label>
                                    <input
                                        type="number"
                                        value={newPrice}
                                        onChange={e => setNewPrice(e.target.value)}
                                        className="w-full border border-white/10 bg-[#050505] px-4 py-3 text-xs uppercase tracking-[0.16em] text-white outline-none transition-colors focus:border-[#00dbe9]"
                                    />
                                </div>
                                {activeCategory === "gusto" && (
                                    <div className="space-y-2">
                                        <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Para quién es?</label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setNewOwner("el")} className={`flex-1 border py-2 text-[9px] font-bold uppercase tracking-[0.16em] ${newOwner === "el" ? "border-user-a bg-user-a/10 text-user-a" : "border-white/10 text-[#a88a7e]"}`}>Santiago</button>
                                            <button type="button" onClick={() => setNewOwner("ella")} className={`flex-1 border py-2 text-[9px] font-bold uppercase tracking-[0.16em] ${newOwner === "ella" ? "border-user-b bg-user-b/10 text-user-b" : "border-white/10 text-[#a88a7e]"}`}>Milena</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Detalles / Notas</label>
                                <textarea
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    placeholder="MÁS INFORMACIÓN..."
                                    className="h-24 w-full resize-none border border-white/10 bg-[#050505] px-4 py-3 text-xs uppercase tracking-[0.16em] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#00dbe9]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">URL ({activeCategory === 'plan' ? 'Link de Google Maps' : 'Link de Compra'})</label>
                                    <input
                                        value={newLocationUrl}
                                        onChange={e => setNewLocationUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full border border-white/10 bg-[#050505] px-4 py-3 text-xs tracking-normal text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#00dbe9]"
                                    />
                                </div>
                                <div className="flex items-end pb-1">
                                    <button
                                        type="button"
                                        onClick={() => setNewIsPriority(!newIsPriority)}
                                        className={`flex w-full items-center gap-3 border px-4 py-3 transition-all ${newIsPriority ? 'border-[#a100f0] bg-[#a100f0]/10 text-[#e5b5ff]' : 'border-white/10 text-[#a88a7e]'}`}
                                    >
                                        <Diamond className={`h-4 w-4 ${newIsPriority ? 'fill-[#a100f0]' : ''}`} />
                                        <span className="text-[9px] font-bold uppercase tracking-[0.18em]">Prioridad</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 border border-white/10 py-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] transition-all hover:border-white/30 hover:text-white">Cancelar</button>
                                <button type="submit" className="flex-1 bg-[#00dbe9] py-3 text-[9px] font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-[#a100f0]">Guardar Item</button>
                            </div>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            {activeCategory === 'gusto' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="mb-4 flex items-center gap-2 border-b border-user-a/25 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-user-a">
                                            <div className="w-1.5 h-1.5 bg-user-a" />
                                            Gustos de Santiago
                                        </h4>
                                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredItems.filter(i => i.owner === 'el' || (!i.owner && i.author === 'el')).map(item => (
                                                <GustoItem key={item.id} item={item} />
                                            ))}
                                            {filteredItems.filter(i => i.owner === 'el' || (!i.owner && i.author === 'el')).length === 0 && (
                                                <p className="border border-dashed border-white/10 p-4 text-center text-[8px] uppercase italic tracking-[0.2em] text-white/25">No hay gustos registrados</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="mb-4 flex items-center gap-2 border-b border-user-b/25 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-user-b">
                                            <div className="w-1.5 h-1.5 bg-user-b rounded-full" />
                                            Gustos de Milena
                                        </h4>
                                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredItems.filter(i => i.owner === 'ella' || (!i.owner && i.author === 'ella')).map(item => (
                                                <GustoItem key={item.id} item={item} />
                                            ))}
                                            {filteredItems.filter(i => i.owner === 'ella' || (!i.owner && i.author === 'ella')).length === 0 && (
                                                <p className="border border-dashed border-white/10 p-4 text-center text-[8px] uppercase italic tracking-[0.2em] text-white/25">No hay gustos registrados</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredItems.length === 0 ? (
                                        <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-white/10 py-20 text-[#a88a7e] opacity-60">
                                            <CategoryIcon className="mb-4 h-12 w-12" strokeWidth={1} />
                                            <p className="text-[10px] font-black uppercase tracking-[0.35em]">Lista Vacía</p>
                                        </div>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const isVisited = item.status === 'visited';
                                            const canAfford = activeCategory === 'antojo' && !isVisited && (item.price || 0) <= totalSavings;
                                            const accentColor = item.author === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`group relative flex flex-col gap-4 border p-5 transition-all md:flex-row md:items-center ${
                                                        isVisited
                                                            ? 'border-white/10 bg-white/[0.03] opacity-65'
                                                            : 'border-dashed bg-black/65'
                                                    } ${canAfford ? 'animate-pulse-green !border-[#22C55E]' : ''} ${editingId === item.id ? '!border-[#00dbe9] ring-1 ring-[#00dbe9]/30' : ''}`}
                                                    style={!isVisited && !canAfford && editingId !== item.id ? { borderColor: accentColor } : (canAfford ? { borderColor: '#22C55E' } : {})}
                                                >
                                                    {isVisited && (
                                                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.08]">
                                                            <Check className="w-24 h-24 stroke-[4]" />
                                                        </div>
                                                    )}

                                                    {editingId === item.id ? (
                                                        <form onSubmit={handleEditSave} className="w-full space-y-3">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <input
                                                                    autoFocus
                                                                    value={editTitle}
                                                                    onChange={e => setEditTitle(e.target.value)}
                                                                    placeholder="Título"
                                                                    className="w-full border border-white/10 bg-[#050505] px-3 py-2 text-xs uppercase tracking-[0.16em] text-white outline-none focus:border-[#00dbe9]"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    value={editPrice}
                                                                    onChange={e => setEditPrice(e.target.value)}
                                                                    placeholder="Precio"
                                                                    className="w-full border border-white/10 bg-[#050505] px-3 py-2 text-xs uppercase tracking-[0.16em] text-white outline-none focus:border-[#00dbe9]"
                                                                />
                                                            </div>
                                                            <textarea
                                                                value={editDesc}
                                                                onChange={e => setEditDesc(e.target.value)}
                                                                placeholder="Descripción"
                                                                className="h-16 w-full resize-none border border-white/10 bg-[#050505] px-3 py-2 text-xs uppercase tracking-[0.16em] text-white outline-none focus:border-[#00dbe9]"
                                                            />
                                                            <input
                                                                value={editLocationUrl}
                                                                onChange={e => setEditLocationUrl(e.target.value)}
                                                                placeholder="URL"
                                                                className="w-full border border-white/10 bg-[#050505] px-3 py-2 text-xs tracking-normal text-white outline-none focus:border-[#00dbe9]"
                                                            />
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditIsPriority(!editIsPriority)}
                                                                    className={`flex items-center gap-2 border px-3 py-2 text-[9px] font-bold uppercase transition-all ${editIsPriority ? 'border-[#a100f0] bg-[#a100f0]/10 text-[#e5b5ff]' : 'border-white/10 text-[#a88a7e]'}`}
                                                                >
                                                                    <Diamond className={`h-3 w-3 ${editIsPriority ? 'fill-[#a100f0]' : ''}`} /> Prioridad
                                                                </button>
                                                                {item.category === 'gusto' && (
                                                                    <div className="flex gap-1">
                                                                        <button type="button" onClick={() => setEditOwner('el')} className={`border px-2 py-1 text-[8px] font-bold ${editOwner === 'el' ? 'border-user-a bg-user-a/10 text-user-a' : 'border-white/10 text-[#a88a7e]'}`}>S</button>
                                                                        <button type="button" onClick={() => setEditOwner('ella')} className={`border px-2 py-1 text-[8px] font-bold ${editOwner === 'ella' ? 'border-user-b bg-user-b/10 text-user-b' : 'border-white/10 text-[#a88a7e]'}`}>M</button>
                                                                    </div>
                                                                )}
                                                                <div className="flex-1" />
                                                                <button type="button" onClick={() => setEditingId(null)} className="p-2 text-[#a88a7e] transition-colors hover:text-white">
                                                                    <X size={14} />
                                                                </button>
                                                                <button type="submit" className="p-2 text-[#00dbe9] transition-colors hover:text-white">
                                                                    <Check size={14} />
                                                                </button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                    <>
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <button
                                                            onClick={() => toggleStatus(item.id)}
                                                            className="relative flex h-7 w-14 shrink-0 items-center border border-white/10 bg-[#050505] px-1"
                                                        >
                                                            <motion.div
                                                                animate={{ x: isVisited ? 24 : 0 }}
                                                                className={`h-4 w-4 ${isVisited ? 'bg-[#00dbe9]' : 'bg-[#a88a7e]'}`}
                                                            />
                                                        </button>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`text-xs font-black uppercase tracking-[0.18em] ${isVisited ? 'text-[#a88a7e] line-through' : 'text-white'}`}>
                                                                    {item.title}
                                                                </h4>
                                                                {item.isPriority && <Diamond className="h-3 w-3 fill-[#a100f0] text-[#a100f0]" />}
                                                            </div>
                                                            {item.description && (
                                                                <p className="mt-1 line-clamp-1 text-[10px] uppercase tracking-normal text-[#a88a7e]">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                            {activeCategory === 'antojo' && (
                                                                <span className="mt-1 block font-mono text-[9px] font-bold tracking-normal text-[#ffb595]">
                                                                    COSTO: {formatCOP(item.price || 0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-6 border-t border-white/10 pt-4 md:justify-end md:border-t-0 md:pt-0">
                                                        {item.locationUrl && (
                                                            <div className="flex flex-col gap-2">
                                                                {activeCategory === 'antojo' ? (
                                                                    <LinkPreview url={item.locationUrl} category={activeCategory} />
                                                                ) : (
                                                                    <a
                                                                        href={item.locationUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#00dbe9] hover:underline"
                                                                    >
                                                                        <ExternalLink className="w-3 h-3" />
                                                                        {activeCategory === 'plan' ? 'Ver Ubicación' : 'Link Preview'}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="font-mono text-[8px] uppercase tracking-normal text-white/35">
                                                                {item.author}
                                                            </span>
                                                            <div className="flex gap-1">
                                                                {!isVisited && (
                                                                    <button
                                                                        onClick={() => handleEditStart(item)}
                                                                        className="text-[#a88a7e] transition-all hover:text-[#00dbe9]"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="text-[#a88a7e] transition-colors hover:text-red-400"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    </>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
