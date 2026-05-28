'use client';

import React, { useState } from 'react';
import type { WishlistItem } from '@/services/storeService';
import { formatCOP, STATE_CONFIG, REACTION_CONFIG, GOAL_CATEGORIES } from './constants';
import { ExternalLink, Trash2, Pencil, MapPin, ChevronRight, Heart, Zap, Sparkles } from 'lucide-react';
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

    const stateBgClass = 
        item.state === 'DISCOVERED' ? 'state-discovered-bg' :
        item.state === 'SAVING' ? 'state-saving-bg' :
        item.state === 'READY_TO_DEPLOY' ? 'state-ready-bg' :
        item.state === 'COMPLETED' ? 'state-completed-bg' :
        'state-archived-bg';

    const reactionIcons: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
        LIKE: Heart,
        PRIORITY: Zap,
        WANT_THIS_WITH_YOU: Sparkles,
    };

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
            className={`group relative flex flex-col border bg-[#120d0e] transition-all hover:bg-white/[0.02] ${isCompleted ? 'border-white/10 opacity-60' : `border-white/10 hover:border-white/20`}`}
        >
            {/* Thick left border for state */}
            <div className={`absolute left-0 top-0 bottom-0 w-[5px] z-10 ${stateBgClass}`} />
            
            {/* Card Content Wrapper: nested to have consistent left padding */}
            <div className="p-4 pl-7 flex flex-col gap-4">
                {/* Header strip: Category and Badges on left, rigid button group on right */}
                <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        {CatIcon && <CatIcon className="h-4 w-4 shrink-0 text-white/40" strokeWidth={1.5} />}
                        <span className={`state-badge ${stateConfig.css}`}>{stateConfig.label}</span>
                    </div>

                    <div className="flex gap-[1px] bg-white/[0.08] brutal-border shrink-0">
                        {/* Reactions Grid */}
                        {REACTION_CONFIG.map(r => {
                            const myReaction = item.reactions.find(rx => rx.reactor === profile && rx.type === r.type);
                            const count = item.reactions.filter(rx => rx.type === r.type).length;
                            const Icon = reactionIcons[r.type];
                            
                            return (
                                <button
                                    key={r.type}
                                    onClick={() => handleReaction(r.type)}
                                    className={`relative w-8 h-8 !min-h-0 flex items-center justify-center transition-colors hover:bg-white/5 ${
                                        myReaction ? 'bg-user-a/10 text-user-a' : 'text-white/40 hover:text-white/70'
                                    }`}
                                    title={r.label}
                                >
                                    {Icon && <Icon className="h-4 w-4" strokeWidth={1.5} />}
                                    {count > 0 && (
                                        <span className="absolute bottom-0.5 right-0.5 text-[7px] font-black leading-none bg-[#120d0e] border border-white/10 px-0.5">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        {/* Map pin */}
                        {item.locationUrl ? (
                            <a href={item.locationUrl} target="_blank" rel="noopener noreferrer"
                                className="w-8 h-8 flex items-center justify-center text-[#00dbe9] hover:bg-white/5"
                                title="Ver ubicación">
                                <MapPin className="h-4 w-4" strokeWidth={1.5} />
                            </a>
                        ) : (
                            <span className="w-8 h-8 flex items-center justify-center text-white/10 select-none">
                                <MapPin className="h-4 w-4" strokeWidth={1.5} />
                            </span>
                        )}

                        {/* Author letter */}
                        <div className={`w-8 h-8 flex items-center justify-center font-mono text-[10px] font-black uppercase ${
                            item.author === 'ella' ? 'bg-user-a/10 text-user-a' : 'bg-user-b/10 text-user-b'
                        }`}>
                            {item.author === 'el' ? 'S' : 'M'}
                        </div>

                        {/* Shared badge */}
                        {item.shared && (
                            <div className="px-2 h-8 flex items-center justify-center font-mono text-[8px] text-white/40 border-l border-white/[0.08] select-none uppercase tracking-wider">
                                Para los dos
                            </div>
                        )}
                    </div>
                </div>

                {/* Body content: split columns if detail link exists */}
                <div className={`w-full ${hasDetailLink ? 'grid grid-cols-[minmax(0,1fr)_100px] sm:grid-cols-[minmax(0,1fr)_120px] gap-4' : ''}`}>
                    {/* Left side */}
                    <div className="min-w-0 flex flex-col gap-2 justify-center">
                        <h4 className={`text-[13px] font-black uppercase leading-tight tracking-[0.08em] ${isCompleted ? 'line-through text-[#a88a7e]' : 'text-white'}`}>
                            {item.title}
                        </h4>
                        {item.description && (
                            <p className="text-[10px] leading-relaxed tracking-normal text-[#a88a7e] line-clamp-2">{item.description}</p>
                        )}

                        {/* Savings progress */}
                        {item.price > 0 && !isCompleted && (
                            <div className="mt-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-mono font-bold text-user-b">{formatCOP(item.savedAmount)}</span>
                                    <span className="text-[10px] font-mono text-white/20">/ {formatCOP(item.price)}</span>
                                </div>
                                <div className="chunked-progress h-2">
                                    {Array.from({ length: chunks }).map((_, i) => (
                                        <div key={i} className={`chunk ${i < filledChunks ? 'filled' : ''}`} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {isCompleted && item.price > 0 && (
                            <div className="mt-1 text-[8px] font-mono font-bold text-user-c">✓ {formatCOP(item.price)}</div>
                        )}

                        {/* Quick contributions button/inputs */}
                        {!isCompleted && item.price > 0 && (
                            <div className="mt-2">
                                {!showContrib ? (
                                    <button onClick={() => setShowContrib(true)}
                                        className="w-full border border-white/10 py-2 text-[9px] font-mono font-bold uppercase tracking-widest text-user-b transition-colors hover:bg-white/5">
                                        + CONTRIBUIR
                                    </button>
                                ) : (
                                    <div className="space-y-1.5 border border-white/10 bg-[#080808] p-2">
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

                        {/* Recent contributions */}
                        {item.contributions.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 border-t border-white/[0.04] pt-1.5">
                                {item.contributions.slice(0, 2).map(c => (
                                    <span key={c.id} className="text-[8px] uppercase tracking-wider font-mono">
                                        <span className={c.contributor === 'el' ? 'text-user-b' : 'text-user-a'}>{c.contributor === 'el' ? 'S' : 'M'}</span>
                                        <span className="text-white/40 ml-1">aportó</span>
                                        <span className="font-bold text-user-b ml-1">{formatCOP(c.amount)}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right side: detail link preview */}
                    {hasDetailLink && (
                        <div className="border border-white/[0.06] p-1 bg-black/20 flex items-center justify-center">
                            <LinkPreview url={item.externalLink!} category="antojo" variant="square" />
                        </div>
                    )}
                </div>
            </div>

            {/* Footer strip: state transition + edit/delete */}
            <div className="flex items-stretch border-t border-dashed border-white/20 mt-auto">
                {stateConfig.next && stateConfig.nextLabel && (
                    <button onClick={handleStateTransition}
                        disabled={stateConfig.next === 'READY_TO_DEPLOY' && item.savedAmount < item.price && item.price > 0}
                        className={`flex flex-1 items-center justify-center gap-1 py-3 text-[8px] font-mono font-bold uppercase tracking-widest transition-colors disabled:opacity-20 ${
                            stateConfig.next === 'COMPLETED' ? 'text-user-c hover:bg-white/5' : 'text-[#00dbe9] hover:bg-white/5'
                        }`}>
                        <ChevronRight className="h-3 w-3" />
                        {stateConfig.nextLabel}
                    </button>
                )}
                {!isCompleted && (
                    <button onClick={() => onEdit(item)} className="flex w-12 items-center justify-center border-l border-white/10 text-[#a88a7e] transition-colors hover:text-[#00dbe9] hover:bg-white/5">
                        <Pencil className="w-4 h-4" />
                    </button>
                )}
                <button onClick={() => onDelete(item.id)} className="flex w-12 items-center justify-center border-l border-white/10 text-[#a88a7e] transition-colors hover:text-red-400 hover:bg-white/5">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
