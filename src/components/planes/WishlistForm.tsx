import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Link2, X } from 'lucide-react';
import { LiveLinkPreview } from '../LiveLinkPreview';
import { GOAL_CATEGORIES } from './constants';
import type { GoalCategory } from '@/services/storeService';
import type { useWishlist } from '@/hooks/useWishlist';

type WishlistFormProps = {
    wishlistState: ReturnType<typeof useWishlist>;
    onSubmit: (e: React.FormEvent) => void;
    profile: string | null;
};

export function WishlistForm({ wishlistState, onSubmit, profile }: WishlistFormProps) {
    const {
        editingItem, setIsAdding, setEditingItem,
        fTitle, setFTitle,
        fDesc, setFDesc,
        fPrice, setFPrice,
        fCategory, setFCategory,
        fLocationUrl, setFLocationUrl,
        fDetailLink, setFDetailLink,
        fOwner, setFOwner,
        fShared, setFShared,
        fPriority, setFPriority,
    } = wishlistState;

    return (
        <div className="w-full max-w-full overflow-hidden">
            <motion.form key="form" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                onSubmit={onSubmit} className="w-full max-w-full mb-4 space-y-1.5 border border-white/10 bg-black/60 p-3.5 sm:p-5">
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
    );
}
