'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Trophy,
    Sparkles,
    Coins,
    Crown,
    Gift,
    Scroll,
    Ticket,
    CheckCircle2,
    Play,
    Zap,
    Heart,
    Flame,
    RotateCw,
    Award,
    ChevronRight,
} from 'lucide-react';
import { useArcadeProgression } from '@/hooks/useArcadeProgression';
import { useProfile } from '@/context/ProfileContext';
import { GAMES_METADATA, GameTab } from './ArcadeGameSelector';
import { BrutalistCorners } from '@/components/ui/BrutalistPanel';
import { ArcadeCoupon } from '@/lib/arcadeProgression';
import { DuelsTab } from './hub/DuelsTab';
import { GachaponTab } from './hub/GachaponTab';
import { QuestsTab } from './hub/QuestsTab';
import { WalletTab } from './hub/WalletTab';

interface ArcadeHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectGame: (gameId: GameTab) => void;
}

type TabKey = 'duels' | 'gachapon' | 'quests' | 'wallet';

export function ArcadeHubModal({ isOpen, onClose, onSelectGame }: ArcadeHubModalProps) {
    const { profile } = useProfile();
    const {
        coins,
        synergyXP,
        scores,
        coupons,
        redeemedCoupons,
        dailyQuests,
        pendingQuestsCount,
        gachaponCost,
        spin,
        claimQuest,
        redeem,
    } = useArcadeProgression();

    const [activeTab, setActiveTab] = useState<TabKey>('duels');
    const [isSpinning, setIsSpinning] = useState(false);
    const [wonCoupon, setWonCoupon] = useState<ArcadeCoupon | null>(null);
    const [gachaponError, setGachaponError] = useState<string | null>(null);
    const [justRedeemedId, setJustRedeemedId] = useState<string | null>(null);

    const accentColor = profile === 'ella' ? '#ff4b89' : '#c3f400';

    // Calculate duel totals
    const gameKeys = Object.keys(GAMES_METADATA) as GameTab[];
    let elWins = 0;
    let ellaWins = 0;

    gameKeys.forEach(k => {
        const s = scores[k];
        if (s) {
            if ((s.el || 0) > (s.ella || 0)) elWins++;
            else if ((s.ella || 0) > (s.el || 0)) ellaWins++;
        }
    });

    const handleSpin = () => {
        if (coins < gachaponCost || isSpinning) return;
        setGachaponError(null);
        setIsSpinning(true);
        setWonCoupon(null);

        setTimeout(() => {
            const res = spin();
            setIsSpinning(false);
            if (res.success && res.coupon) {
                setWonCoupon(res.coupon);
            } else if (res.error) {
                setGachaponError(res.error);
            }
        }, 1500);
    };

    const handleRedeem = (couponId: string) => {
        setJustRedeemedId(couponId);
        redeem(couponId);
        setTimeout(() => setJustRedeemedId(null), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl font-mono select-none">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-white/20 bg-[#090b14] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden"
            >
                <BrutalistCorners color={accentColor} size={20} />

                {/* Header Top Bar */}
                <div className="flex items-center justify-between border-b border-white/10 px-5 sm:px-8 py-4 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2.5 rounded-xl border border-white/15"
                            style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}60` }}
                        >
                            <Trophy className="w-5 h-5" style={{ color: accentColor }} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-white flex items-center gap-2">
                                <span>BÓVEDA DE SINERGIA & DUELOS</span>
                                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                            </h2>
                            <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest">
                                Récords compartidos, misiones de pareja y cápsulas gachapon
                            </p>
                        </div>
                    </div>

                    {/* Coins & XP Badges */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                            <Coins className="w-4 h-4 text-amber-400" />
                            <span className="text-xs sm:text-sm font-black text-amber-300 tabular-nums">{coins}</span>
                            <span className="text-[9px] text-amber-400/70 font-bold uppercase">MONEDAS</span>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 bg-white/5 border border-white/15 rounded-xl text-white/60 hover:text-white hover:bg-white/15 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 px-5 sm:px-8 pt-4 pb-2 border-b border-white/10 overflow-x-auto scrollbar-none bg-black/40">
                    <button
                        onClick={() => setActiveTab('duels')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                            activeTab === 'duels'
                                ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Trophy className="w-4 h-4" />
                        <span>Duelos Él vs Ella ({elWins}-{ellaWins})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('gachapon')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                            activeTab === 'gachapon'
                                ? 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Gift className="w-4 h-4" />
                        <span>Cápsula Gachapon</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('quests')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap relative ${
                            activeTab === 'quests'
                                ? 'bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Scroll className="w-4 h-4" />
                        <span>Misiones de Pareja</span>
                        {pendingQuestsCount > 0 && (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute top-2 right-2" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('wallet')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                            activeTab === 'wallet'
                                ? 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Ticket className="w-4 h-4" />
                        <span>Cupones Ganados ({coupons.length})</span>
                    </button>
                </div>

                {/* Tab Content Area */}
                <div className="p-5 sm:p-8 overflow-y-auto flex-1 max-h-[60vh] space-y-6">
                    {activeTab === 'duels' && (
                        <DuelsTab
                            elWins={elWins}
                            ellaWins={ellaWins}
                            scores={scores}
                            onSelectGame={onSelectGame}
                            onClose={onClose}
                        />
                    )}

                    {activeTab === 'gachapon' && (
                        <GachaponTab
                            coins={coins}
                            gachaponCost={gachaponCost}
                            isSpinning={isSpinning}
                            wonCoupon={wonCoupon}
                            gachaponError={gachaponError}
                            onSpin={handleSpin}
                        />
                    )}

                    {activeTab === 'quests' && (
                        <QuestsTab
                            dailyQuests={dailyQuests}
                            onClaimQuest={claimQuest}
                        />
                    )}

                    {activeTab === 'wallet' && (
                        <WalletTab
                            coupons={coupons}
                            redeemedCoupons={redeemedCoupons}
                            onRedeem={handleRedeem}
                            justRedeemedId={justRedeemedId}
                        />
                    )}
                </div>
            </motion.div>
        </div>
    );
}
