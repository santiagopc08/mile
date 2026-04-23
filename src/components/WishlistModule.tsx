'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { Plus, Trash2, MapPin, Utensils, Heart, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Category = 'plan' | 'antojo' | 'gusto';

export function WishlistModule() {
    const { data, updateData } = useStore();
    const { profile } = useProfile();
    const [activeCategory, setActiveCategory] = useState<Category>('plan');
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const items = data?.wishlist || [];
    const filteredItems = items.filter(item => item.category === activeCategory);

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
                status: 'pending',
                author: profile || 'el'
            };
            await updateData({ wishlist: [newItem, ...items] });
            setNewTitle('');
            setNewDesc('');
            setIsAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        await updateData({ wishlist: items.filter(i => i.id !== id) });
    };

    const toggleStatus = async (id: string) => {
        const updated = items.map(i =>
            i.id === id ? { ...i, status: i.status === 'done' ? 'pending' : 'done' } : i
        );
        await updateData({ wishlist: updated });
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
                                <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 ml-1">Detalles / Notas</label>
                                <textarea
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    placeholder="MÁS INFORMACIÓN..."
                                    className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 px-4 py-3 text-xs uppercase tracking-widest outline-none focus:border-geometric-accent resize-none h-24"
                                />
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
                            className="space-y-3"
                        >
                            {filteredItems.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center opacity-20">
                                    <CategoryIcon className="w-12 h-12 mb-4" />
                                    <p className="text-[10px] uppercase font-black tracking-[0.4em]">Lista Vacía</p>
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`group flex items-center gap-4 p-4 border ${
                                            item.status === 'done'
                                                ? 'border-stone-100 dark:border-stone-900 bg-stone-50/30 dark:bg-stone-950/30 opacity-60'
                                                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-black'
                                        }`}
                                    >
                                        <button
                                            onClick={() => toggleStatus(item.id)}
                                            className={`transition-colors ${item.status === 'done' ? 'text-geometric-accent' : 'text-stone-300 hover:text-stone-400'}`}
                                        >
                                            {item.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-xs font-black uppercase tracking-widest ${item.status === 'done' ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-100'}`}>
                                                {item.title}
                                            </h4>
                                            {item.description && (
                                                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1 italic uppercase tracking-tighter">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-[8px] font-mono opacity-20 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                                                By {item.author}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
