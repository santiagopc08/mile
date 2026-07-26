'use client';

/**
 * /design-lab — banco de pruebas del kit decorativo sobre el fondo real.
 * No enlazado desde la navegación: es una herramienta de iteración, no una
 * pantalla de la app. Se llega por URL directa.
 */

import { useState } from 'react';
import { AmbientField } from '@/components/AmbientField';
import { ChamferedPanel } from '@/components/ui/ChamferedPanel';
import {
    DecoRule,
    CornerBrackets,
    TickScale,
    RadialBurst,
    ContourLines,
    DataStrip,
    MicroLabel,
    WireSolid,
} from '@/components/deco';
import { PROFILE_PALETTE, type ProfileKey } from '@/lib/profilePalette';

export default function DesignLab() {
    const [profile, setProfile] = useState<ProfileKey>('el');
    const accent = PROFILE_PALETTE[profile].primary;

    return (
        <>
            <AmbientField preset="home" profile={profile} interactive={false} />

            <main className="relative z-10 mx-auto max-w-3xl px-4 py-10 space-y-8" style={{ color: '#e5e2e1' }}>
                <header className="stagger-item space-y-3" style={{ '--i': 0 } as React.CSSProperties}>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-sm animate-spin-slow" style={{ color: accent }}>◆</span>
                        <h1 className="font-mono text-2xl font-bold uppercase tracking-tight text-white">Design Lab</h1>
                    </div>
                    <p className="text-sm text-[#c9b8bd]">Kit decorativo sobre el fondo real. Cambia de perfil para ver el acento heredado.</p>
                    <div className="flex gap-2 pt-1">
                        {(['el', 'ella'] as ProfileKey[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setProfile(p)}
                                className="border px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors"
                                style={{
                                    borderColor: profile === p ? PROFILE_PALETTE[p].primary : 'rgba(255,255,255,0.15)',
                                    color: profile === p ? PROFILE_PALETTE[p].primary : '#8a8a8a',
                                    background: profile === p ? `${PROFILE_PALETTE[p].primary}12` : 'transparent',
                                }}
                            >
                                {p === 'el' ? 'Santi' : 'Mile'}
                            </button>
                        ))}
                    </div>
                </header>

                <Section title="DecoRule" index={1} accent={accent}>
                    <div className="space-y-5" style={{ color: accent }}>
                        <DecoRule label="Separador" />
                        <DecoRule label="SYS · 07 · OK" />
                        <DecoRule />
                    </div>
                </Section>

                <Section title="CornerBrackets" index={2} accent={accent}>
                    <div className="relative h-28 border border-white/10 bg-black/30" style={{ color: accent }}>
                        <CornerBrackets />
                        <div className="flex h-full items-center justify-center font-mono text-xs text-white/40">contenedor con corchetes</div>
                    </div>
                </Section>

                <Section title="TickScale" index={3} accent={accent}>
                    <div className="flex items-center gap-8" style={{ color: accent }}>
                        <TickScale orientation="horizontal" length={240} />
                        <TickScale orientation="vertical" length={90} />
                    </div>
                </Section>

                <Section title="RadialBurst · WireSolid" index={4} accent={accent}>
                    <div className="flex items-center gap-10" style={{ color: accent }}>
                        <RadialBurst />
                        <WireSolid />
                    </div>
                </Section>

                <Section title="ContourLines" index={5} accent={accent}>
                    <div style={{ color: accent }}>
                        <ContourLines width={400} height={140} />
                    </div>
                </Section>

                <Section title="DataStrip · MicroLabel" index={6} accent={accent}>
                    <div className="space-y-4" style={{ color: accent }}>
                        <DataStrip bars={48} />
                        <div className="flex gap-6">
                            <MicroLabel parts={['SYS_DATA', '07', 'OK']} />
                            <MicroLabel parts={['REFUGIO', 'v2', 'ONLINE']} />
                        </div>
                    </div>
                </Section>

                <Section title="En contexto: ChamferedPanel + deco" index={7} accent={accent}>
                    <ChamferedPanel accentColor={accent} label="COMPUESTO" notchSize={18}>
                        <CornerBrackets color={accent} inset={10} />
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-mono text-lg font-black uppercase text-white">Panel demo</h3>
                                <MicroLabel parts={['ID', '04']} color={accent} />
                            </div>
                            <DecoRule color={accent} />
                            <DataStrip bars={40} color={accent} />
                        </div>
                    </ChamferedPanel>
                </Section>
            </main>
        </>
    );
}

function Section({ title, index, accent, children }: { title: string; index: number; accent: string; children: React.ReactNode }) {
    return (
        <section className="stagger-item space-y-4" style={{ '--i': index } as React.CSSProperties}>
            <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>{title}</span>
                <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="border border-white/8 bg-[#0a070c]/60 p-6 backdrop-blur-sm">{children}</div>
        </section>
    );
}
