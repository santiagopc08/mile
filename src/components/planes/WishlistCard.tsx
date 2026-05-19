'use client';

import React, { useState } from 'react';
import type { WishlistItem } from '@/services/storeService';
import { formatCOP, STATE_CONFIG, REACTION_CONFIG, GOAL_CATEGORIES } from './constants';
import { ExternalLink, Trash2, Pencil, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreService } from '@/services/storeService';
import { supabase } from '@/lib/supabase';

interface WishlistCardProps {
    item: WishlistItem;
    profile: string;
    onRefresh: () => void;
    onEdit: (item: WishlistItem) => void;
    onDelete: (id: string) => void;
}

export function WishlistCard({ item, profile, onRefresh, onEdit, onDelete }: WishlistCardProps) {
    const [showContrib, setShowContrib] = useState(false);
    const [contribAmount, setContribAmount] = useState('');
    const [contribNote, setContribNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const stateConfig = STATE_CONFIG[item.state] || STATE_CONFIG.DISCOVERED;
    const catConfig = GOAL_CATEGORIES.find(c => c.id === item.goalCategory);
    const progress = item.price > 0 ? Math.min((item.savedAmount / item.price) * 100, 100) : 0;
    const chunks = 10;
    const filledChunks = Math.round((progress / 100) * chunks);
    const isCompleted = item.state === 'COMPLETED' || item.state === 'ARCHIVED';
    const authorColor = item.author === 'ella' ? 'text-user-a' : 'text-user-b';
    const authorBorder = item.author === 'ella' ? 'border-user-a/30' : 'border-user-b/30';

    const handleContribute = async (amount: number) => {
        if (amount <= 0) return;
        setSubmitting(true);
        try {
            await StoreService.addContribution(item.id, profile || 'el', amount, contribNote, supabase);
            // Auto-transition to SAVING if still DISCOVERED
            if (item.state === 'DISCOVERED') {
                await StoreService.updateWishlistState(item.id, 'SAVING', profile || 'el', supabase);
            }
            // Check if ready
            if (item.savedAmount + amount >= item.price && item.price > 0 && item.state === 'SAVING') {
                await StoreService.updateWishlistState(item.id, 'READY_TO_DEPLOY', profile || 'el', supabase);
            }
            setContribAmount('');
            setContribNote('');
            setShowContrib(false);
            onRefresh();
        } catch (e) { console.error(e); }
        setSubmitting(false);
    };

    const handleReaction = async (type: string) => {
        try {
            await StoreService.toggleReaction(item.id, profile || 'el', type, supabase);
            onRefresh();
        } catch (e) { console.error(e); }
    };

    const handleStateTransition = async () => {
        if (!stateConfig.next) return;
        if (stateConfig.next === 'READY_TO_DEPLOY' && item.savedAmount < item.price && item.price > 0) return;
        try {
            await StoreService.updateWishlistState(item.id, stateConfig.next, profile || 'el', supabase);
            onRefresh();
        } catch (e) { console.error(e); }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative border bg-black/60 transition-all hover:bg-white/[0.02] ${isCompleted ? 'border-white/10 opacity-60' : `border-dashed ${authorBorder}`}`}
        >
            {/* Image header if available */}
            {item.imageUrl && (
                <div className="relative h-32 w-full overflow-hidden border-b border-white/10">
                    <img src={item.imageUrl} alt={item.title} className="wishlist-card-img h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
            )}

            <div className="p-4 sm:p-5">
                {/* Top row: category + state + author */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    {catConfig && <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/30">{catConfig.emoji} {catConfig.label}</span>}
                    <span className={`state-badge ${stateConfig.css}`}>{stateConfig.label}</span>
                    <span className="ml-auto flex items-center gap-1">
                        <span className={`text-[8px] font-black uppercase ${authorColor}`}>{item.author === 'el' ? 'S' : 'M'}</span>
                        {item.shared && <span className="text-[7px] font-bold text-white/20 border border-white/10 px-1">SHARED</span>}
                    </span>
                </div>

                {/* Title + description */}
                <h4 className={`text-sm font-black uppercase tracking-[0.1em] ${isCompleted ? 'line-through text-[#a88a7e]' : 'text-white'}`}>
                    {item.title}
                </h4>
                {item.description && (
                    <p className="mt-1 text-[10px] tracking-normal text-[#a88a7e] line-clamp-2">{item.description}</p>
                )}

                {/* Savings progress */}
                {item.price > 0 && !isCompleted && (
                    <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-mono font-bold text-user-b">{formatCOP(item.savedAmount)}</span>
                            <span className="text-[9px] font-mono text-white/25">/ {formatCOP(item.price)}</span>
                        </div>
                        <div className="savings-track">
                            {Array.from({ length: chunks }).map((_, i) => (
                                <div key={i} className={`savings-chunk ${i < filledChunks ? 'savings-chunk-filled' : ''} ${i === filledChunks - 1 && filledChunks > 0 ? 'savings-chunk-latest' : ''}`} />
                            ))}
                        </div>
                    </div>
                )}

                {isCompleted && item.price > 0 && (
                    <div className="mt-2 text-[9px] font-mono font-bold text-user-c">✓ {formatCOP(item.price)}</div>
                )}

                {/* Expand toggle */}
                <button onClick={() => setExpanded(!expanded)} className="mt-3 flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors">
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {expanded ? 'Menos' : 'Más'}
                </button>

                <AnimatePresence>
                    {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-3">

                                {/* External link */}
                                {(item.externalLink || item.locationUrl) && (
                                    <a href={item.externalLink || item.locationUrl} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#00dbe9] hover:underline">
                                        <ExternalLink className="w-3 h-3" /> Ver Link
                                    </a>
                                )}

                                {/* Reactions */}
                                <div className="flex flex-wrap gap-1.5">
                                    {REACTION_CONFIG.map(r => {
                                        const myReaction = item.reactions.find(rx => rx.reactor === profile && rx.type === r.type);
                                        const count = item.reactions.filter(rx => rx.type === r.type).length;
                                        return (
                                            <button key={r.type} onClick={() => handleReaction(r.type)}
                                                className={`reaction-btn ${myReaction ? 'reaction-btn-active' : ''}`}>
                                                <span>{r.emoji}</span>
                                                {count > 0 && <span>{count}</span>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Contribution section */}
                                {!isCompleted && item.price > 0 && (
                                    <div>
                                        {!showContrib ? (
                                            <button onClick={() => setShowContrib(true)}
                                                className="w-full border border-user-b/20 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-user-b hover:bg-user-b/[0.06] transition-colors">
                                                + Contribuir
                                            </button>
                                        ) : (
                                            <div className="space-y-2 border border-user-b/20 bg-user-b/[0.03] p-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {[5000, 10000, 20000, 50000].map(amt => (
                                                        <button key={amt} onClick={() => handleContribute(amt)} disabled={submitting}
                                                            className="contrib-quick-btn">{formatCOP(amt)}</button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)}
                                                        placeholder="Otro monto" className="flex-1 border border-white/10 bg-black px-3 py-2 text-[10px] text-white outline-none focus:border-user-b" />
                                                    <button onClick={() => handleContribute(parseFloat(contribAmount) || 0)} disabled={submitting || !contribAmount}
                                                        className="border border-user-b bg-user-b/10 px-4 py-2 text-[9px] font-bold text-user-b disabled:opacity-30">OK</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* State transition + actions */}
                                <div className="flex items-center gap-2">
                                    {stateConfig.next && stateConfig.nextLabel && (
                                        <button onClick={handleStateTransition}
                                            disabled={stateConfig.next === 'READY_TO_DEPLOY' && item.savedAmount < item.price && item.price > 0}
                                            className={`flex-1 border py-2 text-[9px] font-black uppercase tracking-[0.16em] transition-colors disabled:opacity-20 ${
                                                stateConfig.next === 'COMPLETED' ? 'border-user-c/40 text-user-c hover:bg-user-c/10' : 'border-[#00dbe9]/40 text-[#00dbe9] hover:bg-[#00dbe9]/10'
                                            }`}>
                                            {stateConfig.nextLabel}
                                        </button>
                                    )}
                                    {!isCompleted && (
                                        <button onClick={() => onEdit(item)} className="p-2 text-[#a88a7e] hover:text-[#00dbe9] transition-colors">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => onDelete(item.id)} className="p-2 text-[#a88a7e] hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Recent contributions */}
                                {item.contributions.length > 0 && (
                                    <div className="border-t border-white/[0.04] pt-2">
                                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20 mb-1">Contribuciones</p>
                                        {item.contributions.slice(0, 3).map(c => (
                                            <div key={c.id} className="flex items-center justify-between py-1 text-[9px]">
                                                <span className={c.contributor === 'el' ? 'text-user-b' : 'text-user-a'}>{c.contributor === 'el' ? 'Santiago' : 'Milena'}</span>
                                                <span className="font-mono font-bold text-user-b">+{formatCOP(c.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
