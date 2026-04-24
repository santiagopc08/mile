'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { Plus, Trash2, MapPin, Utensils, Heart, Check, Diamond, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Category = 'plan' | 'antojo' | 'gusto';

function GustoItem({ item }: { item: any }) {
    const isSantiago = item.owner === "el" || (!item.owner && item.author === "el");
    const colorClass = isSantiago ? "text-user-a" : "text-user-b";
    const borderColorClass = isSantiago ? "border-user-a/30" : "border-user-b/30";
    const Bullet = isSantiago ? () => <div className="w-1.5 h-1.5 bg-user-a shrink-0 mt-1" /> : () => <Diamond className="w-2 h-2 text-user-b fill-user-b shrink-0 mt-1" />;
    const initials = item.author === "el" ? "S" : "M";
    const initialsBorder = item.author === "el" ? "border-user-a/40" : "border-user-b/40";
    const initialsText = item.author === "el" ? "text-user-a" : "text-user-b";

    return (
        <div className={`flex items-start gap-3 p-3 border ${borderColorClass} bg-white/50 dark:bg-black/50 group transition-all`}>
            <Bullet />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className={`text-[11px] font-bold uppercase tracking-wide truncate ${item.status === "visited" ? "line-through opacity-40" : "text-stone-800 dark:text-stone-200"}`}>
                        {item.title}
                    </p>
                    <div className={`px-1.5 py-0.5 border ${initialsBorder} ${initialsText} text-[7px] font-black tracking-tighter shrink-0`}>
                        {initials}
                    </div>
                </div>
                {item.description && (
                    <p className="text-[9px] text-stone-500 italic truncate mt-0.5">{item.description}</p>
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
        { id: 'plan', label: 'Planes', icon: MapPin, color: 'text-blue-500' },
        { id: 'antojo', label: 'Antojos', icon: Utensils, color: 'text-orange-500' },
        { id: 'gusto', label: 'Gustos', icon: Heart, color: 'text-purple-500' },
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
                author: profile || "el", owner: activeCategory === "gusto" ? newOwner : undefined
            };
            await updateData({ wishlist: [newItem, ...items] });
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
        <div className="w-full max-w-5xl mx-auto space-y-8">
            {/* Category Selector */}
            <div className="grid grid-cols-3 gap-4">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => { setActiveCategory(cat.id as Category); setIsAdding(false); }}
                            className={`geometric-card p-6 flex flex-col items-center gap-3 transition-all ${
                                isActive
                                    ? 'border-geometric-accent bg-geometric-accent/5'
                                    : 'border-stone-200 dark:border-stone-800 opacity-60 hover:opacity-100'
                            }`}
                        >
                            <Icon className={`w-6 h-6 ${isActive ? 'text-geometric-accent' : 'text-stone-400'}`} />
                            <span className={`text-[10px] uppercase font-black tracking-widest ${isActive ? 'text-stone-900 dark:text-white' : 'text-stone-500'}`}>
                                {cat.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="geometric-card p-8 border-stone-200 dark:border-stone-800 bg-dot-matrix min-h-[400px]">
                {activeCategory === 'antojo' && (
                    <div className="mb-8 p-4 border border-geometric-accent bg-geometric-accent/5 flex items-center justify-between">
                         <span className="text-[10px] uppercase font-black tracking-widest text-stone-600 dark:text-stone-400">Dinero guardado para Antojos:</span>
                         <span className="text-sm font-mono font-bold text-geometric-accent">{formatCOP(totalSavings)}</span>
                    </div>
                )}

                <div className="flex justify-between items-center mb-10 border-b border-stone-100 dark:border-stone-900 pb-4">
                    <h3 className="text-xs uppercase font-black tracking-[0.3em] text-stone-400 flex items-center gap-3">
                        <div className="w-2 h-2 bg-geometric-accent" />
                        Lista de {currentCategory.label}
                    </h3>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="w-8 h-8 flex items-center justify-center border border-geometric-accent text-geometric-accent hover:bg-geometric-accent hover:text-white transition-all"
                    >
                        <Plus className={`w-4 h-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
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
                            className="space-y-4 mb-8 p-6 border border-stone-100 dark:border-stone-900 bg-stone-50/50 dark:bg-stone-950/50"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 ml-1">Título del {activeCategory}</label>
                                    <input
                                        required
                                        autoFocus
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        placeholder="¿QUÉ TENEMOS EN MENTE?..."
                                        className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 px-4 py-3 text-xs uppercase tracking-widest outline-none focus:border-geometric-accent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 ml-1">Precio Estimado (COP)</label>
                                    <input
                                        type="number"
                                        value={newPrice}
                                        onChange={e => setNewPrice(e.target.value)}
                                        className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 px-4 py-3 text-xs uppercase tracking-widest outline-none focus:border-geometric-accent"
                                    />
                                </div>
                            {activeCategory === "gusto" && (
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 ml-1">Para quién es?</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setNewOwner("el")} className={`flex-1 py-2 text-[9px] font-bold border ${newOwner === "el" ? "border-user-a bg-user-a/10 text-user-a" : "border-stone-200 text-stone-400"}`}>SANTIAGO</button>
                                        <button type="button" onClick={() => setNewOwner("ella")} className={`flex-1 py-2 text-[9px] font-bold border ${newOwner === "ella" ? "border-user-b bg-user-b/10 text-user-b" : "border-stone-200 text-stone-400"}`}>MILENA</button>
                                    </div>
                                </div>
                            )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 ml-1">Detalles / Notas</label>
                                <textarea
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    placeholder="MÁS INFORMACIÓN..."
                                    className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 px-4 py-3 text-xs uppercase tracking-widest outline-none focus:border-geometric-accent resize-none h-24"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 ml-1">URL (Link de Compra / Ubicación)</label>
                                    <input
                                        value={newLocationUrl}
                                        onChange={e => setNewLocationUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 px-4 py-3 text-xs uppercase tracking-widest outline-none focus:border-geometric-accent"
                                    />
                                </div>
                                <div className="flex items-end pb-1">
                                    <button
                                        type="button"
                                        onClick={() => setNewIsPriority(!newIsPriority)}
                                        className={`flex items-center gap-3 px-4 py-3 border transition-all w-full ${newIsPriority ? 'border-geometric-accent bg-geometric-accent/10 text-geometric-accent' : 'border-stone-200 dark:border-stone-800 text-stone-400'}`}
                                    >
                                        <Diamond className={`w-4 h-4 ${newIsPriority ? 'fill-geometric-accent' : ''}`} />
                                        <span className="text-[9px] uppercase font-bold tracking-widest">Prioridad (Diamante)</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 border border-stone-200 dark:border-stone-800 text-stone-500 uppercase text-[9px] font-bold tracking-widest hover:border-stone-400 transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 uppercase text-[9px] font-bold tracking-widest hover:bg-geometric-accent hover:text-white transition-all">Guardar Item</button>
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
                                    {/* User A Column */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-user-a border-b border-user-a/20 pb-2 mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-user-a" />
                                            Gustos de Santiago
                                        </h4>
                                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredItems.filter(i => i.owner === 'el' || (!i.owner && i.author === 'el')).map(item => (
                                                <GustoItem key={item.id} item={item} />
                                            ))}
                                            {filteredItems.filter(i => i.owner === 'el' || (!i.owner && i.author === 'el')).length === 0 && (
                                                <p className="text-[8px] uppercase opacity-30 italic">No hay gustos registrados</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* User B Column */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-user-b border-b border-user-b/20 pb-2 mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-user-b rounded-full" />
                                            Gustos de Milena
                                        </h4>
                                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredItems.filter(i => i.owner === 'ella' || (!i.owner && i.author === 'ella')).map(item => (
                                                <GustoItem key={item.id} item={item} />
                                            ))}
                                            {filteredItems.filter(i => i.owner === 'ella' || (!i.owner && i.author === 'ella')).length === 0 && (
                                                <p className="text-[8px] uppercase opacity-30 italic">No hay gustos registrados</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredItems.length === 0 ? (
                                        <div className="py-20 flex flex-col items-center justify-center opacity-20">
                                            <CategoryIcon className="w-12 h-12 mb-4" />
                                            <p className="text-[10px] uppercase font-black tracking-[0.4em]">Lista Vacía</p>
                                        </div>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const isVisited = item.status === 'visited';
                                            const canAfford = activeCategory === 'antojo' && !isVisited && (item.price || 0) <= totalSavings;
                                            const accentColor = item.author === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`relative group flex flex-col md:flex-row md:items-center gap-4 p-5 bg-mosaic transition-all ${
                                                        isVisited
                                                            ? 'border-solid border-stone-200 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-950/30 opacity-80'
                                                            : 'border-dashed border-[1px] bg-white dark:bg-black'
                                                    } ${canAfford ? 'animate-pulse-green border-solid' : ''}`}
                                                    style={!isVisited && !canAfford ? { borderColor: accentColor } : (canAfford ? { borderColor: '#22C55E' } : {})}
                                                >
                                                    {/* Watermark for Visited items */}
                                                    {isVisited && (
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.05]">
                                                            <Check className="w-24 h-24 stroke-[4]" />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 flex-1">
                                                        {/* Status Toggle Switch */}
                                                        <button
                                                            onClick={() => toggleStatus(item.id)}
                                                            className="relative w-12 h-6 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center px-1 shrink-0"
                                                        >
                                                            <motion.div
                                                                animate={{ x: isVisited ? 24 : 0 }}
                                                                className={`w-4 h-4 ${isVisited ? 'bg-geometric-accent' : 'bg-stone-400'}`}
                                                            />
                                                        </button>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`text-xs font-black uppercase tracking-widest ${isVisited ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-100'}`}>
                                                                    {item.title}
                                                                </h4>
                                                                {item.isPriority && <Diamond className="w-3 h-3 text-geometric-accent fill-geometric-accent" />}
                                                            </div>
                                                            {item.description && (
                                                                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1 italic uppercase tracking-tighter">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                            {activeCategory === 'antojo' && (
                                                                <span className="text-[9px] font-mono font-bold text-stone-400 mt-1 block">
                                                                    COSTO: {formatCOP(item.price || 0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-stone-900">
                                                        {item.locationUrl && (
                                                            <div className="flex flex-col gap-2">
                                                                <a
                                                                    href={item.locationUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest text-geometric-accent hover:underline"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                    Link Preview
                                                                </a>
                                                                {/* Mock Preview Box */}
                                                                <div className="hidden md:block w-32 h-16 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 overflow-hidden">
                                                                    <div className="w-full h-full opacity-20 bg-grid-mosaic" />
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-[8px] font-mono opacity-40 uppercase tracking-tighter">
                                                                {item.author}
                                                            </span>
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                className="text-stone-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
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
