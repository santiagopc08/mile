'use client';

import React, { useState } from 'react';
import type { WishlistItem, WishlistState } from '@/services/storeService';
import { formatCOP, STATE_CONFIG, REACTION_CONFIG, GOAL_CATEGORIES } from './constants';
import { ExternalLink, Trash2, Pencil, MapPin, ChevronRight, Heart, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkPreview } from '@/components/LinkPreview';
import { FuturisticProgressBar } from '@/components/ui/FuturisticProgressBar';

interface WishlistCardProps {
    item: WishlistItem;
    profile: string;
    onRefresh: () => void;
    onEdit: (item: WishlistItem) => void;
    onDelete: (id: string) => void;
}

import { ChamferedPanel } from '@/components/ui/ChamferedPanel';

export function WishlistCard({ item, profile, onRefresh, onEdit, onDelete }: WishlistCardProps) {
    const [showContrib, setShowContrib] = useState(false);
    const [contribAmount, setContribAmount] = useState('');
    const [contribNote, setContribNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const stateConfig = STATE_CONFIG[item.state] || STATE_CONFIG.DISCOVERED;
    const catConfig = GOAL_CATEGORIES.find(c => c.id === item.goalCategory);
    const progress = item.price > 0 ? Math.min((item.savedAmount / item.price) * 100, 100) : 0;
    const isCompleted = item.state === 'COMPLETED' || item.state === 'ARCHIVED';
    const authorColor = item.author === 'ella' ? '#ff4b89' : '#c3f400';
    const CatIcon = catConfig?.icon;

    const stateBgClass = 
        item.state === 'DISCOVERED' ? 'state-discovered-bg' :
        item.state === 'SAVING' ? 'state-saving-bg' :
        item.state === 'READY_TO_DEPLOY' ? 'state-ready-bg' :
        item.state === 'COMPLETED' ? 'state-completed-bg' :
        'state-archived-bg';

    const handleContribute = async (amount: number) => {
        if (amount <= 0) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'contribute',
                    itemId: item.id,
                    profile: profile || 'el',
                    amount,
                    note: contribNote
                })
            });
            if (!res.ok) throw new Error('Failed to contribute');

            setContribAmount('');
            setContribNote('');
            setShowContrib(false);
            onRefresh();
        } catch (e) { console.error(e); }
        setSubmitting(false);
    };

    const handleStateTransition = async (forcedNextState?: WishlistState) => {
        const nextState = forcedNextState || stateConfig.next;
        if (!nextState) return;
        if (!forcedNextState && nextState === 'READY_TO_DEPLOY' && item.savedAmount < item.price && item.price > 0) return;
        try {
            const res = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'state_transition',
                    itemId: item.id,
                    profile: profile || 'el',
                    nextState
                })
            });
            if (!res.ok) throw new Error('Failed to transition state');
            onRefresh();
        } catch (e) { console.error(e); }
    };

    const hasDetailLink = !!item.externalLink && (item.externalLink.startsWith('http://') || item.externalLink.startsWith('https://'));

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative"
        >
            <ChamferedPanel
                accentColor={authorColor}
                notchSize={14}
                label={`${item.author === 'ella' ? 'MILENA' : 'SANTIAGO'} · ${catConfig?.label?.toUpperCase() || item.goalCategory.toUpperCase()}`}
                className={`!p-3.5 flex flex-col justify-between ${isCompleted ? 'opacity-40' : ''}`}
            >
                {/* Header Chips & Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-[7px] uppercase font-black px-1.5 py-0.5 rounded-none" style={{ backgroundColor: `${authorColor}30`, color: authorColor }}>
                            {item.author === 'ella' ? 'Milena' : 'Santiago'}
                        </span>
                        {item.shared && (
                            <span className="text-[7px] uppercase font-mono tracking-wider text-white/50 border border-white/10 px-1 py-0.5">
                                Compartido
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[7px] font-mono tracking-wider uppercase px-1.5 py-0.5 border border-white/10 ${stateConfig.css}`}>
                            {stateConfig.label}
                        </span>
                        {item.locationUrl && (
                            <a href={item.locationUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[#00dbe9] border border-white/10 p-1 hover:bg-white/10 transition-colors" title="Ubicación">
                                <MapPin className="h-3 w-3" strokeWidth={1.5} />
                            </a>
                        )}
                    </div>
                </div>

                {/* Main Content Body */}
                <div className={`w-full ${hasDetailLink ? 'grid grid-cols-[minmax(0,1fr)_90px] sm:grid-cols-[minmax(0,1fr)_110px] gap-3' : ''}`}>
                    <div className="min-w-0 flex flex-col gap-1.5 justify-center">
                        <h4 className={`text-xs sm:text-sm font-black uppercase tracking-wider font-mono ${isCompleted ? 'line-through text-[#a88a7e]' : 'text-white'}`}>
                            {item.title}
                        </h4>
                        {item.description && (
                            <p className="text-[10px] leading-relaxed text-[#a88a7e] line-clamp-2 font-sans">{item.description}</p>
                        )}

                        {/* Progress Bar */}
                        {item.price > 0 && !isCompleted && (
                            <div className="mt-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-mono font-bold text-user-b">{formatCOP(item.savedAmount)}</span>
                                    <span className="text-[10px] font-mono text-white/30">/ {formatCOP(item.price)}</span>
                                </div>
                                <FuturisticProgressBar 
                                    progress={progress} 
                                    color={authorColor}
                                />
                            </div>
                        )}

                        {isCompleted && item.price > 0 && (
                            <div className="mt-1 text-[9px] font-mono font-bold text-user-c">✓ {formatCOP(item.price)}</div>
                        )}

                        {/* Contribution Controls */}
                        {!isCompleted && item.price > 0 && (
                            <div className="mt-1.5">
                                {!showContrib ? (
                                    <button onClick={() => setShowContrib(true)}
                                        className="w-full border border-white/15 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-user-b transition-colors hover:bg-white/10">
                                        + CONTRIBUIR
                                    </button>
                                ) : (
                                    <div className="space-y-1.5 border border-white/15 bg-black/80 p-2">
                                        <div className="grid grid-cols-4 gap-1">
                                            {[5000, 10000, 20000, 50000].map(amt => (
                                                <button key={amt} onClick={() => handleContribute(amt)} disabled={submitting}
                                                    className="contrib-quick-btn !py-1 !text-[7px]">{formatCOP(amt)}</button>
                                            ))}
                                        </div>
                                        <div className="flex gap-1">
                                            <input type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)}
                                                placeholder="Otro" className="min-w-0 flex-1 border border-white/15 bg-black px-2 py-1 text-[9px] text-white outline-none focus:border-user-b" />
                                            <button onClick={() => handleContribute(parseFloat(contribAmount) || 0)} disabled={submitting || !contribAmount}
                                                className="border border-user-b bg-user-b/20 px-2 py-1 text-[8px] font-bold text-user-b disabled:opacity-30">OK</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {hasDetailLink && (
                        <div className="flex items-center justify-center shrink-0">
                            <LinkPreview url={item.externalLink!} category="antojo" variant="square" />
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-stretch border-t border-white/10 mt-3 pt-2">
                    {item.state === 'DISCOVERED' ? (
                        <>
                            <button onClick={() => handleStateTransition('SAVING')}
                                className="flex flex-1 items-center justify-center gap-1 py-1 text-[8px] font-mono font-bold uppercase tracking-widest transition-colors text-[#00dbe9] hover:bg-white/5 border-r border-white/10">
                                <ChevronRight className="h-3 w-3" />
                                Ahorrar
                            </button>
                            <button onClick={() => handleStateTransition('READY_TO_DEPLOY')}
                                className="flex flex-1 items-center justify-center gap-1 py-1 text-[8px] font-mono font-bold uppercase tracking-widest transition-colors text-user-c hover:bg-white/5">
                                <ChevronRight className="h-3 w-3" />
                                Listo
                            </button>
                        </>
                    ) : (
                        stateConfig.next && stateConfig.nextLabel && (
                            <button onClick={() => handleStateTransition()}
                                disabled={stateConfig.next === 'READY_TO_DEPLOY' && item.savedAmount < item.price && item.price > 0}
                                className={`flex flex-1 items-center justify-center gap-1 py-1 text-[8px] font-mono font-bold uppercase tracking-widest transition-colors disabled:opacity-20 ${
                                    stateConfig.next === 'COMPLETED' ? 'text-user-c hover:bg-white/5' : 'text-[#00dbe9] hover:bg-white/5'
                                }`}>
                                <ChevronRight className="h-3 w-3" />
                                {stateConfig.nextLabel}
                            </button>
                        )
                    )}
                    {!isCompleted && (
                        <button onClick={() => onEdit(item)} className="flex w-10 items-center justify-center border-l border-white/10 text-[#a88a7e] transition-colors hover:text-[#00dbe9]">
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button onClick={() => onDelete(item.id)} className="flex w-10 items-center justify-center border-l border-white/10 text-[#a88a7e] transition-colors hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </ChamferedPanel>
        </motion.div>
    );
}
