'use client';

import React, { useState } from 'react';
import type { WishlistItem } from '@/services/storeService';
import { formatCOP, STATE_CONFIG, REACTION_CONFIG, GOAL_CATEGORIES } from './constants';
import { ExternalLink, Trash2, Pencil, MapPin, ChevronRight, Heart, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { StoreService } from '@/services/storeService';
import { WishlistService } from '@/services/wishlistService';
import { NotificationService } from '@/services/notificationService';
import { supabase } from '@/lib/supabase';
import { LinkPreview } from '@/components/LinkPreview';
import { FuturisticProgressBar } from '@/components/ui/FuturisticProgressBar';

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

    const catStripeColors: Record<string, string> = {
        Food: 'bg-emerald-400',
        Travel: 'bg-cyan-400',
        Gaming: 'bg-amber-400',
        Tech: 'bg-purple-400',
        Experiences: 'bg-user-b',
        Home: 'bg-user-a'
    };
    const categoryStripeColor = catStripeColors[item.goalCategory] || 'bg-user-c';

    const reactionIcons: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
        LIKE: Heart,
        PRIORITY: Zap,
        WANT_THIS_WITH_YOU: Sparkles,
    };

    const handleContribute = async (amount: number) => {
        if (amount <= 0) return;
        setSubmitting(true);
        try {
            await WishlistService.addContribution(item.id, profile || 'el', amount, contribNote, supabase);
            // Auto-transition to SAVING if still DISCOVERED
            if (item.state === 'DISCOVERED') {
                await WishlistService.updateWishlistState(item.id, 'SAVING', profile || 'el', supabase);
            }
            // Check if ready
            if (item.savedAmount + amount >= item.price && item.price > 0 && item.state === 'SAVING') {
                await WishlistService.updateWishlistState(item.id, 'READY_TO_DEPLOY', profile || 'el', supabase);
            }

            // Notificar a la pareja si el plan es compartido
            if (item.shared) {
                const target = profile === 'el' ? 'ella' : 'el';
                const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                const amountFormatted = formatCOP(amount);
                await NotificationService.addNotification(target, 'wishlist', `¡${authorName} aportó ${amountFormatted} al plan: "${item.title}"! 💰`, supabase);
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
            await WishlistService.toggleReaction(item.id, profile || 'el', type, supabase);
            onRefresh();
        } catch (e) { console.error(e); }
    };

    const handleStateTransition = async () => {
        if (!stateConfig.next) return;
        if (stateConfig.next === 'READY_TO_DEPLOY' && item.savedAmount < item.price && item.price > 0) return;
        try {
            await WishlistService.updateWishlistState(item.id, stateConfig.next, profile || 'el', supabase);
            
            // Notificar a la pareja si el plan es compartido
            if (item.shared) {
                const target = profile === 'el' ? 'ella' : 'el';
                const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                if (stateConfig.next === 'COMPLETED') {
                    await NotificationService.addNotification(target, 'wishlist', `¡Objetivo Cumplido! Completamos el plan: "${item.title}" 🎉`, supabase);
                } else {
                    const stateLabel = STATE_CONFIG[stateConfig.next]?.label || stateConfig.next;
                    await NotificationService.addNotification(target, 'wishlist', `¡${authorName} actualizó el plan "${item.title}" a estado: ${stateLabel}!`, supabase);
                }
            }
            
            onRefresh();
        } catch (e) { console.error(e); }
    };

    const hasDetailLink = !!item.externalLink && (item.externalLink.startsWith('http://') || item.externalLink.startsWith('https://'));

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative flex flex-col border transition-all ${isCompleted ? 'bg-black/40 border-stone-900 opacity-30 shadow-none' : 'bg-[#0a0a0a] border-white/10 hover:border-white/20'}`}
        >
            {/* Thick left border for state */}
            <div className={`absolute left-0 top-0 bottom-0 w-[5px] z-10 ${stateBgClass}`} />

            {/* Top-left category stripe to match task card visual structure */}
            <div className={`absolute left-[5px] top-0 h-1 w-12 z-10 ${categoryStripeColor}`} />

            {/* Left Top Corner Indicators (Author & Scope) */}
            <div className="absolute -top-2 left-[5px] md:-top-3 flex items-center z-10 font-mono">
                <div className={`px-1.5 py-[3px] text-[6px] md:text-[7px] font-mono uppercase tracking-[0.16em] font-black ${
                    item.author === 'ella' ? 'bg-user-a text-black' : 'bg-user-b text-black'
                }`}>
                    {item.author === 'ella' ? 'Milena' : 'Santiago'}
                </div>
                {item.shared && (
                    <div className="border-y border-r border-white/10 bg-[#050505] px-1.5 py-[3px] text-[6px] md:text-[7px] font-mono tracking-widest uppercase text-white/40">
                        Para los dos
                    </div>
                )}
            </div>

            {/* Right Top Corner Indicators */}
            <div className="absolute -top-2 right-0 md:-top-3 flex items-center z-10">
                <div className="border px-1.5 py-[3px] text-[6px] md:text-[7px] font-mono tracking-widest uppercase border-white/10 bg-black/40 text-[#a88a7e] flex items-center gap-1">
                    {CatIcon && <CatIcon className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />}
                    <span>{catConfig?.label || item.goalCategory}</span>
                </div>
                <div className={`border-y border-r border-white/10 px-1.5 py-[3px] text-[6px] md:text-[7px] font-mono tracking-widest uppercase ${stateConfig.css}`}>
                    {stateConfig.label}
                </div>
                {item.locationUrl ? (
                    <a href={item.locationUrl} target="_blank" rel="noopener noreferrer"
                        className="border-b border-r border-white/10 bg-[#050505] px-1.5 py-[3px] text-[#00dbe9] hover:bg-white/5 flex items-center justify-center"
                        title="Ver ubicación">
                        <MapPin className="h-2.5 w-2.5" strokeWidth={1.5} />
                    </a>
                ) : (
                    <div className="border-b border-r border-white/10 bg-[#050505] px-1.5 py-[3px] text-white/10 select-none flex items-center justify-center">
                        <MapPin className="h-2.5 w-2.5" strokeWidth={1.5} />
                    </div>
                )}
            </div>
            
            {/* Card Content Wrapper: nested to have consistent left padding */}
            <div className="pt-3.5 pl-6 pr-4 pb-3 flex flex-col gap-3">
                {/* Body content: split columns if detail link exists */}
                <div className={`w-full pt-1.5 ${hasDetailLink ? 'grid grid-cols-[minmax(0,1fr)_100px] sm:grid-cols-[minmax(0,1fr)_120px] gap-4' : ''}`}>
                    {/* Left side */}
                    <div className="min-w-0 flex flex-col gap-2 justify-center">
                        <h4 className={`text-[13px] font-black uppercase leading-tight tracking-[0.08em] font-mono ${isCompleted ? 'line-through text-[#a88a7e]' : 'text-white'}`}>
                            {item.title}
                        </h4>
                        {item.description && (
                            <p className="text-[10px] leading-relaxed tracking-normal text-[#a88a7e] line-clamp-2 font-sans">{item.description}</p>
                        )}

                        {/* Savings progress */}
                        {item.price > 0 && !isCompleted && (
                            <div className="mt-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-mono font-bold text-user-b">{formatCOP(item.savedAmount)}</span>
                                    <span className="text-[10px] font-mono text-white/20">/ {formatCOP(item.price)}</span>
                                </div>
                                <FuturisticProgressBar 
                                    progress={progress} 
                                    color={item.owner === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)'}
                                />
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
                                        className="w-full border border-white/10 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-user-b transition-colors hover:bg-white/5">
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
                        <div className="flex items-center justify-center shrink-0">
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
                        className={`flex flex-1 items-center justify-center gap-1 py-1.5 text-[8px] font-mono font-bold uppercase tracking-widest transition-colors disabled:opacity-20 ${
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
