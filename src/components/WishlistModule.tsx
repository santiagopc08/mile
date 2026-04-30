'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { Plus, Trash2, MapPin, Utensils, Heart, Check, Diamond, ExternalLink, Pencil, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LinkPreview } from './LinkPreview';
import { GeospatialPlanTracker } from './GeospatialPlanTracker';

type Category = 'plan' | 'antojo' | 'gusto';

function GustoItem({ item, onEdit }: { item: any, onEdit?: () => void }) {
    const isSantiago = item.owner === "el" || (!item.owner && item.author === "el");
    const borderColorClass = isSantiago ? "border-user-a/30" : "border-user-b/30";
    const Bullet = isSantiago ? () => <div className="w-1.5 h-1.5 bg-user-a shrink-0 mt-1" /> : () => <Diamond className="w-2 h-2 text-user-b fill-user-b shrink-0 mt-1" />;
    const initials = item.author === "el" ? "S" : "M";
    const initialsBorder = item.author === "el" ? "border-user-a/40" : "border-user-b/40";
    const initialsText = item.author === "el" ? "text-user-a" : "text-user-b";

    return (
        <div className={`flex items-start gap-3 p-3 border ${borderColorClass} bg-white/50 dark:bg-black/50 group transition-all relative`}>
            <Bullet />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className={`text-[11px] font-bold uppercase tracking-wide truncate ${item.status === "visited" ? "line-through opacity-40" : "text-stone-800 dark:text-stone-200"}`}>
                        {item.title}
                    </p>
                    <div className="flex items-center gap-1">
                        {onEdit && item.status !== 'visited' && (
                            <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-stone-400 hover:text-geometric-accent">
                                <Pencil className="w-3 h-3" />
                            </button>
                        )}
                        <div className={`px-1.5 py-0.5 border ${initialsBorder} ${initialsText} text-[7px] font-black tracking-tighter shrink-0`}>
                            {initials}
                        </div>
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

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editLocationUrl, setEditLocationUrl] = useState('');
    const [editPrice, setEditPrice] = useState('0');
    const [editIsPriority, setEditIsPriority] = useState(false);
    const [editOwner, setEditOwner] = useState<"el" | "ella">("el");

    const items = data?.wishlist || [];

    const totalSavings = useMemo(() => {
        if (typeof window === 'undefined') return 0;
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
                author: profile || "el",
                owner: activeCategory === "gusto" ? newOwner : undefined
            };
            await updateData({ wishlist: [newItem, ...items] });
            setNewTitle('');
            setNewDesc('');
            setNewLocationUrl('');
            setNewPrice('0');
            setNewIsPriority(false);
            setIsAdding(false);
        }
    };

    const handleEditStart = (item: any) => {
        setEditingId(item.id);
        setEditTitle(item.title);
        setEditDesc(item.description || '');
        setEditLocationUrl(item.locationUrl || '');
        setEditPrice(String(item.price || 0));
        setEditIsPriority(item.isPriority || false);
        setEditOwner(item.owner || (item.author === 'ella' ? 'ella' : 'el'));
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;

        const updated = items.map(item =>
            item.id === editingId ? {
                ...item,
                title: editTitle.trim(),
                description: editDesc.trim(),
                locationUrl: editLocationUrl.trim(),
                price: parseFloat(editPrice) || 0,
                isPriority: editIsPriority,
                owner: item.category === "gusto" ? editOwner : item.owner
            } : item
        );

        await updateData({ wishlist: updated });
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este item?')) {
            await updateData({ wishlist: items.filter(i => i.id !== id) });
        }
    };

    const toggleStatus = async (id: string) => {
        const updated = items.map(i => i.id === id ? { ...i, status: (i.status === 'visited' ? 'to-visit' : 'visited') as 'to-visit' | 'visited' } : i);
        await updateData({ wishlist: updated });
    };

    const formatCOP = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    const renderEditForm = (item: any) => (
        <motion.form
            key={`edit-${item.id}`}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleEditSave}
            className="p-5 border border-geometric-accent bg-white dark:bg-black space-y-3"
        >
            <div className="flex gap-2">
                <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    required
                    placeholder="Título"
                    className="flex-1 bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-xs uppercase tracking-widest outline-none focus:border-geometric-accent"
                />
                <button type="button" onClick={() => setEditingId(null)} className="p-2 border border-stone-200 dark:border-stone-800 text-stone-400">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Descripción"
                className="w-full bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-xs uppercase tracking-widest outline-none focus:border-geometric-accent min-h-[60px]"
            />
            <div className="grid grid-cols-2 gap-2">
                <input
                    value={editLocationUrl}
                    onChange={e => setEditLocationUrl(e.target.value)}
                    placeholder="Ubicación/Link"
                    className="bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-[10px] uppercase tracking-widest outline-none focus:border-geometric-accent"
                />
                {item.category === 'antojo' && (
                    <input
                        type="number"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        className="bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-[10px] uppercase tracking-widest outline-none focus:border-geometric-accent"
                    />
                )}
                {item.category === 'gusto' && (
                    <select
                        value={editOwner}
                        onChange={(e) => setEditOwner(e.target.value as any)}
                        className="bg-transparent border border-stone-200 dark:border-stone-800 px-3 py-2 text-[10px] uppercase tracking-widest outline-none focus:border-geometric-accent"
                    >
                        <option value="el">Santiago</option>
                        <option value="ella">Milena</option>
                    </select>
                )}
            </div>
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editIsPriority} onChange={e => setEditIsPriority(e.target.checked)} className="hidden" />
                    <div className={`w-3.5 h-3.5 border flex items-center justify-center ${editIsPriority ? 'bg-geometric-accent border-geometric-accent' : 'border-stone-300'}`}>
                        {editIsPriority && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-[9px] uppercase font-bold text-stone-500">Prioridad</span>
                </label>
                <button type="submit" className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 py-2 text-[9px] font-black uppercase tracking-widest">
                    Guardar
                </button>
            </div>
        </motion.form>
    );

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => { setActiveCategory(cat.id as Category); setIsAdding(false); setEditingId(null); }}
                            className={`flex flex-col items-center gap-3 p-6 border transition-all ${isActive ? 'bg-stone-900 border-stone-900 dark:bg-stone-100 dark:border-stone-100' : 'border-stone-200 dark:border-stone-800 hover:border-stone-400'}`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white dark:text-stone-900' : 'text-stone-400'}`} />
                            <span className={`text-[10px] uppercase font-black tracking-[0.2em] ${isActive ? 'text-white dark:text-stone-900' : 'text-stone-400'}`}>{cat.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-900 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-geometric-accent" />
                        <h3 className="text-xs uppercase font-black tracking-[0.3em]">{currentCategory.label}</h3>
                    </div>
                    {profile && (
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className={`p-2 border transition-all ${isAdding ? 'bg-geometric-accent border-geometric-accent text-white' : 'border-stone-200 dark:border-stone-800 text-stone-400 hover:border-stone-400'}`}
                        >
                            <Plus className={`w-4 h-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
                        </button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {isAdding ? (
                        <motion.form
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleAdd}
                            className="p-6 border border-geometric-accent/20 bg-stone-50 dark:bg-stone-950 space-y-4"
                        >
                            <input
                                autoFocus
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="¿Qué tenemos en mente?"
                                className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 px-4 py-3 text-xs uppercase tracking-widest outline-none focus:border-geometric-accent"
                            />
                            <textarea
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                placeholder="Más detalles..."
                                className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 px-4 py-3 text-xs uppercase tracking-widest outline-none focus:border-geometric-accent min-h-[80px]"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    value={newLocationUrl}
                                    onChange={(e) => setNewLocationUrl(e.target.value)}
                                    placeholder="Link / Ubicación"
                                    className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 px-4 py-3 text-xs uppercase tracking-widest outline-none focus:border-geometric-accent"
                                />
                                {activeCategory === 'antojo' && (
                                    <input
                                        type="number"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        placeholder="Precio aprox."
                                        className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 px-4 py-3 text-xs uppercase tracking-widest outline-none focus:border-geometric-accent"
                                    />
                                )}
                                {activeCategory === 'gusto' && (
                                    <select
                                        value={newOwner}
                                        onChange={(e) => setNewOwner(e.target.value as any)}
                                        className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 px-4 py-3 text-xs uppercase tracking-widest outline-none focus:border-geometric-accent appearance-none"
                                    >
                                        <option value="el">Para Santiago</option>
                                        <option value="ella">Para Milena</option>
                                    </select>
                                )}
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={newIsPriority}
                                        onChange={(e) => setNewIsPriority(e.target.checked)}
                                        className="hidden"
                                    />
                                    <div className={`w-4 h-4 border flex items-center justify-center transition-all ${newIsPriority ? 'bg-geometric-accent border-geometric-accent' : 'border-stone-300 dark:border-stone-700'}`}>
                                        {newIsPriority && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors">Es Prioridad</span>
                                </label>
                                <button
                                    type="submit"
                                    className="flex-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-geometric-accent dark:hover:bg-geometric-accent hover:text-white transition-all"
                                >
                                    Añadir a la lista
                                </button>
                            </div>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            {activeCategory === 'plan' && <GeospatialPlanTracker />}

                            {activeCategory === 'gusto' ? (
                                <div className="grid md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-user-a border-b border-user-a/20 pb-2 mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-user-a rounded-full" />
                                            Gustos de Santiago
                                        </h4>
                                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredItems.filter(i => i.owner === 'el' || (!i.owner && i.author === 'el')).map(item => (
                                                editingId === item.id ? renderEditForm(item) : <GustoItem key={item.id} item={item} onEdit={() => handleEditStart(item)} />
                                            ))}
                                            {filteredItems.filter(i => i.owner === 'el' || (!i.owner && i.author === 'el')).length === 0 && (
                                                <p className="text-[8px] uppercase opacity-30 italic">No hay gustos registrados</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-user-b border-b border-user-b/20 pb-2 mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-user-b rounded-full" />
                                            Gustos de Milena
                                        </h4>
                                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredItems.filter(i => i.owner === 'ella' || (!i.owner && i.author === 'ella')).map(item => (
                                                editingId === item.id ? renderEditForm(item) : <GustoItem key={item.id} item={item} onEdit={() => handleEditStart(item)} />
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
                                            const isEditing = editingId === item.id;
                                            const canAfford = activeCategory === 'antojo' && !isVisited && (item.price || 0) <= totalSavings;
                                            const accentColor = item.author === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';

                                            if (isEditing) {
                                                return renderEditForm(item);
                                            }

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
                                                    {isVisited && (
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.05]">
                                                            <Check className="w-24 h-24 stroke-[4]" />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 flex-1">
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
                                                                {activeCategory === 'antojo' ? (
                                                                    <LinkPreview url={item.locationUrl} category={activeCategory} />
                                                                ) : (
                                                                    <a
                                                                        href={item.locationUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest text-geometric-accent hover:underline"
                                                                    >
                                                                        <ExternalLink className="w-3 h-3" />
                                                                        {activeCategory === 'plan' ? 'Ver Ubicación' : 'Link Preview'}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-3">
                                                            {!isVisited && (
                                                                <button
                                                                    onClick={() => handleEditStart(item)}
                                                                    className="text-stone-300 hover:text-geometric-accent transition-colors"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
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
