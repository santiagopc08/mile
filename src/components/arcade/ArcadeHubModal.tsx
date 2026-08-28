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
                    {/* TAB 1: DUELS LEADERBOARD */}
                    {activeTab === 'duels' && (
                        <div className="space-y-6">
                            {/* Win Overview Header */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 sm:p-5 rounded-2xl border border-lime-400/40 bg-lime-950/20 shadow-[0_0_25px_rgba(195,244,0,0.15)] flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-bold text-lime-400 uppercase tracking-widest flex items-center gap-1">
                                            <Crown className="w-3.5 h-3.5 text-lime-400" /> Santi (Él)
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-black text-white">{elWins} <span className="text-xs text-lime-400 font-bold uppercase">Victorias</span></div>
                                    </div>
                                    <div className="text-3xl">🎮</div>
                                </div>

                                <div className="p-4 sm:p-5 rounded-2xl border border-pink-400/40 bg-pink-950/20 shadow-[0_0_25px_rgba(255,75,137,0.15)] flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-bold text-pink-400 uppercase tracking-widest flex items-center gap-1">
                                            <Crown className="w-3.5 h-3.5 text-pink-400" /> Mile (Ella)
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-black text-white">{ellaWins} <span className="text-xs text-pink-400 font-bold uppercase">Victorias</span></div>
                                    </div>
                                    <div className="text-3xl">👑</div>
                                </div>
                            </div>

                            {/* Game Score List */}
                            <div className="space-y-2.5">
                                <div className="text-xs font-black uppercase tracking-wider text-white/50 px-1">
                                    Tabla de Récords por Juego
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {gameKeys.map(k => {
                                        const meta = GAMES_METADATA[k];
                                        const rec = scores[k] || { el: 0, ella: 0 };
                                        const leader = rec.el > rec.ella ? 'el' : rec.ella > rec.el ? 'ella' : 'tie';
                                        const Icon = meta.icon;

                                        return (
                                            <div
                                                key={k}
                                                className="p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="p-2.5 rounded-xl border border-white/15"
                                                        style={{ backgroundColor: `${meta.accentHex}20`, borderColor: `${meta.accentHex}50` }}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black text-white uppercase">{meta.shortTitle}</div>
                                                        <div className="text-[10px] text-white/50 font-mono">
                                                            Él: <span className="text-lime-400 font-bold tabular-nums">{rec.el || 0}</span> · Ella: <span className="text-pink-400 font-bold tabular-nums">{rec.ella || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {leader === 'el' && (
                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-lime-500/20 border border-lime-400 text-lime-300">
                                                            👑 Él
                                                        </span>
                                                    )}
                                                    {leader === 'ella' && (
                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-pink-500/20 border border-pink-400 text-pink-300">
                                                            👑 Ella
                                                        </span>
                                                    )}
                                                    {leader === 'tie' && (
                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white/10 text-white/60">
                                                            Empate
                                                        </span>
                                                    )}

                                                    <button
                                                        onClick={() => {
                                                            onSelectGame(k);
                                                            onClose();
                                                        }}
                                                        className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg text-white transition-all"
                                                        title="Jugar este juego"
                                                    >
                                                        <Play className="w-3.5 h-3.5 fill-current" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: GACHAPON CAPSULE MACHINE */}
                    {activeTab === 'gachapon' && (
                        <div className="flex flex-col items-center justify-center text-center space-y-6 py-4">
                            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-fuchsia-500/50 bg-gradient-to-b from-fuchsia-950/60 to-purple-950/80 p-4 shadow-[0_0_50px_rgba(217,70,239,0.4)] flex items-center justify-center">
                                <motion.div
                                    animate={isSpinning ? { rotate: [0, 360, 720, 1080], scale: [1, 1.15, 0.95, 1] } : {}}
                                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                                    className="text-6xl sm:text-7xl"
                                >
                                    {isSpinning ? '🎰' : wonCoupon ? wonCoupon.emoji : '🎁'}
                                </motion.div>
                            </div>

                            <div>
                                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                                    Cápsula de Premios de Amor
                                </h3>
                                <p className="text-xs text-white/60 max-w-md mx-auto mt-1">
                                    Gira la ruleta gachapon para ganar cupones reales de pareja (masajes, elecciones de películas, cenas, inmunidad de tareas y más).
                                </p>
                            </div>

                            {/* Won Coupon Display */}
                            {wonCoupon && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="p-5 rounded-2xl border-2 border-fuchsia-400 bg-fuchsia-950/40 shadow-[0_0_30px_rgba(217,70,239,0.5)] max-w-md w-full text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-4xl">{wonCoupon.emoji}</div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400">
                                                ¡NUEVO CUPÓN DESBLOQUEADO!
                                            </div>
                                            <div className="text-base font-black text-white">{wonCoupon.title}</div>
                                            <div className="text-xs text-white/70 mt-0.5">{wonCoupon.description}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {gachaponError && (
                                <div className="text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-500/40 px-4 py-2 rounded-xl">
                                    {gachaponError}
                                </div>
                            )}

                            <button
                                onClick={handleSpin}
                                disabled={coins < gachaponCost || isSpinning}
                                className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm sm:text-base transition-all flex items-center gap-3 shadow-xl ${
                                    coins >= gachaponCost && !isSpinning
                                        ? 'bg-gradient-to-r from-fuchsia-500 to-amber-400 text-black hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(217,70,239,0.5)]'
                                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                                }`}
                            >
                                <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                                <span>{isSpinning ? 'GIRANDO CÁPSULA...' : `GIRAR GACHAPON (${gachaponCost} 🪙)`}</span>
                            </button>
                        </div>
                    )}

                    {/* TAB 3: DAILY QUESTS */}
                    {activeTab === 'quests' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-black uppercase tracking-wider text-white/60">
                                    Misiones del Día · Se renuevan diariamente
                                </div>
                                <div className="text-[10px] text-amber-400 font-bold uppercase">
                                    Gana monedas para el Gachapon
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {dailyQuests.map(q => {
                                    const progressPct = Math.min(100, Math.round((q.current / q.target) * 100));

                                    return (
                                        <div
                                            key={q.id}
                                            className={`p-4 rounded-2xl border transition-all ${
                                                q.completed
                                                    ? 'border-amber-400/50 bg-amber-950/20 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                                                    : 'border-white/10 bg-white/[0.02]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <div className="text-xs font-black text-white uppercase">{q.title}</div>
                                                <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded text-[10px] font-bold text-amber-300">
                                                    <Coins className="w-3 h-3 text-amber-400" />
                                                    <span>+{q.rewardCoins}</span>
                                                </div>
                                            </div>

                                            <p className="text-[11px] text-white/70 mb-3">{q.description}</p>

                                            {/* Progress Bar */}
                                            <div className="space-y-1 mb-3">
                                                <div className="flex items-center justify-between text-[9px] font-mono text-white/50">
                                                    <span>PROGRESO</span>
                                                    <span>{q.current} / {q.target} ({progressPct}%)</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-amber-400 to-fuchsia-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Claim Button */}
                                            {q.completed ? (
                                                q.claimed ? (
                                                    <div className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-center text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>RECOMPENSA RECLAMADA</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => claimQuest(q.id)}
                                                        className="w-full py-2 bg-gradient-to-r from-amber-400 to-fuchsia-500 text-black font-black uppercase text-xs rounded-xl hover:scale-102 active:scale-98 transition-all shadow-[0_0_15px_rgba(251,191,36,0.4)] flex items-center justify-center gap-1.5"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        <span>RECLAMAR +{q.rewardCoins} MONEDAS</span>
                                                    </button>
                                                )
                                            ) : (
                                                <div className="w-full py-2 bg-white/5 rounded-xl text-center text-[10px] font-bold text-white/40 uppercase">
                                                    En Progreso
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: COUPONS WALLET */}
                    {activeTab === 'wallet' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-black uppercase tracking-wider text-white/60">
                                    Cupones Disponibles ({coupons.length})
                                </div>
                                <div className="text-[10px] text-white/40 uppercase">
                                    Canjeados: {redeemedCoupons.length}
                                </div>
                            </div>

                            {coupons.length === 0 ? (
                                <div className="p-8 text-center border border-dashed border-white/15 rounded-3xl space-y-2">
                                    <div className="text-4xl">🎟️</div>
                                    <div className="text-sm font-black text-white uppercase">Aún no tienes cupones</div>
                                    <p className="text-xs text-white/60 max-w-sm mx-auto">
                                        Juega en el arcade, completa misiones y gira la Cápsula Gachapon para ganar cupones reales de pareja.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {coupons.map(c => {
                                        const isRedeeming = justRedeemedId === c.id;

                                        return (
                                            <div
                                                key={c.id}
                                                className="p-4 sm:p-5 rounded-2xl border border-white/15 bg-white/[0.03] flex flex-col justify-between gap-3 shadow-lg relative overflow-hidden"
                                                style={{ borderColor: `${c.color}60` }}
                                            >
                                                <div className="flex items-start gap-3.5">
                                                    <div className="text-3xl p-2 rounded-xl bg-white/5 border border-white/10">
                                                        {c.emoji}
                                                    </div>
                                                    <div>
                                                        <span
                                                            className="text-[9px] font-black uppercase px-2 py-0.5 rounded border"
                                                            style={{ color: c.color, borderColor: `${c.color}60`, backgroundColor: `${c.color}15` }}
                                                        >
                                                            {c.rarity.toUpperCase()}
                                                        </span>
                                                        <h4 className="text-sm font-black text-white mt-1">{c.title}</h4>
                                                        <p className="text-xs text-white/70 mt-0.5">{c.description}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleRedeem(c.id)}
                                                    className="w-full py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                                                    style={{
                                                        backgroundColor: isRedeeming ? '#10b981' : c.color,
                                                        color: '#000000',
                                                    }}
                                                >
                                                    {isRedeeming ? (
                                                        <>
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span>¡CANJEADO CON ÉXITO!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            <span>CANJEAR EN LA VIDA REAL</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Redeemed History */}
                            {redeemedCoupons.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                                    <div className="text-[11px] font-black uppercase tracking-wider text-white/40">
                                        Historial de Cupones Cumplidos
                                    </div>
                                    <div className="space-y-1.5">
                                        {redeemedCoupons.slice(0, 5).map(rc => (
                                            <div key={rc.id} className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-white/60">
                                                <div className="flex items-center gap-2">
                                                    <span>{rc.emoji}</span>
                                                    <span className="line-through">{rc.title}</span>
                                                </div>
                                                <span className="text-[10px] text-emerald-400 font-bold">✓ CUMPLIDO</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
