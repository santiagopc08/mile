'use client';

import React, { useState } from 'react';
import type { WishlistItem } from '@/services/storeService';
import { formatCOP, STATE_CONFIG, REACTION_CONFIG, GOAL_CATEGORIES } from './constants';
import { ExternalLink, Trash2, Pencil, MapPin, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { StoreService } from '@/services/storeService';
import { supabase } from '@/lib/supabase';
import { LinkPreview } from '@/components/LinkPreview';

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

    const stateConfig = STATE_CONFIG[item.state] || STATE_CONFIG.DISCOVERED;
    const catConfig = GOAL_CATEGORIES.find(c => c.id === item.goalCategory);
    const progress = item.price > 0 ? Math.min((item.savedAmount / item.price) * 100, 100) : 0;
    const chunks = 10;
    const filledChunks = Math.round((progress / 100) * chunks);
    const isCompleted = item.state === 'COMPLETED' || item.state === 'ARCHIVED';
    const authorColor = item.author === 'ella' ? 'text-user-a' : 'text-user-b';
    const authorBorder = item.author === 'ella' ? 'border-user-a/30' : 'border-user-b/30';
    const CatIcon = catConfig?.icon;

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

            // Notificar a la pareja si el plan es compartido
            if (item.shared) {
                const target = profile === 'el' ? 'ella' : 'el';
                const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                const amountFormatted = formatCOP(amount);
                await StoreService.addNotification(target, 'wishlist', `¡${authorName} aportó ${amountFormatted} al plan: "${item.title}"! 💰`, supabase);
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
            
            // Notificar a la pareja si el plan es compartido
            if (item.shared) {
                const target = profile === 'el' ? 'ella' : 'el';
                const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                if (stateConfig.next === 'COMPLETED') {
                    await StoreService.addNotification(target, 'wishlist', `¡Objetivo Cumplido! Completamos el plan: "${item.title}" 🎉`, supabase);
                } else {
                    const stateLabel = STATE_CONFIG[stateConfig.next]?.label || stateConfig.next;
                    await StoreService.addNotification(target, 'wishlist', `¡${authorName} actualizó el plan "${item.title}" a estado: ${stateLabel}!`, supabase);
                }
            }
            
            onRefresh();
        } catch (e) { console.error(e); }
    };

    const hasDetailLink = !!item.externalLink;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative border bg-black/60 transition-all hover:bg-white/[0.02] ${isCompleted ? 'border-white/10 opacity-60' : `border-dashed ${authorBorder}`}`}
        >
            {/* Header strip: category icon + state + author + map + reactions inline */}
            <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
                {/* Category icon */}
                {CatIcon && <CatIcon className="h-3.5 w-3.5 shrink-0 text-white/25" strokeWidth={1.5} />}
                <span className={`state-badge ${stateConfig.css}`}>{stateConfig.label}</span>

                {/* Reactions inline */}
                <div className="ml-auto flex items-center gap-1">
                    {REACTION_CONFIG.map(r => {
                        const myReaction = item.reactions.find(rx => rx.reactor === profile && rx.type === r.type);
                        const count = item.reactions.filter(rx => rx.type === r.type).length;
                        return (
                            <button
                                key={r.type}
                                onClick={() => handleReaction(r.type)}
                                className={`flex h-6 items-center gap-0.5 border px-1.5 text-[8px] font-black transition-all ${
                                    myReaction
                                        ? 'border-user-a/40 bg-user-a/10 text-user-a'
                                        : 'border-white/[0.06] text-white/30 hover:border-white/20 hover:text-white/50'
                                }`}
                                title={r.label}
                            >
                                <span className="text-[9px]">{r.emoji}</span>
                                {count > 0 && <span>{count}</span>}
                            </button>
                        );
                    })}

                    {/* Map pin */}
                    {item.locationUrl ? (
                        <a href={item.locationUrl} target="_blank" rel="noopener noreferrer"
                            className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#00dbe9]/30 text-[#00dbe9] transition-colors hover:bg-[#00dbe9]/10"
                            title="Ver ubicación">
                            <MapPin className="h-3 w-3" />
                        </a>
                    ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-white/[0.06] text-white/15">
                            <MapPin className="h-3 w-3" />
                        </span>
                    )}

                    {/* Author + shared */}
                    <span className={`text-[7px] font-black uppercase ${authorColor}`}>{item.author === 'el' ? 'S' : 'M'}</span>
                    {item.shared && <span className="text-[6px] font-bold text-white/20 border border-white/10 px-1 leading-none py-0.5">SH</span>}
                </div>
            </div>

            {/* Body: two-column when there's a detail link preview */}
            <div className={`${hasDetailLink ? 'grid grid-cols-[minmax(0,1fr)_100px] sm:grid-cols-[minmax(0,1fr)_120px]' : ''}`}>
                {/* Left: content */}
                <div className="min-w-0 p-3 sm:p-4">
                    {/* Title */}
                    <h4 className={`text-[11px] font-black uppercase leading-tight tracking-[0.08em] ${isCompleted ? 'line-through text-[#a88a7e]' : 'text-white'}`}>
                        {item.title}
                    </h4>
                    {item.description && (
                        <p className="mt-1 text-[9px] leading-relaxed tracking-normal text-[#a88a7e] line-clamp-2">{item.description}</p>
                    )}

                    {/* Savings progress */}
                    {item.price > 0 && !isCompleted && (
                        <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[8px] font-mono font-bold text-user-b">{formatCOP(item.savedAmount)}</span>
                                <span className="text-[8px] font-mono text-white/20">/ {formatCOP(item.price)}</span>
                            </div>
                            <div className="savings-track">
                                {Array.from({ length: chunks }).map((_, i) => (
                                    <div key={i} className={`savings-chunk ${i < filledChunks ? 'savings-chunk-filled' : ''} ${i === filledChunks - 1 && filledChunks > 0 ? 'savings-chunk-latest' : ''}`} />
                                ))}
                            </div>
                        </div>
                    )}

                    {isCompleted && item.price > 0 && (
                        <div className="mt-1.5 text-[8px] font-mono font-bold text-user-c">✓ {formatCOP(item.price)}</div>
                    )}

                    {/* Contribution section — compact */}
                    {!isCompleted && item.price > 0 && (
                        <div className="mt-2">
                            {!showContrib ? (
                                <button onClick={() => setShowContrib(true)}
                                    className="w-full border border-user-b/20 py-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-user-b transition-colors hover:bg-user-b/[0.06]">
                                    + Contribuir
                                </button>
                            ) : (
                                <div className="space-y-1.5 border border-user-b/20 bg-user-b/[0.03] p-2">
                                    <div className="grid grid-cols-4 gap-1">
                                        {[5000, 10000, 20000, 50000].map(amt => (
                                            <button key={amt} onClick={() => handleContribute(amt)} disabled={submitting}
                                                className="contrib-quick-btn !py-1 !text-[7px]">{formatCOP(amt)}</button>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        <input type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)}
                                            placeholder="Otro" className="min-w-0 flex-1 border border-white/10 bg-black px-2 py-1.5 text-[9px] text-white outline-none focus:border-user-b" />
                                        <button onClick={() => handleContribute(parseFloat(contribAmount) || 0)} disabled={submitting || !contribAmount}
                                            className="border border-user-b bg-user-b/10 px-2 py-1.5 text-[8px] font-bold text-user-b disabled:opacity-30">OK</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recent contributions — inline */}
                    {item.contributions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
                            {item.contributions.slice(0, 2).map(c => (
                                <span key={c.id} className="text-[8px]">
                                    <span className={c.contributor === 'el' ? 'text-user-b' : 'text-user-a'}>{c.contributor === 'el' ? 'S' : 'M'}</span>
                                    <span className="font-mono font-bold text-user-b ml-1">+{formatCOP(c.amount)}</span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: detail link preview — only when there's a link */}
                {hasDetailLink && (
                    <div className="border-l border-white/[0.06] p-1.5">
                        <LinkPreview url={item.externalLink!} category="antojo" variant="square" />
                    </div>
                )}
            </div>

            {/* Footer strip: state transition + edit/delete */}
            <div className="flex items-stretch border-t border-white/[0.06]">
                {stateConfig.next && stateConfig.nextLabel && (
                    <button onClick={handleStateTransition}
                        disabled={stateConfig.next === 'READY_TO_DEPLOY' && item.savedAmount < item.price && item.price > 0}
                        className={`flex flex-1 items-center justify-center gap-1 py-2 text-[7px] font-black uppercase tracking-[0.1em] transition-colors disabled:opacity-20 ${
                            stateConfig.next === 'COMPLETED' ? 'text-user-c hover:bg-user-c/[0.06]' : 'text-[#00dbe9] hover:bg-[#00dbe9]/[0.06]'
                        }`}>
                        <ChevronRight className="h-3 w-3" />
                        {stateConfig.nextLabel}
                    </button>
                )}
                {!isCompleted && (
                    <button onClick={() => onEdit(item)} className="flex w-10 items-center justify-center border-l border-white/[0.06] text-[#a88a7e] transition-colors hover:text-[#00dbe9]">
                        <Pencil className="w-3 h-3" />
                    </button>
                )}
                <button onClick={() => onDelete(item.id)} className="flex w-10 items-center justify-center border-l border-white/[0.06] text-[#a88a7e] transition-colors hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
        </motion.div>
    );
}
