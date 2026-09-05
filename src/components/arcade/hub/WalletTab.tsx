import React, { useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { ArcadeCoupon } from '@/lib/arcadeProgression';

interface WalletTabProps {
    coupons: ArcadeCoupon[];
    redeemedCoupons: ArcadeCoupon[];
    onRedeem: (couponId: string) => void;
    justRedeemedId: string | null;
}

export function WalletTab({ coupons, redeemedCoupons, onRedeem, justRedeemedId }: WalletTabProps) {
    return (
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
                                    onClick={() => onRedeem(c.id)}
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
    );
}
